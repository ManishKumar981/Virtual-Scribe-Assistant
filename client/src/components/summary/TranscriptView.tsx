// ============================================
// AURA - Transcript View Component
// ============================================

import React from 'react';
import { ChatMessage } from '../../types';

interface TranscriptViewProps {
  messages: ChatMessage[];
}

export function TranscriptView({ messages }: TranscriptViewProps) {
  const handleExport = () => {
    const transcript = messages
      .map(
        (msg) =>
          `[${new Date(msg.createdAt).toLocaleTimeString()}] ${
            msg.role === 'assistant' ? 'Virtual Scribe Assistant' : 'PATIENT'
          }${msg.isVoiceInput ? ' (voice)' : ''}: ${msg.content}`
      )
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-scribe-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="transcript-view">
      <div className="transcript-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Conversation Transcript
        </h3>
        <button onClick={handleExport} className="btn btn-secondary btn-sm" id="export-transcript-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>

      <div className="transcript-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`transcript-entry ${msg.role}`}>
            <div className="transcript-meta">
              <span className="transcript-role">
                {msg.role === 'assistant' ? '🩺 Virtual Scribe Assistant' : '👤 Patient'}
              </span>
              <span className="transcript-time">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {msg.isVoiceInput && <span className="transcript-voice">🎤</span>}
            </div>
            <p className="transcript-content">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
