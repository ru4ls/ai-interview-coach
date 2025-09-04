// src/components/ChatSession.tsx

import React, { useState, useEffect } from 'react';
import { Typography, Box, Grid, Button, CircularProgress, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AnswerInputBox from './AnswerInputBox';
import { Message } from '../hooks/useInterviewState';

interface ChatSessionProps {
  chatHistory: Message[];
  isLoading: boolean;
  isAudioPlaying: boolean;
  activePhase: string;
  isFinished: boolean;
  onSubmitAnswer: (answer: string) => void;
  onGetSummary: () => void;
  userName: string;
  industry: string;
  role: string;
  language: string;
  languageMap: { [key: string]: string };
}

const ChatSession: React.FC<ChatSessionProps> = (props) => {

  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
    setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <Paper 
        sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            p: 2 
        }}
    >
      
      <Box sx={{ 
          flexShrink: 0, 
          pb: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
      }}>
        <Box>
            <Typography variant="h6">
              Interview Session
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`Candidate: ${props.userName} | Role: ${props.role}, ${props.industry}`}
            </Typography>
        </Box>
        <Box>
            <Typography variant="h5">
              {formatTime(elapsedTime)}
            </Typography>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2, pr: 1, minHeight: '80vh' }}>
        {props.chatHistory.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {msg.sender === 'ai' ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontSize: '0.7rem' }}>
                    <SmartToyIcon sx={{ fontSize: '0.8rem' }} />
                    Interviewer
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: '12px 12px 12px 0', bgcolor: 'background.default', maxWidth: '95%' }}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mt: 0.5, fontSize: '0.7rem' }}>{msg.timestamp}</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontSize: '0.7rem' }}>
                    You
                    <PersonIcon sx={{ fontSize: '0.8rem' }}/>
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: '12px 12px 0 12px', bgcolor: 'primary.main', color: 'primary.contrastText', maxWidth: '85%' }}>
                  <Typography variant="body1">{msg.text}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1, mt: 0.5, fontSize: '0.7rem' }}>{msg.timestamp}</Typography>
              </Box>
            )}
          </motion.div>
        ))}
      </Box>
      
      <Box sx={{ pt: 2, pb: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', position: 'sticky', bottom: 0, bgcolor: 'background.paper' }}>
        {props.isFinished ? (
            <Grid container justifyContent="center">
                <Button variant="contained" size="large" onClick={props.onGetSummary} disabled={props.isLoading}>
                    {props.isLoading ? <CircularProgress size={24} /> : "View Final Analysis"}
                </Button>
            </Grid>
        ) : (
            <AnswerInputBox 
              isLoading={props.isLoading} 
              isAudioPlaying={props.isAudioPlaying}
              phase={props.activePhase}
              language={props.language}
              languageMap={props.languageMap}
              onSubmit={props.onSubmitAnswer}
            />
        )}
      </Box>
    </Paper>
  );
};

export default ChatSession;