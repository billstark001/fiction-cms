# Security Guide

This guide provides comprehensive security recommendations for Fiction CMS deployments, covering authentication, authorization, data protection, and operational security best practices.

## Authentication Security

### PASETO Token Security

Fiction CMS uses PASETO v4 (Platform-Agnostic Security Tokens) for authentication, which provides several security advantages over JWT:

**Key Generation:**
```bash
# Generate a cryptographically secure 64-character hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use a key derivation function
node -e "
const crypto = require('crypto');
const salt = crypto.randomBytes(16);
const key = crypto.pbkdf2Sync('your-master-password', salt, 100000, 32, 'sha256');
console.log(key.toString('hex'));
"
```

**PASETO Security Features:**
- Ed25519 signatures for authenticity
- XChaCha20-Poly1305 encryption for local tokens
- Built-in protection against algorithm confusion attacks
- Automatic prevention of "none" algorithm vulnerabilities

### Password Security

**Password Policy Requirements:**
```typescript
interface PasswordPolicy {
  minLength: 12;
  requireUppercase: true;
  requireLowercase: true;
  requireNumbers: true;
  requireSpecialChars: true;
  preventCommonPasswords: true;
  preventUserInfoInPassword: true;
}
```

**bcrypt Configuration:**
```javascript
// Use high salt rounds for production
const SALT_ROUNDS = 12; // Minimum recommended

// Hash password
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
```

**Password Reset Security:**
```typescript
interface PasswordResetSecurity {
  tokenExpiry: '15 minutes';
  oneTimeUse: true;
  emailVerification: true;
  rateLimiting: {
    maxAttempts: 5;
    windowMinutes: 60;
  };
}
```

### Multi-Factor Authentication (Future Enhancement)

While not currently implemented, consider these MFA options for enhanced security:

- **TOTP (Time-based One-Time Passwords)**: Using apps like Google Authenticator
- **WebAuthn**: Hardware security keys and biometric authentication
- **SMS/Email codes**: For backup authentication methods

## Authorization and Access Control

### Role-Based Access Control (RBAC)

Fiction CMS implements a granular permission system:

```typescript
interface PermissionModel {
  roles: {
    admin: {
      permissions: ['*']; // All permissions
      description: 'Full system access';
    };
    editor: {
      permissions: [
        'site:read', 'site:write',
        'content:read', 'content:write',
        'file:create', 'file:update', 'file:delete'
      ];
      description: 'Content management access';
    };
    viewer: {
      permissions: ['site:read', 'content:read'];
      description: 'Read-only access';
    };
  };
  
  sitePermissions: {
    'site:read': 'View site information and configuration';
    'site:write': 'Modify site settings and configuration';
    'site:delete': 'Delete sites (admin only)';
    'content:read': 'View file contents and directory structure';
    'content:write': 'Edit and save file contents';
    'file:create': 'Create new files';
    'file:update': 'Modify existing files';
    'file:delete': 'Delete files';
    'user:read': 'View user information';
    'user:write': 'Create and modify users';
    'deploy:trigger': 'Trigger site deployments';
  };
}
```

### Site-Level Permissions

Users can have different permissions for different sites:

```typescript
interface SiteAccessControl {
  userId: number;
  siteId: number;
  permissions: string[]; // Subset of global permissions
  grantedBy: number;     // User who granted access
  grantedAt: Date;
  expiresAt?: Date;      // Optional expiration
}
```

### Permission Validation

**Server-side Permission Checks:**
```typescript
// Middleware for route protection
async function requirePermission(permission: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user');
    const siteId = c.req.param('siteId');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const hasPermission = await checkUserPermission(user.id, permission, siteId);
    if (!hasPermission) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
}

// Usage in routes
app.get('/api/sites/:siteId/files', requirePermission('content:read'), getFiles);
app.put('/api/sites/:siteId/files/*', requirePermission('content:write'), updateFile);
```

