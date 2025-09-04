// src/components/AnalysisPanel.tsx

import React from 'react';
import {
  Typography, Box, CircularProgress, Card, 
  CardContent, Divider, Button
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface Analysis {
  score?: number;
  feedback?: string;
  hint?: string;
  exampleAnswer?: string;
}

interface AnalysisPanelProps {
  analysis: Analysis | null;
  isLoading: boolean;
  onRetry: () => void;
  canRetry: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isLoading, onRetry, canRetry }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', overflowY: 'auto', minHeight: '90vh' }}>
                      <Box sx={{ flexShrink: 0, pb: 2, borderBottom: '1px solid', borderColor: 'divider', marginBottom: '20px' }}>
                        <Typography variant="h6">
                          Q&A Analyst
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Analysis and feedback on your answers.
                        </Typography>
                      </Box>
                {isLoading && !analysis && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', p: 2 }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            Analyzing your answer...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            (This may take a moment)
                        </Typography>
                    </Box>
                )}
                {!isLoading && !analysis && (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                        Hint and analysis will appear here.
                    </Typography>
                )}
                {analysis && (
                    <Box>
                        {analysis.score !== undefined && (
                            <>
                                <Typography variant="h5" component="div" sx={{ textAlign: 'center', mb: 1 }}>Score: {analysis.score}/10</Typography>
                                <Typography variant="h6">Feedback</Typography>
                                <ReactMarkdown>{analysis.feedback || ""}</ReactMarkdown>
                                {canRetry && <Button onClick={onRetry} variant="outlined" size="small" sx={{ my: 2 }}>Retry This Question</Button>}
                                <Divider sx={{ my: 2 }} />
                            </>
                        )}
                        {analysis.hint && (
                            <>
                                <Typography variant="h6">Hint for This Question</Typography>
                                <ReactMarkdown>{analysis.hint}</ReactMarkdown>
                                <Divider sx={{ my: 2 }} />
                            </>
                        )}
                        {analysis.exampleAnswer && (
                            <>
                                <Typography variant="h6">Example Answer</Typography>
                                <ReactMarkdown>{analysis.exampleAnswer}</ReactMarkdown>
                            </>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default AnalysisPanel;