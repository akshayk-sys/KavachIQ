const axios = require('axios');
const cheerio = require('cheerio');
const sslChecker = require('ssl-checker');
const pool = require('../config/database');
const { decrypt } = require('./apiKeyEncryption');

/**
 * Resolve an API key value — checks env vars first, then DB
 */
async function resolveApiKey(keyName) {
  // Check environment variables first
  if (process.env[keyName]) return process.env[keyName];

  // Fall back to database-stored keys
  try {
    const result = await pool.query(
      'SELECT id, encrypted_value FROM api_keys WHERE key_name = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
      [keyName]
    );
    if (result.rows.length > 0) {
      const value = decrypt(result.rows[0].encrypted_value);
      // Update last_used_at asynchronously
      pool.query('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].id])
        .catch(e => global.logger?.warn('Failed to update last_used_at:', e.message));
      return value;
    }
  } catch (e) {
    global.logger?.warn(`Failed to resolve ${keyName} from DB:`, e.message);
  }
  return null;
}

class SecurityScanner {
  /**
   * Scan website for SSL/TLS issues
   */
  static async scanSSL(domain) {
    try {
      const result = await sslChecker(domain);
      return {
        valid: result.valid,
        validFrom: result.validFrom,
        validTo: result.validTo,
        issuer: result.issuer,
        grade: result.valid ? 'A' : 'F',
        daysRemaining: result.daysRemaining,
        protocol: result.protocol
      };
    } catch (error) {
      global.logger?.error('SSL scan error:', error.message);
      return { error: error.message, grade: 'UNKNOWN' };
    }
  }

  /**
   * Check for common security headers
   */
  static async scanSecurityHeaders(url) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const headers = response.headers;
      
      const securityHeaders = {
        haveStrictTransportSecurity: !!headers['strict-transport-security'],
        haveXContentTypeOptions: !!headers['x-content-type-options'],
        haveXFrameOptions: !!headers['x-frame-options'],
        haveXXSSProtection: !!headers['x-xss-protection'],
        haveContentSecurityPolicy: !!headers['content-security-policy'],
        haveReferrerPolicy: !!headers['referrer-policy'],
        havePermissionsPolicy: !!headers['permissions-policy'],
        headersList: headers
      };

      return {
        passed: Object.values(securityHeaders).filter(v => v === true).length,
        total: 7,
        details: securityHeaders
      };
    } catch (error) {
      global.logger?.error('Security headers scan error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Real malware/blacklist check via Google Safe Browsing API
   */
  static async checkMalwareStatus(url) {
    try {
      const apiKey = await resolveApiKey('GOOGLE_SAFE_BROWSING_API_KEY');
      if (!apiKey) {
        global.logger?.warn('Google Safe Browsing API key not configured, using heuristic check');
        return this.heuristicMalwareCheck(url);
      }

      const response = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          client: {
            clientId: 'kavachiq',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        },
        { timeout: 10000 }
      );

      const threats = response.data?.matches || [];
      
      return {
        clean: threats.length === 0,
        lastChecked: new Date().toISOString(),
        status: threats.length === 0 ? 'No threats detected' : 'Threats detected',
        threats: threats.map(t => ({
          type: t.threatType,
          platform: t.platformType,
          threatEntryType: t.threatEntryType,
          cacheDuration: t.cacheDuration
        })),
        source: 'Google Safe Browsing'
      };
    } catch (error) {
      global.logger?.error('Malware check error:', error.message);
      // Fallback to heuristic check
      return this.heuristicMalwareCheck(url);
    }
  }

  /**
   * Heuristic-based malware check (fallback when API is unavailable)
   */
  static async heuristicMalwareCheck(url) {
    try {
      const response = await axios.get(url, { 
        timeout: 5000,
        validateStatus: false 
      });
      
      const html = response.data?.toLowerCase() || '';
      const suspiciousPatterns = [
        'eval(', 'document.write(', '<iframe', 'onclick=', 'onload=',
        'onerror=', 'javascript:', 'malware', 'phishing', 'keylogger',
        'trojan', 'ransomware', 'cryptominer'
      ];
      
      const detectedPatterns = suspiciousPatterns.filter(p => html.includes(p));
      
      // Check for suspicious redirects
      const suspiciousRedirect = response.request?.res?.responseUrl && 
        new URL(response.request.res.responseUrl).hostname !== new URL(url).hostname;

      const score = (detectedPatterns.length * 10) + (suspiciousRedirect ? 30 : 0);

      return {
        clean: score < 20,
        lastChecked: new Date().toISOString(),
        status: score < 10 ? 'No malware detected' : 
                score < 20 ? 'Low risk - suspicious patterns found' :
                score < 50 ? 'Medium risk - multiple suspicious indicators' :
                'High risk - malware indicators detected',
        riskScore: score,
        suspiciousPatterns: detectedPatterns,
        suspiciousRedirect,
        source: 'Heuristic Analysis'
      };
    } catch (error) {
      global.logger?.error('Heuristic malware check error:', error.message);
      return {
        clean: null,
        lastChecked: new Date().toISOString(),
        status: 'Unable to check - ' + error.message,
        source: 'Heuristic Analysis'
      };
    }
  }

  /**
   * Scan for common vulnerabilities in response
   */
  static async scanVulnerabilities(url) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const $ = cheerio.load(response.data);
      const vulnerabilities = [];

      // Check for outdated frameworks in comments
      const html = response.data;
      if (html.includes('WordPress')) vulnerabilities.push({
        type: 'WordPress Detected',
        severity: 'medium',
        recommendation: 'Keep WordPress and plugins updated'
      });

      return {
        vulnerabilitiesFound: vulnerabilities.length,
        vulnerabilities,
        recommendations: ['Update all dependencies', 'Enable security headers']
      };
    } catch (error) {
      global.logger?.error('Vulnerability scan error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Run comprehensive security scan
   */
  static async runFullScan(url) {
    try {
      const domain = new URL(url).hostname;
      
      const [ssl, headers, malware, vulnerabilities] = await Promise.all([
        this.scanSSL(domain),
        this.scanSecurityHeaders(url),
        this.checkMalwareStatus(url),
        this.scanVulnerabilities(url)
      ]);

      const severity = this.calculateSeverity(ssl, headers, malware, vulnerabilities);

      return {
        url,
        timestamp: new Date().toISOString(),
        severity,
        ssl,
        securityHeaders: headers,
        malware,
        vulnerabilities,
        overallScore: this.calculateScore(ssl, headers, malware, vulnerabilities)
      };
    } catch (error) {
      global.logger?.error('Full scan error:', error.message);
      throw error;
    }
  }

  static calculateSeverity(ssl, headers, malware, vulnerabilities) {
    let score = 0;
    if (ssl && !ssl.valid) score += 3;
    if (headers && headers.passed < 4) score += 2;
    if (malware) {
      if (malware.clean === false) score += 5;
      else if (malware.riskScore && malware.riskScore > 20) score += 3;
    }
    if (vulnerabilities && vulnerabilities.vulnerabilitiesFound > 0) score += 1;

    if (score >= 5) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  static calculateScore(ssl, headers, malware, vulnerabilities) {
    let score = 100;
    if (ssl && !ssl.valid) score -= 30;
    if (headers && headers.passed < 4) score -= (7 - headers.passed) * 5;
    if (malware) {
      if (malware.clean === false) score -= 25;
      else if (malware.riskScore) score -= Math.min(malware.riskScore / 2, 25);
    }
    if (vulnerabilities && vulnerabilities.vulnerabilitiesFound > 0) score -= vulnerabilities.vulnerabilitiesFound * 5;
    return Math.max(0, score);
  }
}

module.exports = SecurityScanner;