## Data Protection

### File System Security

**Path Traversal Prevention:**
```typescript
function validateFilePath(sitePath: string, requestedPath: string): boolean {
  // Resolve absolute path
  const resolvedPath = path.resolve(sitePath, requestedPath);
  
  // Ensure path is within site directory
  if (!resolvedPath.startsWith(path.resolve(sitePath))) {
    throw new Error('Path traversal attempt detected');
  }
  
  // Check against editable paths
  const editablePaths = getSiteEditablePaths(sitePath);
  const isEditable = editablePaths.some(editablePath => 
    resolvedPath.startsWith(path.resolve(sitePath, editablePath))
  );
  
  if (!isEditable) {
    throw new Error('File not in editable path');
  }
  
  return true;
}
```

**File Type Validation:**
```typescript
const ALLOWED_FILE_EXTENSIONS = [
  '.md', '.mdx',        // Markdown files
  '.json', '.json5',    // JSON files
  '.js', '.ts',         // JavaScript/TypeScript
  '.css', '.scss',      // Stylesheets
  '.html', '.xml',      // Markup
  '.yml', '.yaml',      // YAML files
  '.txt', '.csv',       // Text files
  '.sql',               // SQL files
  '.db', '.sqlite'      // SQLite databases
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.sh', '.ps1',  // Executables
  '.php', '.asp', '.jsp',         // Server scripts
  '.dll', '.so',                  // Libraries
];

function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new Error('File type not allowed');
  }
  
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
}
```

**File Size Limits:**
```typescript
const FILE_SIZE_LIMITS = {
  '.md': 5 * 1024 * 1024,      // 5MB for Markdown
  '.json': 10 * 1024 * 1024,   // 10MB for JSON
  '.db': 100 * 1024 * 1024,    // 100MB for databases
  default: 1 * 1024 * 1024      // 1MB for others
};

function validateFileSize(filename: string, size: number): boolean {
  const ext = path.extname(filename).toLowerCase();
  const limit = FILE_SIZE_LIMITS[ext] || FILE_SIZE_LIMITS.default;
  
  if (size > limit) {
    throw new Error(`File size exceeds limit (${limit} bytes)`);
  }
  
  return true;
}
```

### Database Security

