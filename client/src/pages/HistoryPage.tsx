// ============================================
// AURA - History Page
// ============================================

import React, { useEffect, useState } from 'react';
import { ConsultationList } from '../components/history/ConsultationList';
import { getHistory } from '../services/api';
import { HistoryItem } from '../types';

interface HistoryPageProps {
  onBack: () => void;
  onSelectConsultation: (id: string) => void;
}

export function HistoryPage({ onBack, onSelectConsultation }: HistoryPageProps) {
  const [consultations, setConsultations] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const result = await getHistory(page, 20);
        setConsultations(result.consultations);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [page]);

  return (
    <div className="history-page">
      <header className="history-header">
        <button onClick={onBack} className="btn btn-ghost btn-sm back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Dashboard
        </button>
        <h2>Consultation History</h2>
      </header>

      <div className="history-content">
        <ConsultationList
          consultations={consultations}
          onSelect={onSelectConsultation}
          loading={loading}
        />

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
