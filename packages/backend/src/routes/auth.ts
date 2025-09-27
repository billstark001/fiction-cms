import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from '../auth/tokens.js';
import { UserDataWithRoles, userService } from '../services/index.js';
import { authMiddleware } from '../auth/middleware.js';
import { validateJson } from '../middleware/validation.js';
import { authRateLimit } from '../middleware/rate-limiting.js';
import { handleError, createErrorResponse, sanitizeErrorMessage } from '../utils/error-handling.js';
import { 
  loginSchema, 
  registerSchema, 
  refreshTokenSchema, 
  changePasswordSchema 
} from '../schemas/index.js';

const auth = new Hono();

/**
 * POST /auth/login - User login
 */
auth.post('/login', authRateLimit, validateJson(loginSchema), async (c) => {
  const { username, password } = c.get('validatedData');

  try {
    // Find user by username or email using service
    const user = await userService.findByCredentials(username);
    
    if (!user) {
      return createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    if (!user.isActive) {
      return createErrorResponse('Account is disabled', 'ACCOUNT_DISABLED', 401);
    }

    // Verify password using service
    const isValidPassword = await userService.verifyPassword(user.id, password);
    if (!isValidPassword) {
      return createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    // Update last login timestamp using service
    await userService.updateLastLogin(user.id);

    // Generate tokens
    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName
    };

    const accessToken = await generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    const userWithRoles = user as UserDataWithRoles;
    userWithRoles.roles = await userService.getUserRoles(user.id);
    userWithRoles.permissions = await userService.getUserPermissions(user.id);

    return c.json({
      message: 'Login successful',
      user: userWithRoles,
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    return handleError(error, 'User login', c);
  }
});

/**
 * POST /auth/register - User registration
 */
auth.post('/register', authRateLimit, validateJson(registerSchema), async (c) => {
  const { username, email, password, displayName } = c.get('validatedData');

  try {
    // Create user using service
    const newUser = await userService.createUser({
      username,
      email,
      password,
      displayName,
      isActive: true
    });

    // Generate tokens
    const userPayload = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName
    };

    const accessToken = await generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    const userWithRoles = newUser as UserDataWithRoles;
    userWithRoles.roles = await userService.getUserRoles(newUser.id);
    userWithRoles.permissions = await userService.getUserPermissions(newUser.id);

    return c.json({
      message: 'Registration successful',
      user: userWithRoles,
      tokens: {
        accessToken,
        refreshToken
      }
    }, 201);
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Username already exists') {
        return c.json({ error: 'Username already exists' }, 409);
      }
      if (error.message === 'Email already exists') {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }
    return handleError(error, 'User registration', c);
  }
});

/**
 * POST /auth/refresh - Refresh access token
 */
auth.post('/refresh', validateJson(refreshTokenSchema), async (c) => {
  const { refreshToken } = c.get('validatedData');

  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Get user data using service
    const user = await userService.findById(payload.sub);

    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401);
    }

    // Generate new access token
    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName
    };

    const newAccessToken = await generateAccessToken(userPayload);

    return c.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });
  } catch (error) {
    return c.json({ 
      error: 'Invalid refresh token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 401);
  }
});

/**
 * POST /auth/logout - Logout user (revoke refresh token)
 */
auth.post('/logout', validateJson(refreshTokenSchema), async (c) => {
  const { refreshToken } = c.get('validatedData');

  try {
    // Verify and get token payload
    const payload = await verifyRefreshToken(refreshToken);
    
    if (payload.jti) {
      await revokeRefreshToken(payload.jti);
    }

    return c.json({ message: 'Logout successful' });
  } catch (error) {
    // Even if token is invalid, return success for security
    return c.json({ message: 'Logout successful' });
  }
});

/**
 * POST /auth/logout-all - Logout from all devices (revoke all refresh tokens)
 */
auth.post('/logout-all', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    await revokeAllUserRefreshTokens(user.id);
    return c.json({ message: 'Logged out from all devices' });
  } catch (error) {
    return handleError(error, 'Logout all devices', c);
  }
});

/**
 * POST /auth/change-password - Change user password
 */
auth.post('/change-password', authMiddleware, validateJson(changePasswordSchema), async (c) => {
  const user = c.get('user');
  const { currentPassword, newPassword } = c.get('validatedData');

  try {
    // Change password using service
    await userService.changePassword(user.id, currentPassword, newPassword);

    return c.json({ message: 'Password changed successfully' });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Current password is incorrect') {
        return c.json({ error: 'Current password is incorrect' }, 400);
      }
      if (error.message === 'User not found') {
        return c.json({ error: 'User not found' }, 404);
      }
    }
    return handleError(error, 'Change password', c);
  }
});

/**
 * GET /auth/me - Get current user information
 */
auth.get('/me', authMiddleware, async (c) => {
  const { id: userId } = c.get('user') ?? { id: null };

  try {
    // Get fresh user data from service
    const user = await userService.findByIdWithRoles(userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user
    });
  } catch (error) {
    return handleError(error, 'Get user profile', c);
  }
});

export { auth };