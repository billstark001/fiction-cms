import { Link, useRouter } from '@tanstack/react-router';
import { useAuth } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import * as styles from './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  requiredRole?: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/sites', label: 'Sites' },
  { path: '/users', label: 'User Management', requiredRole: 'admin' },
  { path: '/admin', label: 'Admin Panel', requiredRole: 'admin' },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.navigate({ to: '/login' });
    } catch (error) {
      // Error is handled by the mutation
      console.error('Logout error:', error);
    }
  };

  // Filter nav items based on user roles
  const availableNavItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    return user?.roles?.some(role => role === item.requiredRole);
  });

  const primaryRole = user?.roles?.[0] || 'User';
  const currentPath = router.state.location.pathname;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Fiction CMS</div>
        
        <nav className={styles.nav}>
          {availableNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={currentPath === item.path ? styles.navItemActive : styles.navItem}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* User info at bottom of sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div className={styles.userName}>{user?.displayName || user?.username}</div>
            <div className={styles.userRole}>{primaryRole}</div>
          </div>
          <button 
            onClick={handleLogout} 
            className={styles.logoutButton}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>
      
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>
              {getPageTitle(currentPath)}
            </h1>
            <p className={styles.pageDescription}>
              {getPageDescription(currentPath)}
            </p>
          </div>
          
          <div className={styles.userMenu}>
            <div>
              <div className={styles.userName}>Welcome, {user?.displayName || user?.username}</div>
              <div className={styles.userRole}>{user?.email}</div>
            </div>
          </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard';
    case '/sites':
      return 'Site Management';
    case '/users':
      return 'User Management';
    case '/admin':
      return 'Admin Panel';
    default:
      return 'Fiction CMS';
  }
}

function getPageDescription(pathname: string): string {
  switch (pathname) {
    case '/dashboard':
      return 'Overview of your sites and recent activity';
    case '/sites':
      return 'Manage your GitHub-based static sites';
    case '/users':
      return 'Manage system users and their permissions';
    case '/admin':
      return 'System administration and configuration';
    default:
      return 'Content management for your static sites';
  }
}