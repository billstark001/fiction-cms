import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { api } from './routes/index.js'
import { initializeDatabase } from './utils/db-init.js'
import { cleanupExpiredTokens } from './auth/tokens.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = new Hono()

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  credentials: true,
}))
app.use('*', logger())

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
  console.error('Unhandled error:', err)
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500)
})

// Not found handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: `Path ${c.req.path} not found`
  }, 404)
})

const port = parseInt(process.env.PORT || '3001')

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
    console.log('🔐 Default admin credentials: admin / admin123')
    
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