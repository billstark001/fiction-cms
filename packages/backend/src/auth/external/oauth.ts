import { randomBytes } from 'crypto';
import type { Context } from 'hono';
import type { config as appConfig } from '../../config/environment.js';
import { generateAccessToken, generateRefreshToken } from '../tokens.js';
import { userService } from '../../services/index.js';

type AppConfig = typeof appConfig;
type ProviderKind = 'oidc' | 'oauth';

interface ProviderEndpoints {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string;
  emailField: string;
}

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

let oidcDiscoveryCache: { issuer: string; endpoints: ProviderEndpoints; expiresAt: number } | null = null;

function randomState() {
  return randomBytes(18).toString('base64url');
}

function encodeAuthState(state: string, redirectUri: string) {
  return Buffer.from(JSON.stringify({ s: state, r: redirectUri })).toString('base64url');
}

function decodeAuthState(encoded: string): { s: string; r: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { s?: string; r?: string };
    return typeof parsed.s === 'string' && parsed.s && typeof parsed.r === 'string' && parsed.r ? { s: parsed.s, r: parsed.r } : null;
  } catch {
    return null;
  }
}

function firstForwardedValue(value: string | undefined) {
  return value?.split(',', 1)[0]?.trim();
}

export function requestOrigin(c: Context) {
  const url = new URL(c.req.url);
  const protocol = firstForwardedValue(c.req.header('x-forwarded-proto'));
  const host = firstForwardedValue(c.req.header('x-forwarded-host'));
  if ((protocol === 'https' || protocol === 'http') && host) {
    try {
      return new URL(`${protocol}://${host}`).origin;
    } catch {
      return url.origin;
    }
  }
  return url.origin;
}

function callbackUrl(c: Context, provider: ProviderKind, configured?: string) {
  return configured || `${requestOrigin(c)}/api/auth/${provider}/callback`;
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

function decodeJwtPayload(token: string | undefined) {
  if (!token) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function discoverOidc(config: AppConfig): Promise<ProviderEndpoints | null> {
  if (!config.oidc) return null;
  if (oidcDiscoveryCache && oidcDiscoveryCache.issuer === config.oidc.issuer && oidcDiscoveryCache.expiresAt > Date.now()) {
    return oidcDiscoveryCache.endpoints;
  }

  const issuer = config.oidc.issuer.replace(/\/$/, '');
  const discoveryResponse = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!discoveryResponse.ok) throw new Error(`OIDC discovery failed: ${discoveryResponse.status}`);
  const discovery = (await discoveryResponse.json()) as {
    authorization_endpoint?: string;
    token_endpoint?: string;
    userinfo_endpoint?: string;
  };

  if (!discovery.authorization_endpoint || !discovery.token_endpoint) {
    throw new Error('OIDC discovery response is missing authorization or token endpoints.');
  }

  const endpoints: ProviderEndpoints = {
    authorizationEndpoint: discovery.authorization_endpoint,
    tokenEndpoint: discovery.token_endpoint,
    userInfoEndpoint: discovery.userinfo_endpoint || '',
    clientId: config.oidc.clientId,
    clientSecret: config.oidc.clientSecret,
    redirectUri: config.oidc.redirectUri,
    scopes: config.oidc.scopes,
    emailField: 'email',
  };
  oidcDiscoveryCache = { issuer: config.oidc.issuer, endpoints, expiresAt: Date.now() + 1000 * 60 * 60 };
  return endpoints;
}

function oauthEndpoints(config: AppConfig): ProviderEndpoints | null {
  if (!config.oauth) return null;
  return {
    authorizationEndpoint: config.oauth.authorizationEndpoint,
    tokenEndpoint: config.oauth.tokenEndpoint,
    userInfoEndpoint: config.oauth.userInfoEndpoint,
    clientId: config.oauth.clientId,
    clientSecret: config.oauth.clientSecret,
    redirectUri: config.oauth.redirectUri,
    scopes: config.oauth.scopes,
    emailField: config.oauth.emailField,
  };
}

async function providerEndpoints(provider: ProviderKind, config: AppConfig) {
  return provider === 'oidc' ? discoverOidc(config) : oauthEndpoints(config);
}

async function exchangeCode(endpoints: ProviderEndpoints, code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: endpoints.clientId,
  });
  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (endpoints.clientSecret) headers.Authorization = basicAuthHeader(endpoints.clientId, endpoints.clientSecret);

  const response = await fetch(endpoints.tokenEndpoint, { method: 'POST', headers, body });
  const token = (await response.json()) as TokenResponse;
  if (!response.ok || token.error) {
    throw new Error(token.error_description || token.error || `Token exchange failed: ${response.status}`);
  }
  return token;
}

async function readEmail(endpoints: ProviderEndpoints, token: TokenResponse) {
  if (token.access_token && endpoints.userInfoEndpoint) {
    const response = await fetch(endpoints.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (response.ok) {
      const profile = (await response.json()) as Record<string, unknown>;
      const email = profile[endpoints.emailField];
      if (typeof email === 'string' && email) return email;
    }
  }

  const jwtPayload = decodeJwtPayload(token.id_token);
  const email = jwtPayload?.[endpoints.emailField] ?? jwtPayload?.email;
  return typeof email === 'string' ? email : null;
}

export function authProviderSummary(config: AppConfig) {
  return {
    password: true,
    oidc: Boolean(config.oidc),
    oauth: Boolean(config.oauth),
  };
}

export async function startExternalAuth(c: Context, provider: ProviderKind, config: AppConfig) {
  const endpoints = await providerEndpoints(provider, config);
  if (!endpoints) return c.json({ error: `${provider.toUpperCase()} is not configured.` }, 404);

  const redirectUri = callbackUrl(c, provider, endpoints.redirectUri);
  const url = new URL(endpoints.authorizationEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', endpoints.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', endpoints.scopes);
  url.searchParams.set('state', encodeAuthState(randomState(), redirectUri));
  return c.redirect(url.toString());
}

export async function completeExternalAuth(c: Context, provider: ProviderKind, config: AppConfig) {
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state) return c.json({ error: 'Authorization callback is missing code or state.' }, 400);

  const decodedState = decodeAuthState(state);
  if (!decodedState) return c.json({ error: 'Authorization state is invalid.' }, 400);

  const endpoints = await providerEndpoints(provider, config);
  if (!endpoints) return c.json({ error: `${provider.toUpperCase()} is not configured.` }, 404);

  const token = await exchangeCode(endpoints, code, decodedState.r);
  const email = await readEmail(endpoints, token);
  if (!email) return c.json({ error: 'The identity provider did not return an email address.' }, 403);

  let user = await userService.findByEmail(email);
  if (!user) {
    user = await userService.createExternalUser({ email, roleName: 'editor' });
  }
  await userService.updateLastLogin(user.id);

  const userPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
  };
  const accessToken = await generateAccessToken(userPayload);
  const refreshToken = await generateRefreshToken(userPayload);
  const redirect = new URL('/login', config.FRONTEND_URL);
  redirect.searchParams.set('external', 'success');
  redirect.searchParams.set('accessToken', accessToken);
  redirect.searchParams.set('refreshToken', refreshToken);
  return c.redirect(redirect.toString());
}
