/**
 * Environment configuration validation
 */

import { z } from 'zod';
import crypto from 'crypto';
import { capabilitiesFromBackendConfig, resourceBackendConfigSchema, type ResourceBackendConfig } from '@fiction-cms/common';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Encryption
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters').optional(),
  
  // CORS
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  
  // File limits
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB
  MAX_BODY_SIZE: z.string().default('52428800').transform(Number), // 50MB
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('10').transform(Number),
  
  // GitHub
  GITHUB_DEFAULT_BRANCH: z.string().default('main'),

  // Resource backends
  CMS_ENABLE_PSQL: z.string().default('true'),
  CMS_ENABLE_S3: z.string().default('false'),
  CMS_ENABLE_GIT: z.string().default('true'),

  // S3/R2
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  // OIDC
  OIDC_ISSUER: z.string().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_REDIRECT_URI: z.string().optional(),
  OIDC_SCOPES: z.string().default('openid email profile'),

  // Generic OAuth2
  OAUTH_AUTHORIZATION_ENDPOINT: z.string().optional(),
  OAUTH_TOKEN_ENDPOINT: z.string().optional(),
  OAUTH_USERINFO_ENDPOINT: z.string().optional(),
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_REDIRECT_URI: z.string().optional(),
  OAUTH_SCOPES: z.string().default('email profile'),
  OAUTH_EMAIL_FIELD: z.string().default('email'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Validate and parse environment variables
 */
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Generate defaults for required secrets if not provided
    if (!env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set, generating a random one. This should be set in production!');
      process.env.JWT_SECRET = generateSecureKey(64);
    }
    
    if (!env.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY not set, generating a random one. This should be set in production!');
      process.env.ENCRYPTION_KEY = generateSecureKey(64);
    }
    
    if (env.NODE_ENV === 'production') {
      validateProductionSettings(env);
    }
    
    return {
      ...env,
      oidc: readOidcConfig(env),
      oauth: readOauthConfig(env),
      s3: readS3Config(env),
      resourceBackends: readResourceBackends(env),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err: any) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

type RawEnv = z.infer<typeof envSchema>;

function truthy(value: string | undefined) {
  return value === 'true' || value === '1' || value === 'yes';
}

function readResourceBackends(env: RawEnv): ResourceBackendConfig[] {
  return [
    truthy(env.CMS_ENABLE_PSQL)
      ? resourceBackendConfigSchema.parse({ driver: 'psql', texts: true, dataCollections: true, assets: false })
      : null,
    truthy(env.CMS_ENABLE_S3)
      ? resourceBackendConfigSchema.parse({ driver: 's3', assets: true, texts: true, dataCollections: false })
      : null,
    truthy(env.CMS_ENABLE_GIT)
      ? resourceBackendConfigSchema.parse({ driver: 'git', assets: true, texts: true, dataCollections: true })
      : null,
  ].filter((item): item is ResourceBackendConfig => Boolean(item));
}

function readS3Config(env: RawEnv) {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET) return undefined;
  return {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
    publicBaseUrl: env.S3_PUBLIC_BASE_URL,
  };
}

function readOidcConfig(env: RawEnv) {
  if (!env.OIDC_ISSUER || !env.OIDC_CLIENT_ID) return undefined;
  return {
    issuer: env.OIDC_ISSUER,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET,
    redirectUri: env.OIDC_REDIRECT_URI,
    scopes: env.OIDC_SCOPES,
  };
}

function readOauthConfig(env: RawEnv) {
  if (!env.OAUTH_AUTHORIZATION_ENDPOINT || !env.OAUTH_TOKEN_ENDPOINT || !env.OAUTH_USERINFO_ENDPOINT || !env.OAUTH_CLIENT_ID) return undefined;
  return {
    authorizationEndpoint: env.OAUTH_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: env.OAUTH_TOKEN_ENDPOINT,
    userInfoEndpoint: env.OAUTH_USERINFO_ENDPOINT,
    clientId: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
    redirectUri: env.OAUTH_REDIRECT_URI,
    scopes: env.OAUTH_SCOPES,
    emailField: env.OAUTH_EMAIL_FIELD,
  };
}

/**
 * Validate production-specific settings
 */
function validateProductionSettings(env: any) {
  const issues: string[] = [];
  
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET is too short for production use');
  }
  
  if (env.FRONTEND_URL.includes('localhost')) {
    issues.push('FRONTEND_URL should not point to localhost in production');
  }
  
  if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
    issues.push('DATABASE_URL should be set in production');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️  Production security warnings:');
    issues.forEach(issue => console.warn(`   - ${issue}`));
  }
}

/**
 * Generate a cryptographically secure key
 */
function generateSecureKey(length: number): string {
  return crypto.randomBytes(length / 2).toString('hex');
}

/**
 * Get validated environment config
 */
export const config = validateEnvironment();
export const resourceCapabilities = capabilitiesFromBackendConfig(config.resourceBackends);

/**
 * Helper to check if we're in development mode
 */
export const isDevelopment = config.NODE_ENV === 'development';

/**
 * Helper to check if we're in production mode
 */
export const isProduction = config.NODE_ENV === 'production';

/**
 * Helper to check if we're in test mode
 */
export const isTest = config.NODE_ENV === 'test';
