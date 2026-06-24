// ── KavachIQ Demo / Mock Data ──────────────────────────────────
// Provides realistic mock data so the dashboard works without a backend.
// Used automatically when deployed to Cloudflare (no localhost API).

// ── Persistent Mutation Store (Demo Mode) ────────────────────
// Persists user-created scans, deletions, and trash to localStorage
// so all data survives page refreshes. Seeds stable example scans
// only on very first visit — no random/garbage data ever generated.

const STORAGE_KEY = 'kavachiq_mock_store';

// Stable example scans seeded on first visit — fully deterministic, no Math.random
function createExampleScans() {
  const now = Date.now();
  const users = [
    { id: 'demo-user-001', email: 'demo@kavachiq.com', username: 'demouser' },
    { id: 'demo-user-002', email: 'alice@company.com', username: 'alice' }
  ];
  return [
    {
      id: 'scan-example-1',
      type: 'Full Vulnerability',
      website_url: 'https://example.com',
      target: 'https://example.com',
      created_at: new Date(now - 3600000).toISOString(),
      status: 'completed',
      severity: 'medium',
      user_id: users[0].id,
      user_email: users[0].email,
      user_name: users[0].username,
      vulnerabilitiesFound: 5,
      score: 72,
      duration: '2m 34s'
    },
    {
      id: 'scan-example-2',
      type: 'SSL Check',
      website_url: 'https://shop.example.com',
      target: 'https://shop.example.com',
      created_at: new Date(now - 7200000).toISOString(),
      status: 'completed',
      severity: 'low',
      user_id: users[1].id,
      user_email: users[1].email,
      user_name: users[1].username,
      vulnerabilitiesFound: 2,
      score: 88,
      duration: '1m 12s'
    },
    {
      id: 'scan-example-3',
      type: 'Malware Scan',
      website_url: 'https://blog.example.com',
      target: 'https://blog.example.com',
      created_at: new Date(now - 10800000).toISOString(),
      status: 'completed',
      severity: 'none',
      user_id: users[0].id,
      user_email: users[0].email,
      user_name: users[0].username,
      vulnerabilitiesFound: 0,
      score: 95,
      duration: '3m 05s'
    }
  ];
}

export const MockStore = {
  _customScans: [],
  _deletedScanIds: new Set(),
  _deletedScans: [],
  _initialized: false,

  _save() {
    try {
      const data = {
        customScans: this._customScans,
        deletedScanIds: Array.from(this._deletedScanIds),
        deletedScans: this._deletedScans
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage might be full or unavailable
      console.warn('MockStore save failed:', e);
    }
  },

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this._customScans = data.customScans || [];
        this._deletedScanIds = new Set(data.deletedScanIds || []);
        this._deletedScans = data.deletedScans || [];
        return true; // had existing data
      }
    } catch (e) {
      console.warn('MockStore load failed:', e);
    }
    return false; // no existing data
  },

  _ensureInitialized() {
    if (this._initialized) return;
    this._initialized = true;
    const hadData = this._load();
    // Seed stable example scans only on very first visit
    if (!hadData) {
      const examples = createExampleScans();
      this._customScans = examples;
      this._save();
    }
  },

  addScan(scan) {
    this._ensureInitialized();
    this._customScans.push(scan);
    this._save();
  },

  softDeleteScan(scan) {
    this._ensureInitialized();
    this._deletedScanIds.add(scan.id);
    this._deletedScans.push({ ...scan, deletedAt: new Date().toISOString() });
    this._save();
  },

  restoreScan(scanId) {
    this._ensureInitialized();
    this._deletedScanIds.delete(scanId);
    const idx = this._deletedScans.findIndex(s => s.id === scanId);
    if (idx !== -1) this._deletedScans.splice(idx, 1);
    this._save();
  },

  permanentDeleteScan(scanId) {
    this._ensureInitialized();
    this._deletedScanIds.delete(scanId);
    const idx = this._deletedScans.findIndex(s => s.id === scanId);
    if (idx !== -1) this._deletedScans.splice(idx, 1);
    this._save();
  },

  emptyTrash() {
    this._ensureInitialized();
    this._deletedScanIds.clear();
    this._deletedScans = [];
    this._save();
  },

  /** Batch-delete all example scans (IDs starting with scan-example-) */
  removeExampleScans() {
    this._ensureInitialized();
    const examples = this._customScans.filter(s => s.id.startsWith('scan-example-'));
    for (const scan of examples) {
      if (!this._deletedScanIds.has(scan.id)) {
        this._deletedScanIds.add(scan.id);
        this._deletedScans.push({ ...scan, deletedAt: new Date().toISOString() });
      }
    }
    this._save();
    return examples.length; // return count of scans removed
  },

  /** Check if any example scans are currently active (not deleted) */
  hasExampleScans() {
    this._ensureInitialized();
    return this._customScans.some(s => s.id.startsWith('scan-example-') && !this._deletedScanIds.has(s.id));
  },

  isDeleted(scanId) {
    this._ensureInitialized();
    return this._deletedScanIds.has(scanId);
  },

  getDeletedScans() {
    this._ensureInitialized();
    return [...this._deletedScans];
  },

  getCustomScans() {
    this._ensureInitialized();
    return [...this._customScans];
  },

  getAllScans() {
    this._ensureInitialized();
    return this._customScans.filter(s => !this._deletedScanIds.has(s.id));
  }
};

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

// ── Scan Report Generator ────────────────────────────────────
// Generates a complete, deterministic scan report for any website URL.
// Same URL always produces the same report (same CVEs, same findings).

// Simple deterministic string hash
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Infer tech stack from URL for relevant CVE selection
function inferTechStack(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host.startsWith('shop.')) return 'ecommerce';
  if (host.startsWith('admin.')) return 'admin';
  if (host.startsWith('api.')) return 'api';
  if (host.startsWith('blog.')) return 'cms';
  if (host.startsWith('mail.') || host.startsWith('email.')) return 'email';
  if (host.startsWith('dev.') || host.startsWith('staging.')) return 'dev';
  if (host.startsWith('app.')) return 'app';
  return 'generic';
}

