import { Link, useRouter } from '@tanstack/react-router';
import { useAuth } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { useSiteManagerStore } from '../../store/siteManagerStore';
import { ConfirmDialog } from '../ui/AlertDialog';
import { useEffect, useState } from 'react';
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
  const { openedSites, loadOpenedSites, closeSite } = useSiteManagerStore();
  const [confirmClose, setConfirmClose] = useState<{ siteId: string; siteName?: string } | null>(null);

  useEffect(() => {
    loadOpenedSites();
  }, [loadOpenedSites]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.navigate({ to: '/login' });
    } catch (error) {
      // Error is handled by the mutation
      console.error('Logout error:', error);
    }
  };

  const handleCloseSite = (siteId: string, siteName?: string) => {
    const site = openedSites.find(s => s.siteId === siteId);
    if (site?.isDirty) {
      setConfirmClose({ siteId, siteName });
    } else {
      closeSite(siteId);
    }
  };

  const confirmCloseSite = () => {
    if (confirmClose) {
      closeSite(confirmClose.siteId);
      setConfirmClose(null);
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
        
        {/* User info and opened sites at bottom of sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          {/* Opened Sites Section */}
          {openedSites.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Opened Sites
              </h3>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {openedSites.map(site => (
                  <div
                    key={site.siteId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      marginBottom: '0.25rem',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <Link
                      to="/sites/$siteId/manage"
                      params={{ siteId: site.siteId }}
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textDecoration: 'none',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {site.siteName || site.siteId}
                      {site.isDirty && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>●</span>}
                    </Link>
                    <button
                      onClick={() => handleCloseSite(site.siteId, site.siteName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        padding: '0.25rem',
                        marginLeft: '0.5rem'
                      }}
                      title="Close site"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        {/* Only show header for non-site management pages */}
        {!currentPath.includes('/sites/') || !currentPath.includes('/manage') ? (
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
        ) : null}
        
        {children}
      </main>

      {/* Confirmation dialog for closing sites with unsaved changes */}
      <ConfirmDialog
        open={!!confirmClose}
        onOpenChange={() => setConfirmClose(null)}
        title="Unsaved Changes"
        description={`The site "${confirmClose?.siteName || confirmClose?.siteId}" has unsaved changes. Are you sure you want to close it? All unsaved changes will be lost.`}
        confirmText="Close"
        cancelText="Keep Open"
        onConfirm={confirmCloseSite}
        variant="destructive"
      />
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