**SQL Injection Prevention:**
```typescript
// Use parameterized queries with Drizzle ORM
import { eq } from 'drizzle-orm';

// Good: Parameterized query
const user = await db.select().from(users).where(eq(users.id, userId));

// Bad: String concatenation (vulnerable to injection)
// const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Database Encryption:**
```typescript
// Encrypt sensitive data before storage
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function encryptSensitiveData(data: string): string {
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptSensitiveData(encryptedData: string): string {
  const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Git Repository Security

**GitHub Token Security:**
```typescript
interface GitHubTokenSecurity {
  scope: 'repo';              // Minimal required scope
  expiration: '90 days';      // Regular rotation
  storage: 'encrypted';       // Encrypt in database
  validation: 'startup';      // Validate on startup
}

// Validate GitHub token on startup
async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}` }
    });
    return response.ok;
  } catch (error) {
    console.error('GitHub token validation failed:', error);
    return false;
  }
}
```

**Git Commit Security:**
```typescript
// Sanitize commit messages
function sanitizeCommitMessage(message: string): string {
  // Remove potentially dangerous characters
  return message
    .replace(/[`${}]/g, '')           // Shell injection characters
    .replace(/[<>&]/g, '')            // HTML/XML characters  
    .slice(0, 200)                    // Limit length
    .trim();
}

// Validate author information
function validateGitAuthor(name: string, email: string): boolean {
  const namePattern = /^[a-zA-Z0-9\s\-\.]+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return namePattern.test(name) && emailPattern.test(email);
}
```

## Network Security

### HTTPS Configuration

**SSL/TLS Best Practices:**
```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    
    # SSL certificates
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL protocols and ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # SSL session caching
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Security Headers

**Critical Security Headers:**
```typescript
// Security middleware
function securityHeaders() {
  return (c: Context, next: () => Promise<void>) => {
    // Content Security Policy
    c.header('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval'; " +  // Monaco Editor needs unsafe-eval
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'"
    );
    
    // XSS Protection
    c.header('X-XSS-Protection', '1; mode=block');
    
    // Content Type Options
    c.header('X-Content-Type-Options', 'nosniff');
    
    // Frame Options
    c.header('X-Frame-Options', 'DENY');
    
    // Referrer Policy
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    c.header('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    
    return next();
  };
}
```

### CORS Configuration

**Secure CORS Setup:**
```typescript
const corsConfig = {
  origin: (origin: string) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return true;
    
    return allowedOrigins.includes(origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
```

## Rate Limiting and DDoS Protection

### API Rate Limiting

**Implementation:**
```typescript
interface RateLimitConfig {
  windowMs: 15 * 60 * 1000;  // 15 minutes
  max: 100;                  // Max requests per window
  
  // Different limits for different endpoints
  endpoints: {
    '/api/auth/login': { max: 5, windowMs: 5 * 60 * 1000 };
    '/api/sites/*/files/*': { max: 30, windowMs: 60 * 1000 };
    '/api/users': { max: 20, windowMs: 60 * 1000 };
  };
}

// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});
```

### Brute Force Protection

**Login Protection:**
```typescript
interface BruteForceProtection {
  maxAttempts: 5;
  windowMinutes: 15;
  lockoutMinutes: 30;
  
  // Progressive delays
  delays: [1000, 2000, 4000, 8000, 16000]; // milliseconds
}

class LoginAttemptTracker {
  private attempts = new Map<string, LoginAttempt[]>();
  
  async recordAttempt(ip: string, success: boolean) {
    const key = ip;
    const attempts = this.attempts.get(key) || [];
    
    attempts.push({
      timestamp: Date.now(),
      success,
      ip
    });
    
    // Keep only recent attempts
    const cutoff = Date.now() - (15 * 60 * 1000); // 15 minutes
    const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
    
    this.attempts.set(key, recentAttempts);
    
    return this.checkBlocked(key);
  }
  
  private checkBlocked(key: string): boolean {
    const attempts = this.attempts.get(key) || [];
    const failures = attempts.filter(a => !a.success);
    
    return failures.length >= 5;
  }
}
```

## Input Validation and Sanitization

### Request Validation

**Using Zod for validation:**
```typescript
import { z } from 'zod';

const CreateSiteSchema = z.object({
  name: z.string()
    .min(3, 'Site name must be at least 3 characters')
    .max(50, 'Site name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Site name contains invalid characters'),
    
  repositoryUrl: z.string()
    .url('Must be a valid URL')
    .regex(/^https:\/\/github\.com\/[\w\-_\.]+\/[\w\-_\.]+$/, 'Must be a GitHub repository URL'),
    
  githubPat: z.string()
    .min(40, 'GitHub PAT appears invalid')
    .regex(/^gh[ps]_[A-Za-z0-9_]{36,}$/, 'Invalid GitHub PAT format'),
    
  buildCommand: z.string()
    .max(200, 'Build command too long')
    .regex(/^[a-zA-Z0-9\s\-_\.\/]+$/, 'Build command contains invalid characters'),
    
  editablePaths: z.array(z.string())
    .max(10, 'Too many editable paths')
    .refine(paths => paths.every(p => !p.includes('..')), 'Invalid path detected')
});

// Usage in route handler
app.post('/api/sites', async (c) => {
  try {
    const data = CreateSiteSchema.parse(await c.req.json());
    // Process validated data
  } catch (error) {
    return c.json({ error: 'Invalid input', details: error.errors }, 400);
  }
});
```

### Content Sanitization

**HTML/Markdown Sanitization:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeMarkdown(content: string): string {
  // Remove potentially dangerous HTML elements
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'del',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    STRIP_COMMENTS: true
  });
  
  return clean;
}
```

## Logging and Monitoring

### Security Event Logging

**Critical Events to Log:**
```typescript
interface SecurityEvent {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'critical';
  event: string;
  userId?: number;
  ip: string;
  userAgent: string;
  details: Record<string, any>;
}

class SecurityLogger {
  static logLoginAttempt(success: boolean, username: string, ip: string) {
    this.log({
      level: success ? 'info' : 'warn',
      event: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      details: { username, ip }
    });
  }
  
  static logPermissionDenied(userId: number, resource: string, ip: string) {
    this.log({
      level: 'warn',
      event: 'PERMISSION_DENIED',
      userId,
      details: { resource, ip }
    });
  }
  
  static logSuspiciousActivity(description: string, ip: string, details: any) {
    this.log({
      level: 'error',
      event: 'SUSPICIOUS_ACTIVITY',
      details: { description, ip, ...details }
    });
  }
}
```

### Monitoring and Alerting

**Key Metrics to Monitor:**
```typescript
interface SecurityMetrics {
  // Authentication metrics
  loginAttempts: number;
  loginFailures: number;
  accountLockouts: number;
  
  // Authorization metrics
  permissionDenials: number;
  privilegeEscalations: number;
  
  // File system metrics
  fileAccessAttempts: number;
  pathTraversalAttempts: number;
  
  // Network metrics
  rateLimitViolations: number;
  suspiciousIPs: string[];
  
  // System metrics
  diskUsage: number;
  memoryUsage: number;
  errorRate: number;
}
```

## Incident Response

### Security Incident Checklist

**Immediate Response:**
1. **Isolate the system** if actively under attack
2. **Document the incident** with timestamps and evidence
3. **Preserve logs** and system state for analysis
4. **Notify stakeholders** per incident response plan
5. **Assess the scope** of potential data exposure

**Investigation Steps:**
1. **Analyze logs** for attack patterns and entry points
2. **Check for data exfiltration** or unauthorized changes
3. **Identify compromised accounts** and reset credentials
4. **Review system integrity** and file modifications
5. **Document findings** and attack vectors

**Recovery Actions:**
1. **Patch vulnerabilities** that enabled the attack
2. **Reset compromised credentials** and tokens
3. **Restore from clean backups** if necessary
4. **Update security configurations** to prevent recurrence
5. **Monitor for continued threats** post-incident

### Backup and Recovery

**Security-focused Backup Strategy:**
```bash
#!/bin/bash
# Secure backup script

BACKUP_DIR="/secure/backups/fiction-cms"
ENCRYPTION_KEY_FILE="/etc/fiction-cms/backup-key"
DATE=$(date +%Y%m%d_%H%M%S)

# Create encrypted backup
tar -czf - fiction-cms.db repos/ | \
gpg --symmetric --cipher-algo AES256 --compress-algo 2 \
    --passphrase-file "$ENCRYPTION_KEY_FILE" \
    --output "$BACKUP_DIR/backup-$DATE.tar.gz.gpg"

# Verify backup integrity
gpg --passphrase-file "$ENCRYPTION_KEY_FILE" --decrypt \
    "$BACKUP_DIR/backup-$DATE.tar.gz.gpg" | tar -tzf - > /dev/null

if [ $? -eq 0 ]; then
    echo "Backup verified successfully"
    # Upload to secure remote storage
    aws s3 cp "$BACKUP_DIR/backup-$DATE.tar.gz.gpg" \
        s3://secure-backup-bucket/fiction-cms/
else
    echo "Backup verification failed"
    exit 1
fi
```

This security guide provides a comprehensive foundation for securing Fiction CMS deployments. Regular security reviews and updates are essential to maintain protection against evolving threats.