// All possible CVEs categorized by tech stack
const CVE_CATALOG = {
  // Applies to any website
  generic: [
    { id: 'CVE-2026-1234', name: 'Apache HTTP Server RCE', score: 9.8, severity: 'critical', cve: 'CVE-2026-1234',
      description: 'Remote code execution in Apache HTTP Server 2.4.x allows unauthenticated attackers to execute arbitrary code via a crafted request.',
      type: 'Remote Code Execution',
      recommendation: 'Upgrade Apache HTTP Server to version 2.4.59 or later immediately. Apply virtual patching via WAF rules.',
      remediation: 'Update Apache HTTP Server to 2.4.59+',
      damage: 'An attacker can gain full remote control of the server, install backdoors, exfiltrate sensitive data, and pivot to internal networks. Estimated financial impact: $150K-$500K per incident.' },
    { id: 'CVE-2026-5678', name: 'MySQL SQL Injection', score: 8.2, severity: 'high', cve: 'CVE-2026-5678',
      description: 'SQL injection in MySQL < 8.0.35 allows authenticated attackers to extract arbitrary data from the database.',
      type: 'SQL Injection',
      recommendation: 'Upgrade MySQL to version 8.0.35 or later. Implement prepared statements and input validation.',
      remediation: 'Upgrade MySQL to 8.0.35+ and use parameterized queries',
      damage: 'Attackers can extract customer credentials, payment data, and business-critical information. Average breach cost: $200K. Regulatory fines under GDPR: up to 4% of global revenue.' },
    { id: 'CVE-2026-7890', name: 'Nginx Path Traversal', score: 5.4, severity: 'medium', cve: 'CVE-2026-7890',
      description: 'Path traversal in Nginx < 1.24 allows attackers to read arbitrary files on the server.',
      type: 'Path Traversal',
      recommendation: 'Upgrade Nginx to version 1.24 or later. Restrict file system access permissions.',
      remediation: 'Update Nginx to 1.24+ with proper access controls',
      damage: 'Exposes sensitive configuration files, source code, and credentials. Can lead to full system compromise when combined with other vulnerabilities. Remediation cost: $20K-$50K.' },
    { id: 'CVE-2026-4321', name: 'Redis Zero-Day RCE', score: 9.1, severity: 'critical', cve: 'CVE-2026-4321',
      description: 'Critical zero-day in Redis < 7.2.4 allows unauthenticated remote code execution via crafted protocol commands.',
      type: 'Remote Code Execution',
      recommendation: 'Immediately upgrade Redis to version 7.2.4 or later. Restrict network access to Redis instances.',
      remediation: 'Upgrade Redis to 7.2.4+ with network ACLs',
      damage: 'Complete server takeover. Attackers can encrypt Redis data for ransom, exfiltrate cached session data containing user tokens. Average ransomware demand: $300K. Downtime cost: $50K/hour.' },
    { id: 'CVE-2026-8765', name: 'Node.js Information Leak', score: 4.3, severity: 'medium', cve: 'CVE-2026-8765',
      description: 'Information leak in Node.js 20.x allows attackers to obtain sensitive server environment details via error handling.',
      type: 'Information Disclosure',
      recommendation: 'Upgrade Node.js to version 20.12 or later. Disable detailed error messages in production.',
      remediation: 'Update Node.js to 20.12+ and configure error handling',
      damage: 'Exposes environment variables, API keys, and internal architecture details. Can be used to craft targeted attacks. Compliance violation under PCI DSS section 6.5.' },
    { id: 'CVE-2026-2233', name: 'OpenSSL Heartbleed Variant', score: 7.8, severity: 'high', cve: 'CVE-2026-2233',
      description: 'Memory leak in OpenSSL 3.x allows attackers to read sensitive data from server memory including private keys.',
      type: 'Memory Leak',
      recommendation: 'Upgrade OpenSSL to version 3.2.1 or later. Rotate all TLS certificates immediately.',
      remediation: 'Update OpenSSL to 3.2.1+ and rotate certificates',
      damage: 'Private keys, passwords, and sensitive data leaked from memory. Attacker can decrypt all past and future TLS traffic. Certificate revocation cost: $5K-$15K. Reputational damage: severe.' },
    { id: 'CVE-2026-4455', name: 'PHP Deserialization RCE', score: 8.8, severity: 'high', cve: 'CVE-2026-4455',
      description: 'Remote code execution via unserialize() in PHP < 8.3.1 allows untrusted data to execute arbitrary code.',
      type: 'Deserialization Attack',
      recommendation: 'Upgrade PHP to version 8.3.1 or later. Avoid unserializing untrusted user input.',
      remediation: 'Update PHP to 8.3.1+ with input validation',
      damage: 'Full server compromise. Attackers can deploy web shells, modify application code, and steal database contents. Recovery cost: $100K-$250K.' },
    { id: 'CVE-2026-6677', name: 'Python Pickle Deserialization', score: 7.5, severity: 'high', cve: 'CVE-2026-6677',
      description: 'Insecure deserialization in Python applications using pickle.loads() on untrusted data allows arbitrary code execution.',
      type: 'Insecure Deserialization',
      recommendation: 'Replace pickle with safe serialization formats (JSON). Validate all serialized data sources.',
      remediation: 'Replace pickle with JSON serialization',
      damage: 'Attackers can execute arbitrary Python code on the server, access databases, and manipulate application state. Average incident response cost: $75K.' },
    { id: 'CVE-2026-3344', name: 'Linux Kernel Privilege Escalation', score: 7.0, severity: 'high', cve: 'CVE-2026-3344',
      description: 'Local privilege escalation in Linux kernel < 6.6.8 allows authenticated users to gain root access.',
      type: 'Privilege Escalation',
      recommendation: 'Apply latest Linux kernel security patches. Restrict user shell access and implement least privilege.',
      remediation: 'Update Linux kernel to 6.6.8+ with minimal privileges',
      damage: 'Unauthorized root access to the server. Attackers can install kernel rootkits, hide malicious activity, and maintain persistent access. System rebuild cost: $30K-$60K.' }
  ],
  ecommerce: [
    { id: 'CVE-2026-9911', name: 'WooCommerce Payment Bypass', score: 9.4, severity: 'critical', cve: 'CVE-2026-9911',
      description: 'Payment bypass vulnerability in WooCommerce < 8.6.0 allows attackers to complete orders without payment.',
      type: 'Payment Bypass',
      recommendation: 'Upgrade WooCommerce to version 8.6.0 or later. Implement server-side payment validation.',
      remediation: 'Update WooCommerce to 8.6.0+',
      damage: 'Direct revenue loss from fraudulent orders. Customer trust erosion. PCI DSS compliance violation with fines up to $500K/month.' },
    { id: 'CVE-2026-9922', name: 'Magento SQL Injection', score: 9.1, severity: 'critical', cve: 'CVE-2026-9922',
      description: 'SQL injection in Magento < 2.4.7 allows unauthenticated attackers to extract customer payment data.',
      type: 'SQL Injection',
      recommendation: 'Upgrade Magento to version 2.4.7 or later. Implement WAF rules for SQL injection detection.',
      remediation: 'Update Magento to 2.4.7+ with WAF',
      damage: 'Massive customer data breach including credit card numbers and personal information. Average cost per stolen record: $180. Class-action lawsuit exposure: $5M-$20M.' },
    { id: 'CVE-2026-9933', name: 'Stripe API Key Exposure', score: 7.8, severity: 'high', cve: 'CVE-2026-9933',
      description: 'Stripe API keys exposed via client-side JavaScript in e-commerce checkout pages.',
      type: 'API Key Exposure',
      recommendation: 'Remove API keys from client-side code. Use server-side payment intents API instead.',
      remediation: 'Move payment processing to server-side',
      damage: 'Attackers can make unauthorized charges, refund orders, and access customer payment methods. Fraudulent transactions: $50K-$200K. Stripe account suspension possible.' }
  ],
  admin: [
    { id: 'CVE-2026-8811', name: 'Admin Authentication Bypass', score: 9.6, severity: 'critical', cve: 'CVE-2026-8811',
      description: 'Authentication bypass in admin panels allows unauthenticated attackers to access administrative interfaces.',
      type: 'Authentication Bypass',
      recommendation: 'Implement multi-factor authentication. Restrict admin access by IP whitelist. Review authentication logic.',
      remediation: 'Enable MFA and IP whitelisting',
      damage: 'Complete administrative control of the application. Attackers can delete data, create admin accounts, and lock out legitimate administrators. Data destruction cost: $500K-$2M.' },
    { id: 'CVE-2026-8822', name: 'CSRF in Admin Actions', score: 6.8, severity: 'medium', cve: 'CVE-2026-8822',
      description: 'Cross-Site Request Forgery in admin panel allows attackers to perform actions on behalf of authenticated admins.',
      type: 'CSRF',
      recommendation: 'Implement anti-CSRF tokens for all admin actions. Use SameSite cookies.',
      remediation: 'Add CSRF tokens to all admin forms',
      damage: 'Attackers can modify system configurations, create unauthorized users, and exfiltrate data without admin knowledge.' }
  ],
  api: [
    { id: 'CVE-2026-7711', name: 'GraphQL Injection', score: 8.5, severity: 'high', cve: 'CVE-2026-7711',
      description: 'GraphQL injection vulnerability allows attackers to execute arbitrary queries and access unauthorized data.',
      type: 'GraphQL Injection',
      recommendation: 'Implement query depth limiting, rate limiting, and authentication for all GraphQL endpoints.',
      remediation: 'Add query depth limits and authentication',
      damage: 'Data exfiltration of entire database through GraphQL introspection. Attackers can query user data, API keys, and internal records. Data breach cost: $150K-$400K.' },
    { id: 'CVE-2026-7722', name: 'REST API Rate Limit Bypass', score: 5.6, severity: 'medium', cve: 'CVE-2026-7722',
      description: 'Rate limiting bypass in REST API allows attackers to perform brute-force attacks on authentication endpoints.',
      type: 'Brute Force',
      recommendation: 'Implement IP-based rate limiting with exponential backoff. Use CAPTCHA for repeated attempts.',
      remediation: 'Add IP-based rate limiting and CAPTCHA',
      damage: 'Account takeover through credential stuffing. Customer accounts compromised. Average account recovery cost: $25 per compromised user.' },
    { id: 'CVE-2026-7733', name: 'JWT Token Weakness', score: 7.2, severity: 'high', cve: 'CVE-2026-7733',
      description: 'Weak JWT signing algorithm allows attackers to forge authentication tokens and impersonate any user.',
      type: 'Authentication Bypass',
      recommendation: 'Use RS256 instead of HS256. Implement short token expiry. Rotate signing keys regularly.',
      remediation: 'Switch to RS256 with short expiry tokens',
      damage: 'Complete account takeover of all users. Attackers can impersonate admins and perform unauthorized actions. Regulatory notification costs: $100K-$500K.' }
  ],
  cms: [
    { id: 'CVE-2026-6611', name: 'WordPress XSS', score: 6.1, severity: 'medium', cve: 'CVE-2026-6611',
      description: 'Stored XSS in WordPress core < 6.4 allows attackers to inject malicious scripts that execute when admins view comments.',
      type: 'Cross-Site Scripting (XSS)',
      recommendation: 'Upgrade WordPress to version 6.4 or later. Use a Web Application Firewall (WAF).',
      remediation: 'Update WordPress to 6.4+ with WAF',
      damage: 'Attackers can steal admin session cookies, deface the website, and inject malicious redirects to phishing pages. SEO degradation and blacklisting cost: $50K-$100K in lost revenue.' },
    { id: 'CVE-2026-6622', name: 'WordPress Plugin RCE', score: 8.8, severity: 'high', cve: 'CVE-2026-6622',
      description: 'Remote code execution in popular WordPress plugin (Yoast SEO < 21.5) allows unauthenticated file upload.',
      type: 'Remote Code Execution',
      recommendation: 'Update all WordPress plugins to latest versions. Remove unused plugins.',
      remediation: 'Update plugins and remove unused ones',
      damage: 'Server compromise through malicious plugin upload. Website defacement, malware distribution to visitors. Blacklist recovery cost: $15K-$40K.' },
    { id: 'CVE-2026-6633', name: 'WordPress User Enumeration', score: 4.2, severity: 'low', cve: 'CVE-2026-6633',
      description: 'User enumeration in WordPress REST API allows attackers to discover valid usernames for targeted attacks.',
      type: 'User Enumeration',
      recommendation: 'Disable REST API user endpoints. Use security plugin to block user enumeration.',
      remediation: 'Block REST API user discovery endpoints',
      damage: 'Enables targeted brute-force attacks and social engineering. Accelerates account takeover attempts.' }
  ],
  app: [
    { id: 'CVE-2026-5511', name: 'Session Fixation', score: 7.1, severity: 'high', cve: 'CVE-2026-5511',
      description: 'Session fixation vulnerability allows attackers to hijack user sessions by pre-setting session identifiers.',
      type: 'Session Hijacking',
      recommendation: 'Regenerate session IDs after login. Use secure, HttpOnly cookies with SameSite=Strict.',
      remediation: 'Regenerate session on login with secure cookies',
      damage: 'Account takeover without credentials. Attackers can access user data, perform actions as the victim, and escalate privileges.' },
    { id: 'CVE-2026-5522', name: 'OAuth Token Theft', score: 8.3, severity: 'high', cve: 'CVE-2026-5522',
      description: 'OAuth token leakage through referrer headers allows attackers to steal authentication tokens.',
      type: 'Token Theft',
      recommendation: 'Use state parameters in OAuth flow. Implement PKCE. Validate redirect URIs strictly.',
      remediation: 'Implement PKCE and validate redirect URIs',
      damage: 'Third-party account compromise through OAuth token theft. Access to connected services and APIs. Average incident cost: $120K.' }
  ],
  dev: [
    { id: 'CVE-2026-4411', name: '.env File Exposure', score: 8.0, severity: 'high', cve: 'CVE-2026-4411',
      description: '.env configuration file exposed through misconfigured web server allows access to environment variables containing credentials.',
      type: 'Sensitive Data Exposure',
      recommendation: 'Block access to .env files in web server configuration. Store secrets in a vault service.',
      remediation: 'Block .env access and use a vault service',
      damage: 'Direct exposure of database passwords, API keys, and secret tokens. Full infrastructure compromise possible. Rotation of all secrets: $30K-$80K.' },
    { id: 'CVE-2026-4422', name: 'Git Metadata Exposure', score: 6.5, severity: 'medium', cve: 'CVE-2026-4422',
      description: '.git directory exposed on production server allows attackers to download the full source code and commit history.',
      type: 'Source Code Disclosure',
      recommendation: 'Block access to .git directories. Remove .git from production deployments.',
      remediation: 'Block .git access and strip from deployments',
      damage: 'Source code theft reveals business logic, API endpoints, and hardcoded secrets. Competitors can clone proprietary algorithms. IP theft cost: $200K-$1M+' }
  ]
};

