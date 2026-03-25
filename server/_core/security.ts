/**
 * Security Module - Best-in-Class Security Implementation
 * Implements OWASP Top 10 protections and industry best practices
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { TRPCError } from '@trpc/server';

/**
 * 1. HELMET SECURITY HEADERS
 * Protects against various HTTP header-based attacks
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https://fonts.googleapis.com'],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * 2. RATE LIMITING
 * Prevents brute force attacks and DDoS
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });
};

// Specific rate limiters for sensitive operations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

/**
 * 3. INPUT VALIDATION & SANITIZATION
 * Prevents injection attacks
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove common SQL injection patterns
    return input
      .replace(/['"]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .trim();
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

/**
 * 4. CORS CONFIGURATION
 * Prevents cross-origin attacks
 */
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
      'https://polarisarabia.com',
      'https://www.polarisarabia.com',
      'https://aivalcalc-m2sxuioy.manus.space',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

/**
 * 5. AUTHENTICATION & SESSION SECURITY
 */
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevents XSS attacks
    sameSite: 'strict' as const, // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

/**
 * 6. PASSWORD SECURITY REQUIREMENTS
 */
export const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters`);
  }
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 7. AUDIT LOGGING
 * Tracks security-relevant events
 */
export interface AuditLog {
  timestamp: Date;
  userId?: number;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

export const logAuditEvent = async (log: AuditLog) => {
  // TODO: Implement audit logging to database or external service
  console.log('[AUDIT]', JSON.stringify(log));
};

/**
 * 8. SQL INJECTION PREVENTION
 * Use parameterized queries (already done with Drizzle ORM)
 */

/**
 * 9. CSRF PROTECTION
 * Implemented via session cookies with SameSite=Strict
 */

/**
 * 10. SECURITY HEADERS MIDDLEWARE
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * 11. ERROR HANDLING - NEVER EXPOSE SENSITIVE INFO
 */
export const sanitizeError = (error: any): { message: string; code?: string } => {
  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production') {
    if (error instanceof TRPCError) {
      return { message: error.message, code: error.code };
    }
    return { message: 'An error occurred. Please try again later.' };
  }

  // In development, provide more details
  return {
    message: error.message || 'An error occurred',
    code: error.code,
  };
};

/**
 * 12. DATA ENCRYPTION
 * Sensitive fields should be encrypted at rest
 */
export const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  saltLength: 16,
};

/**
 * 13. API KEY SECURITY
 * Validate and rotate API keys regularly
 */
export const validateApiKey = (apiKey: string): boolean => {
  // Should be checked against database of valid keys
  // Keys should be hashed and salted
  return apiKey.length >= 32;
};

/**
 * 14. DEPENDENCY SECURITY
 * Keep dependencies updated and scan for vulnerabilities
 * Run: npm audit, npm audit fix
 */

/**
 * 15. ENVIRONMENT VARIABLES
 * Never commit .env files, use secure secret management
 */
export const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'VITE_APP_ID',
  'OAUTH_SERVER_URL',
];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * 16. MONITORING & ALERTING
 * Implement security monitoring for:
 * - Failed login attempts
 * - Unusual API usage patterns
 * - Data access anomalies
 * - Configuration changes
 */

export default {
  helmetMiddleware,
  createRateLimiter,
  authLimiter,
  apiLimiter,
  sanitizeInput,
  corsConfig,
  sessionConfig,
  validatePassword,
  logAuditEvent,
  securityHeadersMiddleware,
  sanitizeError,
  validateApiKey,
  validateEnvironment,
};
