# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Fiction CMS across different environments and use cases.

## General Troubleshooting Steps

### 1. Check System Health

**Backend Health Check:**

```bash
# Test if backend is running
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

**Database Connection:**

```bash
# Check if database file exists and is accessible
ls -la packages/backend/fiction-cms.db

# Check database permissions
sqlite3 packages/backend/fiction-cms.db ".tables"
```

**Frontend Connectivity:**

```bash
# Test frontend can reach backend
curl http://localhost:3000/api/health
# Should proxy to backend and return same health response
```

### 2. Check Logs

**Backend Logs:**

```bash
# View real-time logs (PM2)
pm2 logs fiction-cms

# View log files directly
tail -f /var/log/fiction-cms/error.log
tail -f /var/log/fiction-cms/access.log

# Docker logs
docker logs fiction-cms-container
```

**Browser Console:**

1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Check Application tab for localStorage issues

## Authentication Issues

### Problem: "Invalid credentials" on login

**Symptoms:**

- Login form shows "Invalid credentials" error
- User exists in database but cannot log in

**Solutions:**

1. **Check default credentials:**

```bash
# Default admin credentials
Username: admin
Password: admin123
```

2. **Verify user in database:**

```bash
sqlite3 fiction-cms.db "SELECT id, username, email FROM users WHERE username = 'admin';"
```

3. **Reset admin password:**

```bash
# Connect to database and update password hash
sqlite3 fiction-cms.db
UPDATE users SET password_hash = '$2b$12$...' WHERE username = 'admin';
```

4. **Check password hashing:**

```javascript
// Verify bcrypt is working correctly
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('admin123', 12);
console.log('New hash:', hash);
```

### Problem: "Token expired" or authentication loops

**Symptoms:**

- User gets logged out immediately after login
- Infinite authentication redirects
- "Token expired" errors in console

**Solutions:**

1. **Clear browser storage:**

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

2. **Check PASETO secret key:**

```bash
# Ensure PASETO_SECRET_KEY is set and consistent
echo $PASETO_SECRET_KEY
# Should be 64-character hex string
```

3. **Verify token expiration settings:**

```bash
# Check token expiration times in .env
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

4. **Time synchronization:**

```bash
# Ensure server time is correct
date
# Sync time if needed (Linux)
sudo ntpdate -s time.nist.gov
```

## Site Management Issues

### Problem: Cannot create new site

**Symptoms:**

- "Site creation failed" error
- Git clone operations fail
- GitHub repository access errors

**Solutions:**

1. **Verify GitHub PAT permissions:**
   - Token must have `repo` scope
   - Token must not be expired
   - Repository must be accessible with token

2. **Test GitHub connectivity:**

```bash
# Test GitHub API access
curl -H "Authorization: token YOUR_GITHUB_PAT" https://api.github.com/user

# Test repository access
curl -H "Authorization: token YOUR_GITHUB_PAT" \
  https://api.github.com/repos/USERNAME/REPOSITORY
```

3. **Check local path permissions:**

```bash
# Verify directory exists and is writable
mkdir -p /var/fiction-cms/repos
chown fiction-cms:fiction-cms /var/fiction-cms/repos
chmod 755 /var/fiction-cms/repos
```

4. **Git configuration:**

```bash
# Set up Git identity for the system user
git config --global user.name "Fiction CMS"
git config --global user.email "cms@your-domain.com"
```

### Problem: Git operations fail

**Symptoms:**

- Push/pull operations fail
- "Git authentication failed" errors
- Repository sync issues

**Solutions:**

1. **Check Git credentials:**

```bash
# Test Git clone manually
git clone https://TOKEN@github.com/USERNAME/REPO.git /tmp/test-clone
```

2. **Verify repository permissions:**

```bash
# Check if user can write to repository
ls -la /var/fiction-cms/repos/
# Ensure fiction-cms user owns the directories
```

3. **Git configuration issues:**

```bash
# Check Git configuration
git config --list --global
git config --list --local
```

4. **Network connectivity:**

```bash
# Test GitHub connectivity
ping github.com
# Test HTTPS connectivity
curl -I https://github.com
```

## File Editing Issues

### Problem: Files not loading in editor

