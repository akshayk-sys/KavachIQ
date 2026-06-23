# KavachIQ Command Reference

## Development Setup

### 1. Clone & Install

```bash
# Navigate to project
cd c:\Users\jiban\Documents\KavachIQ

# Backend setup
cd backend
npm install
cp .env.example .env

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env.local
```

### 2. Start Services

**Terminal 1 - Backend API**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend App**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 - Database (Optional)**
```bash
docker run -d --name kavachiq-postgres \
  -e POSTGRES_PASSWORD=test123 \
  -e POSTGRES_DB=kavachiq \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Create First Account

1. Visit http://localhost:3000
2. Click "Register"
3. Create account with test credentials
4. Login with credentials
5. Create your first security scan

---

## Docker Commands

### Start All Services

```bash
# Single command to start everything
docker-compose -f infrastructure/docker-compose.yml up -d

# View status
docker-compose -f infrastructure/docker-compose.yml ps

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f

# Stop all services
docker-compose -f infrastructure/docker-compose.yml down
```

### Individual Service Management

```bash
# View backend logs
docker logs -f kavachiq-backend

# View frontend logs
docker logs -f kavachiq-frontend

# View database logs
docker logs -f kavachiq-postgres

# Restart a service
docker restart kavachiq-backend

# Execute command in container
docker exec -it kavachiq-backend npm test
```

### Database Management

```bash
# Connect to database
docker exec -it kavachiq-postgres psql -U postgres -d kavachiq

# Backup database
docker exec kavachiq-postgres pg_dump -U postgres kavachiq > backup.sql

# Restore database
docker exec -i kavachiq-postgres psql -U postgres kavachiq < backup.sql

# View database size
docker exec -it kavachiq-postgres psql -U postgres -d kavachiq -c "SELECT pg_size_pretty(pg_database_size('kavachiq'));"
```

---

## npm Scripts

### Backend

```bash
cd backend

# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Run database migrations
npm run migrate

# Build for production
npm run build
```

### Frontend

```bash
cd frontend

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## Database Management

### Initialize Database

```bash
# Connect to database
psql -h localhost -U postgres -d kavachiq

# Run schema from code
cd backend
node -e "const schema = require('./src/config/schema'); schema.initializeDatabase();"
```

### Common Queries

```sql
-- View all tables
\dt

-- Show table schema
\d table_name

-- Count records
SELECT COUNT(*) FROM scans;

-- View recent scans
SELECT * FROM scans ORDER BY created_at DESC LIMIT 10;

-- View audit trail
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;

-- View CVE records
SELECT * FROM cve_records LIMIT 10;

-- View active threats
SELECT * FROM threat_intelligence WHERE status = 'active';
```

---

## Testing & Debugging

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123"}'

# Create scan (replace TOKEN with actual JWT)
curl -X POST http://localhost:5000/api/scans \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com"}'

# Get metrics
curl -X GET http://localhost:5000/api/dashboard/metrics \
  -H "Authorization: Bearer TOKEN"
```

### View Logs

```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Docker logs
docker logs -f kavachiq-backend
docker logs -f kavachiq-frontend

# System logs
journalctl -u docker -f
```

---

## Deployment Commands

### Production Deployment

```bash
# Build Docker images
docker-compose build

# Start in production
docker-compose -f infrastructure/docker-compose.yml up -d

# Verify services running
docker-compose ps

# Check application health
curl http://your-domain.com/health

# View deployment logs
docker-compose logs -f
```

### GitHub Actions Deployment

```bash
# Push to trigger deployment
git add .
git commit -m "Deploy update"
git push origin main

# Monitor in GitHub
# Go to: Actions tab → Deploy workflow → View logs
```

---

## Configuration Management

### Update Environment Variables

```bash
# Backend
nano backend/.env

# Frontend
nano frontend/.env.local

# Restart services
docker-compose restart
```

### Common Configuration Changes

```bash
# Change database password
DB_PASSWORD=new_secure_password
docker-compose down
docker volume rm kavachiq_postgres_data  # Warning: deletes data
docker-compose up -d

# Change API port
PORT=5001
docker-compose up -d --force-recreate

# Change CORS origin
CORS_ORIGIN=https://new-domain.com
docker-compose restart backend
```

---

## Monitoring & Performance

### Check Service Health

```bash
# All services
docker-compose ps

# Backend health
curl http://localhost:5000/health

# Database connection
docker exec kavachiq-postgres pg_isready -U postgres

# Container stats
docker stats

# View resource usage
docker-compose exec backend ps aux
```

### Performance Optimization

```bash
# Clean Docker system
docker system prune

# Remove unused volumes
docker volume prune

# Clear logs
truncate -s 0 backend/logs/*.log

# Database optimization
docker exec kavachiq-postgres vacuumdb -U postgres -d kavachiq
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup with timestamp
BACKUP_NAME="kavachiq_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec kavachiq-postgres pg_dump -U postgres kavachiq > $BACKUP_NAME
gzip $BACKUP_NAME

# Automated daily backup
# Add to crontab:
# 0 2 * * * docker exec kavachiq-postgres pg_dump -U postgres kavachiq | gzip > /backups/kavachiq_$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup

```bash
# Restore from backup file
gunzip backup.sql.gz
docker exec -i kavachiq-postgres psql -U postgres kavachiq < backup.sql
```

---

## Troubleshooting Commands

### Port Conflicts

```bash
# Find process using port
lsof -i :3000
lsof -i :5000
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Restart Docker daemon
sudo systemctl restart docker

# Clear all containers
docker system prune -a

# Rebuild images
docker-compose build --no-cache

# Force recreate containers
docker-compose up -d --force-recreate
```

### Database Connection Issues

```bash
# Test connection
psql -h localhost -U postgres -d kavachiq -c "SELECT 1"

# Check PostgreSQL status
docker exec kavachiq-postgres pg_isready -U postgres

# View connection info
docker inspect kavachiq-postgres | grep -A 5 NetworkSettings
```

### Application Issues

```bash
# Clear node modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update
```

---

## Git Commands

### Source Control

```bash
# Clone repository
git clone <repo-url>
cd KavachIQ

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# (via GitHub web interface)

# Deploy (push to main)
git push origin main
```

---

## Useful Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health**: http://localhost:5000/health
- **API Docs**: docs/API_REFERENCE.md
- **Architecture**: docs/ARCHITECTURE.md
- **Deployment Guide**: docs/DEPLOYMENT.md

---

## Quick Reference

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f backend` |
| Restart backend | `docker-compose restart backend` |
| Run backend tests | `cd backend && npm test` |
| Run frontend dev | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Database backup | `docker exec kavachiq-postgres pg_dump -U postgres kavachiq > backup.sql` |
| Check health | `curl http://localhost:5000/health` |
| View database | `docker exec -it kavachiq-postgres psql -U postgres -d kavachiq` |

---

## Need Help?

1. Check logs: `docker-compose logs -f`
2. Review documentation: `docs/ARCHITECTURE.md`
3. Check API reference: `docs/API_REFERENCE.md`
4. Read quick start: `docs/QUICKSTART.md`
5. Check deployment guide: `docs/DEPLOYMENT.md`

---

**KavachIQ** - Secure Websites. Smarter Defense. 🛡️
