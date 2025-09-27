import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAuthActions } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { checkAuth } = useAuthActions();
  const location = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1rem',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required roles are specified
  if (requiredRoles.length > 0 && user) {
    const userRoleNames = user.roles.map(role => role.name);
    const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '1.5rem', color: '#dc2626' }}>Access Denied</h1>
          <p style={{ color: '#6b7280' }}>
            You don't have the required permissions to access this page.
          </p>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            Required roles: {requiredRoles.join(', ')}
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}