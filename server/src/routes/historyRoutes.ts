// ============================================
// AURA - History Routes
// ============================================

import { Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/authMiddleware.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import * as db from '../services/supabaseService.js';

const router = Router();

router.use(authMiddleware as any);

/**
 * GET /api/history
 * Get user's consultation history with pagination
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    if (!req.userId) {
      throw createError('Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await db.getUserConsultations(req.userId, page, limit);

    res.json({
      success: true,
      data: {
        consultations: result.consultations,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      },
    });
  })
);

export default router;
