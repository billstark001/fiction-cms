import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { apiClient, Site } from '../api/client';
import { useAuth } from '../store/authStore';
import * as layoutStyles from '../components/layout/Layout.css';
import * as dashboardStyles from './Dashboard.css';
import * as pageStyles from '../styles/pages.css';
import * as formStyles from '../styles/forms.css';

interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalUsers: number;
  recentActivity: Array<{
    id: string;
    type: 'site_created' | 'user_created' | 'deployment';
    message: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSites: 0,
    activeSites: 0,
    totalUsers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sites
      const sitesResponse = await apiClient.getSites({ limit: 10 });
      setSites(sitesResponse.sites);

      // Calculate stats
      const activeSites = sitesResponse.sites.filter(site => site.isActive).length;
      let totalUsers = 0;

      // Try to get user count if user has admin role
      if (user?.roles?.some(role => role === 'admin')) {
        try {
          const usersResponse = await apiClient.getUsers({ limit: 1 });
          totalUsers = usersResponse.total;
        } catch {
          // Ignore error for non-admin users
        }
      }

      setStats({
        totalSites: sitesResponse.pagination.total,
        activeSites,
        totalUsers,
        recentActivity: [
          {
            id: '1',
            type: 'site_created',
            message: 'Welcome to Fiction CMS',
            timestamp: new Date().toISOString()
          }
        ]
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={pageStyles.loadingText}>
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={layoutStyles.card}>
          <div className={formStyles.errorMessage} style={{ textAlign: 'center' }}>
            Error: {error}
          </div>
        </div>
      </Layout>
    );
  }

  const isAdmin = user?.roles?.some(role => role === 'admin') ?? false;

  return (
    <Layout>
      {/* Stats Cards */}
      <div className={dashboardStyles.statsGrid}>
        <div className={layoutStyles.card}>
          <h3 className={dashboardStyles.statNumberBlue}>
            {stats.totalSites}
          </h3>
          <p className={dashboardStyles.statLabel}>Total Sites</p>
        </div>

        <div className={layoutStyles.card}>
          <h3 className={dashboardStyles.statNumberGreen}>
            {stats.activeSites}
          </h3>
          <p className={dashboardStyles.statLabel}>Active Sites</p>
        </div>

        {isAdmin && (
          <div className={layoutStyles.card}>
            <h3 className={dashboardStyles.statNumberPurple}>
              {stats.totalUsers}
            </h3>
            <p className={dashboardStyles.statLabel}>Total Users</p>
          </div>
        )}
      </div>

      {/* Recent Sites */}
      <div className={layoutStyles.card}>
        <div className={layoutStyles.cardHeader}>
          <h2 className={layoutStyles.cardTitle}>Your Sites</h2>
          <p className={layoutStyles.cardDescription}>
            Recently accessed sites in your account
          </p>
        </div>

        {sites.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#6b7280' 
          }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No sites yet</h3>
            <p>Create your first site to get started with Fiction CMS.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '1rem' 
          }}>
            {sites.map(site => (
              <div key={site.id} className={dashboardStyles.recentSiteItem}>
                <div className={dashboardStyles.siteItemInfo}>
                  <h3 className={dashboardStyles.siteItemTitle}>
                    {site.name}
                  </h3>
                  <p className={dashboardStyles.siteItemDescription}>
                    {site.description || 'No description'}
                  </p>
                  <div>
                    <span className={dashboardStyles.siteItemPath}>
                      {site.localPath}
                    </span>
                  </div>
                </div>
                
                <div className={dashboardStyles.siteItemActions}>
                  <span className={site.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'} style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    backgroundColor: site.isActive ? '#dcfce7' : '#fee2e2',
                    color: site.isActive ? '#166534' : '#991b1b'
                  }}>
                    {site.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <a 
                    href={`/sites/${site.id}/manage`}
                    className={dashboardStyles.siteItemButton}
                  >
                    Manage
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Health */}
      <div className={layoutStyles.card}>
        <div className={layoutStyles.cardHeader}>
          <h2 className={layoutStyles.cardTitle}>System Status</h2>
          <p className={layoutStyles.cardDescription}>
            Current system health and information
          </p>
        </div>

        <div className={dashboardStyles.systemHealthContainer}>
          <div className={dashboardStyles.healthIndicatorGreen}></div>
          <span className={dashboardStyles.healthText}>All systems operational</span>
        </div>
      </div>
    </Layout>
  );
}