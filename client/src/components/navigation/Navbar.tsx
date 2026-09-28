// ============================================
// AURA - Navigation Bar Component
// Senior-Accessible Navigation with Font Scaler & Emergency Quick Link
// ============================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export type AppView = 'dashboard' | 'consultation' | 'summary' | 'history' | 'support' | 'about' | 'login';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isLargeFont: boolean;
  onToggleLargeFont: () => void;
}

export function Navbar({ currentView, onNavigate, isLargeFont, onToggleLargeFont }: NavbarProps) {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || localStorage.getItem('aura_patient_name') || 'Patient';

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <button onClick={() => onNavigate('dashboard')} className="navbar-brand-btn">
          <div className="aura-logo small">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="brand-title">
            Virtual Scribe <span className="brand-sub">Assistant</span>
          </span>
        </button>

        {/* Center Nav Links */}
        <nav className="navbar-menu">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            🏠 Home
          </button>

          <button
            onClick={() => onNavigate('consultation')}
            className={`nav-link ${currentView === 'consultation' ? 'active' : ''}`}
          >
            🩺 New Consultation
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
          >
            📋 Medical History
          </button>

          <button
            onClick={() => onNavigate('support')}
            className={`nav-link emergency ${currentView === 'support' ? 'active' : ''}`}
          >
            🚨 Emergency & Support
          </button>

          <button
            onClick={() => onNavigate('about')}
            className={`nav-link ${currentView === 'about' ? 'active' : ''}`}
          >
            ℹ️ About
          </button>
        </nav>

        {/* Right Controls */}
        <div className="navbar-controls">
          {/* Senior Font Scaler */}
          <button
            type="button"
            onClick={onToggleLargeFont}
            className={`senior-font-toggle ${isLargeFont ? 'active' : ''}`}
            title="Toggle Senior Large Text Size"
          >
            <span>👓 Text:</span>
            <strong>{isLargeFont ? 'Large A+' : 'Normal A'}</strong>
          </button>

          {/* User Status / Account */}
          <div className="user-profile-chip">
            <span className="user-avatar-icon">👤</span>
            <span className="user-name-text">{displayName}</span>
            <button
              type="button"
              onClick={() => {
                signOut();
                onNavigate('login');
              }}
              className="btn-switch-account"
              title="Switch Patient Account"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
