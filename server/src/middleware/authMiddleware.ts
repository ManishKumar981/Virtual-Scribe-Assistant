// ============================================
// AURA - Auth Middleware (Open Access / No Login Required)
// Accepts Supabase JWT if present, otherwise defaults to Guest User
// ============================================

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

const DEFAULT_GUEST_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_GUEST_EMAIL = 'guest@aura.ai';

/**
 * Middleware that allows instant open access without mandatory authentication
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let userId = DEFAULT_GUEST_ID;
  let userEmail = DEFAULT_GUEST_EMAIL;

  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token && token !== 'guest-token' && token !== 'null' && token !== 'undefined') {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data } = await supabase.auth.getUser(token);

          if (data?.user) {
            userId = data.user.id;
            userEmail = data.user.email || DEFAULT_GUEST_EMAIL;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Auth token verification skipped, using guest access.');
  }

  req.userId = userId;
  req.userEmail = userEmail;
  next();
}
