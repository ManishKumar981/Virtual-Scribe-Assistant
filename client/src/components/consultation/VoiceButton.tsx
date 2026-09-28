// ============================================
// AURA - Voice Button Component
// ============================================

import React from 'react';
import { VoiceState } from '../../types';

interface VoiceButtonProps {
  voiceState: VoiceState;
  isSupported: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({ voiceState, isSupported, onClick, disabled }: VoiceButtonProps) {
  if (!isSupported) return null;

  const isActive = voiceState === 'listening' || voiceState === 'capturing';
  const isProcessing = voiceState === 'submitting' || voiceState === 'starting';

  const getLabel = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...';
      case 'capturing':
        return 'Capturing...';
      case 'starting':
        return 'Starting...';
      case 'submitting':
        return 'Processing...';
      case 'speaking':
        return 'Assistant is speaking';
      default:
        return 'Tap to speak';
    }
  };

  return (
    <div className="voice-button-container">
      <button
        type="button"
        className={`voice-button ${isActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={onClick}
        disabled={disabled || isProcessing}
        aria-label={getLabel()}
        title={getLabel()}
      >
        {isActive && (
          <div className="voice-ripple">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          {isActive ? (
            // Stop icon when active
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            // Mic icon when idle
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          )}
        </svg>
      </button>
      <span className="voice-label">{getLabel()}</span>
    </div>
  );
}
