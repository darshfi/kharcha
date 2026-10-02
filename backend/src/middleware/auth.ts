import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../services/supabase';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.match(/^Bearer\s+(\S+)$/i)?.[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify token and get user
    const user = await getUserFromToken(token);

    // Attach user to request object
    req.user = user;

    // Continue to next middleware/route handler
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if no token provided
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.match(/^Bearer\s+(\S+)$/i)?.[1];
      if (token) {
        const user = await getUserFromToken(token);
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