// Select CVEs for a URL based on tech stack and hash
function selectCVEsForUrl(websiteUrl) {
  const hash = simpleHash(websiteUrl);
  const tech = inferTechStack(websiteUrl);
  
  const selected = [];
  const usedIndices = new Set();
  
  // Always include 2-4 generic CVEs that apply to every site
  const genericCount = 2 + (hash % 3); // 2-4
  for (let i = 0; i < genericCount; i++) {
    const idx = (hash + i * 7) % CVE_CATALOG.generic.length;
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      selected.push({ ...CVE_CATALOG.generic[idx], status: 'open' });
    }
  }
  
  // Include 1-2 tech-specific CVEs if applicable
  const techCVEs = CVE_CATALOG[tech];
  if (techCVEs) {
    const techCount = 1 + (hash % 2); // 1-2
    for (let i = 0; i < techCount; i++) {
      const idx = (hash * 3 + i * 5) % techCVEs.length;
      selected.push({ ...techCVEs[idx], status: i === 0 ? 'open' : (idx % 2 === 0 ? 'open' : 'resolved') });
    }
  }
  
  return selected;
}

// Generate scan findings object for a website URL
function generateFindings(websiteUrl) {
  const hash = simpleHash(websiteUrl);
  const selectedCVEs = selectCVEsForUrl(websiteUrl);
  const vulnCount = selectedCVEs.length;
  
  // Compute overall score inversely based on vulnerabilities
  const criticalCount = selectedCVEs.filter(v => v.severity === 'critical').length;
  const highCount = selectedCVEs.filter(v => v.severity === 'high').length;
  const mediumCount = selectedCVEs.filter(v => v.severity === 'medium').length;
  const lowCount = selectedCVEs.filter(v => v.severity === 'low').length;
  const overallScore = Math.max(15, Math.min(98, 95 - criticalCount * 15 - highCount * 8 - mediumCount * 4 - lowCount * 2));

  return {
    overallScore,
    securityHeaders: {
      passed: 2 + (hash % 6),
      total: 7,
      details: {
        StrictTransportSecurity: hash % 2 === 0,
        XFrameOptions: hash % 3 !== 0,
        XContentTypeOptions: hash % 4 !== 0,
        ContentSecurityPolicy: hash % 5 !== 0,
        XXssProtection: hash % 2 === 0,
        ReferrerPolicy: hash % 3 === 0,
        PermissionsPolicy: hash % 4 === 0
      }
    },
    vulnerabilities: {
      vulnerabilitiesFound: vulnCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      vulnerabilities: selectedCVEs.map(v => ({
        type: `[${v.cve}] ${v.name}`,
        recommendation: `${v.remediation}. Potential damage: ${v.damage}`
      })),
      recommendations: [
        ...(criticalCount > 0 ? ['Apply critical patches immediately -- prioritize vulnerabilities with CVSS > 9.0 as they pose immediate risk of remote code execution.'] : []),
        ...(highCount > 0 ? ['Schedule high-priority updates within 7 days. Implement virtual patching via WAF for vulnerabilities that cannot be patched immediately.'] : []),
        'Enable automatic security updates where possible to reduce window of exposure.',
        'Conduct a comprehensive vulnerability scan monthly to identify new threats.',
        'Implement a Web Application Firewall (WAF) as a compensating control for unpatched vulnerabilities.',
        'Review and rotate all secrets, API keys, and certificates that may have been exposed.'
      ]
    },
    malware: {
      clean: hash % 5 !== 0,
      status: hash % 5 === 0 ? 'Suspicious patterns detected' : 'Clean -- no malicious signatures found',
      riskScore: hash % 5 === 0 ? 45 + (hash % 40) : (hash % 15),
      threats: hash % 5 === 0 ? [
        { type: 'PHP Web Shell', platform: 'Linux/Apache' },
        { type: 'Obfuscated JavaScript', platform: 'Cross-platform' }
      ] : [],
      suspiciousPatterns: hash % 5 === 0 ? ['base64_decode() in wp-config.php', 'eval() in theme functions.php', 'system() call in uploads directory'] : []
    }
  };
}

// Generate SSL/TLS status for a website URL
function generateSSLStatus(websiteUrl) {
  const hash = simpleHash(websiteUrl);
  const grades = ['A+', 'A', 'A', 'B', 'C'];
  const protocols = ['TLS 1.3', 'TLS 1.2', 'TLS 1.3', 'TLS 1.3', 'TLS 1.2'];
  const valid = hash % 5 !== 0;
  return {
    valid,
    grade: grades[hash % 5],
    daysRemaining: valid ? (15 + (hash % 75)) : 0,
    protocol: protocols[hash % 5],
    issuer: hash % 3 === 0 ? "Let's Encrypt" : hash % 3 === 1 ? 'Cloudflare' : 'DigiCert',
    subject: new URL(websiteUrl).hostname,
    sans: [`*.${new URL(websiteUrl).hostname}`, new URL(websiteUrl).hostname]
  };
}

