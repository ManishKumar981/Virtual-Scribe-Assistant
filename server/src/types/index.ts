// ============================================
// AURA - Shared Types (Server)
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

export interface ConsultationState {
  consultationId: string;
  userId: string;
  stage: ConsultationStage;
  findings: ClinicalFindings;
  askedQuestions: string[];
  missingFields: string[];
  isComplete: boolean;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'patient' | 'assistant' | 'system';
  content: string;
  isVoiceInput: boolean;
  createdAt: string;
}

export interface GeminiResponse {
  assistantMessage: string;
  voiceText?: string;
  extractedFindings: Partial<ClinicalFindings>;
  detectedRedFlags: string[];
  isEmergency: boolean;
}

export interface ConsultationSummary {
  summaryText: string;
  clinicalImpression: string | null;
  recommendedTriageLevel: 'routine' | 'urgent' | 'emergency';
}

// DB row types (snake_case)
export interface DBProfile {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBConsultation {
  id: string;
  profile_id: string;
  stage: ConsultationStage;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
}

export interface DBMessage {
  id: string;
  consultation_id: string;
  role: 'patient' | 'assistant' | 'system';
  content: string;
  is_voice_input: boolean;
  created_at: string;
}

export interface DBClinicalFindings {
  id: string;
  consultation_id: string;
  chief_complaint: string | null;
  symptoms: string[];
  duration: string | null;
  onset: string | null;
  severity: string | null;
  associated_symptoms: string[];
  red_flags: string[];
  medical_history: string | null;
  medications: string[];
  allergies: string[];
  updated_at: string;
}

export interface DBConsultationSummary {
  id: string;
  consultation_id: string;
  summary_text: string;
  clinical_impression: string | null;
  recommended_triage_level: 'routine' | 'urgent' | 'emergency';
  created_at: string;
}
