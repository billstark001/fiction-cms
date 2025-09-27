# Deployment Guide

This guide provides comprehensive instructions for deploying Fiction CMS to production environments, including various hosting platforms, security considerations, and monitoring setup.

## Deployment Options

Fiction CMS can be deployed to various platforms depending on your requirements:

- **[Docker Deployment](#docker-deployment)** - Recommended for most scenarios
- **[Traditional VPS](#traditional-vps-deployment)** - Direct deployment with PM2/systemd
- **[Cloud Platforms](#cloud-platform-deployment)** - Heroku, Railway, DigitalOcean App Platform
- **[Kubernetes](#kubernetes-deployment)** - For large-scale deployments

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU**: 1 vCPU
- **RAM**: 1GB RAM  
- **Storage**: 10GB SSD
- **Network**: Stable internet connection

**Recommended for Production:**
- **CPU**: 2+ vCPU
- **RAM**: 2GB+ RAM
- **Storage**: 20GB+ SSD with automated backups
- **Network**: CDN for static assets

### Required Software

- **Node.js**: 18.x LTS or higher
- **Git**: 2.20+ (for repository operations)
- **SQLite**: Included with Node.js
- **Process Manager**: PM2, systemd, or Docker
- **Reverse Proxy**: Nginx or Apache (recommended)
- **SSL Certificate**: Let's Encrypt or commercial

## Docker Deployment

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fiction-cms -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=fiction-cms:nodejs /app/packages/backend/dist ./backend/
COPY --from=builder --chown=fiction-cms:nodejs /app/packages/frontend/dist ./frontend/
COPY --from=builder --chown=fiction-cms:nodejs /app/packages/backend/package.json ./backend/
COPY --from=builder --chown=fiction-cms:nodejs /app/node_modules ./node_modules/
COPY --from=builder --chown=fiction-cms:nodejs /app/packages/backend/node_modules ./backend/node_modules/

# Create required directories
RUN mkdir -p /app/data /app/repos /app/logs
RUN chown -R fiction-cms:nodejs /app

# Switch to app user
USER fiction-cms

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/index.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  fiction-cms:
    build: .
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_PATH=/app/data/fiction-cms.db
      - PASETO_SECRET_KEY=${PASETO_SECRET_KEY}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
      - GITHUB_PAT=${GITHUB_PAT}
    volumes:
      - fiction-cms-data:/app/data
      - fiction-cms-repos:/app/repos
      - fiction-cms-logs:/app/logs
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fiction-cms.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.fiction-cms.tls.certresolver=letsencrypt"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - fiction-cms-ssl:/etc/nginx/ssl
      - fiction-cms-static:/usr/share/nginx/html
    depends_on:
      - fiction-cms

volumes:
  fiction-cms-data:
  fiction-cms-repos:
  fiction-cms-logs:
  fiction-cms-ssl:
  fiction-cms-static:
```

### Environment Configuration

Create `.env` file:

```bash
# Required: Generate secure secret key
PASETO_SECRET_KEY=your-64-character-secret-key-here

# Domain configuration
DOMAIN=your-cms-domain.com
FRONTEND_URL=https://your-cms-domain.com

# GitHub integration
GITHUB_PAT=ghp_your_github_personal_access_token

# Database
DATABASE_PATH=/app/data/fiction-cms.db

# Optional: Additional security
CORS_ORIGINS=https://your-cms-domain.com
MAX_FILE_SIZE=52428800
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Deploy with Docker

```bash
# Clone repository
git clone https://github.com/billstark001/fiction-cms.git
cd fiction-cms

# Configure environment
cp .env.example .env
# Edit .env with your values

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f fiction-cms

# Scale if needed
docker-compose up -d --scale fiction-cms=2
```

## Traditional VPS Deployment

### Server Setup

**1. Update System:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

**2. Install Node.js:**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally
sudo npm install -g pnpm pm2
```

**3. Create Application User:**
```bash
# Create dedicated user
sudo adduser fiction-cms
sudo usermod -aG sudo fiction-cms

# Switch to app user
sudo su - fiction-cms
```

### Application Deployment

**1. Clone and Build:**
```bash
# Clone repository
git clone https://github.com/billstark001/fiction-cms.git
cd fiction-cms

# Install dependencies
pnpm install

# Build production bundle
pnpm build

# Copy built files to deployment directory
sudo mkdir -p /opt/fiction-cms
sudo cp -r packages/backend/dist/* /opt/fiction-cms/
sudo cp -r packages/frontend/dist /opt/fiction-cms/public/
sudo chown -R fiction-cms:fiction-cms /opt/fiction-cms
```

**2. Environment Configuration:**
```bash
# Create environment file
sudo nano /opt/fiction-cms/.env

# Environment content
NODE_ENV=production
PORT=3001
DATABASE_PATH=/opt/fiction-cms/data/fiction-cms.db
PASETO_SECRET_KEY=your-secure-secret-key
FRONTEND_URL=https://your-domain.com
GITHUB_PAT=your-github-token
```

**3. PM2 Process Management:**
```bash
# Create PM2 ecosystem file
cat > /opt/fiction-cms/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'fiction-cms',
    script: '/opt/fiction-cms/index.js',
    cwd: '/opt/fiction-cms',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/fiction-cms/error.log',
    out_file: '/var/log/fiction-cms/access.log',
    log_file: '/var/log/fiction-cms/combined.log',
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/fiction-cms
sudo chown fiction-cms:fiction-cms /var/log/fiction-cms

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Nginx Configuration

**1. Install Nginx:**
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

**2. Configure Virtual Host:**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/fiction-cms
```

```nginx
# /etc/nginx/sites-available/fiction-cms
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Frontend static files
    location / {
        root /opt/fiction-cms/public;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Static assets with long-term caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /opt/fiction-cms/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # File upload size limit
    client_max_body_size 50M;
}
```

**3. Enable Site and SSL:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fiction-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Cloud Platform Deployment

### Railway Deployment

**1. Prepare for Railway:**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**2. Environment Variables:**
```bash
NODE_ENV=production
PASETO_SECRET_KEY=your-secret-key
GITHUB_PAT=your-github-token
RAILWAY_STATIC_URL=https://your-app.up.railway.app
```

### Heroku Deployment

**1. Create Heroku Configuration:**
```json
// Procfile
web: node packages/backend/dist/index.js
release: echo "Release phase completed"
```

**2. Configure Build:**
```json
// package.json
{
  "scripts": {
    "heroku-postbuild": "pnpm build"
  },
  "engines": {
    "node": "18.x",
    "pnpm": "8.x"
  }
}
```

### DigitalOcean App Platform

**1. App Spec Configuration:**
```yaml
# .do/app.yaml
name: fiction-cms
services:
- name: web
  source_dir: /
  github:
    repo: your-username/fiction-cms
    branch: main
    deploy_on_push: true
  run_command: node packages/backend/dist/index.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3001
  health_check:
    http_path: /api/health
  envs:
  - key: NODE_ENV
    value: production
  - key: PASETO_SECRET_KEY
    value: ${PASETO_SECRET_KEY}
  - key: GITHUB_PAT
    value: ${GITHUB_PAT}
```

## Kubernetes Deployment

### Kubernetes Manifests

**1. Deployment:**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fiction-cms
  labels:
    app: fiction-cms
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fiction-cms
  template:
    metadata:
      labels:
        app: fiction-cms
    spec:
      containers:
      - name: fiction-cms
        image: your-registry/fiction-cms:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_PATH
          value: "/app/data/fiction-cms.db"
        - name: PASETO_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: fiction-cms-secrets
              key: paseto-secret-key
        - name: GITHUB_PAT
          valueFrom:
            secretKeyRef:
              name: fiction-cms-secrets
              key: github-pat
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
        - name: repos-volume
          mountPath: /app/repos
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: fiction-cms-data-pvc
      - name: repos-volume
        persistentVolumeClaim:
          claimName: fiction-cms-repos-pvc
```

**2. Service and Ingress:**
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: fiction-cms-service
spec:
  selector:
    app: fiction-cms
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fiction-cms-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-cms-domain.com
    secretName: fiction-cms-tls
  rules:
  - host: your-cms-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fiction-cms-service
            port:
              number: 80
```

## Security Configuration

### Environment Security

**1. Secrets Management:**
```bash
# Generate secure PASETO key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use environment-specific secrets
# Never commit secrets to version control
# Use secret management services (AWS Secrets Manager, Azure Key Vault, etc.)
```

**2. Firewall Configuration:**
```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Only allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
```

### Database Security

**1. Database Backup:**
```bash
# Create backup script
cat > /opt/fiction-cms/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/opt/fiction-cms/data/fiction-cms.db"
BACKUP_DIR="/opt/fiction-cms/backups"
mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/fiction-cms-$DATE.db"
# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "fiction-cms-*.db" -mtime +30 -delete
EOF

chmod +x /opt/fiction-cms/backup-db.sh

# Add to crontab
echo "0 2 * * * /opt/fiction-cms/backup-db.sh" | crontab -
```

**2. File Permissions:**
```bash
# Secure file permissions
chmod 600 /opt/fiction-cms/.env
chmod 640 /opt/fiction-cms/data/fiction-cms.db
chown fiction-cms:fiction-cms /opt/fiction-cms/data/fiction-cms.db
```

## Monitoring and Logging

### Application Monitoring

**1. Health Checks:**
```bash
# Create monitoring script
cat > /opt/fiction-cms/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3001/api/health"
if ! curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "Health check failed - restarting application"
    pm2 restart fiction-cms
fi
EOF

chmod +x /opt/fiction-cms/health-check.sh

# Run every 5 minutes
echo "*/5 * * * * /opt/fiction-cms/health-check.sh" | crontab -
```

**2. Log Management:**
```bash
# Configure logrotate
sudo cat > /etc/logrotate.d/fiction-cms << 'EOF'
/var/log/fiction-cms/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 fiction-cms fiction-cms
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### Performance Monitoring

**1. System Monitoring with htop/netdata:**
```bash
# Install monitoring tools
sudo apt install htop iotop -y

# Optional: Install Netdata for web-based monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

**2. Application Metrics:**
```javascript
// Add to your application (optional)
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Endpoint for metrics
app.get('/metrics', async (c) => {
  const metrics = await promClient.register.metrics();
  return c.text(metrics);
});
```

## Maintenance and Updates

### Update Process

**1. Backup Before Update:**
```bash
# Stop application
pm2 stop fiction-cms

# Backup database
cp /opt/fiction-cms/data/fiction-cms.db /opt/fiction-cms/backups/pre-update-$(date +%Y%m%d).db

# Backup application files
tar -czf /opt/fiction-cms/backups/app-backup-$(date +%Y%m%d).tar.gz /opt/fiction-cms/
```

**2. Update Application:**
```bash
# Pull latest code
cd /path/to/source/fiction-cms
git pull origin main

# Install dependencies and build
pnpm install
pnpm build

# Update deployed files
sudo cp -r packages/backend/dist/* /opt/fiction-cms/
sudo cp -r packages/frontend/dist /opt/fiction-cms/public/

# Restart application
pm2 restart fiction-cms
```

### Rollback Process

**1. Quick Rollback:**
```bash
# Stop application
pm2 stop fiction-cms

# Restore from backup
tar -xzf /opt/fiction-cms/backups/app-backup-YYYYMMDD.tar.gz -C /

# Restart application  
pm2 start fiction-cms
```

This deployment guide provides comprehensive coverage for various deployment scenarios. Choose the approach that best fits your infrastructure and requirements. For additional support or deployment-specific questions, please refer to the troubleshooting section or create an issue in the GitHub repository.