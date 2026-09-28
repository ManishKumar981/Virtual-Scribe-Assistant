// ============================================
// AURA - Consultation List Component
// ============================================

import React from 'react';
import { ConsultationCard } from './ConsultationCard';
import { HistoryItem } from '../../types';

interface ConsultationListProps {
  consultations: HistoryItem[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ConsultationList({ consultations, onSelect, loading }: ConsultationListProps) {
  if (loading) {
    return (
      <div className="consultation-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="consultation-card skeleton">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line medium"></div>
          </div>
        ))}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h3>No consultations yet</h3>
        <p>Start your first consultation to see it here.</p>
      </div>
    );
  }

  return (
    <div className="consultation-list">
      {consultations.map((c) => (
        <ConsultationCard key={c.id} consultation={c} onClick={onSelect} />
      ))}
    </div>
  );
}
