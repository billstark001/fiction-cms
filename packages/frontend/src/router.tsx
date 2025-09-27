import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';

// Import components
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import SiteManagement from './pages/SiteManagement';
import SiteContentManagement from './pages/SiteContentManagement';
import CreateSite from './pages/CreateSite';

// Root route component
const RootComponent = () => {
  return <Outlet />;
};

// Create root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

// Create routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <ProtectedRoute requiredRoles={['admin']}>
      <UserManagement />
    </ProtectedRoute>
  ),
});

const sitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sites',
  component: () => (
    <ProtectedRoute>
      <SiteManagement />
    </ProtectedRoute>
  ),
});

const createSiteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sites/create',
  component: () => (
    <ProtectedRoute requiredRoles={['admin']}>
      <CreateSite />
    </ProtectedRoute>
  ),
});

const siteContentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sites/$siteId/manage',
  component: () => (
    <ProtectedRoute>
      <SiteContentManagement />
    </ProtectedRoute>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <ProtectedRoute requiredRoles={['admin']}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        textAlign: 'center'
      }}>
        <h1>Admin Panel</h1>
        <p>System administration features coming soon!</p>
      </div>
    </ProtectedRoute>
  ),
});

// 404 route
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#dc2626' }}>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" style={{ color: '#2563eb' }}>Go to Dashboard</a>
    </div>
  ),
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  usersRoute,
  sitesRoute,
  createSiteRoute,
  siteContentRoute,
  adminRoute,
  notFoundRoute,
]);

// Create the router
export const router = createRouter({ 
  routeTree,
  context: undefined!,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}