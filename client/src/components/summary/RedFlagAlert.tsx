// ============================================
// AURA - Red Flag Alert Component
// ============================================

import React from 'react';

interface RedFlagAlertProps {
  redFlags: string[];
  triageLevel: string;
}

export function RedFlagAlert({ redFlags, triageLevel }: RedFlagAlertProps) {
  if (redFlags.length === 0) return null;

  const isEmergency = triageLevel === 'emergency';

  return (
    <div className={`red-flag-alert ${isEmergency ? 'emergency' : 'warning'}`}>
      <div className="alert-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
        <h4>{isEmergency ? 'Emergency Red Flags' : 'Clinical Red Flags Detected'}</h4>
      </div>
      <ul className="red-flag-list">
        {redFlags.map((flag, index) => (
          <li key={index}>{flag}</li>
        ))}
      </ul>
      {isEmergency && (
        <p className="emergency-warning">
          ⚠ This patient may require immediate medical attention. Please seek emergency care.
        </p>
      )}
    </div>
  );
}
