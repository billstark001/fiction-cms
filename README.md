# Fiction CMS

A modern fiction CMS built with pnpm workspaces, featuring a Vite+React frontend and Hono backend, all in TypeScript.

## Architecture

- **Frontend**: Vite + React + TypeScript + Vanilla Extract + Radix UI
- **Backend**: Hono + TypeScript + Node.js
- **Package Manager**: pnpm workspaces
- **Dev Tools**: ESLint + Prettier

## Project Structure

```
fiction-cms/
├── packages/
│   ├── frontend/          # Vite + React frontend
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts # Configured with API proxy to backend
│   └── backend/           # Hono backend
│       ├── src/
│       └── package.json
├── package.json           # Workspace root
├── pnpm-workspace.yaml    # Workspace configuration
└── .eslintrc.cjs         # Shared ESLint config
```

## Features

### Frontend
- ✅ Vite development server with hot reload
- ✅ React 18 with TypeScript
- ✅ Vanilla Extract for CSS-in-TS styling
- ✅ Radix UI components for accessible UI primitives
- ✅ API proxy configuration (all `/api/*` requests forwarded to backend)
- ✅ ESLint + Prettier configured

### Backend
- ✅ Hono web framework with TypeScript
- ✅ CORS and logging middleware
- ✅ RESTful API endpoints for stories
- ✅ Mock data for development
- ✅ Hot reload development server
- ✅ ESLint + Prettier configured

## Getting Started

### Prerequisites

- Node.js (>=18.0.0)
- pnpm (install globally: `npm install -g pnpm`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fiction-cms
   ```

2. Install all dependencies:
   ```bash
   pnpm install
   ```

### Development

Start both frontend and backend development servers:

```bash
pnpm dev
```

This runs both servers concurrently:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3001 (Hono server)

Or start them individually:

```bash
# Backend only
pnpm --filter backend dev

# Frontend only  
pnpm --filter frontend dev
```

### Building

Build both packages for production:

```bash
pnpm build
```

Or build individually:

```bash
# Backend only
pnpm --filter backend build

# Frontend only
pnpm --filter frontend build
```

### Code Quality

Run linting across all packages:

```bash
pnpm lint
```

Run TypeScript type checking:

```bash
pnpm type-check
```

## API Endpoints

The backend exposes the following REST API endpoints:

- `GET /api/health` - Backend health check
- `GET /api/hello` - Simple hello message
- `GET /api/stories` - Retrieve all stories
- `POST /api/stories` - Create a new story

## Frontend Proxy Configuration

The Vite development server is configured to proxy all `/api/*` requests to the backend at `http://localhost:3001`. This allows the frontend to make API calls using relative URLs like `/api/stories` without CORS issues during development.

## Technologies Used

### Frontend
- **Vite**: Fast build tool and development server
- **React 18**: Modern React with concurrent features
- **TypeScript**: Type-safe JavaScript
- **Vanilla Extract**: CSS-in-TS styling solution
- **Radix UI**: Headless, accessible UI components

### Backend
- **Hono**: Fast, lightweight web framework
- **@hono/node-server**: Node.js adapter for Hono
- **TypeScript**: Type-safe JavaScript
- **tsx**: TypeScript execution with hot reload

### Development
- **pnpm**: Fast, disk space efficient package manager
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Concurrently**: Run multiple commands simultaneously

## Next Steps

- Add a database (PostgreSQL/SQLite) for data persistence
- Implement authentication and user management
- Add more sophisticated story management features
- Set up CI/CD pipeline
- Add unit and integration tests
- Implement story editor with rich text capabilities