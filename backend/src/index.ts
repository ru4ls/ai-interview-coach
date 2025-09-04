// backend/src/index.ts

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import dotenv from 'dotenv';
import pdf from 'pdf-parse';
import multer from 'multer';
import http from 'http';
import * as WebSocket from 'ws';

type RawData = WebSocket.RawData;

dotenv.config();
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

if (!process.env.GCP_CREDENTIALS_JSON) {
    throw new Error("GCP_CREDENTIALS_JSON environment variable not set.");
}
const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
const ttsClient = new TextToSpeechClient({ credentials });
const sttClient = new SpeechClient({ credentials });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- HELPER RETRY ---
const generateContentWithRetry = async (prompt: string, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            console.log(`Attempt ${attempt + 1} to generate content...`);
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            if (error.status === 503 || error.status === 500) {
                attempt++;
                if (attempt >= maxRetries) {
                    console.error(`Max retries (${maxRetries}) reached. Failing.`);
                    throw error;
                }
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`Model is overloaded (503). Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("Non-retriable error:", error);
                throw error;
            }
        }
    }
    throw new Error("generateContentWithRetry failed after all attempts.");
};

app.get('/', (req, res) => res.send('AI Interview Coach Backend is running!'));

app.post('/api/interview/next-step', upload.single('cvFile'), async (req, res) => {
    const { 
        phase, userName: initialUserName, industry, role, language, jobDescription, additionalInfo, profileSummary,
        cvText: existingCvText, lastQuestion, userAnswer,
        numExpQuestions, numRoleQuestions, numPersonalityQuestions,
        expQuestionsAsked, roleQuestionsAsked, personalityQuestionsAsked,
        selectedVoice
    } = req.body;
    
    let cvText = existingCvText || '';
    let userName = initialUserName || 'Candidate';

    if (phase === 'GREETING' && req.file) {
        try { 
            cvText = (await pdf(req.file.buffer)).text;
            
            const nameExtractionPrompt = `From the following CV text, extract the candidate's full name. Respond with ONLY the name and nothing else. If you cannot find a name, respond with 'Candidate'. CV Text: """${cvText}"""`;
            const nameResult = await model.generateContent(nameExtractionPrompt);
            
            userName = nameResult.response.text().trim(); 
            console.log("CV Parsed and name extracted:", userName);

        } catch (e) { 
            console.error("Error parsing CV or extracting name:", e); 
            userName = 'Candidate';
        }
    }

    // --- PROMPT FUNCTIONS ---
    const getInterviewerResponse = (currentPhase: string, context: any): { prompt: string, nextPhase: string } => {
        let prompt = '';
        let nextPhase = '';
        const lang = context.language;
        const langInstruction = `IMPORTANT: Your entire response MUST be in ${lang}. You are speaking directly TO the candidate. Use the second person ("Anda" or "You").`;
        const noGreetingInstruction = `Do not add any greetings or introductory pleasantries. Just ask the question directly.`;
        const summaryContext = context.profileSummary ? `The candidate also provided this summary about themselves: """${context.profileSummary}"""` : '';

        // --- GREETINGS --- 
        if (currentPhase === 'GREETING') {
            const greetingName = (context.userName && context.userName.toLowerCase() !== 'candidate' && context.userName.trim() !== '') ? `, ${context.userName}` : "";
            prompt = `${langInstruction} You are an expert interviewer named Gemini. You are starting an interview for a ${context.role} position. Start with a professional greeting (e.g., "Good morning" or "Selamat pagi")${greetingName}. Then, ask the candidate to introduce themselves. ${summaryContext}`;
            nextPhase = 'INTRODUCTION';
        } 
        // --- INTRODUCTION ---         
        else if (currentPhase === 'INTRODUCTION') {
            prompt = `${langInstruction} The candidate, ${context.userName}, introduced themselves: "${context.userAnswer}". Based on this, their CV, their profile summary, and additional info, ${noGreetingInstruction} CV Text: """${context.cvText}""" Additional Info: """${context.additionalInfo}""" ${summaryContext}`;
            nextPhase = 'EXPERIENCE';
        } 
        // --- EXPERIENCE ---        
        else if (parseInt(context.expQuestionsAsked) < parseInt(context.numExpQuestions)) {
            prompt = `${langInstruction} The candidate answered: "${context.userAnswer}". Based on their CV and experience, ${noGreetingInstruction} This is experience question ${parseInt(context.expQuestionsAsked) + 1} of ${context.numExpQuestions}. CV Text: """${context.cvText}"""`;
            if (parseInt(context.expQuestionsAsked) + 1 >= parseInt(context.numExpQuestions)) {
                nextPhase = 'ROLE_SPECIFIC';
            } else {
                nextPhase = 'EXPERIENCE';
            }
        } 
        // --- ROLE SPECIFIC ---
        else if (parseInt(context.roleQuestionsAsked) < parseInt(context.numRoleQuestions)) {
            const transitionText = (parseInt(context.roleQuestionsAsked) === 0) ? "Now, let's move on to some role-specific questions." : "";
            let questionContextPrompt = '';
            if (context.jobDescription && context.jobDescription.trim() !== '') {
                questionContextPrompt = `Based on the following job description, ask a relevant question. Job Description: """${context.jobDescription}"""`;
            } else {
                questionContextPrompt = `Ask a common and relevant interview question for a **${context.role}** position.`;
            }        
            prompt = `${langInstruction} ${transitionText} The candidate answered: "${context.userAnswer}". 
            ${questionContextPrompt} 
            ${noGreetingInstruction} This is role-specific question ${parseInt(context.roleQuestionsAsked) + 1} of ${context.numRoleQuestions}.`;
            
            if (parseInt(context.roleQuestionsAsked) + 1 >= parseInt(context.numRoleQuestions)) {
                nextPhase = 'PERSONALITY';
            } else {
                nextPhase = 'ROLE_SPECIFIC';
            }
        }
        // --- PERSONALITY ---
        else if (parseInt(context.personalityQuestionsAsked) < parseInt(context.numPersonalityQuestions)) {
            const transitionText = (parseInt(context.personalityQuestionsAsked) === 0) ? "Great. Finally, I'd like to ask a few questions to understand you better." : "";     
            prompt = `${langInstruction} ${transitionText} The candidate answered: "${context.userAnswer}". Now, ask a new, DIFFERENT personality or behavioral question. DO NOT repeat a question that has already been asked in the chat history. Possible topics include (but are not limited to): - The candidate's greatest professional strength. - The candidate's biggest area for improvement or weakness. - How they handle pressure or tight deadlines. - A time they failed and what they learned. - Their ideal work environment. - How they stay motivated. Review the chat history below to ensure your question is unique. CHAT HISTORY: """${context.fullChatHistory}""" ${noGreetingInstruction} This is personality question ${parseInt(context.personalityQuestionsAsked) + 1} of ${context.numPersonalityQuestions}.`;
            if (parseInt(context.personalityQuestionsAsked) + 1 >= parseInt(context.numPersonalityQuestions)) {
                nextPhase = 'CLOSING';
            } else {
                nextPhase = 'PERSONALITY';
            }
        } 
        // --- CLOSING ---
        else {
            prompt = `${langInstruction} The candidate's last answer was: "${context.userAnswer}". The interview is now over. Thank ${context.userName} for their time and briefly explain the next steps.**Do not mention a specific number of days or a timeline like "[Number] business days". Keep it general.**`;
            nextPhase = 'FINISHED';
        }
        return { prompt, nextPhase };
    };
    
    const getPostAnswerAnalysis = (context: any): string => {
        return `You are a career coach. Analyze an interview answer and provide feedback directly to the candidate, using "You" or the equivalent in the target language. The question asked was: "${context.lastQuestion}". The candidate's answer was: "${context.userAnswer}". Your task is to provide a concise, objective analysis. **IMPORTANT: Your entire response, including all keys and values in the JSON, MUST be in ${context.language}.** Respond with ONLY a valid JSON object with two keys: - "score": a number out of 10. - "feedback": constructive and concise feedback for the candidate, limited to 2-3 sentences. Do not include any other text.`;
    };
    
    const getPreAnswerAnalysis = (question: string, context: any): string => {
        const summaryContext = context.profileSummary ? `CANDIDATE'S PROFILE SUMMARY:\n"""${context.profileSummary}"""` : '';
        return `You are a career coach. For the interview question: "${question}", provide helpful guidance for a candidate. Your task is to write an example of a high-quality answer as if you were the candidate. CRUCIALLY, you MUST use the specific facts from the candidate's CV and Profile Summary. CANDIDATE'S CV TEXT: """${context.cvText}""" ${summaryContext} **IMPORTANT: Your entire response, including all keys and values in the JSON, MUST be in ${context.language}.** Respond with ONLY a valid JSON object with two keys: - "hint": a brief, one-sentence tip. - "exampleAnswer": a concise but strong example answer, limited to about 50-200 words. Do not include any other text.`;
    };

    try {
        let postAnswerAnalysis = null;
        if (userAnswer) {
            const analysisPrompt = getPostAnswerAnalysis({ language, lastQuestion, userAnswer });
            const rawAnalysis = (await model.generateContent(analysisPrompt)).response.text();
            const cleanedJson = rawAnalysis.replace(/```json\n?|\n?```/g, '').trim();
            postAnswerAnalysis = JSON.parse(cleanedJson);
        }

        const context = { userName, role, language, userAnswer, cvText, jobDescription, additionalInfo, profileSummary, numExpQuestions, numRoleQuestions, numPersonalityQuestions, expQuestionsAsked, roleQuestionsAsked, personalityQuestionsAsked };
        const { prompt: interviewerPrompt, nextPhase } = getInterviewerResponse(phase, context);
        const conversationalResponse = await generateContentWithRetry(interviewerPrompt);

        let preAnswerAnalysis = null;
        if (nextPhase !== 'FINISHED') {
            const preAnalysisPrompt = getPreAnswerAnalysis(conversationalResponse, { language, cvText, profileSummary });
            const rawPreAnalysis = await generateContentWithRetry(preAnalysisPrompt);
            const cleanedJson = rawPreAnalysis.replace(/```json\n?|\n?```/g, '').trim();
            preAnswerAnalysis = JSON.parse(cleanedJson);
        }
        
        let audioContentB64 = null;
        try {
            const { selectedVoice, languageCode } = req.body;
            const voiceName = selectedVoice || 'en-US-Studio-O';
            const ttsRequest = {
                input: { text: conversationalResponse },
                voice: { languageCode: languageCode, name: voiceName },
                audioConfig: { audioEncoding: 'MP3' as const },
            };

            const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
            if (ttsResponse.audioContent && Buffer.isBuffer(ttsResponse.audioContent)) {
                audioContentB64 = ttsResponse.audioContent.toString('base64');
                console.log("Audio generated successfully with voice:", voiceName);
            } else {
                console.warn("TTS response did not contain valid audio content.");
            }
        } catch (ttsError) {
            console.error("ERROR generating TTS audio:", ttsError);
        }

        const responsePayload: any = {
            conversationalResponse,
            audioContent: audioContentB64,
            postAnswerAnalysis,
            preAnswerAnalysis,
            nextPhase,
            cvText,
            userName
        };
        
        res.json(responsePayload);

    } catch (error) {
        console.error("Error in /api/interview/next-step:", error);
        res.status(500).json({ error: "Failed to process interview step." });
    }
});

