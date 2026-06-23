const axios = require('axios');
const pool = require('../config/database');
const { decrypt } = require('./apiKeyEncryption');

class CVEService {
  constructor() {
    this.nvdApiUrl = null;
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 1 hour
  }

  /**
   * Resolve the NVD API URL — checks DB-stored keys first, then env vars, then default
   */
  async resolveApiUrl() {
    if (this.nvdApiUrl) return this.nvdApiUrl;

    // Check DB for custom NIST_CVE_API endpoint
    try {
      const result = await pool.query(
        'SELECT id, encrypted_value FROM api_keys WHERE key_name = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
        ['NIST_CVE_API']
      );
      if (result.rows.length > 0) {
        const value = decrypt(result.rows[0].encrypted_value);
        pool.query('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].id])
          .catch(e => global.logger?.warn('Failed to update last_used_at:', e.message));
        this.nvdApiUrl = value;
        return this.nvdApiUrl;
      }
    } catch (e) {
      global.logger?.warn('Failed to resolve NIST_CVE_API from DB:', e.message);
    }

    this.nvdApiUrl = process.env.NIST_CVE_API || 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    return this.nvdApiUrl;
  }

  /**
   * Fetch CVE data from NIST NVD
   */
  async fetchCVEFromNIST(keyword, limit = 10) {
    try {
      // Ensure API URL is resolved before use
      if (!this.nvdApiUrl) {
        this.nvdApiUrl = await this.resolveApiUrl();
      }

      const cacheKey = `nvd_${keyword}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const response = await axios.get(this.nvdApiUrl, {
        params: {
          keywordSearch: keyword,
          resultsPerPage: limit,
          startIndex: 0
        },
        timeout: 10000
      });

      const data = response.data.vulnerabilities || [];
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      global.logger?.error('NIST CVE fetch error:', error.message);
      return [];
    }
  }

  /**
   * Search for CVEs by software/version
   */
  async searchCVE(software, version = '') {
    try {
      const query = version ? `${software} ${version}` : software;
      const cves = await this.fetchCVEFromNIST(query, 20);
      
      return cves.map(vuln => ({
        cveId: vuln.cve?.id,
        description: vuln.cve?.descriptions?.[0]?.value,
        cvssScore: vuln.cve?.metrics?.cvssV3_1?.baseScore || 
                   vuln.cve?.metrics?.cvssV3_0?.baseScore ||
                   'N/A',
        severity: this.calculateSeverity(vuln.cve?.metrics?.cvssV3_1?.baseScore),
        published: vuln.cve?.published,
        lastModified: vuln.cve?.lastModified,
        references: vuln.cve?.references?.[0]?.url || ''
      }));
    } catch (error) {
      global.logger?.error('CVE search error:', error.message);
      return [];
    }
  }

  /**
   * Calculate CVSS severity level
   */
  calculateSeverity(cvssScore) {
    if (!cvssScore) return 'UNKNOWN';
    if (cvssScore >= 9.0) return 'CRITICAL';
    if (cvssScore >= 7.0) return 'HIGH';
    if (cvssScore >= 4.0) return 'MEDIUM';
    if (cvssScore > 0) return 'LOW';
    return 'NONE';
  }

  /**
   * Check if website uses vulnerable software
   */
  async checkForVulnerableSoftware(url, detectedSoftware = []) {
    try {
      const vulnerabilities = [];
      
      for (const software of detectedSoftware) {
        const cves = await this.searchCVE(software.name, software.version);
        if (cves.length > 0) {
          vulnerabilities.push({
            software,
            cves: cves.slice(0, 5) // Top 5 CVEs
          });
        }
      }

      return vulnerabilities;
    } catch (error) {
      global.logger?.error('Vulnerable software check error:', error.message);
      return [];
    }
  }

  /**
   * Get threat intelligence summary
   */
  async getThreatIntelligence(keyword) {
    try {
      const cves = await this.fetchCVEFromNIST(keyword, 5);
      const criticalCves = cves.filter(v => {
        const score = v.cve?.metrics?.cvssV3_1?.baseScore || 0;
        return score >= 7.0;
      });

      return {
        keyword,
        totalCVEs: cves.length,
        criticalCVEs: criticalCves.length,
        recentThreats: cves.slice(0, 3).map(v => ({
          id: v.cve?.id,
          score: v.cve?.metrics?.cvssV3_1?.baseScore,
          description: v.cve?.descriptions?.[0]?.value
        }))
      };
    } catch (error) {
      global.logger?.error('Threat intelligence error:', error.message);
      return null;
    }
  }
}

module.exports = new CVEService();
