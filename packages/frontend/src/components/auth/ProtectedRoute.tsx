import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAuth, useAuthActions } from '../../store/authStore';
import * as styles from './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { checkAuth } = useAuthActions();
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const currentPath = router.state.location.pathname;
    router.navigate({ 
      to: '/login', 
      search: { redirect: currentPath },
      replace: true 
    });
    return null;
  }

  // Check role-based access if required roles are specified
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.roles?.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className={styles.accessDeniedContainer}>
          <h1 className={styles.accessDeniedTitle}>Access Denied</h1>
          <p className={styles.accessDeniedText}>
            You don't have the required permissions to access this page.
          </p>
          <p className={styles.accessDeniedRoles}>
            Required roles: {requiredRoles.join(', ')}
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}