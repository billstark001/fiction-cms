/**
 * Unified logging system for Fiction CMS Backend
 * Provides structured logging across all subsystems
 */

import pino, { Logger } from 'pino';
import { config, isDevelopment } from '../config/environment.js';

// Log levels
export const LogLevel = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60
} as const;

// Log contexts/subsystems
export const LogContext = {
  SERVER: 'server',
  DATABASE: 'database',
  AUTH: 'auth',
  GIT: 'git',
  FILESYSTEM: 'filesystem',
  DEPLOYMENT: 'deployment',
  API: 'api',
  MIDDLEWARE: 'middleware'
} as const;

// Create base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: isDevelopment ? 'debug' : config.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        service: 'fiction-cms-backend'
      };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Add request correlation support
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  }
};

// Create pretty printing for development
const devConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
};

// Create the root logger
const rootLogger = pino(isDevelopment ? devConfig : baseConfig);

/**
 * Create a child logger for a specific subsystem
 */
export function createSubsystemLogger(context: string): Logger {
  return rootLogger.child({ subsystem: context });
}

/**
 * Create a logger with request context
 */
export function createRequestLogger(requestId: string, method?: string, path?: string): Logger {
  return rootLogger.child({ 
    requestId,
    method,
    path
  });
}

// Pre-configured loggers for each subsystem
export const loggers = {
  server: createSubsystemLogger(LogContext.SERVER),
  database: createSubsystemLogger(LogContext.DATABASE),
  auth: createSubsystemLogger(LogContext.AUTH),
  git: createSubsystemLogger(LogContext.GIT),
  filesystem: createSubsystemLogger(LogContext.FILESYSTEM),
  deployment: createSubsystemLogger(LogContext.DEPLOYMENT),
  api: createSubsystemLogger(LogContext.API),
  middleware: createSubsystemLogger(LogContext.MIDDLEWARE)
};

// Default export
export const logger = rootLogger;

/**
 * Helper functions for common logging patterns
 */
export const logHelpers = {
  /**
   * Log database operations
   */
  dbOperation: (
    operation: string, 
    table: string, 
    duration?: number, 
    recordCount?: number
  ) => {
    loggers.database.info({
      operation,
      table,
      duration,
      recordCount
    }, `Database ${operation} on ${table}`);
  },

  /**
   * Log database errors
   */
  dbError: (
    operation: string,
    table: string,
    error: Error,
    duration?: number
  ) => {
    loggers.database.error({
      operation,
      table,
      error: error.message,
      stack: error.stack,
      duration
    }, `Database ${operation} failed on ${table}`);
  },

  /**
   * Log authentication events
   */
  authEvent: (
    event: 'login' | 'logout' | 'token_refresh' | 'permission_check',
    userId?: string,
    username?: string,
    success: boolean = true,
    details?: Record<string, any>
  ) => {
    const logData = {
      event,
      userId,
      username,
      success,
      ...details
    };

    if (success) {
      loggers.auth.info(logData, `Authentication event: ${event}`);
    } else {
      loggers.auth.warn(logData, `Authentication event failed: ${event}`);
    }
  },

  /**
   * Log Git operations
   */
  gitOperation: (
    operation: string,
    repository?: string,
    branch?: string,
    commit?: string,
    duration?: number,
    success: boolean = true
  ) => {
    const logData = {
      operation,
      repository,
      branch,
      commit,
      duration,
      success
    };

    if (success) {
      loggers.git.info(logData, `Git ${operation} completed`);
    } else {
      loggers.git.error(logData, `Git ${operation} failed`);
    }
  },

  /**
   * Log file system operations
   */
  fileOperation: (
    operation: 'read' | 'write' | 'delete' | 'create' | 'move' | 'copy',
    path: string,
    size?: number,
    duration?: number,
    success: boolean = true
  ) => {
    const logData = {
      operation,
      path,
      size,
      duration,
      success
    };

    if (success) {
      loggers.filesystem.info(logData, `File ${operation}: ${path}`);
    } else {
      loggers.filesystem.error(logData, `File ${operation} failed: ${path}`);
    }
  },

  /**
   * Log API requests with timing
   */
  apiRequest: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ) => {
    const logData = {
      method,
      path,
      statusCode,
      duration,
      userId,
      requestId
    };

    if (statusCode >= 400) {
      loggers.api.warn(logData, `API ${method} ${path} - ${statusCode}`);
    } else {
      loggers.api.info(logData, `API ${method} ${path} - ${statusCode}`);
    }
  },

  /**
   * Log deployment events
   */
  deploymentEvent: (
    event: 'start' | 'build' | 'upload' | 'complete' | 'error',
    siteId: string,
    taskId?: string,
    duration?: number,
    details?: Record<string, any>
  ) => {
    const logData = {
      event,
      siteId,
      taskId,
      duration,
      ...details
    };

    if (event === 'error') {
      loggers.deployment.error(logData, `Deployment ${event} for site ${siteId}`);
    } else {
      loggers.deployment.info(logData, `Deployment ${event} for site ${siteId}`);
    }
  },

  /**
   * Log middleware operations
   */
  middleware: (
    name: string,
    duration: number,
    requestId?: string,
    details?: Record<string, any>
  ) => {
    loggers.middleware.debug({
      middleware: name,
      duration,
      requestId,
      ...details
    }, `Middleware ${name} executed`);
  }
};

/**
 * Performance logging decorator for functions
 */
export function logPerformance<T extends (...args: any[]) => any>(
  fn: T,
  logger: Logger,
  operationName: string
): T {
  return ((...args: Parameters<T>) => {
    const start = Date.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = Date.now() - start;
        logger.debug({ operation: operationName, duration }, `${operationName} completed`);
      });
    } else {
      const duration = Date.now() - start;
      logger.debug({ operation: operationName, duration }, `${operationName} completed`);
      return result;
    }
  }) as T;
}

// Export types
export type LogContext = keyof typeof LogContext;
export type LogLevel = typeof LogLevel[keyof typeof LogLevel];