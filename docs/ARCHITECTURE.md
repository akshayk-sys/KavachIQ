# KavachIQ - Security Intelligence Platform

Complete upgrade of KavachIQ into a full-stack security intelligence platform with:

🧠 **AI-Powered Security Agent** - ML/rule-based threat analysis
🛡️ **CVE Integration** - Real-time vulnerability database from NIST NVD
📊 **React Dashboard** - Live monitoring and analytics
📄 **Google Docs Audit Logging** - Auto-generated compliance reports
🔥 **Live Threat Intelligence** - Real-time threat detection and alerts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  Dashboard │ Scans │ Threats │ Audit Logs │ Reports         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ API Routes: Auth, Scans, CVE, Audit, Dashboard        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Services:                                              ││
│  │ • SecurityScanner - SSL, Headers, Vulnerabilities    ││
│  │ • CVEService - NIST NVD Integration                  ││
│  │ • AIAgent - Threat Analysis & Recommendations        ││
│  │ • AuditLogger - Google Docs Integration              ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    ┌────────┐    ┌─────────────┐   ┌──────────┐
    │PostgreSQL  │ Google Docs  │   │NIST NVD  │
    │Database    │ (Audit Logs) │   │API (CVE) │
    └────────┘    └─────────────┘   └──────────┘
```

## Components

### Backend (`/backend`)
- **Express.js** REST API
- **PostgreSQL** database
- **Security scanning engine**
- **CVE integration** with NIST NVD
- **AI agent** for threat analysis
- **Google Docs** audit logging
- **JWT authentication**

### Frontend (`/frontend`)
- **React 18** with Vite
- **Recharts** for data visualization
- **Zustand** for state management
- **Axios** for API calls
- **Tailwind CSS** for styling

### Services
- **SecurityScanner** - SSL/TLS, Security Headers, Vulnerability checks
- **CVEService** - NIST NVD integration, CVE search, Threat intelligence
- **AIAgent** - Automated threat analysis, recommendations, risk scoring
- **AuditLogger** - Google Docs integration, compliance reporting

## Features

### 🛡️ Security Scanning
- SSL/TLS certificate validation
- Security headers analysis
- Vulnerability scanning
- Malware risk assessment
- Real-time threat detection

### 🧠 AI-Powered Intelligence
- Automated threat analysis
- Vulnerability prioritization
- Fix time estimation
- Automated recommendations
- Risk scoring

### 📊 Dashboard & Analytics
- Real-time threat monitoring
- Security metrics & KPIs
- Scan history charts
- Active threat list
- Security trends

### 📄 Audit & Compliance
- Automated Google Docs reports
- Audit trail logging
- Compliance exports
- User activity tracking
- Change management

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (optional)
- Google Service Account (for audit logging)

### Development Setup

1. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Database**
```bash
# Using Docker
docker run -d \
  --name kavachiq-postgres \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=kavachiq \
  -p 5432:5432 \
  postgres:15-alpine
```

### Production Deployment

```bash
# Using Docker Compose
docker-compose -f infrastructure/docker-compose.yml up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Nginx Proxy: http://localhost:80
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Security Scans
- `POST /api/scans` - Create scan
- `GET /api/scans` - List user's scans
- `GET /api/scans/:id` - Get scan details

### CVE & Threats
- `GET /api/cve/search?q=keyword` - Search CVEs
- `GET /api/cve/:id` - Get CVE details
- `GET /api/cve/threat-intel/:keyword` - Get threat intelligence

### Audit & Compliance
- `GET /api/audit/trail/:type/:id` - Get audit trail
- `GET /api/audit/report/export` - Export audit report
- `GET /api/audit/summary` - Get audit summary

### Dashboard
- `GET /api/dashboard/metrics` - Get security metrics
- `GET /api/dashboard/threats` - Get active threats
- `GET /api/dashboard/scan-history` - Get scan history

## Database Schema

### Core Tables
- **users** - User authentication & profiles
- **scans** - Security scan records
- **cve_records** - CVE vulnerability database
- **scan_cves** - Mapping scans to CVEs
- **audit_logs** - Complete audit trail
- **threat_intelligence** - Real-time threats
- **security_alerts** - Security findings

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kavachiq
DB_USER=postgres
DB_PASSWORD=secure_password
JWT_SECRET=your_secret_key
NIST_CVE_API=https://services.nvd.nist.gov/rest/json/cves/2.0
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=base64_encoded_key
CORS_ORIGIN=http://localhost:3000,https://kavachiq.com
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

## Security Features

✅ JWT-based authentication
✅ Password hashing with bcryptjs
✅ CORS protection
✅ Rate limiting
✅ SQL injection prevention (prepared statements)
✅ XSS protection
✅ HTTPS/SSL support
✅ Audit logging for compliance
✅ Role-based access control

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

## Monitoring & Logging

- Winston logger for backend events
- Google Docs integration for audit logs
- Real-time threat monitoring
- Health check endpoints
- Database query logging

## Roadmap

- [ ] Two-factor authentication (2FA)
- [ ] Automated remediation workflows
- [ ] Mobile app (React Native)
- [ ] Machine learning-based anomaly detection
- [ ] Slack/Teams integration
- [ ] Advanced RBAC with teams
- [ ] Custom security policies
- [ ] Multi-tenant support
- [ ] Real-time websocket updates

## Support

For issues and feature requests, please open an issue on GitHub.

## License

MIT License - See LICENSE file for details

---

**KavachIQ** - Secure Websites. Smarter Defense. 🛡️
