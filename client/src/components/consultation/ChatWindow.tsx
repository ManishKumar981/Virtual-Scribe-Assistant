// ============================================
// AURA - Pure Voice AI Clinical Console
// Voice-First Medical Assistant (English, Telugu, Hindi)
// ============================================

import { useEffect, useState } from 'react';
import { TextInput } from './TextInput';
import { useConsultation } from '../../context/ConsultationContext';
import { useVoice } from '../../hooks/useVoice';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface ChatWindowProps {
  onComplete?: () => void;
}

type SupportedLanguage = 'en-US' | 'te-IN' | 'hi-IN';

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string; promptText: string }[] = [
  { code: 'en-US', name: 'English', flag: '🇬🇧', promptText: 'Tap mic and speak your symptoms' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🇮🇳', promptText: 'మైక్ నొక్కి మీ సమస్యలు చెప్పండి' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳', promptText: 'माइक दबाएं और अपनी समस्या बताएं' },
];

export function ChatWindow({ onComplete }: ChatWindowProps) {
  const {
    messages,
    findings,
    isComplete,
    isLoading,
    error,
    detectedRedFlags,
    isEmergency,
    sendMessage,
    endConsultation,
  } = useConsultation();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en-US');
  const [isEnding, setIsEnding] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis({
    lang: selectedLang,
  });

  const handleTranscript = async (text: string) => {
    try {
      const response = await sendMessage(text, true, selectedLang);
      // Use voiceText for TTS (optimized for Telugu/Hindi native speech)
      speak(response.voiceText, selectedLang);
    } catch (err) {
      console.error('Failed to process voice input:', err);
    }
  };

  const handleTextSend = async (text: string) => {
    stopSpeaking();
    try {
      const response = await sendMessage(text, false, selectedLang);
      speak(response.voiceText, selectedLang);
    } catch (err) {
      console.error('Failed to process text input:', err);
    }
  };

  const voice = useVoice({
    onTranscript: handleTranscript,
    onError: (err) => console.error('Voice error:', err),
    language: selectedLang,
  });

  const handleEndConsultation = async () => {
    stopSpeaking();
    voice.stopListening();
    setIsEnding(true);
    try {
      await endConsultation();
      // onComplete is triggered by the useEffect watching isComplete
    } catch (err) {
      console.error('Failed to end consultation:', err);
    } finally {
      setIsEnding(false);
    }
  };

  // Handle completion
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Last assistant and patient messages
  const lastPatientMsg = [...messages].reverse().find((m) => m.role === 'patient');
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  // Active status indicator
  let voiceStatusText = 'Tap Microphone to Speak';
  let orbClass = 'idle';

  if (voice.isListening) {
    voiceStatusText = 'Listening... Speak now';
    orbClass = 'listening';
  } else if (isLoading) {
    voiceStatusText = 'Assistant is analyzing...';
    orbClass = 'thinking';
  } else if (isSpeaking) {
    voiceStatusText = 'Assistant is responding...';
    orbClass = 'speaking';
  }

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  const handleMicClick = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    voice.toggleListening();
  };

  return (
    <div className="voice-console-layout">
      {/* Top Clinical & Language Toolbar */}
      <header className="voice-console-topbar">
        <div className="status-indicator">
          <span className={`status-dot ${orbClass}`}></span>
          <span className="status-title">Virtual Scribe Assistant</span>
        </div>

        <div className="topbar-right-controls">
          {/* Language Switcher Pills */}
          <div className="language-pills-bar">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`lang-pill-btn ${selectedLang === lang.code ? 'active' : ''}`}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>

          {/* End Consultation Button */}
          <button
            onClick={handleEndConsultation}
            disabled={isLoading || isEnding}
            className="btn btn-end-consultation btn-sm"
          >
            {isEnding ? (
              <>
                <div className="spinner small"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span>End & Generate Report</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Red Flag Emergency Banner */}
      {detectedRedFlags.length > 0 && (
        <div className={`red-flag-banner ${isEmergency ? 'emergency' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <div>
            <strong>{isEmergency ? '⚠ EMERGENCY DETECTED' : 'Red Flags Detected'}</strong>
            <ul>
              {detectedRedFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Console Content - 2 Column View */}
      <div className="voice-console-body">
        {/* Left Column: Futuristic Voice Orb Console */}
        <div className="voice-orb-section">
          <div className="voice-orb-container">
            {/* Glowing Orb Aura */}
            <div className={`voice-orb-glow ${orbClass}`}></div>
            <div className={`voice-orb-waves ${orbClass}`}></div>

            {/* Mic Console Button */}
            <button
              onClick={handleMicClick}
              disabled={isLoading || isEnding}
              className={`voice-mic-orb ${orbClass}`}
              title="Click to speak"
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          </div>

          {/* Voice Status Text */}
          <div className="voice-status-wrapper">
            <h3 className="voice-status-label">{voiceStatusText}</h3>
            <p className="voice-prompt-sub">{currentLangObj.promptText}</p>
          </div>

          {/* Live Hearing Transcript Stream */}
          {(voice.interimText || voice.finalText) && (
            <div className="voice-live-caption">
              <span className="caption-tag">Hearing You:</span>
              <span className="caption-body">
                {voice.finalText} <span className="interim">{voice.interimText}</span>
              </span>
            </div>
          )}

          {/* Transcript & Text Input Toggle Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setShowTranscript((prev) => !prev)}
              className="btn-transcript-toggle"
            >
              {showTranscript ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <span>Hide Text & Keyboard</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Show Text Transcript & Keyboard</span>
                </>
              )}
            </button>
          </div>

          {/* Current Conversation Subtitles & Text Input Box (Collapsible) */}
          {showTranscript && (
            <>
              <div className="voice-subtitles-card">
                {lastPatientMsg && (
                  <div className="subtitle-line patient">
                    <span className="subtitle-icon">👤 You:</span>
                    <p>{lastPatientMsg.content}</p>
                  </div>
                )}

                {lastAssistantMsg && (
                  <div className="subtitle-line assistant">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className="subtitle-icon">🩺 Virtual Scribe:</span>
                      <button
                        type="button"
                        onClick={() => speak(lastAssistantMsg.content, selectedLang)}
                        disabled={isSpeaking}
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '6px',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Play Telugu/Hindi voice"
                      >
                        🔊 {isSpeaking ? 'Speaking...' : 'Listen Voice'}
                      </button>
                    </div>
                    <p>{lastAssistantMsg.content}</p>
                  </div>
                )}

                {!lastPatientMsg && (
                  <p className="subtitle-placeholder">
                    Press the microphone orb above to speak in {currentLangObj.name}, or type below.
                  </p>
                )}
              </div>

              {/* Quick Text Fallback Input Bar */}
              <div className="voice-text-fallback-bar">
                <TextInput
                  onSend={handleTextSend}
                  disabled={isLoading || voice.isListening}
                  placeholder="Or type your message here..."
                />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Real-Time Clinical Data Dashboard */}
        <div className="clinical-board-section">
          <div className="clinical-card">
            <div className="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <h4>Extracted Symptoms & Medical Findings</h4>
            </div>

            <div className="card-content">
              {findings.chiefComplaint && (
                <div className="finding-group">
                  <span className="finding-label">Primary Issue:</span>
                  <span className="finding-badge primary">{findings.chiefComplaint}</span>
                </div>
              )}

              <div className="finding-group">
                <span className="finding-label">Reported Symptoms:</span>
                <div className="symptom-tags-list">
                  {findings.symptoms.length > 0 ? (
                    findings.symptoms.map((s, i) => (
                      <span key={i} className="symptom-tag">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">Listening for symptoms...</span>
                  )}
                </div>
              </div>

              {findings.duration && (
                <div className="finding-group">
                  <span className="finding-label">Duration:</span>
                  <span className="finding-value">{findings.duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Voice Assistant Guidelines */}
          <div className="clinical-card advice-box">
            <div className="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <h4>Voice Assistant Guidelines</h4>
            </div>
            <ul className="guidelines-list">
              <li>Speak clearly into your device's microphone.</li>
              <li>You can switch between **English**, **Telugu**, or **Hindi** anytime.</li>
              <li>When you're done, tap **End & Generate Report** to view your clinical summary.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