**Symptoms:**

- File browser shows files but editor shows empty content
- "File not found" errors
- Permission denied errors

**Solutions:**

1. **Check file permissions:**

```bash
# Verify file is readable
ls -la /path/to/site/content/file.md
# Should be readable by fiction-cms user
```

2. **Verify editable paths configuration:**

```javascript
// Check site configuration
console.log(siteConfig.editablePaths);
// File path must be within editable paths
```

3. **File encoding issues:**

```bash
# Check file encoding
file /path/to/file.md
# Should be UTF-8 text
```

4. **Large file handling:**

```bash
# Check file size limits
ls -lh /path/to/file.md
# Compare with MAX_FILE_SIZE setting
```

### Problem: Cannot save files

**Symptoms:**

- "Save failed" errors
- Files appear to save but changes don't persist
- Git commit failures

**Solutions:**

1. **Check disk space:**

```bash
# Check available disk space
df -h
# Ensure sufficient space for Git operations
```

2. **Git repository status:**

```bash
cd /var/fiction-cms/repos/site-name
git status
# Check for uncommitted changes or conflicts
```

3. **File locks:**

```bash
# Check for file locks
lsof /path/to/file.md
# Kill processes holding locks if needed
```

4. **Git hooks or pre-commit issues:**

```bash
# Check Git hooks
ls -la .git/hooks/
# Temporarily disable hooks for testing
mv .git/hooks .git/hooks-disabled
```

## Database Issues

### Problem: Database connection errors

**Symptoms:**

- "Database connection failed" errors
- SQLite database locked errors
- Migration failures

**Solutions:**

1. **Check database file:**

```bash
# Verify database file exists and is accessible
ls -la fiction-cms.db
sqlite3 fiction-cms.db ".schema"
```

2. **Database lock issues:**

```bash
# Find processes using database
lsof fiction-cms.db
# Kill processes if necessary
```

3. **Database corruption:**

```bash
# Check database integrity
sqlite3 fiction-cms.db "PRAGMA integrity_check;"
# Should return "ok"
```

4. **Permissions:**

```bash
# Fix database permissions
chown fiction-cms:fiction-cms fiction-cms.db
chmod 640 fiction-cms.db
```

### Problem: Migration failures

**Symptoms:**

- "Migration failed" errors on startup
- Database schema inconsistencies
- Missing tables or columns

**Solutions:**

1. **Backup and reset database:**

```bash
# Backup current database
cp fiction-cms.db fiction-cms.db.backup

# Delete and recreate
rm fiction-cms.db
# Restart application to recreate database
```

2. **Manual migration:**

```bash
# Run specific migration
cd packages/backend
pnpm run db:push
```

3. **Check migration files:**

```bash
# Verify migration files exist
ls -la packages/backend/src/db/migrations/
```

## Performance Issues

### Problem: Slow application response

**Symptoms:**

- Long loading times
- API requests timeout
- Editor laggy or unresponsive

**Solutions:**

1. **Check system resources:**

```bash
# Check CPU and memory usage
htop
# Check disk I/O
iotop
```

2. **Database performance:**

```bash
# Check database size and analyze
sqlite3 fiction-cms.db "ANALYZE; PRAGMA table_info(users);"
```

3. **File system performance:**

```bash
# Check file system performance
dd if=/dev/zero of=/tmp/testfile bs=1M count=100
rm /tmp/testfile
```

4. **Network latency:**

```bash
# Test API response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3001/api/health
```

### Problem: High memory usage

**Symptoms:**

- Out of memory errors
- Application crashes
- System becomes unresponsive

**Solutions:**

1. **Monitor memory usage:**

```bash
# Check memory usage by process
ps aux --sort=-%mem | head
```

2. **Configure memory limits:**

```json
// PM2 ecosystem.config.js
max_memory_restart: '1G'
```

3. **Check for memory leaks:**

```bash
# Monitor memory over time
watch -n 5 'ps -p $(pgrep node) -o pid,vsz,rss,comm'
```

## Network and Connectivity Issues

### Problem: CORS errors

**Symptoms:**

- "CORS policy" errors in browser console
- API requests blocked by browser
- Cross-origin request failures

**Solutions:**