// Generate impact analysis for findings
function generateImpactAnalysis(websiteUrl, findings) {
  const hash = simpleHash(websiteUrl);
  const vulns = findings.vulnerabilities;
  const criticalCount = vulns.criticalCount || 0;
  const highCount = vulns.highCount || 0;
  const mediumCount = vulns.mediumCount || 0;

  // Financial impact scales with severity
  const baseLoss = 50000 + (hash % 200000);
  const annualLoss = baseLoss + criticalCount * 150000 + highCount * 50000 + mediumCount * 15000;
  const breachCostAvg = 180000 + criticalCount * 200000 + highCount * 60000;
  const remediationEst = 25000 + criticalCount * 40000 + highCount * 15000 + mediumCount * 5000;
  
  const riskExposure = Math.min(95, 20 + criticalCount * 15 + highCount * 8 + mediumCount * 4);

  // Determine grade based on risk
  let grade = 'A';
  if (criticalCount > 1) grade = 'F';
  else if (criticalCount === 1) grade = 'D';
  else if (highCount > 2) grade = 'C';
  else if (highCount > 0) grade = 'B';
  
  return {
    overallRiskExposure: riskExposure,
    summary: {
      grade,
      overallScore: findings.overallScore,
      keyFindings: [
        `Identified ${vulns.vulnerabilitiesFound} vulnerabilities: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${vulns.lowCount || 0} low.`,
        `The most severe vulnerability (${vulns.vulnerabilities[0]?.type || 'N/A'}) has a CVSS score that allows unauthenticated remote exploitation.`,
        `Estimated annual financial exposure: $${annualLoss.toLocaleString()}.`,
        `Compliance impact: ${criticalCount > 0 ? 'Non-compliant with PCI DSS, SOC 2, and ISO 27001 requirements for critical vulnerability remediation.' : 'Partially compliant -- remediation required to maintain compliance status.'}`
      ],
      recommendedAction: criticalCount > 0
        ? 'IMMEDIATE ACTION REQUIRED: Prioritize patching critical vulnerabilities within 24 hours. Engage incident response team if evidence of active exploitation exists.'
        : 'Schedule remediation within 30 days. Focus on high-severity vulnerabilities first. Update security policies and conduct employee security awareness training.'
    },
    financialImpact: {
      estimatedAnnualLoss: annualLoss,
      breachCost: { average: breachCostAvg, minimum: Math.floor(breachCostAvg * 0.4), maximum: Math.ceil(breachCostAvg * 2.5) },
      remediationCost: { estimated: remediationEst, minimum: Math.floor(remediationEst * 0.6), maximum: Math.ceil(remediationEst * 1.8) },
      regulatoryFines: criticalCount > 0 ? { gdpr: Math.ceil(annualLoss * 0.04), pci: 500000 } : { gdpr: 0, pci: 0 }
    },
    operationalImpact: {
      overallOperationalRisk: criticalCount > 1 ? 'Critical' : criticalCount === 1 ? 'High' : 'Medium',
      specificImpacts: [
        {
          area: 'Service Availability',
          description: `${criticalCount > 0 ? 'Critical vulnerabilities could lead to service disruption through RCE exploitation. Estimated downtime: 4-24 hours.' : 'Medium-severity vulnerabilities may cause intermittent service degradation during exploitation attempts.'}`,
          impact: criticalCount > 0 ? 'Critical' : 'Medium',
          affectedTeams: ['DevOps', 'Security', 'Engineering']
        },
        {
          area: 'Data Integrity',
          description: `${criticalCount > 0 ? 'Database compromise through SQL injection could corrupt critical business data. Full recovery requires backups and forensic analysis.' : 'Limited data integrity risk from information disclosure vulnerabilities.'}`,
          impact: highCount > 0 ? 'High' : 'Low',
          affectedTeams: ['Database Administration', 'Security']
        },
        {
          area: 'Incident Response',
          description: `Security team requires ${criticalCount * 8 + highCount * 4 + mediumCount * 2} hours to investigate and remediate all identified vulnerabilities.`,
          impact: criticalCount > 0 ? 'High' : 'Medium',
          affectedTeams: ['Security Operations', 'IT Support']
        }
      ]
    },
    reputationalRisk: {
      riskLevel: criticalCount > 0 ? 'Critical' : highCount > 1 ? 'High' : 'Moderate',
      factors: [
        {
          factor: 'Customer Trust Erosion',
          detail: `Security breach could result in ${criticalCount > 0 ? '30-50%' : '10-20%'} customer churn and negative media coverage.`,
          severity: criticalCount > 0 ? 'High' : 'Medium'
        },
        {
          factor: 'Brand Value Impact',
          detail: `Public disclosure of vulnerabilities could reduce brand value by an estimated ${criticalCount * 12 + highCount * 5}% in the following quarter.`,
          severity: highCount > 0 ? 'High' : 'Medium'
        },
        {
          factor: 'Partner/Investor Confidence',
          detail: 'Enterprise customers and partners may require security audits and contractual guarantees before continuing business relationships.',
          severity: criticalCount > 0 ? 'High' : 'Low'
        }
      ]
    },
    prioritizedRisks: (() => {
      const risks = [
        {
          category: 'Remote Code Execution',
          risk: 'Unauthenticated attackers can execute arbitrary code on the server, leading to full system compromise.',
          businessImpact: 'Complete loss of confidentiality, integrity, and availability. Potential ransomware deployment.',
          likelihood: 'High',
          impact: 'Critical',
          mitigationCost: '$40K-$80K',
          mitigationTimeframe: '24-48 hours',
          riskScore: criticalCount > 0 ? 95 : 75,
          mitigation: criticalCount > 0 ? 'Apply critical patches immediately. Isolate affected systems. Deploy WAF with virtual patching.' : 'Schedule patching within 7 days. Monitor for exploitation attempts.'
        },
        {
          category: 'Data Breach / SQL Injection',
          risk: 'Attackers can extract sensitive customer and business data from the database.',
          businessImpact: 'Regulatory fines, legal liability, customer notification costs, and reputational damage.',
          likelihood: criticalCount > 0 ? 'High' : 'Medium',
          impact: 'Critical',
          mitigationCost: '$25K-$60K',
          mitigationTimeframe: '1-2 weeks',
          riskScore: highCount > 0 ? 82 : 55,
          mitigation: 'Implement parameterized queries, input validation, and database activity monitoring. Conduct code review.'
        },
        {
          category: 'Supply Chain / Dependency Risk',
          risk: 'Vulnerabilities in third-party dependencies and libraries could be exploited.',
          businessImpact: 'Cascading failures across dependent systems and services.',
          likelihood: 'Medium',
          impact: 'High',
          mitigationCost: '$15K-$30K',
          mitigationTimeframe: '2-4 weeks',
          riskScore: 60,
          mitigation: 'Implement Software Bill of Materials (SBOM). Automate dependency scanning. Pin dependency versions.'
        }
      ];
      if (vulns.vulnerabilities.length > 5) {
        risks.push({
          category: 'Compliance Violation',
          risk: 'Multiple unpatched vulnerabilities violate PCI DSS, SOC 2, and ISO 27001 compliance requirements.',
          businessImpact: 'Loss of compliance certification, contract termination, regulatory fines.',
          likelihood: 'High',
          impact: 'High',
          mitigationCost: '$50K-$100K',
          mitigationTimeframe: '1-3 months',
          riskScore: 70,
          mitigation: 'Engage compliance team. Document remediation plan. Implement compensating controls.'
        });
      }
      return risks;
    })(),
    recommendations: [
      {
        priority: criticalCount > 0 ? 'Critical' : highCount > 1 ? 'High' : 'Medium',
        category: 'Patch Management',
        action: `${criticalCount > 0 ? 'Immediately patch all critical vulnerabilities. ' : 'Schedule regular patch cycles. '}Establish a vulnerability management program with defined SLAs for remediation timelines.`,
        impact: 'Reduces attack surface by 70-85% and prevents exploitation of known vulnerabilities.',
        effort: criticalCount > 0 ? 'High (24-48 hours)' : 'Medium (1-2 weeks)',
        timeline: criticalCount > 0 ? '24 hours' : '30 days'
      },
      {
        priority: highCount > 0 ? 'High' : 'Medium',
        category: 'Security Hardening',
        action: 'Implement security headers (CSP, HSTS, X-Frame-Options), enable TLS 1.3 only, and disable unnecessary services and ports.',
        impact: 'Prevents XSS, clickjacking, and protocol downgrade attacks. Improves security posture rating.',
        effort: 'Low (2-3 days)',
        timeline: '7 days'
      },
      {
        priority: 'Medium',
        category: 'Monitoring & Detection',
        action: 'Deploy intrusion detection system (IDS), enable audit logging, implement SIEM integration, and set up real-time alerting for suspicious activities.',
        impact: 'Reduces mean time to detection (MTTD) from weeks to hours. Enables rapid incident response.',
        effort: 'Medium (1-2 weeks)',
        timeline: '30 days'
      },
      {
        priority: criticalCount > 0 ? 'High' : 'Medium',
        category: 'Access Control',
        action: 'Implement least privilege access, enable multi-factor authentication for all admin accounts, and review user permissions quarterly.',
        impact: 'Limits blast radius of potential breaches. Prevents privilege escalation attacks.',
        effort: 'Medium (1 week)',
        timeline: '14 days'
      },
      {
        priority: 'Low',
        category: 'Training & Awareness',
        action: 'Conduct security awareness training for all employees. Implement secure coding training for developers.',
        impact: 'Reduces human-error related incidents by 40-60%. Builds security-first culture.',
        effort: 'Low (ongoing)',
        timeline: '60 days'
      }
    ],
    complianceImpact: {
      overallComplianceRisk: criticalCount > 1 
        ? 'High -- Multiple critical vulnerabilities indicate systemic security failures requiring immediate remediation.'
        : criticalCount === 1
          ? 'Elevated -- Critical vulnerability found. Compliance status at risk for PCI DSS and SOC 2.'
          : 'Moderate -- No critical vulnerabilities found. Continue regular patching and monitoring.',
      frameworks: [
        {
          name: 'PCI DSS v4.0',
          relevance: 'Applies if website processes, stores, or transmits credit card data',
          requirements: [
            `Requirement 6.2: Ensure all system components and software are protected from known vulnerabilities (${criticalCount + highCount} violations)`,
            `Requirement 6.5: Address common coding vulnerabilities (${vulns.vulnerabilitiesFound} findings)`,
            'Requirement 11.2: Run internal and external scans at least quarterly'
          ],
          potentialFines: criticalCount > 0 ? 'Up to $500,000/month until compliance is achieved' : 'N/A'
        },
        {
          name: 'SOC 2 Type II',
          relevance: 'Relevant for service organizations handling customer data',
          requirements: [
            'CC6.1: Logical and physical access controls',
            `CC7.1: Monitoring of system components (${criticalCount > 0 ? 'failed' : 'needs improvement'})`,
            'CC7.2: System monitoring and incident response'
          ],
          potentialFines: criticalCount > 0 ? 'Loss of certification -- potential contract value loss of $500K-$2M' : 'N/A'
        },
        {
          name: 'ISO 27001:2022',
          relevance: 'International standard for information security management',
          requirements: [
            'A.8.8: Management of technical vulnerabilities',
            'A.8.25: Secure development lifecycle',
            'A.8.16: Monitoring and review activities'
          ],
          potentialFines: highCount > 0 ? 'Non-conformities may affect certification audit' : 'N/A'
        }
      ]
    }
  };
}

// Generate the complete scan report for a website URL
export function generateScanReport(websiteUrl) {
  const findings = generateFindings(websiteUrl);
  const sslStatus = generateSSLStatus(websiteUrl);
  const impactAnalysis = generateImpactAnalysis(websiteUrl, findings);
  
  // Determine overall severity
  const criticalCount = findings.vulnerabilities.criticalCount || 0;
  const highCount = findings.vulnerabilities.highCount || 0;
  const severity = criticalCount > 0 ? 'critical' : highCount > 1 ? 'high' : highCount === 1 ? 'medium' : 'low';
  
  return {
    findings: JSON.stringify(findings),
    ssl_status: JSON.stringify(sslStatus),
    impact_analysis: JSON.stringify(impactAnalysis),
    severity,
    vulnerabilitiesFound: findings.vulnerabilities.vulnerabilitiesFound,
    score: findings.overallScore,
    summary: `Found ${findings.vulnerabilities.vulnerabilitiesFound} vulnerabilities: ${findings.vulnerabilities.criticalCount} critical, ${findings.vulnerabilities.highCount} high, ${findings.vulnerabilities.mediumCount} medium, ${findings.vulnerabilities.lowCount || 0} low`,
    vulnerabilities: selectCVEsForUrl(websiteUrl)
  };
}

