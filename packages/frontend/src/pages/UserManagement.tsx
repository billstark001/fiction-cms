import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { apiClient, User, Role, CreateUserRequest } from '../api/client';
import { 
  TableContainer, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  TableEmptyState 
} from '../components/ui';
import * as layoutStyles from '../components/layout/Layout.css';
import * as pageStyles from './UserManagement.css';
import * as formStyles from '../styles/forms.css';
import * as tableStyles from '../styles/table.css';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    roleIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersResponse, rolesResponse] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getRoles()
      ]);

      setUsers(usersResponse.users);
      setRoles(rolesResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData: CreateUserRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || undefined,
        roleIds: formData.roleIds.length > 0 ? formData.roleIds : undefined
      };

      await apiClient.createUser(userData);
      await loadData();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.deleteUser(userId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      displayName: '',
      roleIds: []
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className={layoutStyles.pageTitle} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          Loading users...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {error && (
        <div className={formStyles.errorMessage}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className={layoutStyles.card}>
          <div className={layoutStyles.cardHeader}>
            <h2 className={layoutStyles.cardTitle}>Create New User</h2>
            <p className={layoutStyles.cardDescription}>
              Add a new user to the system with appropriate roles
            </p>
          </div>

          <form onSubmit={handleCreateUser} className={formStyles.form}>
            <div className={pageStyles.userFormGrid}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={formStyles.input}
                />
              </div>
            </div>

            <div className={pageStyles.userFormGrid}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={formStyles.input}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'medium', marginBottom: '0.5rem' }}>
                Roles
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {roles.map(role => (
                  <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            roleIds: [...formData.roleIds, role.id] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            roleIds: formData.roleIds.filter(id => id !== role.id) 
                          });
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{role.displayName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); resetForm(); }}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className={layoutStyles.card}>
        <div className={layoutStyles.cardHeader}>
          <div className={pageStyles.userListHeader}>
            <div>
              <h2 className={layoutStyles.cardTitle}>System Users</h2>
              <p className={layoutStyles.cardDescription}>
                Manage user accounts and their permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className={pageStyles.createUserButton}
            >
              Add User
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <TableEmptyState 
            title="No users found" 
            description="Create your first user to get started." 
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} hoverable>
                    <TableCell>
                      <div className={tableStyles.cellContent}>
                        <div className={tableStyles.cellPrimary}>
                          {user.displayName || user.username}
                        </div>
                        <div className={tableStyles.cellSecondary}>
                          @{user.username}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell withText>
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className={pageStyles.roleTagsContainer}>
                        {user.roles.map(role => (
                          <span key={role} className={tableStyles.badgeBlue}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={user.isActive ? pageStyles.userStatusActive : pageStyles.userStatusInactive}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={pageStyles.userTableActions}>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className={tableStyles.tableActionButtonDanger}
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </Layout>
  );
}