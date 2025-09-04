// src/components/AnswerInputBox.tsx

import React, { useState, useRef } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

interface SttResponse {
    results: {
        alternatives: {
            transcript: string;
        }[];
        isFinal: boolean;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }[];
}

interface AnswerInputBoxProps {
  isLoading: boolean;
  isAudioPlaying: boolean;
  phase: string;
  language: string;
  languageMap: { [key: string]: string };
  onSubmit: (answer: string) => void;
}

const AnswerInputBox: React.FC<AnswerInputBoxProps> = ({ isLoading, isAudioPlaying, phase, language, languageMap, onSubmit }) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');    
    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);

    const playSound = (soundFile: string) => {
        try {
            const audio = new Audio(soundFile);
            audio.play();
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    };

    const cleanup = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        setIsRecording(false);
    };

    const startRecording = async () => {
        if (isRecording) return;
        
        playSound('/sounds/start.mp3');
        setIsRecording(true);
        setUserAnswer('');
        setInterimTranscript('');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            
            socketRef.current = new WebSocket('ws://localhost:8080/stt');
            
            socketRef.current.onopen = () => {
                console.log("WebSocket connected. Sending config...");
                const langCode = languageMap[language] || 'en-US';
                console.log(`Using language code for STT: ${langCode} from selected language: ${language}`);
                socketRef.current?.send(JSON.stringify({ config: { languageCode: langCode } }));
            };

            socketRef.current.onmessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);

                if (data.status && data.status === 'ready') {
                    console.log("Received 'ready' signal. Starting MediaRecorder.");
                    const options = { mimeType: 'audio/webm;codecs=opus' };
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.warn(`${options.mimeType} not supported.`);
                        delete (options as any).mimeType;
                    }
                    mediaRecorderRef.current = new MediaRecorder(stream, options);
                    
                    mediaRecorderRef.current.ondataavailable = (e) => {
                        if (e.data.size > 0 && socketRef.current?.readyState === 1) {
                            socketRef.current.send(e.data);
                        }
                    };
                    mediaRecorderRef.current.start(500);
                } else if (data.results && data.results.length > 0) {
                    const transcript = data.results[0].alternatives[0].transcript;
                    if (data.results[0].isFinal) {
                        setUserAnswer(prev => (prev + transcript + ' ').trim());
                        setInterimTranscript('');
                    } else {
                        setInterimTranscript(transcript);
                    }
                }
            };

            socketRef.current.onerror = (error) => {
                console.error("WebSocket Error:", error);
                cleanup();
            };

            socketRef.current.onclose = () => {
                console.log("WebSocket disconnected.");
                cleanup();
            };
        } catch (error) {
            setIsRecording(false);
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please grant permission.");
            cleanup();
        }
    };
    
    const stopRecording = () => {
        playSound('/sounds/stop.mp3');
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ event: 'stop' }));
        }
        cleanup();
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    const handleSubmit = () => {
        const finalAnswer = (userAnswer + interimTranscript).trim();
        if (!finalAnswer || isLoading || isAudioPlaying) return;
        onSubmit(finalAnswer);
        setUserAnswer('');
        setInterimTranscript('');
    };

    if (phase === 'FINISHED') return null;

    return (
        <Paper 
            component="form"
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            sx={{ p: '4px 8px', display: 'flex', alignItems: 'center', borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}
        >
            <IconButton 
                sx={{ p: '10px' }} 
                onClick={handleToggleRecording} 
                disabled={isLoading || isAudioPlaying}
            >
                {isRecording ? <StopIcon color="error" /> : <MicIcon color="primary" />}
            </IconButton>

            <InputBase
                sx={{ ml: 1, flex: 1, fontSize: '0.9rem' }}
                placeholder={isRecording ? "Listening..." : "Your Answer"}
                multiline
                maxRows={4}
                value={isRecording ? (userAnswer + interimTranscript) : userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isLoading || isAudioPlaying || isRecording}
            />
            
            {!isRecording && (
                <IconButton type="submit" color="primary" sx={{ p: '10px' }} disabled={isLoading || isAudioPlaying || !(userAnswer || interimTranscript).trim()}>
                    <SendIcon />
                </IconButton>
            )}
        </Paper>
    );
};

export default AnswerInputBox;