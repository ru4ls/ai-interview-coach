// src/App.tsx

import { useEffect, useState } from 'react';
import { Box, Grid, Typography, AppBar, Toolbar, Container, useTheme, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Toaster, toast } from 'react-hot-toast';
import { useInterviewState } from './hooks/useInterviewState';
import * as interviewService from './api/interviewService';
import SetupView from './views/SetupView';
import InterviewView from './views/InterviewView';
import HeroSection from './components/HeroSection';
import ThemeToggleButton from './components/ThemeToggleButton';

function App() {
  const state = useInterviewState();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); 
  const [selectedVoice, setSelectedVoice] = useState('');
  const theme = useTheme();
  
  useEffect(() => {
    fetch('/jobs.json')
    .then(res => res.json())
    .then((jobsData) => {
        state.setJobData(jobsData);
        const initialIndustry = jobsData.industries[0];
        state.setIndustry(initialIndustry.name);
        state.setAvailableRoles(initialIndustry.roles);
        state.setRole(initialIndustry.roles[0]);
    })
    .catch(error => {
        console.error("Failed to load initial data:", error);
        toast.error("Could not load job data.");
    });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.setJobData, state.setIndustry, state.setAvailableRoles, state.setRole]);

  const playAudio = (audioBase64: string) => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    const audio = new Audio("data:audio/mp3;base64," + audioBase64);
    setCurrentAudio(audio);
    
    setIsAudioPlaying(true);
    audio.onended = () => setIsAudioPlaying(false);
    
    audio.play().catch(e => {
        console.error("Audio playback failed:", e);
        setIsAudioPlaying(false);
    });
  };

  // --- HANDLERS ---

  const handleIndustryChange = (newIndustry: string) => {
    state.setIndustry(newIndustry);
    const selectedIndustry = state.jobData.industries.find((ind: any) => ind.name === newIndustry);
    if (selectedIndustry) {
        state.setAvailableRoles(selectedIndustry.roles);
        state.setRole(selectedIndustry.roles[0]);
    }
  };

  const handleStartSession = async () => {
    if (!state.cvFile) {
        toast.error("Please upload a CV to start the interview.");
        return;
    }

    state.setIsLoading(true);
    state.setChatHistory([]); 
    state.setAnalysisHistory([]); 
    state.setFinalAnalysis(null);
    state.setExpQuestionsAsked(0); 
    state.setRoleQuestionsAsked(0);
    state.setPersonalityQuestionsAsked(0);
    state.setCanRetry(false);

    const formData = new FormData();
    formData.append('phase', 'GREETING');
    formData.append('industry', state.industry);
    formData.append('role', state.role);
    formData.append('language', state.language);
    formData.append('languageCode', state.languageMap[state.language] || 'en-US');
    formData.append('jobDescription', state.jobDescription);
    formData.append('additionalInfo', state.additionalInfo);
    formData.append('profileSummary', state.profileSummary);
    formData.append('cvFile', state.cvFile);
    formData.append('numExpQuestions', String(state.numExpQuestions));
    formData.append('numRoleQuestions', String(state.numRoleQuestions));
    formData.append('numPersonalityQuestions', String(state.numPersonalityQuestions));
    formData.append('expQuestionsAsked', '0');
    formData.append('roleQuestionsAsked', '0');
    formData.append('personalityQuestionsAsked', '0');
    formData.append('selectedVoice', selectedVoice);

    try {
        const data = await interviewService.startSession(formData);

        if (data.audioContent) {
            playAudio(data.audioContent);
        }

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        state.setChatHistory([{ sender: 'ai', text: data.conversationalResponse, timestamp: timestamp }]);
        
        state.setCurrentAnalysis(data.preAnswerAnalysis);
        state.setActivePhase(data.nextPhase);
        state.setCvText(data.cvText || '');
        state.setUserName(data.userName || 'Candidate');
        state.setInterviewPhase('ACTIVE');
    } catch (error) { 
        console.error("Error starting interview:", error); 
        toast.error("Failed to start interview. Please try again.");
    }
    state.setIsLoading(false);
  };

  const handleAnswerSubmit = async (userAnswer: string) => {
    state.setIsLoading(true);
    state.setCurrentAnalysis(null);
    state.setCanRetry(false);

    const phaseOfAnsweredQuestion = state.activePhase;

    const formData = new FormData();
    formData.append('phase', phaseOfAnsweredQuestion);
    formData.append('userName', state.userName);
    formData.append('language', state.language);
    formData.append('languageCode', state.languageMap[state.language] || 'en-US');
    formData.append('fullChatHistory', JSON.stringify(state.chatHistory));
    formData.append('cvText', state.cvText);
    formData.append('jobDescription', state.jobDescription);
    formData.append('additionalInfo', state.additionalInfo);
    formData.append('profileSummary', state.profileSummary);
    formData.append('numExpQuestions', String(state.numExpQuestions));
    formData.append('numRoleQuestions', String(state.numRoleQuestions));
    formData.append('numPersonalityQuestions', String(state.numPersonalityQuestions));
    formData.append('expQuestionsAsked', String(state.expQuestionsAsked));
    formData.append('roleQuestionsAsked', String(state.roleQuestionsAsked));
    formData.append('personalityQuestionsAsked', String(state.personalityQuestionsAsked));
    const lastQuestion = state.chatHistory.filter(m => m.sender === 'ai').pop()?.text || '';
    formData.append('lastQuestion', lastQuestion);
    formData.append('userAnswer', userAnswer);
    formData.append('selectedVoice', selectedVoice);
    
    try {
        const data = await interviewService.submitAnswer(formData);

        if (data.audioContent) {
            playAudio(data.audioContent);
        }

        const combinedAnalysis = { ...data.postAnswerAnalysis, ...data.preAnswerAnalysis };
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        state.setChatHistory(prev => [...prev, { sender: 'user', text: userAnswer, timestamp: timestamp }, { sender: 'ai', text: data.conversationalResponse, timestamp: timestamp }]);
        state.setCurrentAnalysis(combinedAnalysis);
        state.setActivePhase(data.nextPhase);
        
        if (data.postAnswerAnalysis) {
            state.setAnalysisHistory(prev => [...prev, data.postAnswerAnalysis]);
            state.setCanRetry(true);
        }

        if (data.nextPhase === 'FINISHED') {
            state.setInterviewPhase('FINISHED');
        }

        if (phaseOfAnsweredQuestion === 'INTRODUCTION') {
             state.setExpQuestionsAsked(prev => prev + 1);
        } else if (phaseOfAnsweredQuestion === 'EXPERIENCE') {
            state.setExpQuestionsAsked(prev => prev + 1);
        } else if (phaseOfAnsweredQuestion === 'ROLE_SPECIFIC') {
            state.setRoleQuestionsAsked(prev => prev + 1);
        } else if (phaseOfAnsweredQuestion === 'PERSONALITY') {
            state.setPersonalityQuestionsAsked(prev => prev + 1);
        }

    } catch (error) { 
        console.error("Error submitting answer:", error);
        toast.error("Failed to get next question. Please try again.");
    }
    state.setIsLoading(false);
  };

  const handleGetSummary = async () => {
      state.setIsLoading(true);
      try {
          const data = await interviewService.getSummary({
              fullChatHistory: state.chatHistory,
              analysisHistory: state.analysisHistory,
              language: state.language
          });
          state.setFinalAnalysis(data);
          state.setInterviewPhase('SUMMARY');
      } catch (error) {
          console.error("Error fetching final summary:", error);
          toast.error("Could not retrieve the final summary.");
      }
      state.setIsLoading(false);
  };

  const handleRetryQuestion = () => {
    if (!state.canRetry) return;
    const lastAnsweredPhase = state.activePhase;
    if (lastAnsweredPhase === 'EXPERIENCE') {
        state.setExpQuestionsAsked(prev => Math.max(0, prev - 1));
    } else if (lastAnsweredPhase === 'ROLE_SPECIFIC') {
        state.setRoleQuestionsAsked(prev => Math.max(0, prev - 1));
    }
    
    const hintAndExample = { hint: state.currentAnalysis?.hint, exampleAnswer: state.currentAnalysis?.exampleAnswer };
    state.setChatHistory(prev => prev.slice(0, -2));
    state.setCurrentAnalysis(hintAndExample);
    state.setCanRetry(false);
  };

  const handleReset = () => {
      state.setInterviewPhase('SETUP');
      state.setCvFile(null);
      state.setJobDescription('');
      state.setAdditionalInfo('');
      state.setProfileSummary('');
  };

  // --- RENDER LOGIC ---
  const renderCurrentView = () => {
    if (state.interviewPhase === 'SETUP') {
      return (
        <Grid container sx={{ 
            flexGrow: 1, 
            flexDirection: 'column', 
            [theme.breakpoints.up('md')]: {
              flexDirection: 'row',
            }
        }}>
          <Grid 
            item 
            xs={12} md={5} lg={6} 
            sx={{ height: { xs: '30vh', md: 'auto' } }}
          >
            <HeroSection />
          </Grid>
          
          <Grid 
            item 
            xs={12} md={7} lg={6} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              p: { xs: 2, sm: 4 },
              flexGrow: 1
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '600px', padding:{xs:2, sm:4} }}>
              <SetupView 
                {...state} 
                handleIndustryChange={handleIndustryChange} 
                onStart={handleStartSession} 
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
              />
            </Box>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <InterviewView 
            interviewPhase={state.interviewPhase}
            chatHistory={state.chatHistory}
            currentAnalysis={state.currentAnalysis}
            isLoading={state.isLoading}
            isAudioPlaying={isAudioPlaying}
            activePhase={state.activePhase}
            canRetry={state.canRetry}
            isFinished={state.interviewPhase === 'FINISHED'}
            onSubmitAnswer={handleAnswerSubmit}
            onGetSummary={handleGetSummary}
            onRetry={handleRetryQuestion}
            finalAnalysis={state.finalAnalysis}
            onRestart={handleReset}
            userName={state.userName}
            industry={state.industry}
            role={state.role}
            language={state.language}
            languageMap={state.languageMap}
        />
      );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Toaster position="top-center" reverseOrder={false} />

      <AppBar  elevation={0}>
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            {state.interviewPhase === 'SETUP' ? (
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                AI Interview Coach
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleReset} color="inherit" aria-label="back to setup" sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }} />
            <ThemeToggleButton />
            
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderCurrentView()}
      </Box>

      <Box component="footer" sx={{ py: 1.5, px: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">Copyright © Ruals Syarif 2025</Typography>
      </Box>
    </Box>
  );
}

export default App;