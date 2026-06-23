# KavachIQ API Reference

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses are JSON:

```json
{
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2024-06-23T00:22:40.000Z"
}
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201)**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Verify Token
```http
GET /auth/verify
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "valid": true,
  "user": {
    "userId": 1,
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

## Security Scans Endpoints

### Create Scan
```http
POST /scans
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "website_url": "https://example.com",
  "scan_type": "full"
}
```

**Response (201)**
```json
{
  "message": "Scan initiated",
  "scan": {
    "id": 42,
    "status": "pending",
    "created_at": "2024-06-23T00:22:40.000Z"
  }
}
```

### List User Scans
```http
GET /scans?limit=50&offset=0
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `limit` (default: 50) - Number of scans to return
- `offset` (default: 0) - Pagination offset

**Response (200)**
```json
{
  "scans": [
    {
      "id": 42,
      "user_id": 1,
      "website_url": "https://example.com",
      "scan_type": "full",
      "status": "completed",
      "severity": "high",
      "findings": { /* scan results */ },
      "created_at": "2024-06-23T00:22:40.000Z",
      "completed_at": "2024-06-23T00:23:15.000Z"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

### Get Scan Details
```http
GET /scans/42
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "id": 42,
  "user_id": 1,
  "website_url": "https://example.com",
  "status": "completed",
  "severity": "high",
  "findings": {
    "url": "https://example.com",
    "severity": "high",
    "ssl": {
      "valid": true,
      "grade": "A",
      "daysRemaining": 45,
      "protocol": "TLSv1.3"
    },
    "securityHeaders": {
      "passed": 5,
      "total": 7,
      "details": {
        "haveStrictTransportSecurity": true,
        "haveXContentTypeOptions": true
      }
    },
    "vulnerabilities": {
      "vulnerabilitiesFound": 2,
      "vulnerabilities": [
        {
          "type": "Outdated jQuery",
          "severity": "medium",
          "recommendation": "Update jQuery to latest version"
        }
      ]
    }
  },
  "report_url": "https://docs.google.com/document/d/..."
}
```

---

## CVE Endpoints

### Search CVEs
```http
GET /cve/search?q=WordPress&version=6.1
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `q` (required) - Search query (software name)
- `version` (optional) - Specific version

**Response (200)**
```json
{
  "query": "WordPress 6.1",
  "results": [
    {
      "cveId": "CVE-2023-12345",
      "description": "Vulnerability in WordPress core",
      "cvssScore": 7.5,
      "severity": "HIGH",
      "published": "2023-01-15T00:00:00Z",
      "lastModified": "2023-02-01T10:30:00Z",
      "references": "https://nvd.nist.gov/vuln/detail/CVE-2023-12345"
    }
  ],
  "total": 3
}
```

### Get CVE Details
```http
GET /cve/CVE-2023-12345
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "id": 1,
  "cve_id": "CVE-2023-12345",
  "description": "Vulnerability in WordPress core allowing RCE",
  "cvss_score": 9.8,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "severity": "CRITICAL",
  "attack_vector": "NETWORK",
  "published_date": "2023-01-15T00:00:00Z",
  "modified_date": "2023-02-01T10:30:00Z",
  "cpe_matches": [ /* CPE data */ ],
  "references": [ /* reference URLs */ ]
}
```

### Get Threat Intelligence
```http
GET /cve/threat-intel/WordPress
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "keyword": "WordPress",
  "totalCVEs": 247,
  "criticalCVEs": 12,
  "recentThreats": [
    {
      "id": "CVE-2024-01234",
      "score": 9.1,
      "description": "Remote code execution in Plugin X"
    }
  ]
}
```

---

## Audit Endpoints

### Get Audit Trail
```http
GET /audit/trail/scan/42?limit=100
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `limit` (default: 100) - Number of records

**Response (200)**
```json
{
  "resourceType": "scan",
  "resourceId": 42,
  "trail": [
    {
      "id": 1,
      "user_id": 1,
      "action": "scan_initiated",
      "resource_type": "scan",
      "resource_id": 42,
      "changes": { "website_url": "https://example.com" },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-06-23T00:22:40.000Z"
    }
  ]
}
```

### Export Audit Report
```http
GET /audit/report/export?startDate=2024-06-01&endDate=2024-06-30
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `startDate` (required) - ISO 8601 format (YYYY-MM-DD)
- `endDate` (required) - ISO 8601 format (YYYY-MM-DD)

**Response (200)**
```json
{
  "reportGenerated": "2024-06-23T00:22:40.000Z",
  "periodStart": "2024-06-01",
  "periodEnd": "2024-06-30",
  "totalRecords": 156,
  "records": [
    /* audit log records */
  ]
}
```

### Get Audit Summary
```http
GET /audit/summary
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "period": "7 days",
  "summary": {
    "uniqueUsers": 5,
    "totalActions": 127,
    "actionBreakdown": [
      {
        "action": "scan_initiated",
        "count": 42
      },
      {
        "action": "scan_completed",
        "count": 40
      }
    ]
  }
}
```

---

## Dashboard Endpoints

### Get Security Metrics
```http
GET /dashboard/metrics
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "metrics": {
    "totalScans": 127,
    "scansLast7Days": 23,
    "criticalIssuesFound": 5,
    "averageSecurityScore": 78
  },
  "timestamp": "2024-06-23T00:22:40.000Z"
}
```

### Get Active Threats
```http
GET /dashboard/threats?limit=20
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `limit` (default: 20) - Number of threats

**Response (200)**
```json
{
  "threats": [
    {
      "id": 1,
      "threat_type": "critical_cve",
      "threat_description": "Critical vulnerability in OpenSSL",
      "severity": "critical",
      "source": "nist-nvd",
      "affected_websites": ["https://example.com"],
      "mitigation_steps": "Update OpenSSL to version X.Y.Z",
      "status": "active",
      "created_at": "2024-06-23T00:00:00.000Z",
      "updated_at": "2024-06-23T00:22:40.000Z"
    }
  ],
  "total": 5
}
```

### Get Scan History
```http
GET /dashboard/scan-history
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "historyData": [
    {
      "date": "2024-06-23",
      "total": 8,
      "critical": 1,
      "high": 2,
      "medium": 5
    },
    {
      "date": "2024-06-22",
      "total": 6,
      "critical": 0,
      "high": 1,
      "medium": 5
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "website_url is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Scan not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

All endpoints are rate-limited:
- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 per window
- **Headers**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1687514560

---

## Pagination

List endpoints support pagination:

```bash
# Get page 2 with 50 items
GET /scans?limit=50&offset=50
```

Response includes:
- `total` - Total items in database
- `limit` - Items per page
- `offset` - Current offset

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Create scan
curl -X POST http://localhost:5000/api/scans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com"}'

# Get metrics
curl -X GET http://localhost:5000/api/dashboard/metrics \
  -H "Authorization: Bearer <token>"
```

---

## Testing with JavaScript/Node.js

```javascript
import api from './frontend/src/services/api';

// Login
const loginRes = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'pass123'
});

// Create scan
const scanRes = await api.post('/scans', {
  website_url: 'https://example.com'
});

// Get metrics
const metricsRes = await api.get('/dashboard/metrics');
```

---

## Webhooks (Future)

Webhooks for:
- Scan completion
- Critical vulnerability detected
- Audit log entries
- Threat intelligence updates

Configure in dashboard settings.

---

For more information, see [ARCHITECTURE.md](docs/ARCHITECTURE.md)
