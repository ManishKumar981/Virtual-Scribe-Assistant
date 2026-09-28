// ============================================
// AURA - Consultation Routes
// ============================================

import { Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/authMiddleware.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import * as engine from '../engine/consultationEngine.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware as any);

/**
 * POST /api/consultations/start
 * Start a new consultation session
 */
router.post(
  '/start',
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    if (!req.userId) {
      throw createError('Unauthorized', 401);
    }

    const result = await engine.startConsultation(req.userId);

    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/consultations/message
 * Send a message in an active consultation
 */
router.post(
  '/message',
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    if (!req.userId) {
      throw createError('Unauthorized', 401);
    }

    const { consultationId, message, isVoiceInput, language } = req.body;

    if (!consultationId || !message) {
      throw createError('consultationId and message are required', 400);
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw createError('Message must be a non-empty string', 400);
    }

    if (message.length > 5000) {
      throw createError('Message exceeds maximum length of 5000 characters', 400);
    }

    const result = await engine.processMessage(
      consultationId,
      req.userId,
      message.trim(),
      isVoiceInput === true,
      typeof language === 'string' ? language : 'en'
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/consultations/:id/end
 * Explicitly end a consultation and generate the summary report
 */
router.post(
  '/:id/end',
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    if (!req.userId) {
      throw createError('Unauthorized', 401);
    }

    const result = await engine.endConsultation(req.params.id, req.userId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/consultations/:id
 * Get full consultation details (findings, messages, summary)
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    if (!req.userId) {
      throw createError('Unauthorized', 401);
    }

    const result = await engine.getConsultationDetails(req.params.id, req.userId);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;