1. **Check CORS configuration:**

```bash
# Verify CORS origins setting
echo $CORS_ORIGINS
# Should include frontend URL
```

2. **Update CORS settings:**

```javascript
// In environment or configuration
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

3. **Nginx proxy configuration:**

```nginx
# Add CORS headers in Nginx if needed
add_header Access-Control-Allow-Origin "https://your-domain.com";
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type";
```

### Problem: SSL/TLS certificate issues

**Symptoms:**

- "Certificate not trusted" errors
- HTTPS connection failures
- Mixed content warnings

**Solutions:**

1. **Check certificate validity:**

```bash
# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/domain/cert.pem -text -noout | grep "Not After"
```

2. **Renew Let's Encrypt certificate:**

```bash
sudo certbot renew --dry-run
sudo certbot renew
sudo systemctl reload nginx
```

3. **Check certificate chain:**

```bash
# Test certificate chain
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Docker-specific Issues

### Problem: Container startup failures

**Symptoms:**

- Container exits immediately
- "Port already in use" errors
- Mount volume failures

**Solutions:**

1. **Check container logs:**

```bash
docker logs fiction-cms-container
docker-compose logs fiction-cms
```

2. **Port conflicts:**

```bash
# Check what's using port 3001
netstat -tlnp | grep :3001
# Kill process or use different port
```

3. **Volume mount issues:**

```bash
# Check volume permissions
ls -la /path/to/mounted/volume
# Fix permissions if needed
sudo chown -R 1001:1001 /path/to/volume
```

4. **Environment variable issues:**

```bash
# Check environment variables in container
docker exec fiction-cms-container env | grep PASETO
```

## Development-specific Issues

### Problem: Hot reload not working

**Symptoms:**

- Changes not reflected in browser
- Development server not restarting
- TypeScript compilation errors

**Solutions:**

1. **Check development server:**

```bash
# Ensure development servers are running
pnpm --filter frontend dev
pnpm --filter backend dev
```

2. **Clear build cache:**

```bash
# Clear Vite cache
rm -rf packages/frontend/.vite
# Clear TypeScript cache
rm -rf packages/*/tsconfig.tsbuildinfo
```

3. **Check file watchers:**

```bash
# Increase file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Problem: TypeScript compilation errors

**Symptoms:**

- Build failures
- Type checking errors
- Import resolution issues

**Solutions:**

1. **Update dependencies:**

```bash
pnpm update
pnpm install
```

2. **Check TypeScript configuration:**

```bash
# Validate tsconfig.json
npx tsc --noEmit
```

3. **Clear and rebuild:**

```bash
rm -rf node_modules packages/*/node_modules
rm -rf packages/*/dist
pnpm install
pnpm build
```

## Getting Additional Help

### Enable Debug Mode

```bash
# Enable debug logging
export DEBUG=fiction-cms:*
export LOG_LEVEL=debug

# Start application with debug output
pnpm dev
```

### Collect Diagnostic Information

```bash
#!/bin/bash
# Create diagnostic report
echo "=== System Information ===" > diagnostic.txt
uname -a >> diagnostic.txt
node --version >> diagnostic.txt
npm --version >> diagnostic.txt

echo "=== Environment Variables ===" >> diagnostic.txt
env | grep -E "(NODE_|PASETO_|DATABASE_|GITHUB_)" >> diagnostic.txt

echo "=== Service Status ===" >> diagnostic.txt
systemctl status fiction-cms >> diagnostic.txt

echo "=== Recent Logs ===" >> diagnostic.txt
tail -50 /var/log/fiction-cms/error.log >> diagnostic.txt

echo "=== Database Status ===" >> diagnostic.txt
sqlite3 fiction-cms.db ".tables" >> diagnostic.txt
```

### Community Support

- **GitHub Issues**: [Report issues](https://github.com/billstark001/fiction-cms/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/billstark001/fiction-cms/discussions)
- **Documentation**: Review relevant documentation sections

### Professional Support

For production deployments or complex issues:

- Consider professional consulting services
- Implement monitoring and alerting solutions
- Set up automated backup and recovery procedures

Remember to always backup your data before attempting major troubleshooting steps, especially those involving database modifications or file system changes.
