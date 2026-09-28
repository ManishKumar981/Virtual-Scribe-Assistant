// ============================================
// AURA - Field Merger
// Merges extracted findings from Gemini into existing clinical findings
// ============================================

import { ClinicalFindings } from '../types/index.js';

/**
 * Create empty clinical findings object
 */
export function createEmptyFindings(): ClinicalFindings {
  return {
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
}

/**
 * Merge newly extracted findings into existing findings.
 * - String fields: overwrite only if currently null/empty and new value is non-null
 * - Array fields: append unique new entries (no duplicates)
 */
export function mergeFindings(
  existing: ClinicalFindings,
  extracted: Partial<ClinicalFindings>
): ClinicalFindings {
  const merged = { ...existing };

  // Merge string fields (only overwrite if current is null/empty)
  const stringFields: (keyof ClinicalFindings)[] = [
    'chiefComplaint',
    'duration',
    'onset',
    'severity',
    'medicalHistory',
  ];

  for (const field of stringFields) {
    const newValue = extracted[field];
    if (newValue && typeof newValue === 'string' && newValue.trim()) {
      const currentValue = merged[field];
      if (!currentValue || (typeof currentValue === 'string' && !currentValue.trim())) {
        (merged as any)[field] = newValue.trim();
      }
    }
  }

  // Merge array fields (append unique entries)
  const arrayFields: (keyof ClinicalFindings)[] = [
    'symptoms',
    'associatedSymptoms',
    'redFlags',
    'medications',
    'allergies',
  ];

  for (const field of arrayFields) {
    const newValues = extracted[field];
    if (Array.isArray(newValues) && newValues.length > 0) {
      const currentArray = merged[field] as string[];
      const currentLower = new Set(currentArray.map((v) => v.toLowerCase()));
      
      for (const newVal of newValues) {
        if (typeof newVal === 'string' && newVal.trim() && !currentLower.has(newVal.trim().toLowerCase())) {
          currentArray.push(newVal.trim());
          currentLower.add(newVal.trim().toLowerCase());
        }
      }
    }
  }

  return merged;
}

/**
 * Convert camelCase ClinicalFindings to snake_case for database
 */
export function findingsToDb(findings: ClinicalFindings): Record<string, any> {
  return {
    chief_complaint: findings.chiefComplaint,
    symptoms: findings.symptoms,
    duration: findings.duration,
    onset: findings.onset,
    severity: findings.severity,
    associated_symptoms: findings.associatedSymptoms,
    red_flags: findings.redFlags,
    medical_history: findings.medicalHistory,
    medications: findings.medications,
    allergies: findings.allergies,
  };
}

/**
 * Convert snake_case DB row to camelCase ClinicalFindings
 */
export function dbToFindings(row: Record<string, any>): ClinicalFindings {
  return {
    chiefComplaint: row.chief_complaint || null,
    symptoms: row.symptoms || [],
    duration: row.duration || null,
    onset: row.onset || null,
    severity: row.severity || null,
    associatedSymptoms: row.associated_symptoms || [],
    redFlags: row.red_flags || [],
    medicalHistory: row.medical_history || null,
    medications: row.medications || [],
    allergies: row.allergies || [],
  };
}
