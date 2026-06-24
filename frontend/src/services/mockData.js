// ── KavachIQ Demo / Mock Data ──────────────────────────────────
// Provides realistic mock data so the dashboard works without a backend.
// Used automatically when deployed to Cloudflare (no localhost API).

// ── Demo Users ────────────────────────────────────────────────
export const DEMO_USERS = [
  { id: 'demo-user-001', username: 'demouser', email: 'demo@kavachiq.com', role: 'admin' },
  { id: 'demo-user-002', username: 'alice', email: 'alice@company.com', role: 'user' },
  { id: 'demo-user-003', username: 'bob', email: 'bob@company.com', role: 'user' },
  { id: 'demo-user-004', username: 'charlie', email: 'charlie@company.com', role: 'user' }
];

export const DEMO_USER = DEMO_USERS[0];
export const DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-token-kavachiq';

// ── Dashboard Metrics ─────────────────────────────────────────
export const mockDashboardMetrics = (currentUser = null) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  return {
    totalScans: isAdmin ? 147 : 42,
    vulnerabilitiesFound: isAdmin ? 89 : 23,
    criticalThreats: isAdmin ? 3 : 1,
    highThreats: isAdmin ? 12 : 4,
    mediumThreats: isAdmin ? 34 : 10,
    lowThreats: isAdmin ? 40 : 8,
    assetsMonitored: isAdmin ? 12 : 3,
    scansToday: isAdmin ? 7 : 2,
    riskScore: 'B+',
    riskScoreTrend: 'improving',
    lastAuditDate: '2026-06-23',
    activeThreats: isAdmin ? 18 : 5,
    resolvedThreats: isAdmin ? 156 : 37,
    uptime: 99.97,
    uniqueUsers: isAdmin ? 4 : undefined,
    scanHistory: [
      { date: '2026-06-17', count: isAdmin ? 12 : 3 },
      { date: '2026-06-18', count: isAdmin ? 9 : 2 },
      { date: '2026-06-19', count: isAdmin ? 15 : 4 },
      { date: '2026-06-20', count: isAdmin ? 8 : 1 },
      { date: '2026-06-21', count: isAdmin ? 11 : 3 },
      { date: '2026-06-22', count: isAdmin ? 14 : 5 },
      { date: '2026-06-23', count: isAdmin ? 7 : 2 }
    ],
    threatDistribution: [
      { name: 'Critical', value: isAdmin ? 3 : 1, color: '#ef4444' },
      { name: 'High', value: isAdmin ? 12 : 4, color: '#f97316' },
      { name: 'Medium', value: isAdmin ? 34 : 10, color: '#eab308' },
      { name: 'Low', value: isAdmin ? 40 : 8, color: '#22c55e' }
    ]
  };
};

// ── Scans ─────────────────────────────────────────────────────
let scanIdCounter = 100;
const scanTypes = ['Quick Scan', 'Full Vulnerability', 'SSL Check', 'Malware Scan', 'Port Scan', 'Compliance Check', 'CVE Match'];
const scanStatuses = ['completed', 'completed', 'completed', 'in_progress', 'completed', 'failed', 'completed'];
const severities = ['critical', 'high', 'medium', 'low', 'none'];
const scanTargets = [
  'https://example.com',
  'https://shop.example.com',
  'https://blog.example.com',
  'https://admin.example.com',
  'https://api.example.com'
];

