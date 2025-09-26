/**
 * Comprehensive request logging middleware for Fiction CMS
 */

import { Context, Next } from 'hono';
import { createRequestLogger, logHelpers } from '../utils/logger.js';

/**
 * Enhanced request logging middleware that captures detailed request/response info
 */
export function requestLoggingMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = c.get('requestId') || `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const ip = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
    
    // Create request-specific logger
    const logger = createRequestLogger(requestId, method, path);
    
    // Log incoming request
    logger.info({
      type: 'request_start',
      method,
      path,
      userAgent,
      ip,
      headers: Object.fromEntries(c.req.header() as any)
    }, `${method} ${path} started`);

    // Store logger and start time in context for other middleware/routes to use
    c.set('logger', logger);
    c.set('startTime', startTime);

    try {
      await next();
      
      const duration = Date.now() - startTime;
      const status = c.res.status;
      const user = c.get('user');
      
      // Log completed request
      logHelpers.apiRequest(method, path, status, duration, user?.id, requestId);
      
      logger.info({
        type: 'request_complete',
        method,
        path,
        status,
        duration,
        userId: user?.id,
        username: user?.username
      }, `${method} ${path} completed - ${status}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error({
        type: 'request_error',
        method,
        path,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, `${method} ${path} failed`);
      
      throw error;
    }
  };
}

/**
 * Performance monitoring middleware that logs slow requests
 */
export function performanceMiddleware(slowThreshold: number = 1000) {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    
    await next();
    
    const duration = Date.now() - startTime;
    
    if (duration > slowThreshold) {
      const logger = c.get('logger') || createRequestLogger(
        c.get('requestId') || 'unknown',
        c.req.method,
        c.req.path
      );
      
      logger.warn({
        type: 'slow_request',
        method: c.req.method,
        path: c.req.path,
        duration,
        threshold: slowThreshold,
        status: c.res.status
      }, `Slow request detected: ${c.req.method} ${c.req.path} took ${duration}ms`);
    }
  };
}

/**
 * Error logging middleware that captures unhandled errors
 */
export function errorLoggingMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      const logger = c.get('logger') || createRequestLogger(
        c.get('requestId') || 'unknown',
        c.req.method,
        c.req.path
      );
      
      logger.error({
        type: 'unhandled_error',
        method: c.req.method,
        path: c.req.path,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: c.get('user')?.id
      }, `Unhandled error in ${c.req.method} ${c.req.path}`);
      
      throw error;
    }
  };
}

/**
 * Database operation logging decorator
 */
export function logDatabaseOperation<T extends any[], R>(
  operation: string,
  table: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      logHelpers.dbOperation(operation, table, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logHelpers.dbError(
        operation,
        table,
        error instanceof Error ? error : new Error(String(error)),
        duration
      );
      
      throw error;
    }
  };
}