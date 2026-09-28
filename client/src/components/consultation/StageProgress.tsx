// ============================================
// AURA - Stage Progress Component
// ============================================

import React from 'react';
import { ConsultationStage, STAGE_LABELS } from '../../types';

interface StageProgressProps {
  currentStage: ConsultationStage;
  progress: number;
}

const STAGES: ConsultationStage[] = [
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

export function StageProgress({ currentStage, progress }: StageProgressProps) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="stage-progress">
      <div className="progress-header">
        <span className="progress-label">
          {STAGE_LABELS[currentStage]}
        </span>
        <span className="progress-value">{progress}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="stage-dots">
        {STAGES.map((stage, index) => (
          <div
            key={stage}
            className={`stage-dot ${
              index < currentIndex
                ? 'completed'
                : index === currentIndex
                ? 'active'
                : ''
            }`}
            title={STAGE_LABELS[stage]}
          />
        ))}
      </div>
    </div>
  );
}