// ── Scans ─────────────────────────────────────────────────────
export const mockScans = (page = 1, limit = 10, currentUser = null) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  // Get active scans from persistent store -- no random/garbage generation
  const allScans = MockStore.getAllScans();

  // Sort by created_at descending
  allScans.sort((a, b) => new Date(b.created_at || b.startedAt) - new Date(a.created_at || a.startedAt));

  // Filter by user if not admin
  const filtered = isAdmin ? allScans : allScans.filter(s => s.user_id === currentUser?.id);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageScans = filtered.slice(start, start + limit);

  return { scans: pageScans, total, page, limit, totalPages: Math.ceil(total / limit), isAdminView: isAdmin };
};

// Lookup a scan from the persistent store by ID
const findScanById = (scanId) => {
  const all = MockStore.getAllScans();
  const deleted = MockStore.getDeletedScans();
  return all.find(s => s.id === scanId) || deleted.find(s => s.id === scanId);
};

export const mockScanDetail = (scanId, currentUser = null) => {
  // Look up scan data from persistent store
  const existingScan = findScanById(scanId);
  
  const websiteUrl = existingScan?.website_url || existingScan?.target || 'https://example.com';
  const createdAt = existingScan?.created_at || new Date().toISOString();
  const userId = existingScan?.user_id || currentUser?.id || 'demo-user-001';
  const userEmail = existingScan?.user_email || currentUser?.email || 'demo@kavachiq.com';
  const userName = existingScan?.user_name || currentUser?.username || 'demouser';

  // If the scan already has stored report data (findings, ssl_status, impact_analysis),
  // use that instead of generating fresh. This preserves the exact report from creation time.
  if (existingScan?.findings) {
    return {
      id: scanId,
      type: existingScan.type || 'Full Vulnerability Scan',
      target: websiteUrl,
      website_url: websiteUrl,
      created_at: createdAt,
      status: existingScan.status || 'completed',
      severity: existingScan.severity || 'medium',
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      findings: existingScan.findings,
      ssl_status: existingScan.ssl_status,
      impact_analysis: existingScan.impact_analysis,
      vulnerabilitiesFound: existingScan.vulnerabilitiesFound || 0,
      score: existingScan.score || 50,
      summary: existingScan.summary || 'Scan completed.',
      vulnerabilities: existingScan.vulnerabilities || []
    };
  }

  // No stored report -- generate one based on the website URL
  const report = generateScanReport(websiteUrl);
  
  return {
    id: scanId,
    type: existingScan?.type || 'Full Vulnerability Scan',
    target: websiteUrl,
    website_url: websiteUrl,
    created_at: createdAt,
    status: existingScan?.status || 'completed',
    severity: report.severity,
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    ...report
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

// ── Dashboard Threats (Threat Intelligence Feed) ──────────────
// Deterministic, rich threat intelligence data — no Math.random().
// Each threat has CVE mapping, MITRE ATT&CK, IoCs, mitigation, impact, and more.

const THREAT_CATALOG = [
  {
    id: 'threat-1', name: 'Apache Log4j RCE Exploitation Campaign',
    type: 'Remote Code Execution', severity: 'critical', status: 'active',
    source: 'NVD', cve: 'CVE-2026-1234', mitre_id: 'T1190', score: 94,
    ip: '185.220.101.34', target: 'web-server-01.prod', attack_vector: 'Network',
    affected_products: 'Apache HTTP Server 2.4.x, Tomcat 9.x',
    description: 'Mass exploitation campaign targeting unpatched Apache HTTP Server instances. Attackers are scanning for vulnerable endpoints and deploying crypto miners.',
    longDescription: 'A widespread exploitation campaign is leveraging CVE-2026-1234 to compromise Apache HTTP Server instances globally. The attack begins with automated scanning for vulnerable endpoints, followed by remote code execution payload delivery. Once compromised, attackers deploy cryptocurrency miners, establish persistence via cron jobs, and exfiltrate AWS credentials from environment variables. Multiple ransomware groups have been observed using this as an initial access vector.',
    mitigation: 'Immediately upgrade Apache HTTP Server to 2.4.59+. Deploy WAF rules to block exploit attempts. Scan all systems for signs of compromise using the provided IoCs. Isolate affected servers and rotate all credentials stored on compromised hosts.',
    impact: 'Full server compromise, data exfiltration, cryptominer deployment, and potential ransomware deployment. Average incident cost: $350K-$800K per compromised host.',
    iocs: [
      '185.220.101.34', '185.220.101.35', '89.248.165.58',
      '/tmp/java_updater.sh', '/var/log/httpd/error_log.1.gz',
      'crypto.mining.pool:8443', 'c2.apache-exploit.net',
      'MD5: a3f5b8c1d2e4f67890abcdef12345678'
    ],
    timestamp: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'threat-2', name: 'Redis Ransomware Deployment',
    type: 'Ransomware', severity: 'critical', status: 'active',
    source: 'AlienVault OTX', cve: 'CVE-2026-4321', mitre_id: 'T1486', score: 97,
    ip: '192.168.1.200', target: 'redis-cache-02.prod', attack_vector: 'Network',
    affected_products: 'Redis < 7.2.4, Redis Stack < 7.2.4',
    description: 'Active ransomware campaign targeting exposed Redis instances via zero-day RCE. Data being encrypted and held for ransom.',
    longDescription: 'A sophisticated ransomware group is exploiting CVE-2026-4321 to gain remote code execution on unpatched Redis instances. The attack vector involves scanning for Redis servers accessible over the network, then exploiting the protocol command vulnerability to inject arbitrary code. The ransomware encrypts all keyspace data and any mounted filesystems, then demands payment in Monero. Initial reports indicate over 2,000 Redis instances have been compromised in the past 72 hours.',
    mitigation: 'Disable network access to Redis instances immediately. Upgrade to Redis 7.2.4+. Restore from clean backups. Do NOT pay the ransom — there is no evidence that data will be decrypted.',
    impact: 'Complete data loss from encrypted Redis databases. Average demand: $300K in Monero. Operational downtime: 24-72 hours. Potential data exfiltration prior to encryption.',
    iocs: [
      'redisransom.c2.net:443', 'Monero wallet: 4A6d...8F3k',
      '/tmp/redis_ransomware.so', 'Cron entry: */5 * * * * /tmp/redis_ransomware.so',
      'Port scan pattern: TCP/6379, TCP/6380',
      'YARA rule: redis_ransom_dec2026'
    ],
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'threat-3', name: 'WordPress Mass Defacement Attack',
    type: 'Malware', severity: 'high', status: 'active',
    source: 'Wordfence', cve: 'CVE-2026-6622', mitre_id: 'T1190', score: 85,
    ip: '51.75.145.82', target: 'blog-cms-01.prod', attack_vector: 'Web Application',
    affected_products: 'WordPress < 6.4, Yoast SEO < 21.5',
    description: 'Automated script exploiting vulnerable WordPress plugins to inject defacement pages and SEO spam.',
    longDescription: 'A large-scale automated attack is targeting WordPress sites using CVE-2026-6622 (Yoast SEO RCE) and CVE-2026-6611 (WordPress XSS). Attackers deploy a script that scans for vulnerable versions, auto-exploits the RCE to upload a web shell, then uses the web shell to inject defacement HTML pages, SEO spam links to pharmaceutical websites, and hidden iframes leading to tech support scams. Over 15,000 WordPress sites have been compromised in this campaign.',
    mitigation: 'Update WordPress to 6.4+, update all plugins to latest versions, remove unused plugins, scan for unknown admin users, restore clean files from backup, and implement a WAF.',
    impact: 'Website defacement damaging brand reputation, SEO blacklisting reducing organic traffic by 60-80%, potential malware delivery to site visitors leading to legal liability.',
    iocs: [
      '51.75.145.82', '51.75.145.83', 'wp-content/uploads/2026/06/theme_options.php',
      'Base64 encoded eval() in theme files', '.htaccess redirect to pharma-spam.com',
      'MD5: b8c9d0e1f2a3b4c5d6e7f809a1b2c3d4'
    ],
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'threat-4', name: 'Phishing Kit Targeting Admin Panels',
    type: 'Phishing', severity: 'high', status: 'active',
    source: 'AbuseIPDB', cve: 'CVE-2026-8811', mitre_id: 'T1566', score: 82,
    ip: '194.26.29.71', target: 'admin-panel-01.prod', attack_vector: 'Social Engineering',
    affected_products: 'Custom admin panels, Webmail interfaces',
    description: 'Sophisticated phishing kit mimicking legitimate admin login pages to harvest credentials of security personnel.',
    longDescription: 'A sophisticated phishing-as-a-service operation is targeting enterprise admin portals by deploying convincing replicas of Okta, AWS Console, and custom admin login pages. The phishing kit captures not just username/password but also MFA tokens in real-time through a reverse proxy setup. The operation primarily uses spear-phishing emails pretending to be urgent security alerts or password expiry notifications. The stolen credentials are sold on dark web markets within hours of acquisition.',
    mitigation: 'Enforce MFA with hardware tokens (U2F/FIDO2), implement conditional access policies, block known malicious IPs, conduct phishing simulation training, and enable admin notification for suspicious login attempts.',
    impact: 'Credential theft leading to privilege escalation, data breach, and lateral movement within the organization. Average credential value on dark web: $200-$2,000 for admin accounts.',
    iocs: [
      '194.26.29.71', '194.26.29.72', '194.26.29.80/28',
      'login-secure-portal.com', 'account-verify-okta.com',
      'Certificate fingerprint: 3A:4B:5C:6D:7E:8F:90:1A:2B:3C:4D:5E:6F:70:81:92',
      'Phishing kit hash: c6d7e8f9a0b1c2d3e4f50617283940a5'
    ],
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'threat-5', name: 'DDoS Attack on E-Commerce Platform',
    type: 'DDoS', severity: 'high', status: 'active',
    source: 'Cloudflare', cve: 'CVE-2026-9911', mitre_id: 'T1498', score: 78,
    ip: 'Various (Botnet)', target: 'shop-ecommerce-01.prod', attack_vector: 'Network',
    affected_products: 'WooCommerce < 8.6.0, Magento < 2.4.7',
    description: 'Layer 7 DDoS attack targeting payment endpoints on e-commerce platform. Attack volume: 500K requests/second.',
    longDescription: 'A sustained Layer 7 DDoS attack is targeting the checkout and payment processing endpoints of a major e-commerce platform. The attack uses a botnet of approximately 50,000 compromised IoT devices and residential proxies. The goal appears to be financial disruption — targeting the payment gateway to cause transaction failures and revenue loss. The attack also attempts to exploit CVE-2026-9911 (WooCommerce Payment Bypass) during the DDoS window. Attack patterns suggest a hacktivist group protesting the company\'s business practices.',
    mitigation: 'Enable DDoS protection (Cloudflare/Cloudfront), implement rate limiting on payment endpoints, scale up infrastructure, deploy CAPTCHA on checkout flow, and monitor for simultaneous exploitation attempts.',
    impact: 'Revenue loss estimated at $50K-$150K per hour of downtime. Customer trust erosion. Payment data potentially at risk during exploitation attempts.',
    iocs: [
      'Aggregated botnet IPs (50K+)', 'User-agent: Mozilla/5.0 (compatible; Pcore/1.0)',
      'Request pattern: POST /checkout/payment with randomized session IDs',
      'Referrer spoofing: google.com, facebook.com, twitter.com'
    ],
    timestamp: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: 'threat-6', name: 'SSH Brute Force Campaign',
    type: 'Brute Force', severity: 'medium', status: 'active',
    source: 'Fail2ban', cve: 'CVE-2026-3344', mitre_id: 'T1110', score: 65,
    ip: '103.235.46.12', target: 'bastion-host-01.prod', attack_vector: 'Network',
    affected_products: 'Linux kernel < 6.6.8, SSH services',
    description: 'Distributed brute-force attack on SSH services attempting to gain initial access for privilege escalation.',
    longDescription: 'A distributed brute-force campaign is targeting SSH services across multiple organizations. The attack uses credential stuffing with known username/password combinations from previous data breaches. After gaining initial access, the attackers deploy privilege escalation tools to exploit CVE-2026-3344 (Linux Kernel LPE) to gain root access. Once root is obtained, they install persistence mechanisms, including SSH backdoors and rootkits, before moving laterally through the network.',
    mitigation: 'Disable password authentication for SSH, use SSH keys only, implement fail2ban with stricter rules, apply kernel patches, monitor for unusual SSH logins, and implement network segmentation.',
    impact: 'Server compromise leading to data exfiltration, ransomware deployment, or use of compromised server as a pivot point for further attacks.',
    iocs: [
      '103.235.46.12', '103.235.46.0/24', '45.128.232.0/22',
      'Failed auth pattern: root, admin, ubuntu, deployer',
      '/tmp/.ssh-persist', 'Modified authorized_keys file',
      'SSH backdoor on port 2222'
    ],
    timestamp: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'threat-7', name: '.env File Exposure - CI/CD Pipeline Leak',
    type: 'Sensitive Data Exposure', severity: 'high', status: 'investigating',
    source: 'GitHub Advisory', cve: 'CVE-2026-4411', mitre_id: 'T1530', score: 88,
    ip: 'N/A (Public Repository)', target: 'dev-ci-cd-01', attack_vector: 'Web Application',
    affected_products: 'GitHub Actions, self-hosted runners, web servers',
    description: '.env files containing production credentials exposed through misconfigured web server and public GitHub repositories.',
    longDescription: 'A security researcher discovered that multiple organizations have accidentally exposed .env files containing production database credentials, API keys, and cloud service tokens through misconfigured web servers and accidentally public GitHub repositories. The exposed files include AWS Secret Keys, RDS database passwords, Stripe API keys, and SendGrid SMTP credentials. Automated scanners are already indexing these exposures, and several have been observed being used for unauthorized cloud resource access.',
    mitigation: 'Immediately rotate all exposed credentials. Use a secrets vault (AWS Secrets Manager, HashiCorp Vault). Block .env and .git access in web server config. Scan GitHub repos for secrets using secret scanning tools. Implement pre-commit hooks to prevent accidental commits.',
    impact: 'Full cloud infrastructure takeover possible through exposed AWS keys. Data breach through exposed database credentials. Average incident response cost: $80K-$200K.',
    iocs: [
      'github.com/*/repos/*/blob/main/.env',
      'Pattern: AWS_ACCESS_KEY_ID=AKIA*, AWS_SECRET_ACCESS_KEY=',
      'Pattern: DB_PASSWORD=, DB_HOST=rds.amazonaws.com',
      'Pattern: STRIPE_SECRET_KEY=sk_live_*'
    ],
    timestamp: new Date(Date.now() - 18000000).toISOString()
  },
  {
    id: 'threat-8', name: 'GraphQL Data Exfiltration Attempt',
    type: 'Injection', severity: 'high', status: 'investigating',
    source: 'WAF Logs', cve: 'CVE-2026-7711', mitre_id: 'T1190', score: 76,
    ip: '78.128.113.22', target: 'api-gateway-01.prod', attack_vector: 'Web Application',
    affected_products: 'GraphQL servers, Apollo Server < 4.10, Express GraphQL',
    description: 'Advanced GraphQL injection attempt using introspection and batching to extract user data from the database.',
    longDescription: 'A skilled attacker is attempting to exploit GraphQL injection vulnerabilities (CVE-2026-7711) to exfiltrate data through the API gateway. The attack uses a combination of introspection queries to map the entire schema, followed by deeply nested batched queries designed to bypass query cost analysis and extract large volumes of user data. The attacker has rotated through multiple residential proxies to evade IP-based blocking and is systematically testing different query permutations.',
    mitigation: 'Disable GraphQL introspection in production, implement query depth and complexity limits, add rate limiting per client, validate all input parameters, use persisted queries only.',
    impact: 'Complete data exfiltration of user database including PII, authentication tokens, and business data. GDPR fines up to 4% of global revenue.',
    iocs: [
      '78.128.113.22', '78.128.113.0/24',
      'Introspection query pattern: __schema { types { name fields { name type { name } } } }',
      'Deeply nested alias queries (100+ levels)',
      'User-agent: Apollo-Explorer/2.0, graphql-query-generator/1.0'
    ],
    timestamp: new Date(Date.now() - 21600000).toISOString()
  },
  {
    id: 'threat-9', name: 'SQL Injection on Customer Portal',
    type: 'SQL Injection', severity: 'critical', status: 'active',
    source: 'NVD', cve: 'CVE-2026-5678', mitre_id: 'T1190', score: 91,
    ip: '185.130.44.67', target: 'app-customer-portal-01.prod', attack_vector: 'Web Application',
    affected_products: 'MySQL < 8.0.35, Customer Portal v3.2',
    description: 'Automated SQL injection tool targeting customer portal login forms to extract credential hashes and PII.',
    longDescription: 'An automated SQL injection campaign is exploiting CVE-2026-5678 to breach customer portals. The tool tests various injection points including login forms, search boxes, and URL parameters with time-based and error-based SQL injection techniques. Successful exploitation allows attackers to extract the complete user database including password hashes and PII. The campaign uses a rotating IP pool across multiple countries to evade detection.',
    mitigation: 'Upgrade MySQL to 8.0.35+, implement prepared statements/parameterized queries, deploy WAF with SQL injection rules, conduct code review of all database queries, and implement query-level rate limiting.',
    impact: 'Complete customer data breach including PII, hashed passwords, and financial data. Average breach cost for customer data: $200K-$500K. Regulatory fines apply.',
    iocs: [
      '185.130.44.67', '185.130.44.0/24', '91.121.87.0/24',
      'SQL injection patterns in POST form fields',
      'UNION SELECT, SLEEP(5), OR 1=1 payloads',
      'Time-based inference: 5s+ response times on login endpoint'
    ],
    timestamp: new Date(Date.now() - 25200000).toISOString()
  },
  {
    id: 'threat-10', name: 'Stored XSS in User Comments Section',
    type: 'Cross-Site Scripting (XSS)', severity: 'medium', status: 'monitoring',
    source: 'HackerOne', cve: 'CVE-2026-6611', mitre_id: 'T1559', score: 62,
    ip: '23.227.38.32', target: 'blog-cms-02.staging', attack_vector: 'Web Application',
    affected_products: 'WordPress < 6.4, Disqus comments',
    description: 'Stored XSS vulnerability in comments section allows attackers to steal admin sessions and inject malicious redirects.',
    longDescription: 'A security researcher responsibly disclosed a stored XSS vulnerability in the WordPress comments system. The vulnerability allows any authenticated user to inject JavaScript into comments that executes when administrators view the comments moderation panel. The injected script can steal session cookies, perform admin actions on behalf of the victim, or inject malicious redirects to phishing pages. While no active exploitation has been detected, the vulnerability has a CVSS score of 6.1 and should be prioritized for patching.',
    mitigation: 'Update WordPress to 6.4+, implement Content-Security-Policy headers, sanitize all user input, and use output encoding for all user-generated content.',
    impact: 'Admin session theft leading to website defacement, malicious redirects to phishing pages, SEO blacklisting.',
    iocs: [
      'Payload pattern: <script>document.location=</script> in comments',
      'CSP bypass attempts via event handlers',
      'Redirect targets observed: phishing-login-portal.com'
    ],
    timestamp: new Date(Date.now() - 28800000).toISOString()
  },
  {
    id: 'threat-11', name: 'OpenSSL Memory Leak Exploitation',
    type: 'Memory Leak', severity: 'high', status: 'active',
    source: 'CISA', cve: 'CVE-2026-2233', mitre_id: 'T1213', score: 80,
    ip: '89.45.67.123', target: 'api-gateway-02.prod', attack_vector: 'Network',
    affected_products: 'OpenSSL 3.0.0 - 3.2.0',
    description: 'Active exploitation of OpenSSL memory leak vulnerability to extract TLS private keys and session data.',
    longDescription: 'CISA has issued an emergency directive regarding active exploitation of a memory leak vulnerability in OpenSSL 3.x. Attackers are sending specially crafted TLS handshake requests that trigger memory disclosure, leaking up to 64KB of server memory per request. Multiple successful extractions of TLS private keys have been confirmed. Attackers are then using the stolen keys to decrypt recorded traffic and conduct man-in-the-middle attacks against other services on the same infrastructure.',
    mitigation: 'Upgrade OpenSSL to 3.2.1+, revoke and reissue all TLS certificates, enable certificate pinning for critical services, and monitor for unauthorized certificate usage.',
    impact: 'TLS private key theft enabling decryption of all past and future encrypted traffic. Certificate revocation cost: $10K-$30K. Complete loss of transport security.',
    iocs: [
      '89.45.67.123', '89.45.67.0/24',
      'Unusual TLS handshake patterns (ClientHello with oversized extensions)',
      'Certificate transparency log monitoring: unauthorized cert issuance',
      'Memory dump patterns in server logs'
    ],
    timestamp: new Date(Date.now() - 32400000).toISOString()
  },
  {
    id: 'threat-12', name: 'Linux Kernel Privilege Escalation Worm',
    type: 'Privilege Escalation', severity: 'high', status: 'active',
    source: 'MITRE ATT&CK', cve: 'CVE-2026-3344', mitre_id: 'T1068', score: 87,
    ip: 'Self-propagating (worm)', target: 'Various Linux Servers', attack_vector: 'Network',
    affected_products: 'Linux kernel < 6.6.8, Ubuntu 22.04/24.04, CentOS 9',
    description: 'Self-propagating worm exploiting Linux kernel LPE to gain root access and spread across internal networks.',
    longDescription: 'A sophisticated worm is actively exploiting CVE-2026-3344 (Linux Kernel LPE) to gain root access on vulnerable Linux systems. The worm spreads by scanning internal networks for SSH services, then using stolen SSH keys from compromised hosts to authenticate and deploy the exploit. Once root access is obtained, the worm installs a kernel rootkit for persistence, disables SELinux, and continues scanning for new targets. The worm\'s C2 infrastructure uses DNS-over-HTTPS for command communication to evade network monitoring.',
    mitigation: 'Apply latest kernel patches immediately. Restrict SSH key-based authentication. Monitor for kernel module loading alerts. Implement endpoint detection and response (EDR) on critical Linux servers. Use network segmentation to limit lateral movement.',
    impact: 'Widespread Linux server compromise. Rootkit persistence making remediation difficult. Data theft and potential ransomware deployment. Estimated 50,000+ servers compromised globally.',
    iocs: [
      'Kernel module: /lib/modules/6.x.x/kernel/drivers/hid/hid-persist.ko',
      'SELinux disabled via /etc/selinux/config modification',
      'DNS-over-HTTPS to dns.doh-server.xyz',
      'SSH key backdoor in /root/.ssh/authorized_keys',
      'YARA rule: linux_kpe_worm_nov2026'
    ],
    timestamp: new Date(Date.now() - 39600000).toISOString()
  },
  {
    id: 'threat-13', name: 'WooCommerce Payment Fraud Ring',
    type: 'Payment Bypass', severity: 'critical', status: 'investigating',
    source: 'Stripe Radar', cve: 'CVE-2026-9911', mitre_id: 'T1204', score: 93,
    ip: 'Various (Residential Proxy Pool)', target: 'shop-ecommerce-02.prod', attack_vector: 'Web Application',
    affected_products: 'WooCommerce < 8.6.0, Stripe Payment Gateway',
    description: 'Organized fraud ring exploiting payment bypass to place orders with completed checkout status without actual payment.',
    longDescription: 'An organized fraud ring is exploiting CVE-2026-9911 to place high-value orders on e-commerce sites without actually completing payment. The attack manipulates the WooCommerce order status directly via crafted API requests, marking orders as "completed" and "paid" while bypassing the Stripe payment gateway entirely. The ring targets high-value electronics and luxury goods with expedited shipping. Estimated losses of $2M+ across 200+ stores in the past week.',
    mitigation: 'Upgrade WooCommerce to 8.6.0+, implement server-side payment validation, add webhook verification for payment gateway callbacks, and implement fraud scoring for high-value orders.',
    impact: 'Direct revenue loss from shipped goods. Chargeback fees from legitimate transactions. Payment gateway account suspension risk.',
    iocs: [
      'Residential proxy exit nodes (2,000+ IPs across 50 countries)',
      'Order pattern: multiple high-value items, expedited shipping',
      'API abuse pattern: direct order status manipulation via REST API',
      'Email addresses: protonmail.com, tutanota.com domains'
    ],
    timestamp: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 'threat-14', name: 'JWT Token Forgery Attack',
    type: 'Authentication Bypass', severity: 'high', status: 'active',
    source: 'Auth0 Logs', cve: 'CVE-2026-7733', mitre_id: 'T1528', score: 84,
    ip: '5.188.62.14', target: 'api-gateway-03.prod', attack_vector: 'Web Application',
    affected_products: 'JWT libraries using HS256, custom auth implementations',
    description: 'Attackers forging JWT tokens by exploiting weak HS256 signing algorithm to impersonate admin users.',
    longDescription: 'Attackers have identified a JWT implementation using the HS256 symmetric signing algorithm with a weak secret key ("secret123"). They are forging admin-level tokens to gain unauthorized access to API endpoints. The attack has been ongoing for 48 hours with 15,000+ forged token attempts detected. Several successful authentications have been confirmed before rate limiting kicked in. The attackers appear to be systematically testing API endpoints for data exfiltration.',
    mitigation: 'Switch from HS256 to RS256 asymmetric signing, use strong signing keys (min 256-bit), implement short token expiry (15 min), add JWT ID (jti) claim for replay detection, and rotate signing keys immediately.',
    impact: 'Complete account takeover of admin users. API data exfiltration. Potential data breach of all customer records accessible through compromised API endpoints.',
    iocs: [
      '5.188.62.14', '5.188.62.0/24',
      'JWT payload pattern: {"sub":"admin","role":"administrator","iat":*,"exp":*}',
      'Multiple rapid API calls to /api/admin/* and /api/users/* endpoints',
      'User-agent: python-requests/2.31.0'
    ],
    timestamp: new Date(Date.now() - 46800000).toISOString()
  },
  {
    id: 'threat-15', name: 'IoT Botnet Recruitment Campaign',
    type: 'Malware', severity: 'medium', status: 'monitoring',
    source: 'Shodan', cve: 'CVE-2026-4321', mitre_id: 'T1583', score: 72,
    ip: '45.138.16.89', target: 'IoT Devices (Various)', attack_vector: 'Network',
    affected_products: 'Redis < 7.2.4, IoT devices with exposed Redis ports',
    description: 'Botnet campaign targeting IoT devices with exposed Redis instances to recruit into DDoS botnet.',
    longDescription: 'A botnet operator is scanning the internet for IoT devices with exposed Redis instances and exploiting CVE-2026-4321 to install DDoS agents. The campaign targets unsecured smart home devices, IP cameras, and network routers that run embedded Redis instances. The installed DDoS agents can launch multiple types of attacks including HTTP floods, DNS amplification, and TCP SYN floods. The botnet is estimated at 30,000+ devices and growing.',
    mitigation: 'Disable Redis on IoT devices if not needed, upgrade firmware to patch vulnerabilities, restrict Redis to localhost only, and segment IoT devices on a separate VLAN.',
    impact: 'Device compromise leading to DDoS botnet participation, network bandwidth exhaustion, potential legal liability from downstream attacks.',
    iocs: [
      '45.138.16.89', '45.138.16.0/24',
      'DDoS agent binary: /tmp/.ddos_agent, /var/run/.systemd',
      'C2 communication: wss://c2.botnet-control.xyz:8443',
      'Encrypted config at /tmp/.ioc_config.json'
    ],
    timestamp: new Date(Date.now() - 50400000).toISOString()
  },
  {
    id: 'threat-16', name: 'OAuth Token Theft via Open Redirector',
    type: 'Token Theft', severity: 'high', status: 'active',
    source: 'Google OAuth Audit', cve: 'CVE-2026-5522', mitre_id: 'T1557', score: 79,
    ip: '77.75.155.33', target: 'app-saas-01.prod', attack_vector: 'Web Application',
    affected_products: 'OAuth 2.0 implementations, social login integrations',
    description: 'OAuth token theft via open redirector vulnerability and referrer header leakage in social login flows.',
    longDescription: 'Attackers are exploiting an open redirector vulnerability combined with OAuth referrer header leakage to steal authentication tokens. The attack flow: victim clicks a link on the compromised site -> redirected through the open redirector to the OAuth provider -> OAuth token is appended to the callback URL -> referrer header leaks the token to the attacker\'s page. This allows the attacker to hijack the victim\'s session on the target application without credentials.',
    mitigation: 'Fix open redirector vulnerabilities, implement state parameter validation in OAuth flows, use PKCE extension, validate redirect URIs strictly, and add Referrer-Policy: no-referrer header.',
    impact: 'Account takeover without credentials. Access to user data and connected third-party services. Average incident cost: $120K per compromised organization.',
    iocs: [
      '77.75.155.33', '77.75.155.0/24',
      'Open redirect pattern: /redirect?url=http://attacker.com',
      'OAuth callback interception via referrer header',
      'Social login abuse targeting Google and GitHub OAuth'
    ],
    timestamp: new Date(Date.now() - 54000000).toISOString()
  },
  {
    id: 'threat-17', name: 'Magento Credit Card Skimmer',
    type: 'Malware', severity: 'critical', status: 'active',
    source: 'Sucuri', cve: 'CVE-2026-9922', mitre_id: 'T1190', score: 96,
    ip: '87.246.7.34', target: 'shop-ecommerce-03.prod', attack_vector: 'Web Application',
    affected_products: 'Magento < 2.4.7, custom checkout templates',
    description: 'Credit card skimmer injected into Magento checkout page via SQL injection. Captures payment data in real-time.',
    longDescription: 'A sophisticated credit card skimmer has been injected into multiple Magento-based e-commerce sites through CVE-2026-9922 (Magento SQL Injection). The skimmer is a JavaScript payload embedded in the checkout page that captures credit card details, CVV, and billing address in real-time as customers fill out the form. The stolen data is exfiltrated to a remote server encoded as a PNG image to evade network detection. Over 10,000 credit cards have been compromised across 50+ stores.',
    mitigation: 'Update Magento to 2.4.7+, conduct forensic investigation of checkout templates, scan for unauthorized JavaScript modifications, implement Content-Security-Policy, and enable Subresource Integrity (SRI) for all scripts.',
    impact: 'Massive credit card data breach. Average cost per compromised card: $180. PCI DSS fines: up to $500K/month. Class-action lawsuits: $5M-$20M.',
    iocs: [
      '87.246.7.34', '87.246.7.0/24',
      'Skimmer JavaScript MD5: e4f5a6b7c8d9e0f1a2b3c4d5e6f70819',
      'Data exfiltration endpoint: https://cdn-analytics-cdn.com/collect.png',
      'Skimmer pattern: onsubmit handler in checkout form',
      'Encoded data in PNG exif metadata'
    ],
    timestamp: new Date(Date.now() - 57600000).toISOString()
  },
  {
    id: 'threat-18', name: 'PHP Supply Chain Attack',
    type: 'Supply Chain', severity: 'critical', status: 'investigating',
    source: 'Packagist', cve: 'CVE-2026-4455', mitre_id: 'T1195', score: 90,
    ip: 'N/A (Package Registry)', target: 'Development Pipeline', attack_vector: 'Supply Chain',
    affected_products: 'PHP < 8.3.1, Composer dependencies',
    description: 'Compromised PHP package on Packagist containing backdoor deployed to thousands of applications via composer updates.',
    longDescription: 'A popular PHP package on Packagist has been compromised, with a backdoor injected into a minor version update. The backdoor uses CVE-2026-4455 (PHP Deserialization RCE) to execute arbitrary code when the deserialization occurs. The compromised package had 2M+ monthly downloads, affecting thousands of PHP applications worldwide. The backdoor establishes a reverse shell to a C2 server and exfiltrates environment variables containing database credentials and API keys.',
    mitigation: 'Audit all Composer dependencies, check for the malicious package versions, rotate all credentials exposed through environment variables, implement dependency lock files (composer.lock), and enable two-factor authentication on Packagist accounts.',
    impact: 'Widespread PHP application compromise. Supply chain attack affecting thousands of downstream applications. Estimated total impact: $10M+ across affected organizations.',
    iocs: [
      'Compromised package versions: popular-lib 2.4.1 - 2.4.3',
      'Malicious commit hash: a1b2c3d4e5f67890abcdef1234567890abcdef12',
      'C2 server: c2.php-supply-chain.xyz:4443',
      'Backdoor code: eval(gzuncompress(base64_decode(\'...\')))',
      'Exfiltration endpoint: https://api.phplog-collector.com/log'
    ],
    timestamp: new Date(Date.now() - 61200000).toISOString()
  },
  {
    id: 'threat-19', name: 'Nginx Configuration File Exposure',
    type: 'Information Disclosure', severity: 'medium', status: 'resolved',
    source: 'HackerOne', cve: 'CVE-2026-7890', mitre_id: 'T1530', score: 45,
    ip: '104.28.12.34', target: 'web-server-02.prod', attack_vector: 'Web Application',
    affected_products: 'Nginx < 1.24, custom configuration',
    description: 'Path traversal vulnerability exposed Nginx configuration files containing internal architecture details and proxy configurations.',
    longDescription: 'A security researcher responsibly disclosed a path traversal vulnerability allowing access to Nginx configuration files. The exposed files revealed internal network architecture, upstream server addresses, and authentication rules. While no active exploitation was detected, the configuration details could enable sophisticated attacks against internal services. The issue has been fully resolved by updating Nginx and restricting file permissions.',
    mitigation: 'Already resolved. Nginx updated to 1.24+, file permissions hardened, WAF rules added to block path traversal attempts.',
    impact: 'Internal architecture disclosure. Proxied service endpoints exposed. Limited risk as the vulnerability was responsibly disclosed.',
    iocs: [
      '104.28.12.34 (researcher IP)',
      'Path traversal: /files/../../../etc/nginx/nginx.conf',
      'Exposed internal endpoints: backend-server-01.internal:8080'
    ],
    timestamp: new Date(Date.now() - 64800000).toISOString()
  },
  {
    id: 'threat-20', name: 'Session Hijacking on SaaS Platform',
    type: 'Session Hijacking', severity: 'high', status: 'active',
    source: 'Application Logs', cve: 'CVE-2026-5511', mitre_id: 'T1539', score: 83,
    ip: '46.30.211.45', target: 'app-saas-02.prod', attack_vector: 'Web Application',
    affected_products: 'Custom session management, Node.js 20.x',
    description: 'Session fixation attack allowing attackers to hijack user sessions by pre-setting session identifiers before login.',
    longDescription: 'Attackers are exploiting a session fixation vulnerability (CVE-2026-5511) in a SaaS platform\'s authentication flow. The attack works by sending victims a URL with a pre-set session ID parameter. When the victim logs in, the attacker can use the same session ID to hijack the authenticated session. Combined with CVE-2026-8765 (Node.js Information Leak), attackers can also extract session details from error messages.',
    mitigation: 'Regenerate session IDs after successful login, use secure HttpOnly cookies with SameSite=Strict attribute, implement session fingerprinting (IP, User-Agent), and set short session timeouts.',
    impact: 'Account takeover. Access to sensitive customer data and SaaS platform features. Potential data breach of client information.',
    iocs: [
      '46.30.211.45', '46.30.211.0/24', '91.121.87.0/24',
      'Session ID pattern: PHPSESSID=attacker-controlled-value',
      'Multiple session IDs in rapid succession from same IP',
      'Login endpoint: POST /auth/login with pre-set session cookie'
    ],
    timestamp: new Date(Date.now() - 68400000).toISOString()
  }
];

// The total count for the full threat catalog (so pagination stays consistent)
const THREAT_TOTAL = THREAT_CATALOG.length;

export const mockThreats = (params) => {
  const limit = parseInt(params?.limit) || 10;
  const page = parseInt(params?.page) || 1;
  const start = (page - 1) * limit;
  const threats = THREAT_CATALOG.slice(start, start + limit);
  return { threats, total: THREAT_TOTAL, page, limit };
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

// ── Active Users (Admin) ─────────────────────────────────────
export const mockActiveUsers = () => {
  const now = Date.now();
  return DEMO_USERS.map((user, i) => ({
    ...user,
    status: i === 3 ? 'blocked' : 'active',
    lastActive: new Date(now - i * 7200000 - (i === 0 ? 0 : 3600000)).toISOString(),
    scanCount: [24, 15, 8, 3][i],
    blockedAt: i === 3 ? new Date(now - 604800000).toISOString() : null,
    blockedBy: i === 3 ? 'admin' : null
  }));
};

// ── Upgrade Plans ─────────────────────────────────────────────
export const mockUpgradePlans = () => ({
  currentPlan: 'free',
  plans: [
    { id: 'free', name: 'Free', price: 0, features: ['Basic scanning', '5 scans/month', 'Email reports'] },
    { id: 'pro', name: 'Professional', price: 29, features: ['Advanced scanning', 'Unlimited scans', 'API access', 'Scheduled scans', 'Priority support', 'Slack integration'] },
    { id: 'enterprise', name: 'Enterprise', price: 99, features: ['Everything in Pro', 'SSO/SAML', 'Custom rules', 'SLA guarantee', 'Dedicated support', 'On-premise option'] }
  ]
});
