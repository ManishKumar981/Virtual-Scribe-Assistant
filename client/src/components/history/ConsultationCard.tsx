// ============================================
// AURA - Consultation Card Component
// ============================================

import React from 'react';
import { HistoryItem, STAGE_LABELS } from '../../types';

interface ConsultationCardProps {
  consultation: HistoryItem;
  onClick: (id: string) => void;
}

export function ConsultationCard({ consultation, onClick }: ConsultationCardProps) {
  const chiefComplaint =
    consultation.clinical_findings?.[0]?.chief_complaint || 'No complaint recorded';
  const hasRedFlags =
    consultation.clinical_findings?.[0]?.red_flags?.length > 0;
  const triageLevel =
    consultation.consultation_summaries?.[0]?.recommended_triage_level || 'routine';

  const statusColors: Record<string, string> = {
    active: 'status-active',
    completed: 'status-completed',
    abandoned: 'status-abandoned',
  };

  return (
    <div
      className="consultation-card"
      onClick={() => onClick(consultation.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(consultation.id)}
    >
      <div className="card-header">
        <span className={`status-badge ${statusColors[consultation.status]}`}>
          {consultation.status}
        </span>
        {hasRedFlags && <span className="red-flag-indicator" title="Red flags detected">⚠</span>}
      </div>

      <h4 className="card-complaint">{chiefComplaint}</h4>

      <div className="card-meta">
        <span className="card-date">
          {new Date(consultation.started_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span className="card-time">
          {new Date(consultation.started_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="card-footer">
        <span className="card-stage">{STAGE_LABELS[consultation.stage]}</span>
        {triageLevel !== 'routine' && (
          <span className={`triage-badge triage-${triageLevel}`}>
            {triageLevel}
          </span>
        )}
      </div>
    </div>
  );
}
