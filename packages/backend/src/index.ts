import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { api } from './routes/index.js'
import { initializeDatabase } from './utils/db-init.js'
import { cleanupExpiredTokens } from './auth/tokens.js'
import { securityHeaders, requestId, csp, cors, bodyLimit } from './middleware/security.js'
import { requestLoggingMiddleware, performanceMiddleware, errorLoggingMiddleware } from './middleware/logging.js'
import { apiRateLimit } from './middleware/rate-limiting.js'
import { handleError } from './utils/error-handling.js'
import { config, isDevelopment } from './config/environment.js'
import { loggers, logHelpers } from './utils/logger.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = new Hono()

// Security middleware (applied first)
app.use('*', securityHeaders)
app.use('*', requestId)
app.use('*', csp)
app.use('*', cors([config.FRONTEND_URL]))
app.use('*', bodyLimit(config.MAX_BODY_SIZE))

// Enhanced logging middleware
app.use('*', requestLoggingMiddleware())
app.use('*', errorLoggingMiddleware())
app.use('*', performanceMiddleware(2000)) // Log requests taking > 2 seconds

// Hono's built-in logger for development
if (isDevelopment) {
  app.use('*', honoLogger())
}

// Rate limiting for API routes
app.use('/api/*', apiRateLimit)

// API routes
app.route('/api', api)

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Fiction CMS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api/health'
  })
})

// Error handler
app.onError((err, c) => {
  return handleError(err, 'Global error handler', c, true);
})

// Not found handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: `Path ${c.req.path} not found`
  }, 404)
})

const port = config.PORT

async function startServer() {
  try {
    loggers.server.info('Starting Fiction CMS Backend server initialization');
    
    // Initialize database
    await initializeDatabase()
    
    // Setup periodic token cleanup (every 24 hours)
    setInterval(() => {
      cleanupExpiredTokens().catch(err => {
        loggers.auth.error({ error: err.message, stack: err.stack }, 'Token cleanup error');
      })
    }, 24 * 60 * 60 * 1000)
    
    loggers.server.info({
      port,
      healthCheck: `http://localhost:${port}/api/health`,
      apiEndpoints: `http://localhost:${port}/api`,
      frontendUrl: config.FRONTEND_URL,
      environment: config.NODE_ENV
    }, `Fiction CMS Backend starting on port ${port}`);
    
    if (isDevelopment) {
      loggers.server.warn({
        defaultCredentials: { username: 'admin', password: 'admin123' }
      }, 'Running in development mode');
    }
    
    serve({
      fetch: app.fetch,
      port: port,
    })
    
    loggers.server.info('Fiction CMS Backend server started successfully');
  } catch (error) {
    loggers.server.fatal({ error: error instanceof Error ? error.message : String(error) }, 'Failed to start server');
    process.exit(1)
  }
}

startServer()