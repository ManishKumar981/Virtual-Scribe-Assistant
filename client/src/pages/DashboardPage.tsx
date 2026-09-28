// ============================================
// AURA - Dashboard Page
// ============================================

import React from 'react';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onStartConsultation: () => void;
  onViewHistory: () => void;
}

export function DashboardPage({ onStartConsultation, onViewHistory }: DashboardPageProps) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || localStorage.getItem('aura_patient_name') || 'Patient';

  return (
    <div className="dashboard-page">
      {/* Main content */}
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome back, {displayName}</h2>
          <p>How can Virtual Scribe Assistant help you today?</p>
        </div>

        <div className="dashboard-actions">
          {/* New Consultation Card */}
          <button className="action-card primary" onClick={onStartConsultation} id="start-consultation-btn">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </div>
            <h3>New Consultation</h3>
            <p>Start a voice-assisted clinical history taking session in English, Telugu, or Hindi</p>
            <span className="action-cta">
              Begin Consultation
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>

          {/* History Card */}
          <button className="action-card secondary" onClick={onViewHistory} id="view-history-btn">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Consultation History</h3>
            <p>View past consultation summaries, doctor reports, and full conversation transcripts</p>
            <span className="action-cta">
              View History
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="info-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <h4>Important Clinical Notice</h4>
              <p>
                Virtual Scribe Assistant is an AI-driven clinical documentation assistant designed for triage and history recording. Always consult a licensed healthcare professional for prescription medications and diagnosis.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
