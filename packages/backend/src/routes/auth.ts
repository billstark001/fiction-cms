import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from '../auth/tokens.js';
import { authMiddleware } from '../auth/middleware.js';
import { validateJson } from '../middleware/validation.js';
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
auth.post('/login', validateJson(loginSchema), async (c) => {
  const { username, password } = c.get('validatedData');

  try {
    // Find user by username or email
    const user = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      // Check by email as fallback
      const userByEmail = await db.select()
        .from(users)
        .where(eq(users.email, username))
        .get();
      
      if (!userByEmail) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      
      // Use email user for authentication
      Object.assign(user, userByEmail);
    }

    if (!user.isActive) {
      return c.json({ error: 'Account is disabled' }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last login timestamp
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate tokens
    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName
    };

    const accessToken = await generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /auth/register - User registration
 */
auth.post('/register', validateJson(registerSchema), async (c) => {
  const { username, email, password, displayName } = c.get('validatedData');

  try {
    // Check if username already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUser) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // Check if email already exists
    const existingEmail = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingEmail) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.insert(users)
      .values({
        username,
        email,
        passwordHash,
        displayName: displayName || null,
        isActive: true
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
      .get();

    // Generate tokens
    const userPayload = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName
    };

    const accessToken = await generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    return c.json({
      message: 'Registration successful',
      user: newUser,
      tokens: {
        accessToken,
        refreshToken
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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

    // Get user data
    const user = await db.select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .get();

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
    console.error('Logout all error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /auth/change-password - Change user password
 */
auth.post('/change-password', authMiddleware, validateJson(changePasswordSchema), async (c) => {
  const user = c.get('user');
  const { currentPassword, newPassword } = c.get('validatedData');

  try {
    // Get user data from database
    const dbUser = await db.select()
      .from(users)
      .where(eq(users.id, user.id))
      .get();

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValidPassword) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Revoke all existing refresh tokens for security
    await revokeAllUserRefreshTokens(user.id);

    return c.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /auth/me - Get current user information
 */
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    // Get fresh user data from database
    const dbUser = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt
    })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        ...dbUser,
        roles: user.roles,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { auth };