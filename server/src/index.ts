// ============================================
// AURA - Express Server Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import consultationRoutes from './routes/consultationRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import ttsRoutes from './routes/ttsRoutes.js';
import { initSupabase } from './services/supabaseService.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// Middleware
// ============================================

// Trust proxy — required for correct IP detection behind reverse proxies
// (Render, Railway, Vercel, Nginx, etc.) so rate limiting works correctly
if (isProduction) {
  app.set('trust proxy', 1);
}

// CORS — configurable per environment (supports comma-separated list, wildcard *, or development mode)
const rawOrigin = process.env.CLIENT_ORIGIN || '*';
const allowedOrigins = rawOrigin.includes(',')
  ? rawOrigin.split(',').map((o) => o.trim())
  : rawOrigin === '*'
  ? true
  : rawOrigin;

app.use(
  cors({
    origin: isProduction && allowedOrigins !== true ? allowedOrigins : true,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Message-specific rate limiter (stricter)
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 messages per minute
  message: { error: 'Too many messages, please slow down.' },
});

app.use('/api/consultations/message', messageLimiter);

// ============================================
// Routes
// ============================================

app.use('/api/consultations', consultationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/tts', ttsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Virtual Scribe Assistant API', timestamp: new Date().toISOString() });
});

// ============================================
// Error handling
// ============================================

app.use(errorHandler);

// ============================================
// Process-level error handlers (prevent silent crashes in production)
// ============================================

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Give time to flush logs before exiting
  setTimeout(() => process.exit(1), 1000);
});

// ============================================
// Start server
// ============================================

async function start() {
  try {
    // Initialize Supabase connection (tests reachability, falls back to in-memory if unreachable)
    const sb = await initSupabase();
    console.log(sb ? '✓ Supabase connected' : '✓ Running with in-memory store (Supabase unavailable)');

    // Verify Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠ GEMINI_API_KEY not set - AI features will not work');
    } else {
      console.log('✓ Gemini API key configured');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🩺 Virtual Scribe Assistant API`);
      console.log(`   Running on http://0.0.0.0:${PORT} (Accessible via Network IP)`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   CORS Origin: ${isProduction ? rawOrigin : 'ALL (development mode)'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
