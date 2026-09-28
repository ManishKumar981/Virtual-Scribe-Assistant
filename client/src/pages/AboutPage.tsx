// ============================================
// AURA - About & Senior Clinical Guide Page
// Provides easy instructions for elderly patients and health information
// ============================================

import React from 'react';

interface AboutPageProps {
  onBack: () => void;
  onStartConsultation: () => void;
}

export function AboutPage({ onBack, onStartConsultation }: AboutPageProps) {
  return (
    <div className="about-page-container">
      {/* Header */}
      <div className="about-header">
        <button onClick={onBack} className="btn btn-ghost btn-sm back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </button>
        <h2>ℹ️ About Virtual Scribe Assistant</h2>
        <p className="about-subtitle">
          Voice-first multilingual medical consultation and clinical history-taking system
        </p>
      </div>

      {/* 3-Step Simple Guide for Elderly Patients */}
      <div className="guide-section">
        <h3 className="section-title">
          <span>👴</span> How Seniors & Patients Can Use Virtual Scribe Assistant in 3 Easy Steps
        </h3>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>Choose Your Language</h4>
            <p>Select your comfortable language: <strong>English</strong>, <strong>తెలుగు (Telugu)</strong>, or <strong>हिंदी (Hindi)</strong> at any time.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h4>Tap Mic & Speak Symptoms</h4>
            <p>Tap the big glowing blue microphone orb and speak naturally about how you feel, your pain, or symptoms.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h4>Listen & Get Medical Summary</h4>
            <p>Virtual Scribe Assistant speaks back in your language and generates a detailed 6-section clinical report for your doctor.</p>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="about-features-grid">
        <div className="about-card">
          <div className="card-icon">🗣️</div>
          <h3>Multilingual Voice Output</h3>
          <p>
            Supports clear, fluent voice responses in English, native Telugu script (తెలుగు), and Hindi (हिंदी).
          </p>
        </div>

        <div className="about-card">
          <div className="card-icon">📊</div>
          <h3>Advanced 6-Section Clinical Reports</h3>
          <p>
            Creates History of Present Illness (HPI), Differential Diagnosis, OTC Remedies, Specialist Recommendations, and Emergency Red Flags.
          </p>
        </div>

        <div className="about-card">
          <div className="card-icon">🔒</div>
          <h3>Patient Privacy & Data Protection</h3>
          <p>
            Consultation records are stored securely with Supabase database encryption and zero unauthorized sharing.
          </p>
        </div>
      </div>

      {/* Call To Action Card */}
      <div className="about-cta-card">
        <h3>Ready to start your health consultation?</h3>
        <p>Talk to Virtual Scribe Assistant using your voice now in English, Telugu, or Hindi.</p>
        <button onClick={onStartConsultation} className="btn btn-primary">
          🩺 Start Consultation Now
        </button>
      </div>
    </div>
  );
}
