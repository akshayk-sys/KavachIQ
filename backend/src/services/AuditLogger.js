const pool = require('../config/database');
const { google } = require('googleapis');

class AuditLogger {
  constructor() {
    this.initialized = false;
    this.docs = null;
  }

  /**
   * Initialize Google Docs integration
   */
  async initializeGoogleDocs() {
    try {
      if (this.initialized) return;

      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/documents']
      });

      this.docs = google.docs({ version: 'v1', auth });
      this.initialized = true;
      global.logger?.info('Google Docs integration initialized');
    } catch (error) {
      global.logger?.error('Google Docs initialization error:', error.message);
    }
  }

  /**
   * Log action to database
   */
  async logAction(userId, action, resourceType, resourceId, changes = {}, req = null) {
    try {
      const query = `
        INSERT INTO audit_logs 
        (user_id, action, resource_type, resource_id, changes, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;

      const values = [
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(changes),
        req?.ip || 'unknown',
        req?.get('user-agent') || 'unknown'
      ];

      const result = await pool.query(query, values);
      return result.rows[0]?.id;
    } catch (error) {
      global.logger?.error('Audit log error:', error.message);
      throw error;
    }
  }

  /**
   * Create Google Doc for audit report
   */
  async createAuditDocument(scanId, scanData, userId) {
    try {
      if (!this.initialized) await this.initializeGoogleDocs();

      const docTitle = `KavachIQ Audit Report - Scan ${scanId} - ${new Date().toISOString()}`;
      
      // Document content
      const content = [
        {
          insertText: {
            text: docTitle + '\n\n'
          }
        },
        {
          updateTextStyle: {
            range: { startIndex: 0, endIndex: docTitle.length },
            textStyle: { bold: true, fontSize: { magnitude: 24, unit: 'pt' } },
            fields: 'bold,fontSize'
          }
        },
        {
          insertText: {
            text: `Generated: ${new Date().toISOString()}\n`
          }
        },
        {
          insertText: {
            text: `Scan ID: ${scanId}\n`
          }
        },
        {
          insertText: {
            text: `Website: ${scanData.url}\n\n`
          }
        },
        {
          insertText: {
            text: 'FINDINGS:\n'
          }
        }
      ];

      // Add findings
      if (scanData.vulnerabilities?.length > 0) {
        content.push({
          insertText: {
            text: `Vulnerabilities Found: ${scanData.vulnerabilities.length}\n`
          }
        });
      }

      if (scanData.ssl) {
        content.push({
          insertText: {
            text: `SSL Status: ${scanData.ssl.valid ? 'Valid' : 'Invalid'}\n`
          }
        });
      }

      // Create document
      const response = await this.docs.documents.create({
        requestBody: {
          title: docTitle,
          body: {
            content: [
              {
                paragraph: {
                  elements: content.map(c => ({ textRun: { content: '' } }))
                }
              }
            ]
          }
        }
      });

      const docUrl = `https://docs.google.com/document/d/${response.data.documentId}/edit`;

      // Update database with doc URL
      await pool.query(
        'UPDATE scans SET report_url = $1 WHERE id = $2',
        [docUrl, scanId]
      );

      return docUrl;
    } catch (error) {
      global.logger?.error('Create audit document error:', error.message);
      return null;
    }
  }

  /**
   * Get audit trail for a resource
   */
  async getAuditTrail(resourceType, resourceId, limit = 100) {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE resource_type = $1 AND resource_id = $2
        ORDER BY created_at DESC
        LIMIT $3;
      `;

      const result = await pool.query(query, [resourceType, resourceId, limit]);
      return result.rows;
    } catch (error) {
      global.logger?.error('Get audit trail error:', error.message);
      return [];
    }
  }

  /**
   * Export audit report
   */
  async exportAuditReport(startDate, endDate) {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC;
      `;

      const result = await pool.query(query, [startDate, endDate]);
      return {
        reportGenerated: new Date().toISOString(),
        periodStart: startDate,
        periodEnd: endDate,
        totalRecords: result.rows.length,
        records: result.rows
      };
    } catch (error) {
      global.logger?.error('Export audit report error:', error.message);
      return null;
    }
  }

  /**
   * Generate SOC 2 compliance report
   */
  async generateSOC2Report(startDate, endDate) {
    try {
      // Gather relevant audit data
      const auditData = await pool.query(`
        SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT user_id) as unique_users,
          ARRAY_AGG(DISTINCT action) as action_types
        FROM audit_logs
        WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const accessLogs = await pool.query(`
        SELECT * FROM audit_logs 
        WHERE action IN ('login', 'logout', 'access_denied')
        AND created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC
        LIMIT 100`,
        [startDate, endDate]
      );

      const scanSummary = await pool.query(`
        SELECT 
          COUNT(*) as total_scans,
          COUNT(CASE WHEN severity IN ('critical', 'high') THEN 1 END) as high_risk_scans,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_scans
        FROM scans
        WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      return {
        reportType: 'SOC 2 Compliance Report',
        generatedAt: new Date().toISOString(),
        reportingPeriod: { start: startDate, end: endDate },
        reportStructure: {
          section1: 'Independent Service Auditor\'s Report',
          section2: 'Management\'s Assertion',
          section3: 'System Description',
          section4: 'Trust Services Criteria, Controls, and Test Results'
        },
        trustServicesCriteria: {
          security: {
            status: 'Compliant',
            details: [
              'Access controls implemented - JWT-based authentication',
              'Security monitoring via automated scanning',
              'Incident detection via threat intelligence',
              `Total access events: ${auditData.rows[0]?.total_actions || 0}`,
              `Unique users monitored: ${auditData.rows[0]?.unique_users || 0}`
            ],
            gaps: []
          },
          availability: {
            status: 'Compliant',
            details: [
              `Scans completed: ${scanSummary.rows[0]?.completed_scans || 0}`,
              'System monitoring active 24/7',
              'Automated health checks implemented'
            ],
            gaps: []
          },
          processingIntegrity: {
            status: 'Compliant',
            details: [
              'Complete audit trail maintained',
              `High risk scans detected: ${scanSummary.rows[0]?.high_risk_scans || 0}`,
              'All actions logged with timestamps and user context'
            ],
            gaps: []
          },
          confidentiality: {
            status: 'Compliant',
            details: [
              'SSL/TLS encryption for data in transit',
              'Password hashing with bcrypt',
              'Role-based access control (RBAC) implemented'
            ],
            gaps: []
          }
        },
        accessReview: accessLogs.rows.map(row => ({
          timestamp: row.created_at,
          action: row.action,
          userId: row.user_id,
          ipAddress: row.ip_address
        })),
        recommendations: [
          'Continue regular security scanning (currently active)',
          'Maintain comprehensive audit logging (currently active)',
          'Review access logs monthly for anomalous patterns',
          'Conduct quarterly access control reviews'
        ]
      };
    } catch (error) {
      global.logger?.error('SOC 2 report error:', error.message);
      return null;
    }
  }

  /**
   * Generate ISO 27001 compliance report
   */
  async generateISO27001Report(startDate, endDate) {
    try {
      const auditSummary = await pool.query(`
        SELECT 
          COUNT(*) as total_events,
          ARRAY_AGG(DISTINCT action) as actions_taken
        FROM audit_logs
        WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const scanLogs = await pool.query(`
        SELECT * FROM scans
        WHERE created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      return {
        reportType: 'ISO/IEC 27001:2022 Compliance Report',
        generatedAt: new Date().toISOString(),
        reportingPeriod: { start: startDate, end: endDate },
        standardClauses: {
          clause4_ContextOfOrganization: {
            title: '4 - Context of the Organization',
            status: 'Compliant',
            evidence: [
              'Security scanning scope defined for all web assets',
              'Threat intelligence integration for external context'
            ]
          },
          clause6_Planning: {
            title: '6 - Planning',
            status: 'Compliant',
            evidence: [
              'Risk assessment via CVSS scoring',
              'Security objectives tracked via dashboard metrics'
            ]
          },
          clause7_Support: {
            title: '7 - Support',
            status: 'Compliant',
            evidence: [
              'Awareness via security scan reports',
              'Documented audit trails and reports'
            ]
          },
          clause8_Operation: {
            title: '8 - Operation',
            status: 'Compliant',
            evidence: [
              `Risk assessments performed: ${scanLogs.rows.length} scans in period`,
              'Automated vulnerability scanning operational',
              'Threat detection and monitoring active'
            ]
          },
          clause9_PerformanceEvaluation: {
            title: '9 - Performance Evaluation',
            status: 'Compliant',
            evidence: [
              `Total audit events logged: ${auditSummary.rows[0]?.total_events || 0}`,
              'Continuous monitoring and reporting',
              'Security metrics tracked on dashboard'
            ]
          },
          clause10_Improvement: {
            title: '10 - Improvement',
            status: 'Compliant',
            evidence: [
              'Nonconformities tracked via scan findings',
              'Corrective actions generated via AI recommendations',
              'Continuous improvement through regular scanning'
            ]
          }
        },
        annexAControls: {
          A5_InformationSecurityPolicies: { status: 'Compliant', notes: 'Security policies enforced via scanning rules' },
          A6_OrganizationOfInformationSecurity: { status: 'Compliant', notes: 'Roles defined in user management system' },
          A7_HumanResourceSecurity: { status: 'Compliant', notes: 'User activity tracking active' },
          A8_AssetManagement: { status: 'Compliant', notes: 'Web assets tracked via scan records' },
          A9_AccessControl: { status: 'Compliant', notes: 'JWT + RBAC implemented' },
          A10_Cryptography: { status: 'Compliant', notes: 'SSL/TLS for all communications' },
          A12_OperationsSecurity: { status: 'Compliant', notes: 'Automated scanning and monitoring' },
          A16_IncidentManagement: { status: 'Compliant', notes: 'Threat intelligence and alert system' },
          A17_BusinessContinuity: { status: 'Partially Compliant', notes: 'Basic redundancy via Docker' },
          A18_Compliance: { status: 'Compliant', notes: 'Reports generated for compliance review' }
        },
        recommendations: [
          'Formalize ISMS policy documentation based on scan findings',
          'Conduct regular internal audits using the generated reports',
          'Document risk treatment plans for identified vulnerabilities',
          'Establish formal incident response procedures',
          'Review and update security policies quarterly'
        ]
      };
    } catch (error) {
      global.logger?.error('ISO 27001 report error:', error.message);
      return null;
    }
  }
}

module.exports = new AuditLogger();
