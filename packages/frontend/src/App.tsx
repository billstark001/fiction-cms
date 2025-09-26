import { useState, useEffect } from 'react'
import { Slot } from '@radix-ui/react-slot'
import * as styles from './App.css'

interface Story {
  id: number
  title: string
  author: string
  createdAt: string
  excerpt: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
  loading: boolean
}

function App() {
  const [health, setHealth] = useState<ApiResponse<{ status: string; timestamp: string; service: string }>>({ loading: true })
  const [stories, setStories] = useState<ApiResponse<{ stories: Story[] }>>({ loading: true })

  useEffect(() => {
    // Test backend health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth({ data, loading: false }))
      .catch(error => setHealth({ error: error.message, loading: false }))

    // Fetch stories
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories({ data, loading: false }))
      .catch(error => setStories({ error: error.message, loading: false }))
  }, [])

  const handleCreateStory = async () => {
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Story',
          author: 'Demo Author',
          excerpt: 'This is a new story created from the frontend...'
        })
      })
      const result = await response.json()
      console.log('Story created:', result)
      
      // Refresh stories
      setStories({ loading: true })
      fetch('/api/stories')
        .then(res => res.json())
        .then(data => setStories({ data, loading: false }))
        .catch(error => setStories({ error: error.message, loading: false }))
    } catch (error) {
      console.error('Error creating story:', error)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fiction CMS</h1>
        <p className={styles.subtitle}>A modern content management system for fiction writers</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Backend Health</h2>
        {health.loading && <p className={styles.loadingText}>Checking backend health...</p>}
        {health.error && <p className={styles.errorText}>Error: {health.error}</p>}
        {health.data && (
          <div>
            <p><strong>Status:</strong> {health.data.status}</p>
            <p><strong>Service:</strong> {health.data.service}</p>
            <p><strong>Timestamp:</strong> {new Date(health.data.timestamp).toLocaleString()}</p>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Stories</h2>
          <Slot className={styles.primaryButton} onClick={handleCreateStory}>
            <button>Create New Story</button>
          </Slot>
        </div>
        
        {stories.loading && <p className={styles.loadingText}>Loading stories...</p>}
        {stories.error && <p className={styles.errorText}>Error: {stories.error}</p>}
        {stories.data && (
          <div>
            {stories.data.stories.map(story => (
              <div key={story.id} className={styles.storyCard}>
                <h3 className={styles.storyTitle}>{story.title}</h3>
                <p className={styles.storyMeta}>
                  By {story.author} • {new Date(story.createdAt).toLocaleDateString()}
                </p>
                <p className={styles.storyExcerpt}>{story.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default App