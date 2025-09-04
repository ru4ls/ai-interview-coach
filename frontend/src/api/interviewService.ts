// src/api/interviewService.ts

import axios from 'axios';

const API_URL = 'http://localhost:8080/api/interview';

export const startSession = async (formData: FormData): Promise<any> => {
  const response = await axios.post(`${API_URL}/next-step`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const submitAnswer = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/next-step`, formData);
  return response.data;
};

export const getSummary = async (payload: object) => {
  const response = await axios.post(`${API_URL}/summarize`, payload);
  return response.data;
};