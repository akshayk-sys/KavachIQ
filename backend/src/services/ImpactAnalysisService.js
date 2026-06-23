class ImpactAnalysisService {
  /**
   * Perform full business impact analysis on scan results
   */
  static async analyze(scanData, companyContext = {}) {
    try {
      const impact = {
        timestamp: new Date().toISOString(),
        overallRiskExposure: this.calculateRiskExposure(scanData),
        financialImpact: this.estimateFinancialImpact(scanData, companyContext),
        operationalImpact: this.assessOperationalImpact(scanData),
        reputationalRisk: this.assessReputationalRisk(scanData),
        complianceImpact: this.assessComplianceImpact(),
        prioritizedRisks: [],
        recommendations: []
      };

      // Build prioritized risk list
      const risks = [];

      // SSL/TLS Risk
      if (scanData.ssl && !scanData.ssl.valid) {
        risks.push({
          category: 'SSL/TLS',
          risk: 'Invalid or expired SSL certificate',
          likelihood: 'high',
          impact: 'critical',
          riskScore: 95,
          description: 'Users may receive browser security warnings or be unable to access the website',
          businessImpact: 'Loss of user trust, potential data interception, SEO ranking drop',
          mitigation: 'Renew SSL certificate immediately and enable auto-renewal',
          mitigationCost: 'Low',
          mitigationTimeframe: 'Hours'
        });
      }

      if (scanData.ssl && scanData.ssl.daysRemaining < 30) {
        risks.push({
          category: 'SSL/TLS',
          risk: `SSL certificate expiring in ${scanData.ssl.daysRemaining} days`,
          likelihood: 'medium',
          impact: 'high',
          riskScore: 70,
          description: 'Certificate expiration approaching',
          businessImpact: 'Service disruption if not renewed before expiry',
          mitigation: 'Renew certificate before expiry date',
          mitigationCost: 'Low',
          mitigationTimeframe: 'Days'
        });
      }

      // Security Headers Risk
      if (scanData.securityHeaders && scanData.securityHeaders.passed < 7) {
        const missingCount = 7 - (scanData.securityHeaders.total || 7);
        risks.push({
          category: 'Security Headers',
          risk: `${missingCount} security headers not configured`,
          likelihood: scanData.securityHeaders.passed < 3 ? 'high' : 'medium',
          impact: scanData.securityHeaders.passed < 3 ? 'high' : 'medium',
          riskScore: 100 - (scanData.securityHeaders.passed / (scanData.securityHeaders.total || 7)) * 100,
          description: 'Missing security headers reduce protection against common web attacks',
          businessImpact: 'Increased vulnerability to XSS, clickjacking, MIME-type confusion attacks',
          mitigation: `Configure missing HTTP security headers (${missingCount} remaining)`,
          mitigationCost: 'Low',
          mitigationTimeframe: 'Hours'
        });
      }

      // Malware Risk
      if (scanData.malware) {
        if (scanData.malware.clean === false) {
          risks.push({
            category: 'Malware',
            risk: 'Malware or threats detected on website',
            likelihood: 'confirmed',
            impact: 'critical',
            riskScore: 100,
            description: 'Active threats detected: ' + (scanData.malware.threats?.map(t => t.type).join(', ') || 'Unknown'),
            businessImpact: 'Users may be blocked by browsers, data breaches, legal liability, brand damage',
            mitigation: 'Immediately investigate and remove malicious content. Scan all files and databases.',
            mitigationCost: 'Medium-High',
            mitigationTimeframe: 'Hours-Days'
          });
        } else if (scanData.malware.riskScore > 20) {
          risks.push({
            category: 'Malware',
            risk: 'Suspicious patterns detected on website',
            likelihood: 'possible',
            impact: 'high',
            riskScore: scanData.malware.riskScore,
            description: `${scanData.malware.suspiciousPatterns?.length || 0} suspicious patterns found`,
            businessImpact: 'Potential security compromise requiring investigation',
            mitigation: 'Review detected patterns and verify website integrity',
            mitigationCost: 'Low',
            mitigationTimeframe: 'Hours'
          });
        }
      }

      // Vulnerability Risk
      if (scanData.vulnerabilities && scanData.vulnerabilities.vulnerabilitiesFound > 0) {
        risks.push({
          category: 'Vulnerabilities',
          risk: `${scanData.vulnerabilities.vulnerabilitiesFound} known vulnerabilities detected`,
          likelihood: 'high',
          impact: 'high',
          riskScore: Math.min(scanData.vulnerabilities.vulnerabilitiesFound * 15, 95),
          description: scanData.vulnerabilities.vulnerabilities?.map(v => v.type).join(', ') || 'Various vulnerabilities found',
          businessImpact: 'Attackers can exploit known vulnerabilities to gain unauthorized access',
          mitigation: 'Apply security patches and update all software components',
          mitigationCost: 'Medium',
          mitigationTimeframe: 'Days-Weeks'
        });
      }

      // CVE Risk (if available)
      if (scanData.cveFindings && scanData.cveFindings.length > 0) {
        const criticalCves = scanData.cveFindings.filter(c => c.severity === 'CRITICAL');
        if (criticalCves.length > 0) {
          risks.push({
            category: 'CVE / Zero-day',
            risk: `${criticalCves.length} critical CVEs affecting your stack`,
            likelihood: 'confirmed',
            impact: 'critical',
            riskScore: 98,
            description: `Critical vulnerabilities identified: ${criticalCves.map(c => c.cveId).join(', ')}`,
            businessImpact: 'Active exploitation possible. Regulatory non-compliance. Data breach risk.',
            mitigation: 'Patch affected systems immediately. Implement WAF rules if patches unavailable.',
            mitigationCost: 'Medium-High',
            mitigationTimeframe: 'Immediate'
          });
        }
      }

      // Sort risks by risk score
      risks.sort((a, b) => b.riskScore - a.riskScore);
      impact.prioritizedRisks = risks;

      // Generate strategic recommendations
      impact.recommendations = this.generateStrategicRecommendations(risks, scanData);
      impact.summary = this.generateExecutiveSummary(risks, scanData, companyContext);

      return impact;
    } catch (error) {
      global.logger?.error('Impact analysis error:', error.message);
      return null;
    }
  }

  /**
   * Calculate overall risk exposure percentage
   */
  static calculateRiskExposure(scanData) {
    let exposure = 0;
    if (scanData.ssl && !scanData.ssl.valid) exposure += 25;
    if (scanData.securityHeaders && scanData.securityHeaders.passed < 4) exposure += 20;
    if (scanData.malware) {
      if (scanData.malware.clean === false) exposure += 30;
      else if (scanData.malware.riskScore > 20) exposure += 15;
    }
    if (scanData.vulnerabilities && scanData.vulnerabilities.vulnerabilitiesFound > 0) {
      exposure += Math.min(scanData.vulnerabilities.vulnerabilitiesFound * 5, 25);
    }
    return Math.min(exposure, 100);
  }

  /**
   * Estimate potential financial impact
   */
  static estimateFinancialImpact(scanData, companyContext = {}) {
    const avgRevenuePerDay = companyContext.avgRevenuePerDay || 10000;
    const customerCount = companyContext.customerCount || 1000;
    const avgRevenuePerCustomer = companyContext.avgRevenuePerCustomer || 100;

    let breachCost = 0;
    let downtimeCost = 0;
    let remediationCost = 0;

    // Data breach costs (based on IBM 2024 Cost of Data Breach avg: $4.45M)
    if (scanData.malware && scanData.malware.clean === false) {
      breachCost = Math.round(avgRevenuePerCustomer * customerCount * 0.05); // 5% of customer revenue at risk
    }
    if (scanData.vulnerabilities && scanData.vulnerabilities.vulnerabilitiesFound > 0) {
      breachCost += Math.round(avgRevenuePerCustomer * customerCount * 0.02);
    }

    // Downtime costs
    if (scanData.ssl && !scanData.ssl.valid) {
      downtimeCost = Math.round(avgRevenuePerDay * 3); // 3 days of potential downtime
    }

    // Remediation costs
    remediationCost = (scanData.vulnerabilities?.vulnerabilitiesFound || 0) * 500; // $500 per vulnerability fix
    if (scanData.malware && scanData.malware.clean === false) {
      remediationCost += 5000; // Malware cleanup
    }

    return {
      estimatedAnnualLoss: breachCost + (downtimeCost * 12) + remediationCost,
      breachCost: { low: breachCost, high: breachCost * 3, average: breachCost * 2 },
      downtimeCost: { perDay: downtimeCost, estimatedDays: 3 },
      remediationCost: { estimated: remediationCost },
      currency: 'USD',
      confidence: 'Medium - based on industry averages',
      note: 'Actual costs vary based on company size, industry, and regulatory environment'
    };
  }

  /**
   * Assess operational impact
   */
  static assessOperationalImpact(scanData) {
    const impacts = [];

    if (scanData.ssl && !scanData.ssl.valid) {
      impacts.push({
        area: 'Website Availability',
        impact: 'High',
        description: 'SSL certificate issues may cause browser warnings or block access',
        affectedTeams: ['IT Operations', 'DevOps', 'Security']
      });
    }

    if (scanData.securityHeaders && scanData.securityHeaders.passed < 4) {
      impacts.push({
        area: 'Security Posture',
        impact: 'Medium-High',
        description: 'Weak security header configuration increases attack surface',
        affectedTeams: ['Security', 'Development', 'DevOps']
      });
    }

    if (scanData.vulnerabilities && scanData.vulnerabilities.vulnerabilitiesFound > 0) {
      impacts.push({
        area: 'Software Maintenance',
        impact: 'Medium',
        description: `Requires patching ${scanData.vulnerabilities.vulnerabilitiesFound} vulnerabilities`,
        affectedTeams: ['Development', 'DevOps', 'IT Operations']
      });
    }

    if (scanData.malware && scanData.malware.clean === false) {
      impacts.push({
        area: 'Business Continuity',
        impact: 'Critical',
        description: 'Active malware may compromise business operations',
        affectedTeams: ['Security', 'IT Operations', 'Legal', 'Executive']
      });
    }

    return {
      impactedTeams: [...new Set(impacts.flatMap(i => i.affectedTeams))],
      operationalDowntimeRisk: impacts.some(i => i.area === 'Business Continuity') ? 'High' : 'Low',
      specificImpacts: impacts,
      overallOperationalRisk: impacts.some(i => i.impact === 'Critical') ? 'Critical' :
                              impacts.some(i => i.impact === 'High') ? 'High' :
                              impacts.some(i => i.impact === 'Medium-High') ? 'Medium-High' : 'Low'
    };
  }

  /**
   * Assess reputational risk
   */
  static assessReputationalRisk(scanData) {
    let riskLevel = 'Low';
    let score = 0;

    if (scanData.malware && scanData.malware.clean === false) {
      riskLevel = 'Critical';
      score += 50;
    }
    if (scanData.ssl && !scanData.ssl.valid) {
      riskLevel = score < 30 ? 'High' : riskLevel;
      score += 20;
    }
    if (scanData.vulnerabilities && scanData.vulnerabilities.vulnerabilitiesFound > 5) {
      riskLevel = score < 40 ? 'Medium' : riskLevel;
      score += 15;
    }

    return {
      riskLevel,
      riskScore: score,
      factors: [
        { factor: 'Customer trust impact', severity: score > 30 ? 'High' : 'Medium', detail: score > 30 ? 'Security issues may erode customer confidence' : 'Minor impact on customer trust' },
        { factor: 'Brand reputation', severity: score > 40 ? 'High' : 'Medium', detail: score > 40 ? 'Security incidents can damage brand reputation' : 'Reputation risk is manageable' },
        { factor: 'Competitive disadvantage', severity: score > 20 ? 'Medium' : 'Low', detail: score > 20 ? 'Security issues may be used by competitors' : 'Limited competitive impact' }
      ],
      prRecommendation: score > 30 ? 'Prepare communication plan for stakeholders' : 'No immediate PR action needed'
    };
  }

  /**
   * Assess compliance impact
   */
  static assessComplianceImpact() {
    return {
      frameworks: [
        {
          name: 'GDPR',
          relevance: 'Data protection and breach notification',
          requirements: [
            'Implement appropriate technical measures (Article 32)',
            '72-hour breach notification (Article 33)',
            'Data protection by design (Article 25)'
          ],
          potentialFines: 'Up to €20M or 4% of annual global turnover'
        },
        {
          name: 'PCI DSS',
          relevance: 'Payment card data security',
          requirements: [
            'Regular security scanning and testing (Req 11)',
            'Secure network configuration (Req 1)',
            'Access control measures (Req 7)'
          ],
          potentialFines: '$5,000 - $100,000 per month'
        },
        {
          name: 'SOC 2',
          relevance: 'Service organization controls',
          requirements: [
            'Security monitoring and incident response',
            'Risk assessment and management',
            'Logical and physical access controls'
          ],
          potentialFines: 'Loss of certification, customer contracts'
        },
        {
          name: 'ISO 27001',
          relevance: 'Information security management',
          requirements: [
            'Regular vulnerability assessments (A.12.6)',
            'Security incident management (A.16)',
            'Compliance with legal requirements (A.18)'
          ],
          potentialFines: 'Loss of certification'
        }
      ],
      overallComplianceRisk: 'Medium - Regular scanning and monitoring helps maintain compliance posture'
    };
  }

  /**
   * Generate executive summary
   */
  static generateExecutiveSummary(risks, scanData, companyContext) {
    const criticalRisks = risks.filter(r => r.riskScore >= 80).length;
    const highRisks = risks.filter(r => r.riskScore >= 60 && r.riskScore < 80).length;
    const mediumRisks = risks.filter(r => r.riskScore >= 40 && r.riskScore < 60).length;

    const totalScore = scanData.overallScore || 0;

    return {
      title: 'Security Posture Executive Summary',
      grade: totalScore >= 90 ? 'A' : totalScore >= 75 ? 'B' : totalScore >= 60 ? 'C' : totalScore >= 40 ? 'D' : 'F',
      overallScore: totalScore,
      riskBreakdown: `${criticalRisks} critical, ${highRisks} high, ${mediumRisks} medium priority risks identified`,
      keyFindings: risks.slice(0, 3).map(r => `• ${r.category}: ${r.risk} (Risk Score: ${r.riskScore})`),
      recommendedAction: criticalRisks > 0 ? 'Immediate action required' :
                         highRisks > 0 ? 'Action recommended within 30 days' :
                         'Continue regular monitoring',
      strategicPriority: criticalRisks > 0 ? 'Critical - Address immediately' :
                         highRisks > 0 ? 'High - Plan remediation' : 'Standard - Maintain security hygiene'
    };
  }

  /**
   * Generate strategic recommendations
   */
  static generateStrategicRecommendations(risks, scanData) {
    const recommendations = [];

    if (risks.some(r => r.category === 'SSL/TLS' && r.likelihood === 'high')) {
      recommendations.push({
        priority: 'Critical',
        category: 'Infrastructure',
        action: 'Implement automated SSL certificate management (e.g., Let\'s Encrypt with auto-renewal)',
        impact: 'Prevents certificate expiration and associated service disruptions',
        effort: 'Low',
        timeline: 'Immediate'
      });
    }

    if (risks.some(r => r.category === 'Security Headers')) {
      recommendations.push({
        priority: 'High',
        category: 'Security Configuration',
        action: 'Deploy a Web Application Firewall (WAF) with security headers enforcement',
        impact: 'Protects against common web attacks and improves security posture',
        effort: 'Medium',
        timeline: '1-2 weeks'
      });
    }

    if (risks.some(r => r.category === 'Malware')) {
      recommendations.push({
        priority: 'Critical',
        category: 'Incident Response',
        action: 'Engage incident response team for full forensic analysis and remediation',
        impact: 'Prevents data breach and limits damage',
        effort: 'High',
        timeline: 'Immediate'
      });
    }

    if (risks.some(r => r.category === 'Vulnerabilities' || r.category === 'CVE / Zero-day')) {
      recommendations.push({
        priority: 'High',
        category: 'Patch Management',
        action: 'Implement automated patch management and vulnerability scanning pipeline',
        impact: 'Reduces window of exposure to known vulnerabilities',
        effort: 'Medium',
        timeline: '2-4 weeks'
      });
    }

    // General recommendations
    recommendations.push({
      priority: 'Medium',
      category: 'Monitoring',
      action: 'Set up continuous security monitoring with automated alerting',
      impact: 'Early detection of security issues before they become critical',
      effort: 'Medium',
      timeline: '1-3 months'
    });

    recommendations.push({
      priority: 'Low',
      category: 'Training',
      action: 'Conduct security awareness training for development and operations teams',
      impact: 'Reduces human-error related security incidents',
      effort: 'Low',
      timeline: 'Quarterly'
    });

    return recommendations;
  }
}

module.exports = ImpactAnalysisService;
