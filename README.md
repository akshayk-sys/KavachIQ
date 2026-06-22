# KavachIQ - Full-Stack Security Intelligence Platform

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**Secure Websites. Smarter Defense.** 🛡️

A comprehensive security intelligence platform for real-time vulnerability scanning, CVE tracking, threat intelligence, and automated compliance reporting.

## 🌟 Features

### 🛡️ Advanced Security Scanning
- **SSL/TLS Certificate Validation** - Real-time certificate checks with expiration alerts
- **Security Headers Analysis** - HSTS, CSP, X-Frame-Options, and more
- **Vulnerability Scanning** - Detect known vulnerabilities in web stacks
- **Malware Risk Assessment** - Real-time malware detection
- **CVE Integration** - NIST NVD database for zero-day tracking

### 🧠 AI-Powered Intelligence
- **Automated Threat Analysis** - ML-driven vulnerability assessment
- **Smart Recommendations** - Context-aware remediation steps
- **Risk Scoring** - CVSS-based severity calculation
- **Threat Pattern Detection** - Zero-day pattern recognition
- **Priority-Based Actions** - Ranked fix recommendations

### 📊 Real-Time Dashboard
- **Live Metrics** - Security KPIs and trends
- **Threat Monitoring** - Active threat list with severity
- **Scan History** - 30-day activity charts
- **Compliance Status** - Audit-ready reporting
- **Custom Alerts** - Real-time notifications

### 📄 Audit & Compliance
- **Google Docs Integration** - Auto-generated audit reports
- **Complete Audit Trail** - All actions logged with timestamps
- **Compliance Exports** - SOC 2, ISO 27001 ready
- **User Activity Tracking** - Role-based access logs
- **Change Management** - Full change history

### 🔥 Live Security Intelligence
- **Real-Time Threat Feed** - Latest security threats
- **CVE Updates** - Automatic vulnerability database updates
- **Threat Correlation** - Connect related security events
- **Impact Assessment** - Business impact analysis
- **Mitigation Guidance** - Step-by-step fix instructions

## 🏗️ Architecture

```
User (Web/Dashboard)
         ↓
    React App (Vite)
         ↓
   REST API (Express.js)
    ↙    ↓    ↘
  DB  Google  NIST
              CVE
```

**Tech Stack:**
- **Backend**: Node.js, Express, PostgreSQL, Winston
- **Frontend**: React 18, Vite, Recharts, Tailwind
- **Services**: JWT Auth, CVE Integration, Google Docs API
- **Deployment**: Docker, Docker Compose, GitHub Actions
- **Monitoring**: Health checks, Audit logs, Real-time alerts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

### Local Development (5 minutes)

```bash
# Clone repository
git clone <repo-url>
cd KavachIQ

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Access: http://localhost:3000

### Docker Deployment

```bash
docker-compose -f infrastructure/docker-compose.yml up -d
```

Access: http://localhost:3000

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design & components
- **[Quick Start](docs/QUICKSTART.md)** - 5-minute setup
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[API Reference](backend/README.md)** - Backend API docs
- **[Frontend Guide](frontend/README.md)** - React dashboard docs

## 🔑 Key Components

### Backend (`/backend`)
```
Express REST API
├── Auth Routes (JWT)
├── Scan Management
├── CVE/Threat Intelligence
├── Audit & Compliance
└── Dashboard Analytics

Services:
├── SecurityScanner - SSL/header/vulnerability checks
├── CVEService - NIST NVD integration
├── AIAgent - Threat analysis & scoring
└── AuditLogger - Google Docs audit trail
```

### Frontend (`/frontend`)
```
React Dashboard
├── Login/Register
├── Dashboard - Metrics & threats
├── Scans - Create & manage scans
├── Threat Intelligence - Live feeds
└── Audit Logs - Compliance reports

UI Components:
├── Metrics cards
├── Recharts visualizations
├── Data tables
└── Real-time alerts
```

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User authentication |
| `/api/scans` | GET/POST | List/create scans |
| `/api/scans/:id` | GET | Scan details |
| `/api/cve/search` | GET | Search CVEs |
| `/api/dashboard/metrics` | GET | Security metrics |
| `/api/audit/trail/:type/:id` | GET | Audit trail |

[Full API Documentation →](backend/README.md)

## 🔐 Security

✅ JWT authentication with bcryptjs
✅ CORS protection & rate limiting
✅ SQL injection prevention (prepared statements)
✅ XSS protection & HTTPS support
✅ Complete audit logging
✅ Role-based access control

## 📦 Project Structure

```
KavachIQ/
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── config/          # Configuration
│   │   └── middleware/      # Auth, logging
│   └── package.json
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # UI components
│   │   ├── services/        # API client
│   │   └── store/           # State management
│   └── package.json
├── infrastructure/          # Deployment config
│   ├── Dockerfile.*         # Container images
│   ├── docker-compose.yml   # Multi-container setup
│   ├── nginx.conf           # Reverse proxy
│   └── .github/workflows    # CI/CD pipeline
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── QUICKSTART.md
│   └── DEPLOYMENT.md
└── README.md               # This file
```

## 🚢 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Database backups enabled
- [ ] Monitoring setup
- [ ] Rate limiting enabled
- [ ] Audit logging active

### One-Click Deploy

```bash
# Using Docker Compose
docker-compose -f infrastructure/docker-compose.yml up -d

# Using GitHub Actions (with secrets configured)
git push origin main
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## 📈 Performance

- **Response Time**: < 200ms (P95)
- **Database**: Optimized indexes & connection pooling
- **Caching**: Redis-ready architecture
- **Scaling**: Horizontal scaling with load balancers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## 🛣️ Roadmap

- [x] Core security scanning
- [x] CVE integration
- [x] AI-powered analysis
- [x] React dashboard
- [x] Audit logging
- [ ] 2FA authentication
- [ ] Mobile app (React Native)
- [ ] Advanced ML models
- [ ] Slack/Teams integration
- [ ] Multi-tenant support

---

**Made with ❤️ for website security**

KavachIQ © 2024 | [Website](https://kavachiq.com) | [Twitter](https://twitter.com/kavachiq)
