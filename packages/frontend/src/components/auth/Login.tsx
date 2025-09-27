import { useEffect, useState } from 'react';
import { useRouter, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useLogin } from '../../hooks/useAuth';
import * as styles from './Login.css';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginSearchParams {
  redirect?: string;
}

export default function Login() {
  const router = useRouter();
  const search = useSearch({ from: '/login' }) as LoginSearchParams;
  const redirectTo = search.redirect || '/dashboard';
  
  const { isAuthenticated, isLoading, error } = useAuthStore();
  const { clearError } = useAuthStore();
  const loginMutation = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Watch form values to clear errors when they change
  const watchedValues = watch();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: redirectTo });
    }
  }, [isAuthenticated, router, redirectTo]);

  // Clear error when form changes
  useEffect(() => {
    clearError();
  }, [clearError, watchedValues.username, watchedValues.password]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({
        username: data.username.trim(),
        password: data.password,
      });
      // Navigation will be handled by the useEffect above
    } catch (error) {
      // Error is handled by the mutation
      console.error('Login failed:', error);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Welcome to Fiction CMS</h1>
          <p className={styles.loginSubtitle}>Sign in to manage your content</p>
        </div>

        {(error || loginMutation.error) && (
          <div className={styles.errorMessage}>
            {error || (loginMutation.error as Error)?.message || 'Login failed'}
          </div>
        )}

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username', {
                required: 'Username is required',
                validate: value => value.trim().length > 0 || 'Username cannot be empty'
              })}
              className={styles.input}
              placeholder="Enter your username"
              disabled={isLoading || loginMutation.isPending}
              autoComplete="username"
            />
            {errors.username && (
              <div className={styles.errorMessage}>
                {errors.username.message}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  validate: value => value.trim().length > 0 || 'Password cannot be empty'
                })}
                className={styles.input}
                placeholder="Enter your password"
                disabled={isLoading || loginMutation.isPending}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggleButton}
                disabled={isLoading || loginMutation.isPending}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <div className={styles.errorMessage}>
                {errors.password.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isLoading || loginMutation.isPending || !isValid}
          >
            {(isLoading || loginMutation.isPending) ? (
              <>
                <span className={styles.loadingSpinner}></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className={styles.credentialsInfo}>
          <strong>Default Admin Credentials:</strong><br />
          Username: admin<br />
          Password: admin123
        </div>
      </div>
    </div>
  );
}