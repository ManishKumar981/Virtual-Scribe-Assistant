// ============================================
// AURA - Findings Table Component
// ============================================

import React from 'react';
import { ClinicalFindings } from '../../types';

interface FindingsTableProps {
  findings: ClinicalFindings;
}

export function FindingsTable({ findings }: FindingsTableProps) {
  const rows = [
    { label: 'Chief Complaint', value: findings.chiefComplaint },
    { label: 'Symptoms', value: findings.symptoms.length > 0 ? findings.symptoms.join(', ') : null },
    { label: 'Duration', value: findings.duration },
    { label: 'Onset', value: findings.onset },
    { label: 'Severity', value: findings.severity },
    {
      label: 'Associated Symptoms',
      value: findings.associatedSymptoms.length > 0 ? findings.associatedSymptoms.join(', ') : null,
    },
    {
      label: 'Red Flags',
      value: findings.redFlags.length > 0 ? findings.redFlags.join(', ') : null,
      isAlert: findings.redFlags.length > 0,
    },
    { label: 'Medical History', value: findings.medicalHistory },
    {
      label: 'Medications',
      value: findings.medications.length > 0 ? findings.medications.join(', ') : null,
    },
    {
      label: 'Allergies',
      value: findings.allergies.length > 0 ? findings.allergies.join(', ') : null,
      isAlert: findings.allergies.length > 0,
    },
  ];

  return (
    <div className="findings-table">
      <h3 className="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        Clinical Findings
      </h3>
      <div className="findings-grid">
        {rows.map((row) => (
          <div key={row.label} className={`finding-row ${row.isAlert ? 'alert' : ''}`}>
            <span className="finding-label">{row.label}</span>
            <span className={`finding-value ${!row.value ? 'empty' : ''}`}>
              {row.value || 'Not reported'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
