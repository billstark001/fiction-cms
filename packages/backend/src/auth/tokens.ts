import { V4 } from 'paseto';
import { createSecretKey } from 'crypto';
import { db } from '../db/index.js';
import { refreshTokens, users } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Generate or load secret key from environment
const SECRET_KEY = process.env.PASETO_SECRET_KEY || 'your-32-character-secret-key-here12345';

if (SECRET_KEY.length < 32) {
  throw new Error('PASETO_SECRET_KEY must be at least 32 characters long');
}

const secretKey = createSecretKey(Buffer.from(SECRET_KEY.substring(0, 32), 'utf8'));

export interface TokenPayload {
  sub: string; // user id
  username: string;
  email: string;
  iat: number; // issued at
  exp: number; // expires at
  type: 'access' | 'refresh';
  jti?: string; // token id for refresh tokens
}

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
}

/**
 * Generate an access token (short-lived)
 */
export async function generateAccessToken(user: UserPayload): Promise<string> {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    type: 'access'
  };

  return V4.sign(payload, secretKey);
}

/**
 * Generate a refresh token (long-lived) and store in database
 */
export async function generateRefreshToken(user: UserPayload): Promise<string> {
  const tokenId = createId();
  const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
    type: 'refresh',
    jti: tokenId
  };

  const token = await V4.sign(payload, secretKey);

  // Store refresh token in database
  await db.insert(refreshTokens).values({
    id: tokenId,
    token,
    userId: user.id,
    expiresAt,
    isRevoked: false
  });

  return token;
}

/**
 * Verify and decode a PASETO token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const payload = await V4.verify(token, secretKey) as TokenPayload;
    
    // Check if token has expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    return payload;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify refresh token and ensure it's not revoked
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const payload = await verifyToken(token);
  
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  if (!payload.jti) {
    throw new Error('Missing token ID');
  }

  // Check if refresh token exists and is not revoked
  const dbToken = await db.select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.id, payload.jti),
        eq(refreshTokens.isRevoked, false),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .get();

  if (!dbToken) {
    throw new Error('Refresh token is invalid or revoked');
  }

  return payload;
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await db.update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.id, tokenId));
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db.update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.userId, userId));
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await db.delete(refreshTokens)
    .where(
      and(
        eq(refreshTokens.isRevoked, true),
        // Delete revoked tokens older than 30 days
        gt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), refreshTokens.createdAt)
      )
    );

  await db.delete(refreshTokens)
    .where(
      // Delete expired tokens
      gt(new Date(), refreshTokens.expiresAt)
    );
}