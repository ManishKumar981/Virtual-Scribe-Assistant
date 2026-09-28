// ============================================
// AURA - Text-to-Speech Proxy Route
// Provides reliable, high-quality audio streaming for Telugu, Hindi, and English
// Bypasses browser CORS & autoplay restrictions
// ============================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/tts?text=...&lang=te
 * Streams MP3 audio generated from Google Translate TTS
 */
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const text = (req.query.text as string) || '';
    const rawLang = (req.query.lang as string) || 'en';

    if (!text.trim()) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    // Extract primary language code (e.g., 'te-IN' -> 'te', 'hi-IN' -> 'hi', 'en-US' -> 'en')
    const langCode = rawLang.split('-')[0].toLowerCase();

    // Truncate to max 200 chars for TTS safety
    const safeText = text.trim().slice(0, 200);

    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
      langCode
    )}&client=tw-ob&q=${encodeURIComponent(safeText)}`;

    try {
      const response = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch TTS audio from provider' });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache audio for 24h
      res.send(buffer);
    } catch (err: any) {
      console.error('TTS Proxy Error:', err.message);
      res.status(500).json({ error: 'TTS service failed' });
    }
  })
);

export default router;
