import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthRequest } from '../types/auth.types';

export function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  return null;
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' });
  }

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      userId?: string;
      sub?: string;
      role?: string;
    };

    const role = (decoded.role || '').toLowerCase();
    if (role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Bu amalni bajarish huquqingiz yo\'q' });
    }

    const adminId = decoded.userId || decoded.sub || '';
    req.adminId = adminId;
    req.user = {
      id: adminId,
      role: 'SUPER_ADMIN',
      school_id: null,
      school_number: null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Sessiya muddati tugagan, qaytadan kiring' });
  }
}
