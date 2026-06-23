const pool = require('../config/database');
const CVEService = require('./CVEService');

class AISecurityAgent {
  /**
   * Analyze scan results and generate recommendations
   */
  static async analyzeScan(scanData) {
    try {
      const analysis = {
        timestamp: new Date().toISOString(),
        overallRisk: this.calculateRiskLevel(scanData),
        findings: [],
        prioritizedActions: [],
        automatedRecommendations: []
      };

      // Analyze SSL
      if (scanData.ssl && !scanData.ssl.valid) {
        analysis.findings.push({
          type: 'SSL Certificate Invalid',
          severity: 'critical',
          description: 'SSL certificate is invalid or expired',
          automatedFix: 'Run certificate renewal immediately'
        });
      }

      // Analyze Security Headers
      if (scanData.securityHeaders?.passed < 4) {
        analysis.findings.push({
          type: 'Missing Security Headers',
          severity: 'high',
          description: `Only ${scanData.securityHeaders.passed} out of 7 security headers configured`,
          automatedFix: 'Add missing security headers to server configuration'
        });
      }

      // Analyze Vulnerabilities
      if (scanData.vulnerabilities?.vulnerabilitiesFound > 0) {
        analysis.findings.push({
          type: 'Vulnerabilities Detected',
          severity: 'high',
          count: scanData.vulnerabilities.vulnerabilitiesFound,
          automatedFix: 'Update affected software components'
        });
      }

      // Generate prioritized action list
      analysis.prioritizedActions = this.generateActionPlan(analysis.findings);

      // AI Recommendations
      analysis.automatedRecommendations = this.generateAIRecommendations(scanData, analysis.findings);

      return analysis;
    } catch (error) {
      global.logger?.error('AI scan analysis error:', error.message);
      throw error;
    }
  }

  /**
   * Monitor threats in real-time
   */
  static async monitorThreats() {
    try {
      const threats = [];

      // Fetch recent CVEs
      const recentCVEs = await CVEService.getThreatIntelligence('web vulnerability');
      
      if (recentCVEs?.criticalCVEs > 0) {
        threats.push({
          type: 'critical_cve',
          severity: 'critical',
          message: `${recentCVEs.criticalCVEs} critical CVEs detected`,
          details: recentCVEs.recentThreats,
          action: 'Review critical CVEs and patch immediately'
        });
      }

      // Check for zero-day patterns
      const zerodays = await this.detectZeroDayPatterns();
      threats.push(...zerodays);

      // Store in database
      for (const threat of threats) {
        await pool.query(
          `INSERT INTO threat_intelligence 
           (threat_type, threat_description, severity, source)
           VALUES ($1, $2, $3, $4)`,
          [threat.type, threat.message, threat.severity, 'ai-agent']
        );
      }

      return threats;
    } catch (error) {
      global.logger?.error('Monitor threats error:', error.message);
      return [];
    }
  }

  /**
   * Detect potential zero-day attack patterns
   */
  static async detectZeroDayPatterns() {
    try {
      // Query recent scans for anomalies
      const anomalies = await pool.query(`
        SELECT COUNT(*) as count, severity, scan_type
        FROM scans
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY severity, scan_type
        ORDER BY count DESC
      `);

      const patterns = [];
      for (const row of anomalies.rows) {
        if (row.count > 10 && row.severity === 'critical') {
          patterns.push({
            type: 'potential_zero_day',
            severity: 'critical',
            message: `Unusual spike in ${row.scan_type} scans (${row.count} in 24h)`,
            action: 'Investigate unusual traffic patterns'
          });
        }
      }

      return patterns;
    } catch (error) {
      global.logger?.error('Zero-day detection error:', error.message);
      return [];
    }
  }

  /**
   * Generate prioritized action plan
   */
  static generateActionPlan(findings) {
    return findings
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5)
      .map((finding, index) => ({
        priority: index + 1,
        action: finding.automatedFix,
        severity: finding.severity,
        timeToFix: this.estimateFixTime(finding.type)
      }));
  }

  /**
   * Estimate time to fix vulnerability
   */
  static estimateFixTime(vulnerabilityType) {
    const estimates = {
      'SSL Certificate Invalid': '30 minutes',
      'Missing Security Headers': '1 hour',
      'Vulnerabilities Detected': '2-4 hours',
      'Outdated Dependencies': '2 hours',
      'Weak Password Policy': '1 hour'
    };
    return estimates[vulnerabilityType] || 'Variable';
  }

  /**
   * Generate AI-powered recommendations
   */
  static generateAIRecommendations(scanData, findings) {
    const recommendations = [];

    if (findings.length === 0) {
      recommendations.push({
        category: 'Best Practice',
        suggestion: 'Website is secure. Continue monitoring monthly.',
        priority: 'low'
      });
    }

    recommendations.push({
      category: 'Proactive',
      suggestion: 'Enable automated security scanning every week',
      priority: 'high'
    });

    recommendations.push({
      category: 'Compliance',
      suggestion: 'Keep audit logs for 1 year for compliance purposes',
      priority: 'medium'
    });

    return recommendations;
  }

  /**
   * Calculate overall risk level
   */
  static calculateRiskLevel(scanData) {
    let riskScore = 0;

    if (scanData.ssl && !scanData.ssl.valid) riskScore += 40;
    if (scanData.securityHeaders?.passed < 4) riskScore += 30;
    if (scanData.vulnerabilities?.vulnerabilitiesFound > 0) riskScore += 20;
    if (scanData.malware && !scanData.malware.clean) riskScore += 50;

    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }
}

module.exports = AISecurityAgent;
