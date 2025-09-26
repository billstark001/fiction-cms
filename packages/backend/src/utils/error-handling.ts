/**
 * Centralized error handling utilities
 */

import { Context } from 'hono';

export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  requestId?: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  validationErrors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Operations
  OPERATION_FAILED: 'OPERATION_FAILED',
  FILE_OPERATION_FAILED: 'FILE_OPERATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Security
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code: keyof typeof ERROR_CODES,
  statusCode: number = 500,
  additionalData?: Record<string, any>
): Response {
  const errorResponse: ErrorResponse = {
    error,
    code: ERROR_CODES[code],
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  return Response.json(errorResponse, { status: statusCode });
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  message: string,
  validationErrors: Array<{ field: string; message: string }>,
  statusCode: number = 400
): Response {
  const errorResponse: ValidationErrorResponse = {
    error: message,
    code: ERROR_CODES.VALIDATION_FAILED,
    timestamp: new Date().toISOString(),
    validationErrors
  };

  return Response.json(errorResponse, { status: statusCode });
}

/**
 * Handle and log errors in a consistent way
 */
export function handleError(
  error: unknown,
  context: string,
  c?: Context,
  sensitiveDetails: boolean = false
): Response {
  const requestId = c?.get('requestId') || generateRequestId();
  
  // Log the full error for debugging
  console.error(`[${requestId}] Error in ${context}:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Return safe error message to client
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      return createErrorResponse(
        'Insufficient permissions',
        'INSUFFICIENT_PERMISSIONS',
        403,
        { requestId }
      );
    }
    
    if (error.message.includes('not found')) {
      return createErrorResponse(
        'Resource not found',
        'NOT_FOUND',
        404,
        { requestId }
      );
    }
    
    if (error.message.includes('already exists')) {
      return createErrorResponse(
        'Resource already exists',
        'ALREADY_EXISTS',
        409,
        { requestId }
      );
    }

    // For development, we can expose more details
    if (process.env.NODE_ENV === 'development' && sensitiveDetails) {
      return createErrorResponse(
        error.message,
        'INTERNAL_ERROR',
        500,
        { requestId, stack: error.stack }
      );
    }
  }

  // Generic internal error response
  return createErrorResponse(
    'Internal server error',
    'INTERNAL_ERROR',
    500,
    { requestId }
  );
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove file paths and sensitive information
    return error.message
      .replace(/\/[^\s]*/g, '[PATH]') // Remove file paths
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // Remove emails
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '[TOKEN]') // Remove GitHub tokens
      .replace(/Bearer\s+[^\s]+/g, 'Bearer [TOKEN]'); // Remove Bearer tokens
  }
  return 'Unknown error occurred';
}

/**
 * Validation helper for common patterns
 */
export const validators = {
  isValidPath: (path: string): boolean => {
    // Prevent path traversal
    return !path.includes('..') && !path.startsWith('/');
  },
  
  isValidFileType: (filename: string, allowedExtensions: string[]): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ext ? allowedExtensions.includes(ext) : false;
  },
  
  isValidFileSize: (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
    return size <= maxSize; // Default 10MB
  },
  
  sanitizeFilename: (filename: string): string => {
    // Remove potentially dangerous characters
    return filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  }
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create request array for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (validRequests.length < this.maxRequests) {
      validRequests.push(now);
      this.requests.set(identifier, validRequests);
      return true;
    }
    
    return false;
  }
  
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}