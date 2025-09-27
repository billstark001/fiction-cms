import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthActions } from './store/authStore';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import SiteManagement from './pages/SiteManagement';
import SiteContentManagement from './pages/SiteContentManagement';
import './index.css';

function App() {
  const { checkAuth } = useAuthActions();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/users" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/sites" 
          element={
            <ProtectedRoute>
              <SiteManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/sites/:siteId/manage" 
          element={
            <ProtectedRoute>
              <SiteContentManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
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
          } 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 fallback */}
        <Route path="*" element={
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
        } />
      </Routes>
    </Router>
  );
}

export default App;