export const mockScans = (page = 1, limit = 10, currentUser = null) => {
  const scans = [];
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  // Generate a shared pool of scans across all users
  const allScans = [];
  for (let i = 0; i < 47; i++) {
    const userIdx = i % DEMO_USERS.length;
    const user = DEMO_USERS[userIdx];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    allScans.push({
      id: `scan-${100 + i}`,
      type: scanTypes[i % scanTypes.length],
      target: scanTargets[i % scanTargets.length],
      website_url: scanTargets[i % scanTargets.length],
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      status: scanStatuses[i % scanStatuses.length],
      severity,
      user_id: user.id,
      user_email: user.email,
      user_name: user.username,
      vulnerabilitiesFound: severity === 'none' ? 0 : Math.floor(Math.random() * 15) + 1,
      completed_at: i < 6 ? new Date(Date.now() - i * 3600000 + 120000).toISOString() : null,
      duration: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s`,
      score: severity === 'critical' ? 92 : severity === 'high' ? 78 : severity === 'medium' ? 65 : 45
    });
  }

  // Filter by user if not admin
  const filtered = isAdmin ? allScans : allScans.filter(s => s.user_id === currentUser?.id);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageScans = filtered.slice(start, start + limit);

  return { scans: pageScans, total, page, limit, totalPages: Math.ceil(total / limit), isAdminView: isAdmin };
};

// Lookup the correct website URL for a scan ID using the same deterministic formula as mockScans
const getScanUrlById = (scanId) => {
  if (!scanId) return 'https://example.com';
  // scan-100 → index 0, scan-101 → index 1, etc.
  const match = scanId.match(/scan-(\d+)/);
  if (!match) return 'https://example.com';
  const idx = parseInt(match[1]) - 100;
  return scanTargets[Math.abs(idx) % scanTargets.length];
};

// Compute the correct created_at for a scan ID (same offset as mockScans)
const getScanCreatedAt = (scanId) => {
  const match = scanId.match(/scan-(\d+)/);
  if (!match) return '2026-06-23T08:30:00Z';
  const idx = parseInt(match[1]) - 100;
  return new Date(Date.now() - Math.abs(idx) * 3600000).toISOString();
};

export const mockScanDetail = (scanId, currentUser = null) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isOwnScan = currentUser && scanId.startsWith('scan-');
  const websiteUrl = getScanUrlById(scanId);
  const createdAt = getScanCreatedAt(scanId);
  
  return {
  id: scanId,
  type: 'Full Vulnerability Scan',
  target: websiteUrl,
  website_url: websiteUrl,
  created_at: createdAt,
  status: 'completed',
  severity: 'high',
  user_id: isOwnScan ? currentUser.id : 'demo-user-002',
  user_email: isOwnScan ? currentUser.email : 'alice@company.com',
  user_name: isOwnScan ? currentUser.username : 'alice',
  vulnerabilitiesFound: 12,
  summary: 'Found 12 vulnerabilities: 2 critical, 3 high, 4 medium, 3 low',
  vulnerabilities: [
    { id: 'VULN-001', name: 'SQL Injection', severity: 'critical', cvss: 9.8, status: 'open', description: 'SQL injection in login form parameter' },
    { id: 'VULN-002', name: 'XSS Reflected', severity: 'critical', cvss: 8.6, status: 'open', description: 'Reflected XSS in search endpoint' },
    { id: 'VULN-003', name: 'Outdated SSL', severity: 'high', cvss: 7.4, status: 'open', description: 'TLS 1.0 still enabled' },
    { id: 'VULN-004', name: 'Missing Headers', severity: 'high', cvss: 6.8, status: 'open', description: 'X-Frame-Options header missing' },
    { id: 'VULN-005', name: 'CORS Misconfiguration', severity: 'high', cvss: 6.5, status: 'resolved', description: 'CORS allows all origins' },
    { id: 'VULN-006', name: 'Information Disclosure', severity: 'medium', cvss: 5.3, status: 'open', description: 'Server version exposed in headers' },
    { id: 'VULN-007', name: 'Weak Password Policy', severity: 'medium', cvss: 5.0, status: 'open', description: 'No minimum password complexity' },
    { id: 'VULN-008', name: 'Missing CSP', severity: 'medium', cvss: 4.8, status: 'open', description: 'Content Security Policy not set' },
    { id: 'VULN-009', name: 'Unsecured Cookie', severity: 'medium', cvss: 4.3, status: 'resolved', description: 'Session cookie missing Secure flag' },
    { id: 'VULN-010', name: 'Directory Listing', severity: 'low', cvss: 3.7, status: 'open', description: 'Directory listing enabled on /uploads' },
    { id: 'VULN-011', name: 'Email Disclosure', severity: 'low', cvss: 2.5, status: 'open', description: 'Email addresses found in source comments' },
    { id: 'VULN-012', name: 'Meta Tag Info', severity: 'low', cvss: 1.8, status: 'resolved', description: 'Generator meta tag exposes CMS version' }
  ]
  };
};

// ── CVE / Threat Intel ───────────────────────────────────────
export const mockCVESearch = (query) => ({
  total: 34,
  results: [
    { id: 'CVE-2026-1234', score: 9.8, severity: 'critical', description: 'Remote code execution in Apache HTTP Server 2.4.x', published: '2026-06-15', affected: 'Apache HTTP Server 2.4.0 - 2.4.58' },
    { id: 'CVE-2026-5678', score: 8.2, severity: 'high', description: 'SQL injection in MySQL < 8.0.35', published: '2026-06-14', affected: 'MySQL 8.0.x < 8.0.35' },
    { id: 'CVE-2026-9012', score: 7.5, severity: 'high', description: 'Buffer overflow in OpenSSL 3.x', published: '2026-06-12', affected: 'OpenSSL 3.0.0 - 3.1.4' },
    { id: 'CVE-2026-3456', score: 6.1, severity: 'medium', description: 'XSS in WordPress core < 6.4', published: '2026-06-10', affected: 'WordPress < 6.4' },
    { id: 'CVE-2026-7890', score: 5.4, severity: 'medium', description: 'Path traversal in Nginx < 1.24', published: '2026-06-08', affected: 'Nginx < 1.24' },
    { id: 'CVE-2026-4321', score: 9.1, severity: 'critical', description: 'Zero-day in Redis < 7.2.4', published: '2026-06-20', affected: 'Redis < 7.2.4' },
    { id: 'CVE-2026-8765', score: 4.3, severity: 'medium', description: 'Information leak in Node.js 20.x', published: '2026-06-05', affected: 'Node.js 20.x' }
  ]
});

export const mockCVE = (cveId) => ({
  id: cveId,
  description: 'Critical remote code execution vulnerability allowing unauthenticated attackers to execute arbitrary code.',
  score: 9.8,
  severity: 'critical',
  vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
  published: '2026-06-15',
  lastModified: '2026-06-22',
  references: [
    'https://nvd.nist.gov/vuln/detail/' + cveId,
    'https://github.com/advisories/' + cveId.toLowerCase(),
    'https://cve.mitre.org/cgi-bin/cvename.cgi?name=' + cveId
  ],
  affectedProducts: ['Apache HTTP Server 2.4.0 - 2.4.58'],
  exploits: ['Metasploit module available', 'Public PoC published']
});

export const mockThreatIntel = (keyword) => ({
  keyword,
  totalThreats: 12,
  relatedCves: ['CVE-2026-1234', 'CVE-2026-5678', 'CVE-2026-9012'],
  riskLevel: 'high',
  summary: `${keyword} has 12 associated CVEs with an average CVSS score of 7.2. Immediate patching recommended.`,
  sources: ['NVD', 'MITRE', 'GitHub Advisory Database'],
  lastUpdated: '2026-06-23T10:30:00Z'
});

// ── Dashboard Threats ─────────────────────────────────────────
export const mockThreats = (params) => {
  const total = 156;
  const limit = parseInt(params?.limit) || 10;
  const page = parseInt(params?.page) || 1;
  const threats = [];
  
  for (let i = 0; i < Math.min(limit, total); i++) {
    const idx = (page - 1) * limit + i;
    if (idx >= total) break;
    threats.push({
      id: `threat-${idx + 1}`,
      type: ['SQL Injection', 'XSS', 'Malware', 'Phishing', 'DDoS', 'Brute Force', 'RCE'][idx % 7],
      severity: ['critical', 'high', 'medium', 'low'][idx % 4],
      source: `IP 192.168.${Math.floor(idx / 255)}.${idx % 255}`,
      target: `asset-${(idx % 12) + 1}`,
      timestamp: new Date(Date.now() - idx * 7200000).toISOString(),
      status: ['active', 'active', 'resolved', 'investigating'][idx % 4],
      score: Math.floor(Math.random() * 100)
    });
  }
  return { threats, total, page, limit };
};

// ── Audit Logs ────────────────────────────────────────────────
export const mockAuditTrail = (resourceType, resourceId) => {
  const entries = [];
  const actions = ['create', 'update', 'delete', 'read', 'export', 'login', 'configure'];
  const users = ['admin@kavachiq.com', 'operator@kavachiq.com', 'system'];

  for (let i = 0; i < 25; i++) {
    entries.push({
      id: `audit-${i + 1}`,
      action: actions[i % actions.length],
      resourceType: resourceType || 'scan',
      resourceId: resourceId || `scan-${100 + i}`,
      user: users[i % users.length],
      ip: `10.0.${Math.floor(i / 255)}.${i % 255}`,
      timestamp: new Date(Date.now() - i * 7200000).toISOString(),
      details: `${actions[i % actions.length]} operation performed on ${resourceType || 'scan'}`,
      status: i % 5 === 0 ? 'failure' : 'success'
    });
  }
  return { entries, total: 25 };
};

export const mockAuditSummary = () => ({
  totalEvents: 1247,
  uniqueUsers: 8,
  failureRate: 2.3,
  topActions: [
    { action: 'read', count: 523 },
    { action: 'create', count: 312 },
    { action: 'update', count: 201 },
    { action: 'delete', count: 89 },
    { action: 'export', count: 67 }
  ],
  recentActivity: [
    { date: '2026-06-23', count: 34, failures: 1 },
    { date: '2026-06-22', count: 28, failures: 0 },
    { date: '2026-06-21', count: 42, failures: 2 },
    { date: '2026-06-20', count: 19, failures: 0 },
    { date: '2026-06-19', count: 37, failures: 1 },
    { date: '2026-06-18', count: 31, failures: 0 },
    { date: '2026-06-17', count: 45, failures: 3 }
  ]
});

// ── Notifications ─────────────────────────────────────────────
export const mockNotifications = (params) => {
  const limit = parseInt(params?.limit) || 20;
  const notifications = [];
  const types = ['critical', 'warning', 'info', 'success'];
  
  for (let i = 0; i < Math.min(limit, 30); i++) {
    notifications.push({
      id: `notif-${i + 1}`,
      type: types[i % types.length],
      title: [
        'Critical vulnerability detected',
        'Scan completed',
        'New CVE published affecting your stack',
        'SSL certificate expiring soon',
        'Threat blocked automatically',
        'Weekly security report ready',
        'Backup completed successfully'
      ][i % 7],
      message: [
        'SQL injection vulnerability found on example.com/login',
        'Full vulnerability scan completed - 12 issues found',
        'CVE-2026-4321 affects your Redis instance',
        'SSL cert for example.com expires in 14 days',
        'Brute force attack blocked from IP 192.168.1.100',
        'Your weekly security summary is ready to view',
        'Automated backup of all configurations completed'
      ][i % 7],
      read: i > 7,
      timestamp: new Date(Date.now() - i * 1800000).toISOString()
    });
  }
  return { notifications, total: 30, unread: 8 };
};

export const mockUnreadCount = () => ({ count: 8 });

// ── Settings / API Keys ───────────────────────────────────────
export const mockApiKeys = () => ({
  keys: [
    { id: 'key-1', name: 'NVD API Key', status: 'configured', lastUsed: '2026-06-23T10:30:00Z', createdAt: '2026-06-01' },
    { id: 'key-2', name: 'Shodan API', status: 'configured', lastUsed: '2026-06-22T15:00:00Z', createdAt: '2026-06-01' },
    { id: 'key-3', name: 'VirusTotal', status: 'not_configured', lastUsed: null, createdAt: null },
    { id: 'key-4', name: 'AlienVault OTX', status: 'configured', lastUsed: '2026-06-20T08:00:00Z', createdAt: '2026-06-10' },
    { id: 'key-5', name: 'AbuseIPDB', status: 'not_configured', lastUsed: null, createdAt: null }
  ]
});

export const mockKeyStatus = () => ({
  total: 5,
  configured: 3,
  notConfigured: 2,
  activeToday: 3
});

export const mockSupportedKeys = () => ({
  keys: [
    { name: 'NVD API Key', description: 'National Vulnerability Database access', required: true, docsUrl: 'https://nvd.nist.gov/developers/request-an-api-key' },
    { name: 'Shodan API', description: 'Device and service discovery', required: false, docsUrl: 'https://account.shodan.io/' },
    { name: 'VirusTotal', description: 'Malware and file analysis', required: false, docsUrl: 'https://www.virustotal.com/gui/my-apikey' },
    { name: 'AlienVault OTX', description: 'Open Threat Exchange intelligence', required: false, docsUrl: 'https://otx.alienvault.com/api' },
    { name: 'AbuseIPDB', description: 'IP reputation checking', required: false, docsUrl: 'https://www.abuseipdb.com/register' }
  ]
});

// ── Compliance Reports ────────────────────────────────────────
export const mockSOC2Report = () => ({
  status: 'compliant',
  lastAssessment: '2026-06-01',
  nextAssessment: '2026-09-01',
  controls: {
    passed: 142,
    failed: 3,
    total: 145,
    categories: [
      { name: 'Security', passed: 38, failed: 1, total: 39 },
      { name: 'Availability', passed: 25, failed: 0, total: 25 },
      { name: 'Processing Integrity', passed: 20, failed: 1, total: 21 },
      { name: 'Confidentiality', passed: 32, failed: 0, total: 32 },
      { name: 'Privacy', passed: 27, failed: 1, total: 28 }
    ]
  }
});

export const mockISO27001Report = () => ({
  status: 'in_progress',
  progress: 72,
  domains: {
    completed: 8,
    inProgress: 3,
    notStarted: 1,
    total: 12
  }
});

// ── Upgrade Plans ─────────────────────────────────────────────
export const mockUpgradePlans = () => ({
  currentPlan: 'free',
  plans: [
    { id: 'free', name: 'Free', price: 0, features: ['Basic scanning', '5 scans/month', 'Email reports'] },
    { id: 'pro', name: 'Professional', price: 29, features: ['Advanced scanning', 'Unlimited scans', 'API access', 'Scheduled scans', 'Priority support', 'Slack integration'] },
    { id: 'enterprise', name: 'Enterprise', price: 99, features: ['Everything in Pro', 'SSO/SAML', 'Custom rules', 'SLA guarantee', 'Dedicated support', 'On-premise option'] }
  ]
});
