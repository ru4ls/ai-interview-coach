// src/components/SetupForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Typography, TextField, Button, Select, MenuItem, FormControl, 
  InputLabel, CircularProgress, Grid, Divider, Slider
} from '@mui/material';

interface SetupFormProps {
  jobData: any;
  languages: { [key: string]: string };
  language: string;
  selectedVoice: string;
  industry: string;
  availableRoles: string[];
  role: string;
  cvFile: File | null;
  profileSummary: string;
  jobDescription: string;
  additionalInfo: string;
  numExpQuestions: number;
  numRoleQuestions: number;
  numPersonalityQuestions: number;
  isLoading: boolean;
  setRole: (value: string) => void;
  setLanguage: (value: string) => void;
  setLanguageMap: (map: { [key: string]: string }) => void;
  setSelectedVoice: (voice: string) => void;
  handleIndustryChange: (value: string) => void;
  setCvFile: (file: File | null) => void;
  setProfileSummary: (value: string) => void;
  setJobDescription: (value: string) => void;
  setAdditionalInfo: (value: string) => void;
  setNumExpQuestions: (value: number) => void;
  setNumRoleQuestions: (value: number) => void;
  setNumPersonalityQuestions: (value: number) => void;
  onStart: () => void;
}

const SetupForm: React.FC<SetupFormProps> = (props) => {
  
  const [voiceData, setVoiceData] = useState<any>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableVoices, setAvailableVoices] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetch('/voice.json')
      .then(res => res.json())
      .then(data => {
        setVoiceData(data);
        const languages = Object.keys(data);
        setAvailableLanguages(languages);

        const newLangMap: { [key: string]: string } = {};
        for (const langName in data) {
            if (data[langName].lang_code) {
                newLangMap[langName] = data[langName].lang_code;
            }
        }
        props.setLanguageMap(newLangMap);

        if (languages.length > 0) {
          props.setLanguage(languages[0]);
        }
      })
      .catch(error => console.error("Failed to load voices data:", error));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (voiceData && props.language) {
      const languageData = voiceData[props.language];
      if (languageData && languageData.voices) {
        setAvailableVoices(languageData.voices);
        props.setSelectedVoice(Object.values(languageData.voices)[0] as string);
      } else {
        setAvailableVoices({});
        props.setSelectedVoice('');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.language, voiceData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        props.setCvFile(event.target.files[0]);
    } else {
        props.setCvFile(null);
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
        Setup Your Interviews
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Fill in the details to start your personalized interview session.
      </Typography>
      
      <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
              <FormControl fullWidth variant="filled">
                  <InputLabel id="language-select-label">Language</InputLabel>
                  <Select 
                      labelId="language-select-label"
                      value={props.language} 
                      onChange={(e) => props.setLanguage(e.target.value)}
                  >
                      {availableLanguages.map((langName) => (<MenuItem key={langName} value={langName}>{langName}</MenuItem>))}
                  </Select>
              </FormControl>
          </Grid>
          <Grid item xs={12} sm={5}>
              <Button 
                  variant="outlined" component="label" fullWidth 
                  sx={{ height: '56px' }}
              >
                  {props.cvFile ? props.cvFile.name : '*UPLOAD CV (PDF)'}
                  <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
              </Button>
          </Grid>

          <Grid item xs={12}>
              <FormControl fullWidth variant="filled">
                  <InputLabel id="voice-select-label">Voice</InputLabel>
                  <Select 
                      labelId="voice-select-label"
                      value={props.selectedVoice} 
                      onChange={(e) => props.setSelectedVoice(e.target.value)}
                      disabled={!Object.keys(availableVoices).length}
                  >
                      {Object.entries(availableVoices).map(([name, code]) => (
                          <MenuItem key={code} value={code}>{name}</MenuItem>
                      ))}
                  </Select>
              </FormControl>
          </Grid>
          
          <Grid item xs={12}><TextField variant="filled" label="(Optional) Profile Summary" fullWidth multiline rows={3} value={props.profileSummary} onChange={(e) => props.setProfileSummary(e.target.value)} /></Grid>

          <Grid item xs={12}><Divider sx={{ my: 2, borderColor: '#30363D' }}><Typography variant="overline" color="text.secondary">Interviewer Settings</Typography></Divider></Grid>
          
          <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="filled">
                  <InputLabel id="industry-select-label">Industry</InputLabel>
                  <Select 
                      labelId="industry-select-label"
                      value={props.industry} 
                      onChange={(e) => props.handleIndustryChange(e.target.value)}
                  >
                      {props.jobData && props.jobData.industries.map((ind: any) => (<MenuItem key={ind.name} value={ind.name}>{ind.name}</MenuItem>))}
                  </Select>
              </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="filled">
                  <InputLabel id="role-select-label">Job Role</InputLabel>
                  <Select 
                      labelId="role-select-label"
                      value={props.role} 
                      onChange={(e) => props.setRole(e.target.value)}
                  >
                      {props.availableRoles.map((r: string) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
                  </Select>
              </FormControl>
          </Grid>
          
          <Grid item xs={12}><TextField variant="filled" label="(Optional) Job Description" fullWidth multiline rows={3} value={props.jobDescription} onChange={(e) => props.setJobDescription(e.target.value)} /></Grid>
          <Grid item xs={12}><TextField variant="filled" label="(Optional) Additional Info (Secret notes for AI behavior)" fullWidth multiline rows={2} value={props.additionalInfo} onChange={(e) => props.setAdditionalInfo(e.target.value)} /></Grid>
          
          <Grid item xs={12} sm={4}>
              <Typography gutterBottom>Experience: {props.numExpQuestions}</Typography>
              <Slider value={props.numExpQuestions} onChange={(e, val) => props.setNumExpQuestions(val as number)} step={1} marks min={1} max={10} />
          </Grid>
          <Grid item xs={12} sm={4}>
              <Typography gutterBottom>Role-Specific: {props.numRoleQuestions}</Typography>
              <Slider value={props.numRoleQuestions} onChange={(e, val) => props.setNumRoleQuestions(val as number)} step={1} marks min={1} max={10} />
          </Grid>
          <Grid item xs={12} sm={4}>
              <Typography gutterBottom>Personality: {props.numPersonalityQuestions}</Typography>
              <Slider value={props.numPersonalityQuestions} onChange={(e, val) => props.setNumPersonalityQuestions(val as number)} step={1} marks min={1} max={10} />
          </Grid>

          <Grid item xs={12}>
              <Button fullWidth variant="contained" size="large" onClick={props.onStart} disabled={props.isLoading || !props.jobData} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem', bgcolor: '#2563EB', color: 'white', '&:hover': { bgcolor: '#1D4ED8' }, '&.Mui-disabled': { backgroundColor: '#374151', color: '#6B7280' } }}>
                  {props.isLoading ? <CircularProgress size={24} color="inherit" /> : 'START INTERVIEW'}
              </Button>
          </Grid>
      </Grid>
    </>
  );
};

export default SetupForm;