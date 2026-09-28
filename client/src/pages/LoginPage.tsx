// ============================================
// AURA - Elderly-Friendly Authentication Page
// High-Contrast 1-Tap Entry, Name/PIN Login, and Caregiver Access
// ============================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type LoginTab = 'quick' | 'pin' | 'email';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<LoginTab>('quick');

  // Quick Patient State
  const [patientName, setPatientName] = useState('');

  // Name & PIN State
  const [pinName, setPinName] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Caregiver Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = patientName.trim() || 'Senior Patient';
    localStorage.setItem('aura_patient_name', finalName);
    onLoginSuccess?.();
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (pinCode.length < 4) {
      setErrorMsg('Please enter a 4-digit PIN (e.g. 1234)');
      return;
    }
    setErrorMsg(null);
    localStorage.setItem('aura_patient_name', pinName.trim());
    localStorage.setItem('aura_patient_pin', pinCode);
    onLoginSuccess?.();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let res;
      if (isRegisterMode) {
        res = await signUp(email, password, 'Caregiver User');
      } else {
        res = await signIn(email, password);
      }

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onLoginSuccess?.();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page elderly-auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb-1"></div>
        <div className="auth-orb orb-2"></div>
        <div className="auth-orb orb-3"></div>
      </div>

      <div className="auth-container elderly-auth-container">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="aura-logo large animated">
            <div className="logo-pulse"></div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1>Virtual Scribe Assistant</h1>
          <p className="auth-tagline">AI Clinical Documentation & Consultation Assistant</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card glass elderly-card">
          {/* Tab Selector */}
          <div className="elderly-tab-selector">
            <button
              type="button"
              onClick={() => { setActiveTab('quick'); setErrorMsg(null); }}
              className={`elderly-tab ${activeTab === 'quick' ? 'active' : ''}`}
            >
              <span>👴</span> 1-Tap Entry
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('pin'); setErrorMsg(null); }}
              className={`elderly-tab ${activeTab === 'pin' ? 'active' : ''}`}
            >
              <span>🔢</span> Name & PIN
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('email'); setErrorMsg(null); }}
              className={`elderly-tab ${activeTab === 'email' ? 'active' : ''}`}
            >
              <span>✉️</span> Caregiver
            </button>
          </div>

          {errorMsg && (
            <div className="form-error" style={{ marginBottom: '16px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* TAB 1: 1-Tap Quick Patient Entry */}
          {activeTab === 'quick' && (
            <form onSubmit={handleQuickEntry} className="elderly-form">
              <div className="senior-notice-box">
                <p>👴 <strong>Senior Friendly Access:</strong> No passwords or email required! Tap the big button below to begin.</p>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '1rem', fontWeight: 600 }}>Your Name (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="senior-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full senior-big-btn"
              >
                👴 Start Patient Consultation (1-Tap)
              </button>
            </form>
          )}

          {/* TAB 2: Name & 4-Digit PIN */}
          {activeTab === 'pin' && (
            <form onSubmit={handlePinSubmit} className="elderly-form">
              <div className="form-group">
                <label style={{ fontSize: '1rem', fontWeight: 600 }}>Patient Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Sita Devi"
                  value={pinName}
                  onChange={(e) => setPinName(e.target.value)}
                  className="senior-input"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '1rem', fontWeight: 600 }}>Create 4-Digit Easy PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="senior-input pin-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full senior-big-btn"
              >
                🔑 Login with 4-Digit PIN
              </button>
            </form>
          )}

          {/* TAB 3: Caregiver Email Login */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailAuth} className="elderly-form">
              <div className="form-group">
                <label>Caregiver Email Address:</label>
                <input
                  type="email"
                  placeholder="caregiver@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Processing...' : isRegisterMode ? 'Register Caregiver Account' : 'Sign In as Caregiver'}
              </button>

              <p className="auth-switch" style={{ marginTop: '12px' }}>
                {isRegisterMode ? 'Already have an account?' : 'Need a caregiver account?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="link-btn"
                >
                  {isRegisterMode ? 'Sign In' : 'Register Here'}
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>🩺 Virtual Scribe Assistant — Senior Accessibility Enabled</p>
          <small>Voice-First Multilingual Healthcare Documentation</small>
        </div>
      </div>
    </div>
  );
}
