// src/components/HeroSection.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';

const heroImageUrl = 'https://images.unsplash.com/photo-1670529215446-256df9e2fc3a?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const HeroSection: React.FC = () => {
  return (
    <Box 
      sx={{
        width: '100%',
        height: '100%',
        display: { xs: 'flex', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 6,
        color: 'white',
        background: `linear-gradient(rgba(13, 17, 23, 0.1), rgba(13, 17, 23, 1)), url(${heroImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        textAlign: 'left'
      }}
    >
      <Box>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Prepare for your dream job.
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: '450px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Practice interviews, get instant AI-powered feedback, and build the confidence you need to succeed.
        </Typography>
      </Box>
    </Box>
  );
};

export default HeroSection;