// ============================================
// AURA - Speech Synthesis Hook
// Ultra-Fluent Native Audio Engine (Telugu, Hindi, English)
// Uses Backend Proxy TTS Route for 100% Reliable Telugu Speech Output
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE = (import.meta.env.VITE_API_URL || `http://${host}:5000/api`).replace(/\/$/, '');

interface UseSpeechSynthesisOptions {
  onStart?: () => void;
  onEnd?: () => void;
  lang?: string;
  rate?: number;
  pitch?: number;
}

/**
 * Split text into sentence-level chunks that fit within the TTS API limit (180 chars).
 */
function splitIntoChunks(text: string, maxLen: number = 180): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.?!।])\s+/);

  let current = '';
  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current.trim()) chunks.push(current.trim());

      if (sentence.length > maxLen) {
        const parts = sentence.split(/(?<=,)\s*/);
        let sub = '';
        for (const part of parts) {
          if ((sub + ' ' + part).trim().length <= maxLen) {
            sub = (sub + ' ' + part).trim();
          } else {
            if (sub.trim()) chunks.push(sub.trim());
            if (part.length > maxLen) {
              const words = part.split(/\s+/);
              let wordChunk = '';
              for (const w of words) {
                if ((wordChunk + ' ' + w).trim().length <= maxLen) {
                  wordChunk = (wordChunk + ' ' + w).trim();
                } else {
                  if (wordChunk.trim()) chunks.push(wordChunk.trim());
                  wordChunk = w;
                }
              }
              if (wordChunk.trim()) sub = wordChunk.trim();
              else sub = '';
            } else {
              sub = part;
            }
          }
        }
        if (sub.trim()) current = sub.trim();
        else current = '';
      } else {
        current = sentence;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.filter((c) => c.length > 0);
}

export function useSpeechSynthesis({
  onStart,
  onEnd,
  lang = 'en-US',
  rate = 1.0,
  pitch = 1.0,
}: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelledRef = useRef(false);

  // Pre-created HTMLAudioElement to bypass browser autoplay blocks
  const persistentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    persistentAudioRef.current = new Audio();
  }, []);

  // Preload browser voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch {}
      audioRef.current = null;
    }
    if (persistentAudioRef.current) {
      try {
        persistentAudioRef.current.pause();
        persistentAudioRef.current.currentTime = 0;
        persistentAudioRef.current.src = '';
      } catch {}
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  /**
   * Play a single chunk via Backend Proxy TTS endpoint.
   */
  const playChunkAudio = useCallback(
    (chunk: string, langCode: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (cancelledRef.current) {
          resolve(false);
          return;
        }

        const ttsUrl = `${API_BASE}/tts?text=${encodeURIComponent(chunk)}&lang=${encodeURIComponent(
          langCode
        )}`;

        const audio = persistentAudioRef.current || new Audio();
        audioRef.current = audio;

        audio.src = ttsUrl;

        const onEnded = () => {
          cleanup();
          resolve(true);
        };

        const onError = (e: any) => {
          console.warn('Backend TTS error for chunk, attempting fallback:', e);
          cleanup();
          resolve(false);
        };

        const cleanup = () => {
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        audio.play().catch((playErr) => {
          console.warn('Audio play error:', playErr);
          cleanup();
          resolve(false);
        });
      });
    },
    []
  );

  /**
   * Web Speech API Fallback
   */
  const speakWithWebSpeech = useCallback(
    (text: string, targetLang: string) => {
      if (!('speechSynthesis' in window)) {
        setIsSpeaking(false);
        onEnd?.();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;

        const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const langPrefix = targetLang.split('-')[0];

        let preferredVoice = currentVoices.find(
          (v) => v.lang.startsWith(langPrefix) || v.lang.includes(langPrefix)
        );

        if (!preferredVoice && langPrefix === 'te') {
          preferredVoice = currentVoices.find(
            (v) => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India')
          );
          utterance.lang = preferredVoice ? preferredVoice.lang : 'hi-IN';
        } else {
          utterance.lang = targetLang;
        }

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          onStart?.();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          onEnd?.();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          onEnd?.();
        };

        utteranceRef.current = utterance;

        setTimeout(() => {
          try {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          } catch {
            setIsSpeaking(false);
            onEnd?.();
          }
        }, 30);
      } catch {
        setIsSpeaking(false);
        onEnd?.();
      }
    },
    [rate, pitch, voices, onStart, onEnd]
  );

  const speak = useCallback(
    async (text: string, speakLang?: string) => {
      if (!text.trim()) return;

      const targetLang = speakLang || lang || 'en-US';
      const langCode = targetLang.split('-')[0]; // 'en', 'te', 'hi'

      stop();
      cancelledRef.current = false;

      const fullText = text.trim();
      if (!fullText) return;

      const chunks = splitIntoChunks(fullText, 180);

      setIsSpeaking(true);
      onStart?.();

      let ttsFailed = false;
      for (let i = 0; i < chunks.length; i++) {
        if (cancelledRef.current) break;

        const success = await playChunkAudio(chunks[i], langCode);
        if (!success) {
          ttsFailed = true;
          break;
        }
      }

      if (ttsFailed && !cancelledRef.current) {
        speakWithWebSpeech(fullText, targetLang);
        return;
      }

      if (!cancelledRef.current) {
        setIsSpeaking(false);
        onEnd?.();
      }
    },
    [lang, stop, onStart, onEnd, playChunkAudio, speakWithWebSpeech]
  );

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
