import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { api } from './routes/index.js'
import { initializeDatabase } from './utils/db-init.js'
import { cleanupExpiredTokens } from './auth/tokens.js'
import { securityHeaders, requestId, csp, cors, bodyLimit } from './middleware/security.js'
import { apiRateLimit } from './middleware/rate-limiting.js'
import { handleError } from './utils/error-handling.js'
import { config, isDevelopment } from './config/environment.js'
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

// Logging middleware
app.use('*', logger())

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
    // Initialize database
    await initializeDatabase()
    
    // Setup periodic token cleanup (every 24 hours)
    setInterval(() => {
      cleanupExpiredTokens().catch(err => 
        console.error('Token cleanup error:', err)
      )
    }, 24 * 60 * 60 * 1000)
    
    console.log(`🚀 Fiction CMS Backend starting on port ${port}`)
    console.log(`📊 Health check: http://localhost:${port}/api/health`)
    console.log(`📚 API endpoints: http://localhost:${port}/api`)
    console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}`)
    
    if (isDevelopment) {
      console.log('🔐 Default admin credentials: admin / admin123')
      console.log('⚠️  Running in development mode')
    }
    
    serve({
      fetch: app.fetch,
      port: port,
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()