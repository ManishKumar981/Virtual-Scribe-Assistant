// ============================================
// AURA - Consultation Context
// Manages active consultation state
// ============================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage, ClinicalFindings, ConsultationStage } from '../types';
import * as api from '../services/api';

interface ConsultationContextType {
  consultationId: string | null;
  stage: ConsultationStage;
  messages: ChatMessage[];
  findings: ClinicalFindings;
  isComplete: boolean;
  isLoading: boolean;
  progress: number;
  error: string | null;
  detectedRedFlags: string[];
  isEmergency: boolean;
  startNewConsultation: () => Promise<void>;
  sendMessage: (
    message: string,
    isVoiceInput?: boolean,
    language?: string
  ) => Promise<{ text: string; voiceText: string }>;
  loadConsultation: (consultationId: string) => Promise<void>;
  endConsultation: () => Promise<void>;
  reset: () => void;
}

const emptyFindings: ClinicalFindings = {
  chiefComplaint: null,
  symptoms: [],
  duration: null,
  onset: null,
  severity: null,
  associatedSymptoms: [],
  redFlags: [],
  medicalHistory: null,
  medications: [],
  allergies: [],
};

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

export function ConsultationProvider({ children }: { children: React.ReactNode }) {
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [stage, setStage] = useState<ConsultationStage>('presenting_complaint');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [findings, setFindings] = useState<ClinicalFindings>(emptyFindings);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detectedRedFlags, setDetectedRedFlags] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);

  const startNewConsultation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.startConsultation();
      setConsultationId(result.consultationId);
      setStage(result.stage as ConsultationStage);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.welcomeMessage,
          isVoiceInput: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setFindings(emptyFindings);
      setIsComplete(false);
      setProgress(0);
      setDetectedRedFlags([]);
      setIsEmergency(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (
      message: string,
      isVoiceInput: boolean = false,
      language: string = 'en'
    ): Promise<{ text: string; voiceText: string }> => {
      if (!consultationId) throw new Error('No active consultation');

      setIsLoading(true);
      setError(null);

      // Add patient message immediately
      const patientMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'patient',
        content: message,
        isVoiceInput,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, patientMsg]);

      try {
        const result = await api.sendMessage(consultationId, message, isVoiceInput, language);

        // Add assistant response
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.assistantMessage,
          isVoiceInput: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        setStage(result.stage as ConsultationStage);
        setFindings(result.findings);
        setIsComplete(result.isComplete);
        setProgress(result.progress);

        if (result.detectedRedFlags.length > 0) {
          setDetectedRedFlags((prev) => [...new Set([...prev, ...result.detectedRedFlags])]);
        }
        if (result.isEmergency) {
          setIsEmergency(true);
        }

        return {
          text: result.assistantMessage,
          voiceText: result.voiceText || result.assistantMessage,
        };
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [consultationId]
  );

  const loadConsultation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getConsultationDetails(id);
      setConsultationId(id);
      setStage(result.consultation.stage);
      setMessages(result.messages);
      setFindings(result.findings);
      setIsComplete(result.consultation.status === 'completed');

      const stageOrder = [
        'presenting_complaint', 'symptom_details', 'duration_onset', 'severity',
        'associated_symptoms', 'red_flag_screening', 'medical_history',
        'medications_allergies', 'final_summary', 'completed',
      ];
      setProgress(Math.round((stageOrder.indexOf(result.consultation.stage) / 9) * 100));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endConsultation = useCallback(async () => {
    if (!consultationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.endConsultation(consultationId);
      setIsComplete(true);
      setStage('completed');
      setProgress(100);
      if (result.findings) setFindings(result.findings);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [consultationId]);

  const reset = useCallback(() => {
    setConsultationId(null);
    setStage('presenting_complaint');
    setMessages([]);
    setFindings(emptyFindings);
    setIsComplete(false);
    setIsLoading(false);
    setProgress(0);
    setError(null);
    setDetectedRedFlags([]);
    setIsEmergency(false);
  }, []);

  return (
    <ConsultationContext.Provider
      value={{
        consultationId,
        stage,
        messages,
        findings,
        isComplete,
        isLoading,
        progress,
        error,
        detectedRedFlags,
        isEmergency,
        startNewConsultation,
        sendMessage,
        loadConsultation,
        endConsultation,
        reset,
      }}
    >
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error('useConsultation must be used within a ConsultationProvider');
  }
  return context;
}
