import { useState } from 'react';
import Layout from '../components/layout/Layout';
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
import { useRoles, useUserOperations, useUsers } from '../hooks/useUsers';
import { useForm } from 'react-hook-form';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  roleIds: string[];
};

export default function UserManagement() {

  const qUsers = useUsers();
  const qRoles = useRoles();

  const users = qUsers.data?.items || [];
  const roles = qRoles.data?.items || [];

  const loading = qUsers.isLoading || qRoles.isLoading;
  const [oprError, setOprError] = useState<Error | null>(null);
  const [showError, setShowError] = useState(false);
  const error = oprError || qUsers.error || qRoles.error;


  const { createUser, deleteUser } = useUserOperations();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const form = useForm<UserFormData>();

  const { register, handleSubmit, reset, watch, setValue } = form;

  const { roleIds } = watch();

  const handleCreateUser = async (formData: UserFormData) => {
    await createUser.mutateAsync(formData, {
      onError: (err) => {
        setOprError(err);
        setShowError(true);
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    await deleteUser.mutateAsync(userId, {
      onError: (err) => {
        setOprError(err);
        setShowError(true);
      }
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
      {error && showError && (
        <div className={formStyles.errorMessage}>
          {error.message}
          <button
            onClick={() => setShowError(false)}
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

          <form onSubmit={handleSubmit(handleCreateUser)} className={formStyles.form}>
            <div className={pageStyles.userFormGrid}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Username *
                </label>
                <input
                  type="text"
                  {...register('username', { required: true })}
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email', { required: true })}
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
                  {...register('password', { required: true })}
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Display Name
                </label>
                <input
                  type="text"
                  {...register('displayName')}
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
                      checked={roleIds.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValue('roleIds', [...roleIds, role.id]);
                        } else {
                          setValue('roleIds', roleIds.filter(id => id !== role.id));
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
                onClick={() => { setShowCreateForm(false); reset(); }}
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