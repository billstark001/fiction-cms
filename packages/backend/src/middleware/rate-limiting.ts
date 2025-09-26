/**
 * Rate limiting middleware for Fiction CMS
 */

import { Context, Next } from 'hono';
import { RateLimiter, createErrorResponse } from '../utils/error-handling.js';

// Different rate limiters for different endpoints
const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: new RateLimiter(15 * 60 * 1000, 10), // 10 requests per 15 minutes
  
  // General API endpoints
  api: new RateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  
  // File upload endpoints - very strict
  upload: new RateLimiter(60 * 60 * 1000, 20), // 20 uploads per hour
  
  // Deployment endpoints - moderate limits
  deploy: new RateLimiter(15 * 60 * 1000, 5) // 5 deployments per 15 minutes
};

/**
 * Generic rate limiting middleware factory
 */
export function rateLimit(type: keyof typeof rateLimiters) {
  return async (c: Context, next: Next) => {
    const limiter = rateLimiters[type];
    
    // Use IP address as identifier, fallback to user ID if authenticated
    const ip = c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    const user = c.get('user');
    const identifier = user ? `user:${user.id}` : `ip:${ip}`;
    
    if (!limiter.isAllowed(identifier)) {
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        429,
        {
          type,
          retryAfter: Math.ceil((rateLimiters[type] as any).windowMs / 1000)
        }
      );
    }
    
    await next();
  };
}

/**
 * Cleanup old rate limit entries periodically
 */
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
}, 5 * 60 * 1000); // Cleanup every 5 minutes

// Export specific rate limiters
export const authRateLimit = rateLimit('auth');
export const apiRateLimit = rateLimit('api'); 
export const uploadRateLimit = rateLimit('upload');
export const deployRateLimit = rateLimit('deploy');