# Quick Start Guide

## 30-Second Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running locally
- Git

### Clone & Install

```bash
# Navigate to project
cd KavachIQ

# Backend
cd backend
npm install
cp .env.example .env

# Frontend (in new terminal)
cd frontend
npm install
```

### Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3 (optional): Database
docker run -d --name kavachiq-postgres \
  -e POSTGRES_PASSWORD=test123 \
  -e POSTGRES_DB=kavachiq \
  -p 5432:5432 \
  postgres:15-alpine
```

### Access the Application

- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs (when added)

### Default Credentials

```
Email: demo@kavachiq.com
Password: DemoPass@123
```

## Using Docker Compose

```bash
# Single command setup & start
docker-compose -f infrastructure/docker-compose.yml up -d

# Stop all services
docker-compose -f infrastructure/docker-compose.yml down

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f
```

## Configuration

Edit `.env` files for each service:

- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration

## First Steps

1. **Create Account** → Register new user
2. **Create Scan** → Start security scan on any website
3. **View Dashboard** → Monitor results in real-time
4. **Check Threats** → Review active vulnerabilities
5. **Export Report** → Generate Google Docs audit report

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
VITE_PORT=3001 npm run dev
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -h localhost -U postgres -d kavachiq

# Check connection string in .env
DB_HOST=localhost
DB_PORT=5432
```

### CORS Issues
- Ensure `CORS_ORIGIN` in backend .env matches frontend URL
- Check that backend is accessible from frontend

## Next Steps

- [ ] Deploy to production
- [ ] Configure Google Docs integration
- [ ] Set up automated scanning
- [ ] Enable security alerts
- [ ] Configure backup policies
- [ ] Set up monitoring dashboards

## Support

Need help? Check the full documentation in `/docs/ARCHITECTURE.md`
