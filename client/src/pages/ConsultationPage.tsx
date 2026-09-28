// ============================================
// AURA - Consultation Page
// ============================================

import React, { useEffect } from 'react';
import { ChatWindow } from '../components/consultation/ChatWindow';
import { useConsultation } from '../context/ConsultationContext';

interface ConsultationPageProps {
  onBack: () => void;
  onComplete: (consultationId: string) => void;
}

export function ConsultationPage({ onBack, onComplete }: ConsultationPageProps) {
  const { consultationId, startNewConsultation, isComplete, isLoading } = useConsultation();

  useEffect(() => {
    if (!consultationId) {
      startNewConsultation();
    }
  }, [consultationId, startNewConsultation]);

  const handleComplete = () => {
    if (consultationId) {
      onComplete(consultationId);
    }
  };

  return (
    <div className="consultation-page">
      <header className="consultation-header">
        <button onClick={onBack} className="btn btn-ghost btn-sm back-btn" id="back-to-dashboard-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <div className="consultation-title">
          <div className="aura-logo small">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2>Clinical Consultation</h2>
        </div>
        {isComplete && (
          <button onClick={handleComplete} className="btn btn-primary btn-sm" id="view-summary-btn">
            View Summary
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}
      </header>

      <div className="consultation-body">
        {isLoading && !consultationId ? (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Starting consultation...</p>
          </div>
        ) : (
          <ChatWindow onComplete={handleComplete} />
        )}
      </div>
    </div>
  );
}