app.post('/api/interview/summarize', async (req, res) => {
    const { fullChatHistory, analysisHistory, language } = req.body;
    const summaryPrompt = `You are an expert career coach. Analyze the entire following job interview transcript and the individual analyses provided. The interview language was ${language}. Your entire response MUST be in ${language} and in a valid JSON format only. INTERVIEW TRANSCRIPT:---${JSON.stringify(fullChatHistory)}--- INDIVIDUAL QUESTION ANALYSES:---${JSON.stringify(analysisHistory)}--- Based on ALL the information, provide a final summary. Respond with ONLY a valid JSON object with the following keys: - "finalScore": An average score out of 10. - "strengths": A markdown-formatted string summarizing the candidate's key strengths. Keep each point concise. - "areasForImprovement": A markdown-formatted string summarizing the main areas for improvement. Keep each point concise and actionable.`;
    try {
        const result = await model.generateContent(summaryPrompt);
        const rawResponse = await generateContentWithRetry(summaryPrompt);

        const cleanedJson = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
        const finalSummary = JSON.parse(cleanedJson);
        res.json(finalSummary);
    } catch (error) {
        console.error("Error in /api/interview/summarize:", error);
        res.status(500).json({ error: "Failed to generate summary." });
    }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  let recognizeStream: any = null;

  ws.on('message', (message: RawData) => {
    const msgStr = message.toString();
    if (msgStr.includes('config')) {
      try {
        const configMsg = JSON.parse(msgStr);
        if (configMsg.config) {
          console.log(`STT Config received: lang=${configMsg.config.languageCode}`);
          if (recognizeStream) recognizeStream.destroy();
          recognizeStream = sttClient.streamingRecognize({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: configMsg.config.languageCode,
              enableAutomaticPunctuation: true,
            },
            interimResults: true,
          })
          .on('error', (err) => console.error('STT Stream Error:', err))
          .on('data', (data) => {
            if (ws.readyState === 1) {
              ws.send(JSON.stringify(data));
            }
          });

          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ status: 'ready' }));
            console.log("STT stream is ready. Sent 'ready' signal to client.");
          }
        }
      } catch (e) { console.error("Failed to parse config message:", msgStr, e); }
    } else if (msgStr.includes('stop')) {
        console.log('Stop signal received. Ending STT stream.');
        if (recognizeStream) {
            recognizeStream.end();
        }
    } else if (recognizeStream && Buffer.isBuffer(message)) {
      if (!recognizeStream.destroyed) {
        recognizeStream.write(message);
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from STT stream');
    if (recognizeStream) {
      recognizeStream.destroy();
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is listening for HTTP and WS on port ${PORT}`));