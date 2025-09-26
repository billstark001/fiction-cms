import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Test endpoints
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'fiction-cms-backend'
  })
})

app.get('/api/hello', (c) => {
  return c.json({ 
    message: 'Hello from Hono backend!',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/stories', (c) => {
  // Mock stories data
  return c.json({
    stories: [
      {
        id: 1,
        title: 'The First Story',
        author: 'Author One',
        createdAt: '2024-01-01T00:00:00Z',
        excerpt: 'This is the beginning of a great story...'
      },
      {
        id: 2,
        title: 'Another Tale',
        author: 'Author Two', 
        createdAt: '2024-01-02T00:00:00Z',
        excerpt: 'Once upon a time in a digital world...'
      }
    ]
  })
})

app.post('/api/stories', async (c) => {
  const body = await c.req.json()
  
  // Mock creating a story
  return c.json({
    success: true,
    story: {
      id: Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString()
    }
  }, 201)
})

const port = parseInt(process.env.PORT || '3001')

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: port,
})