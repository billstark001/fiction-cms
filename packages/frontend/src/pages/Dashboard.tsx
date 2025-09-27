import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { apiClient, Site } from '../api/client';
import { useAuth } from '../store/authStore';
import * as styles from '../components/layout/Layout.css';

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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.card}>
          <div style={{ 
            color: '#dc2626', 
            textAlign: 'center', 
            padding: '2rem' 
          }}>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className={styles.card}>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
            {stats.totalSites}
          </h3>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Total Sites</p>
        </div>

        <div className={styles.card}>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
            {stats.activeSites}
          </h3>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Active Sites</p>
        </div>

        {isAdmin && (
          <div className={styles.card}>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', margin: 0 }}>
              {stats.totalUsers}
            </h3>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Total Users</p>
          </div>
        )}
      </div>

      {/* Recent Sites */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Your Sites</h2>
          <p className={styles.cardDescription}>
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
              <div 
                key={site.id} 
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'medium', 
                    color: '#111827', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    {site.name}
                  </h3>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: 0 
                  }}>
                    {site.description || 'No description'}
                  </p>
                  <a 
                    href={site.githubRepositoryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '0.75rem', 
                      color: '#2563eb', 
                      textDecoration: 'none' 
                    }}
                  >
                    View Repository →
                  </a>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    backgroundColor: site.isActive ? '#dcfce7' : '#fee2e2',
                    color: site.isActive ? '#166534' : '#991b1b'
                  }}>
                    {site.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Health */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>System Status</h2>
          <p className={styles.cardDescription}>
            Current system health and information
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#16a34a', 
            borderRadius: '50%' 
          }}></div>
          <span style={{ color: '#374151' }}>All systems operational</span>
        </div>
      </div>
    </Layout>
  );
}