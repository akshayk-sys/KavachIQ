# KavachIQ Backend

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start with nodemon
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run migrate` - Run database migrations

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Scans
- `POST /api/scans` - Create security scan
- `GET /api/scans` - List user scans
- `GET /api/scans/:id` - Get scan details

### CVE & Threats
- `GET /api/cve/search?q=keyword` - Search CVEs
- `GET /api/cve/:id` - Get CVE details
- `GET /api/cve/threat-intel/:keyword` - Threat intelligence

### Audit
- `GET /api/audit/trail/:type/:id` - Audit trail
- `GET /api/audit/report/export` - Export report
- `GET /api/audit/summary` - Audit summary

### Dashboard
- `GET /api/dashboard/metrics` - Security metrics
- `GET /api/dashboard/threats` - Active threats
- `GET /api/dashboard/scan-history` - Scan history

## Services

### SecurityScanner
- SSL/TLS validation
- Security headers check
- Malware assessment
- Full website scan

### CVEService
- NIST NVD integration
- CVE search
- Threat intelligence
- Vulnerability tracking

### AIAgent
- Automated threat analysis
- Risk scoring
- Recommendations generation
- Pattern detection

### AuditLogger
- Google Docs integration
- Audit trail logging
- Compliance reporting
- Activity tracking

## Database

PostgreSQL 12+ required

### Schema
- users
- scans
- cve_records
- scan_cves
- audit_logs
- threat_intelligence
- security_alerts

### Indexes
- scans(user_id)
- scans(created_at)
- audit_logs(user_id)
- cve_records(cve_id)

## Environment Variables

```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kavachiq
DB_USER=postgres
DB_PASSWORD=secure
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
NIST_CVE_API=https://services.nvd.nist.gov/rest/json/cves/2.0
```

## Deployment

See `/docs/DEPLOYMENT.md` for production setup.
