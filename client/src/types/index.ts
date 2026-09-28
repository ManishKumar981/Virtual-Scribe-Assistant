// ============================================
// AURA - Client Types
// ============================================

export type ConsultationStage =
  | 'presenting_complaint'
  | 'symptom_details'
  | 'duration_onset'
  | 'severity'
  | 'associated_symptoms'
  | 'red_flag_screening'
  | 'medical_history'
  | 'medications_allergies'
  | 'final_summary'
  | 'completed';

export interface ClinicalFindings {
  chiefComplaint: string | null;
  symptoms: string[];
  duration: string | null;
  onset: string | null;
  severity: string | null;
  associatedSymptoms: string[];
  redFlags: string[];
  medicalHistory: string | null;
  medications: string[];
  allergies: string[];
}

export interface ChatMessage {
  id: string;
  role: 'patient' | 'assistant' | 'system';
  content: string;
  isVoiceInput: boolean;
  createdAt: string;
}

export interface ConsultationData {
  consultationId: string;
  stage: ConsultationStage;
  findings: ClinicalFindings;
  messages: ChatMessage[];
  isComplete: boolean;
  progress: number;
}

export interface ConsultationSummary {
  consultation: {
    id: string;
    stage: ConsultationStage;
    status: 'active' | 'completed' | 'abandoned';
    started_at: string;
    completed_at: string | null;
  };
  findings: ClinicalFindings;
  messages: ChatMessage[];
  summary: {
    summary_text: string;
    clinical_impression: string | null;
    recommended_triage_level: 'routine' | 'urgent' | 'emergency';
  } | null;
}

export interface HistoryItem {
  id: string;
  stage: ConsultationStage;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  clinical_findings: {
    chief_complaint: string | null;
    red_flags: string[];
  }[];
  consultation_summaries: {
    summary_text: string;
    recommended_triage_level: string;
  }[];
}

export type VoiceState =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'capturing'
  | 'stopping'
  | 'submitting'
  | 'speaking';

export const STAGE_LABELS: Record<ConsultationStage, string> = {
  presenting_complaint: 'Chief Complaint',
  symptom_details: 'Symptom Details',
  duration_onset: 'Duration & Onset',
  severity: 'Severity Assessment',
  associated_symptoms: 'Associated Symptoms',
  red_flag_screening: 'Red Flag Screening',
  medical_history: 'Medical History',
  medications_allergies: 'Medications & Allergies',
  final_summary: 'Final Summary',
  completed: 'Completed',
};
