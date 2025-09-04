// src/views/SetupView.tsx

import React from 'react';
import SetupForm from '../components/SetupForm';

interface SetupViewProps {
  jobData: any;
  languages: { [key: string]: string };
  language: string;
  setLanguage: (value: string) => void;
  setLanguageMap: (map: { [key: string]: string }) => void;
  industry: string;
  availableRoles: string[];
  role: string;
  setRole: (value: string) => void;
  cvFile: File | null;
  setCvFile: (file: File | null) => void;
  profileSummary: string;
  setProfileSummary: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  additionalInfo: string;
  setAdditionalInfo: (value: string) => void;
  numExpQuestions: number;
  setNumExpQuestions: (value: number) => void;
  numRoleQuestions: number;
  setNumRoleQuestions: (value: number) => void;
  numPersonalityQuestions: number;
  setNumPersonalityQuestions: (value: number) => void;
  handleIndustryChange: (value: string) => void;
  onStart: () => void;
  isLoading: boolean;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

const SetupView: React.FC<SetupViewProps> = (props) => {
  return (
    <SetupForm {...props} />
  );
};

export default SetupView;