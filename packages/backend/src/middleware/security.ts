/**
 * Input sanitization and security middleware
 */

import { Context, Next } from 'hono';
import { validators, createErrorResponse } from '../utils/error-handling.js';

/**
 * Sanitize file uploads
 */
export function sanitizeFileUpload(allowedExtensions: string[], maxSize: number = 10 * 1024 * 1024) {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');
    
    if (contentType && contentType.includes('multipart/form-data')) {
      try {
        const body = await c.req.parseBody();
        const file = body['file'] as File;
        const path = body['path'] as string;
        
        if (file) {
          // Check file size
          if (!validators.isValidFileSize(file.size, maxSize)) {
            return createErrorResponse(
              `File too large. Maximum size is ${Math.floor(maxSize / (1024 * 1024))}MB`,
              'FILE_TOO_LARGE',
              400
            );
          }
          
          // Check file type
          if (!validators.isValidFileType(file.name, allowedExtensions)) {
            return createErrorResponse(
              `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
              'INVALID_FILE_TYPE',
              400
            );
          }
          
          // Sanitize filename
          const sanitizedName = validators.sanitizeFilename(file.name);
          if (sanitizedName !== file.name) {
            console.warn(`Sanitized filename from "${file.name}" to "${sanitizedName}"`);
          }
        }
        
        if (path) {
          // Validate path
          if (!validators.isValidPath(path)) {
            return createErrorResponse(
              'Invalid file path',
              'INVALID_INPUT',
              400
            );
          }
        }
      } catch (error) {
        return createErrorResponse(
          'Invalid file upload data',
          'VALIDATION_FAILED',
          400
        );
      }
    }
    
    await next();
  };
}

/**
 * Security headers middleware
 */
export async function securityHeaders(c: Context, next: Next) {
  // Add security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server info
  c.header('Server', '');
  
  await next();
}

/**
 * Request ID middleware
 */
export async function requestId(c: Context, next: Next) {
  const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  c.set('requestId', id);
  c.header('X-Request-ID', id);
  await next();
}

/**
 * Content Security Policy middleware
 */
export async function csp(c: Context, next: Next) {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for development
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'"
  ];
  
  c.header('Content-Security-Policy', cspDirectives.join('; '));
  await next();
}

/**
 * CORS middleware with security considerations
 */
export function cors(allowedOrigins: string[] = ['http://localhost:3000']) {
  return async (c: Context, next: Next) => {
    const origin = c.req.header('origin');
    
    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
    }
    
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Max-Age', '86400');
    
    if (c.req.method === 'OPTIONS') {
      return new Response('', { status: 204 });
    }
    
    await next();
  };
}

/**
 * Body size limit middleware
 */
export function bodyLimit(maxSize: number = 50 * 1024 * 1024) { // 50MB default
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return createErrorResponse(
        `Request body too large. Maximum size is ${Math.floor(maxSize / (1024 * 1024))}MB`,
        'INVALID_INPUT',
        413
      );
    }
    
    await next();
  };
}