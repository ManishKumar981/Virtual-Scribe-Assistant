// ============================================
// AURA - Voice Input Hook (Web Speech API - Bulletproof)
// Robust speech recognition with auto-recovery
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceState } from '../types';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SILENCE_TIMEOUT_MS = 1800; // 1.8 seconds silence detection

interface UseVoiceOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export function useVoice({ onTranscript, onError, language = 'en-US' }: UseVoiceOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalStopRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const isSubmittingRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>('idle');

  // Keep ref in sync for callbacks
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.('Speech recognition is not supported in your browser. Please use Google Chrome or Microsoft Edge.');
    }
  }, [onError]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const submitTranscript = useCallback(
    (text: string) => {
      if (isSubmittingRef.current || !text.trim()) return;
      isSubmittingRef.current = true;

      setVoiceState('submitting');
      onTranscript(text.trim());

      setTimeout(() => {
        isSubmittingRef.current = false;
        accumulatedTextRef.current = '';
        setFinalText('');
        setInterimText('');
        setVoiceState('idle');
      }, 200);
    },
    [onTranscript]
  );

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        intentionalStopRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  const stopListening = useCallback(() => {
    intentionalStopRef.current = true;
    clearSilenceTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    }
    setVoiceState('idle');
  }, [clearSilenceTimer]);

  const forceReset = useCallback(() => {
    intentionalStopRef.current = true;
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    accumulatedTextRef.current = '';
    isSubmittingRef.current = false;
    setInterimText('');
    setFinalText('');
    setVoiceState('idle');
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.('Speech recognition is not supported in your browser.');
      return;
    }

    // Force cleanup any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    intentionalStopRef.current = false;
    accumulatedTextRef.current = '';
    isSubmittingRef.current = false;
    setInterimText('');
    setFinalText('');
    setVoiceState('starting');

    recognition.onstart = () => {
      setVoiceState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        accumulatedTextRef.current += final;
        setFinalText(accumulatedTextRef.current);
        setVoiceState('capturing');
        startSilenceTimer();
      }

      if (interim) {
        setInterimText(interim);
        setVoiceState('capturing');
        startSilenceTimer();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition status:', event.error);

      if (event.error === 'aborted') return;

      if (event.error === 'no-speech') {
        // Not a fatal error
        return;
      }

      if (event.error === 'not-allowed') {
        onError?.('Microphone access denied. Please allow microphone access in your browser bar.');
      }

      setVoiceState('idle');
      clearSilenceTimer();
    };

    recognition.onend = () => {
      clearSilenceTimer();

      const text = accumulatedTextRef.current.trim();
      if (text) {
        submitTranscript(text);
      } else {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      forceReset();
    }
  }, [language, onError, startSilenceTimer, clearSilenceTimer, submitTranscript, forceReset]);

  const toggleListening = useCallback(() => {
    if (voiceStateRef.current === 'idle') {
      startListening();
    } else {
      // If currently listening, capturing, or stuck, force stop/reset
      stopListening();
    }
  }, [startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [clearSilenceTimer]);

  return {
    voiceState,
    setVoiceState,
    interimText,
    finalText,
    isSupported,
    isListening: voiceState === 'listening' || voiceState === 'capturing' || voiceState === 'starting',
    startListening,
    stopListening,
    toggleListening,
    forceReset,
  };
}
