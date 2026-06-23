# Deployment Guide

## Production Deployment

### Prerequisites
- Server with Ubuntu 20.04+
- Docker and Docker Compose installed
- SSL certificate (Let's Encrypt recommended)
- Domain name configured
- PostgreSQL 12+ installed or containerized

### Environment Setup

1. **Prepare Server**
```bash
mkdir -p /opt/kavachiq
cd /opt/kavachiq
git clone <your-repo> .
```

2. **Configure Environment**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit with production values
nano backend/.env
nano frontend/.env.local
```

3. **Key Production Settings**
```bash
# backend/.env
NODE_ENV=production
DB_HOST=<db-host>
DB_PORT=5432
JWT_SECRET=<generate-secure-random-key>
CORS_ORIGIN=https://your-domain.com
```

### Deploy with Docker Compose

```bash
# Build images
docker-compose -f infrastructure/docker-compose.yml build

# Start services
docker-compose -f infrastructure/docker-compose.yml up -d

# Verify services
docker-compose -f infrastructure/docker-compose.yml ps

# Check logs
docker-compose -f infrastructure/docker-compose.yml logs -f backend
```

### SSL/TLS Configuration

1. **Using Nginx with Let's Encrypt**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf to use certificate
# Then restart nginx container
```

2. **Update docker-compose.yml**
```yaml
ports:
  - "443:443"
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Database Migration

```bash
# Connect to container
docker exec -it kavachiq-backend npm run migrate

# Or manually
psql -h localhost -U postgres -d kavachiq -f backend/migrations/init.sql
```

### Monitoring & Maintenance

```bash
# View resource usage
docker stats

# Check service health
curl http://localhost:5000/health

# View logs
docker logs kavachiq-backend -f
docker logs kavachiq-frontend -f

# Backup database
docker exec kavachiq-postgres pg_dump -U postgres kavachiq > backup.sql

# Restore database
docker exec -i kavachiq-postgres psql -U postgres kavachiq < backup.sql
```

### Auto-Restart on Failure

```bash
# Docker automatically restarts failed containers
# Verify in docker-compose.yml:
restart_policy:
  condition: on-failure
  delay: 5s
  max_attempts: 5
```

### Performance Optimization

1. **Database**
- Add indexes for frequently queried columns
- Enable query caching
- Regular VACUUM & ANALYZE

2. **Application**
- Enable gzip compression in nginx
- Set caching headers
- Use CDN for static assets

3. **Infrastructure**
- Use load balancing for multiple instances
- Implement horizontal scaling
- Use managed PostgreSQL service

### Backup Strategy

```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups/kavachiq"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker exec kavachiq-postgres pg_dump -U postgres kavachiq | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Scaling Considerations

For high-traffic deployments:

1. **Horizontal Scaling**
```yaml
services:
  backend:
    replicas: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

2. **Use Managed Services**
- AWS RDS for database
- Cloudflare for DNS/CDN
- AWS Lambda for serverless functions
- S3 for file storage

3. **Add Redis Caching**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

## CI/CD Pipeline

### GitHub Actions Deployment

1. **Create GitHub Secrets**
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `SERVER_HOST`
   - `SERVER_USER`
   - `DEPLOY_KEY`

2. **Push to Deploy**
```bash
git push origin main  # Automatically triggers deployment
```

3. **Monitor Deployment**
   - Check GitHub Actions tab for status
   - View logs in Actions section

## Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:3000

# Database connection
docker exec kavachiq-postgres pg_isready -U postgres

# All services
docker-compose -f infrastructure/docker-compose.yml ps
```

## Rollback Procedure

```bash
# Stop current deployment
docker-compose down

# Revert to previous commit
git revert HEAD

# Redeploy
docker-compose -f infrastructure/docker-compose.yml up -d
```

## Support

For deployment issues, check:
- Docker logs: `docker logs <container-id>`
- Application logs: `/app/logs/`
- Database logs: `docker logs kavachiq-postgres`
