// ============================================
// AURA - Stage Manager
// Controls the 10-stage clinical consultation flow
// ============================================

import { ConsultationStage, ClinicalFindings } from '../types/index.js';

// Ordered list of all consultation stages
export const STAGE_ORDER: ConsultationStage[] = [
  'presenting_complaint',
  'symptom_details',
  'duration_onset',
  'severity',
  'associated_symptoms',
  'red_flag_screening',
  'medical_history',
  'medications_allergies',
  'final_summary',
  'completed',
];

// Which fields are required per stage
export const STAGE_REQUIRED_FIELDS: Record<ConsultationStage, (keyof ClinicalFindings)[]> = {
  presenting_complaint: ['chiefComplaint'],
  symptom_details: ['symptoms'],
  duration_onset: ['duration', 'onset'],
  severity: ['severity'],
  associated_symptoms: ['associatedSymptoms'],
  red_flag_screening: ['redFlags'],
  medical_history: ['medicalHistory'],
  medications_allergies: ['medications', 'allergies'],
  final_summary: [],
  completed: [],
};

// Human-readable stage labels
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

/**
 * Check if a field has been filled in the clinical findings
 */
function isFieldFilled(findings: ClinicalFindings, field: keyof ClinicalFindings): boolean {
  const value = findings[field];
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

/**
 * Get all missing required fields for a given stage
 */
export function getMissingFields(
  stage: ConsultationStage,
  findings: ClinicalFindings
): string[] {
  const requiredFields = STAGE_REQUIRED_FIELDS[stage] || [];
  return requiredFields.filter((field) => !isFieldFilled(findings, field));
}

/**
 * Check if the current stage is complete (all required fields filled)
 */
export function isStageComplete(
  stage: ConsultationStage,
  findings: ClinicalFindings
): boolean {
  if (stage === 'final_summary' || stage === 'completed') return true;
  return getMissingFields(stage, findings).length === 0;
}

/**
 * Determine the next appropriate stage based on current findings.
 * Skips stages whose required fields are already filled.
 */
export function getNextStage(
  currentStage: ConsultationStage,
  findings: ClinicalFindings
): ConsultationStage {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  // Iterate through remaining stages
  for (let i = currentIndex + 1; i < STAGE_ORDER.length; i++) {
    const nextStage = STAGE_ORDER[i];

    // Final summary and completed always proceed
    if (nextStage === 'final_summary' || nextStage === 'completed') {
      return nextStage;
    }

    // Skip stages where all required fields are already filled
    if (!isStageComplete(nextStage, findings)) {
      return nextStage;
    }
  }

  return 'completed';
}

/**
 * Get the overall progress percentage (0 - 100)
 */
export function getProgressPercentage(stage: ConsultationStage): number {
  const index = STAGE_ORDER.indexOf(stage);
  if (index === -1) return 0;
  return Math.round((index / (STAGE_ORDER.length - 1)) * 100);
}

/**
 * Get all missing fields across all stages
 */
export function getAllMissingFields(findings: ClinicalFindings): string[] {
  const allMissing: string[] = [];
  for (const stage of STAGE_ORDER) {
    if (stage === 'final_summary' || stage === 'completed') continue;
    allMissing.push(...getMissingFields(stage, findings));
  }
  return allMissing;
}
