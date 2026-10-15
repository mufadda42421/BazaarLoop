import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getDb, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'bazaarloop-super-secure-production-key-2026';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function createToken(payload: AuthPayload): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const dataBase64 = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(dataBase64).digest('base64url');
  return `${dataBase64}.${signature}`;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const [dataBase64, signature] = token.split('.');
    if (!dataBase64 || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(dataBase64).digest('base64url');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(dataBase64, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || 'user'
    };
  } catch {
    return null;
  }
}

/**
 * Normalizes international phone numbers for WhatsApp.
 * Returns numeric string without '+' or symbols (e.g. '14155552671').
 */
export function normalizeWhatsAppNumber(countryCode: string, localNumber: string): { normalized: string; isValid: boolean } {
  // Clean country code (e.g., '+1' -> '1')
  const cleanCode = countryCode.replace(/[^0-9]/g, '');
  // Clean local digits, strip leading 0s often used in local formats
  let cleanLocal = localNumber.replace(/[^0-9]/g, '');
  if (cleanLocal.startsWith('0') && cleanCode !== '39') { // Italy allows 0
    cleanLocal = cleanLocal.replace(/^0+/, '');
  }

  const combined = `${cleanCode}${cleanLocal}`;
  // E.164 valid length: 7 to 15 digits
  const isValid = combined.length >= 7 && combined.length <= 15;

  return {
    normalized: combined,
    isValid
  };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const db = getDb();
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const db = getDb();
      req.user = db.users.find(u => u.id === payload.userId);
    }
  }
  next();
}
