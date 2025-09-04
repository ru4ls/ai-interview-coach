// src/hooks/useInterviewState.ts

import { useState } from 'react';

export interface Message { 
  sender: 'user' | 'ai'; 
  text: string;
  timestamp: string;
}
export interface Analysis { 
  score?: number; 
  feedback?: string; 
  hint?: string; 
  exampleAnswer?: string; 
}
export interface FinalAnalysis { 
  finalScore: number; 
  strengths: string; 
  areasForImprovement: string; 
}

export const useInterviewState = () => {
  // --- Data States ---
  const [jobData, setJobData] = useState<any>(null);
  const [languages, setLanguages] = useState<{ [key: string]: string }>({});
  const [languageMap, setLanguageMap] = useState<{ [key: string]: string }>({});
  
  // --- Form Input State from user ---
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileSummary, setProfileSummary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [numExpQuestions, setNumExpQuestions] = useState(1);
  const [numRoleQuestions, setNumRoleQuestions] = useState(1);
  const [numPersonalityQuestions, setNumPersonalityQuestions] = useState(1);
  
  // --- Dropdown Select State ---
  const [industry, setIndustry] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [language, setLanguage] = useState('');

  // --- Interview Flow State ---
  const [interviewPhase, setInterviewPhase] = useState('SETUP');
  const [activePhase, setActivePhase] = useState('GREETING');
  const [expQuestionsAsked, setExpQuestionsAsked] = useState(0);
  const [roleQuestionsAsked, setRoleQuestionsAsked] = useState(0);
  const [personalityQuestionsAsked, setPersonalityQuestionsAsked] = useState(0);
  const [cvText, setCvText] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Analysis[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<FinalAnalysis | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  return {
    // State Values
    jobData,
    languages,
    cvFile,
    profileSummary,
    jobDescription,
    additionalInfo,
    numExpQuestions,
    numRoleQuestions,
    numPersonalityQuestions,
    industry,
    availableRoles,
    role,
    language,
    languageMap,
    interviewPhase,
    activePhase,
    expQuestionsAsked,
    roleQuestionsAsked,
    personalityQuestionsAsked,
    cvText,
    userName,
    isLoading,
    chatHistory,
    currentAnalysis,
    analysisHistory,
    finalAnalysis,
    canRetry,

    // Setter Functions
    setJobData,
    setLanguages,
    setCvFile,
    setProfileSummary,
    setJobDescription,
    setAdditionalInfo,
    setNumExpQuestions,
    setNumRoleQuestions,
    setNumPersonalityQuestions,
    setIndustry,
    setAvailableRoles,
    setRole,
    setLanguage,
    setLanguageMap,
    setInterviewPhase,
    setActivePhase,
    setExpQuestionsAsked,
    setRoleQuestionsAsked,
    setPersonalityQuestionsAsked,
    setCvText,
    setUserName,
    setIsLoading,
    setChatHistory,
    setCurrentAnalysis,
    setAnalysisHistory,
    setFinalAnalysis,
    setCanRetry,
  };
};