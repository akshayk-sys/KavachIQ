const express = require('express');
const SecurityScanner = require('../services/SecurityScanner');
const AIAgent = require('../services/AIAgent');
const AuditLogger = require('../services/AuditLogger');
const ImpactAnalysisService = require('../services/ImpactAnalysisService');
const NotificationService = require('../services/NotificationService');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware: Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'user';
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper: Check if user is super admin
const isSuperAdmin = (req) => req.userRole === 'admin' || req.userRole === 'super_admin';

/**
 * Start a new security scan
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { website_url, scan_type = 'full' } = req.body;

    if (!website_url) {
      return res.status(400).json({ error: 'website_url is required' });
    }

    // Create scan record
    const scanResult = await pool.query(
      `INSERT INTO scans (user_id, website_url, scan_type, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [req.userId, website_url, scan_type]
    );

    const scan = scanResult.rows[0];

    // Log action
    await AuditLogger.logAction(req.userId, 'scan_initiated', 'scan', scan.id, 
      { website_url, scan_type }, req);

    // Run scan asynchronously
    setImmediate(async () => {
      try {
        const scanResults = await SecurityScanner.runFullScan(website_url);
        const domain = new URL(website_url).hostname;
        
        // Perform business impact analysis
        const impactAnalysis = await ImpactAnalysisService.analyze(scanResults);
        
        // Update scan record
        await pool.query(
          `UPDATE scans 
           SET status = 'completed', findings = $1, ssl_status = $2, 
               severity = $3, impact_analysis = $4, updated_at = NOW(), completed_at = NOW()
           WHERE id = $5`,
          [
            JSON.stringify(scanResults),
            JSON.stringify(scanResults.ssl),
            scanResults.severity,
            JSON.stringify(impactAnalysis),
            scan.id
          ]
        );

        // Analyze with AI
        const analysis = await AIAgent.analyzeScan(scanResults);
        
        // Create audit document
        await AuditLogger.createAuditDocument(scan.id, scanResults, req.userId);

        // Send real-time notification
        await NotificationService.notifyScanComplete(req.userId, scan.id, website_url, scanResults.severity);

        // Send SSL expiration warning if applicable
        if (scanResults.ssl && !scanResults.ssl.valid) {
          await NotificationService.notifySSLExpiring(req.userId, domain, 0);
        } else if (scanResults.ssl && scanResults.ssl.daysRemaining < 30) {
          await NotificationService.notifySSLExpiring(req.userId, domain, scanResults.ssl.daysRemaining);
        }

        // Send threat alert if malware detected
        if (scanResults.malware && scanResults.malware.clean === false) {
          await NotificationService.notifyThreatDetected(req.userId, {
            message: 'Malware detected on ' + website_url,
            type: 'malware',
            severity: 'critical'
          });
        }

        // Log completion
        await AuditLogger.logAction(req.userId, 'scan_completed', 'scan', scan.id, 
          { severity: scanResults.severity, risks: impactAnalysis?.prioritizedRisks?.length || 0 }, req);
      } catch (scanError) {
        global.logger?.error('Background scan error:', scanError.message);
        await pool.query(
          'UPDATE scans SET status = $1 WHERE id = $2',
          ['error', scan.id]
        );
      }
    });

    res.status(201).json({
      message: 'Scan initiated',
      scan: { id: scan.id, status: scan.status, created_at: scan.created_at }
    });
  } catch (error) {
    global.logger?.error('Create scan error:', error.message);
    res.status(500).json({ error: 'Failed to create scan' });
  }
});

/**
 * Get scan details
 * - Admins can view any scan
 * - Regular users can only view their own scans
 */
router.get('/:scanId', verifyToken, async (req, res) => {
  try {
    let result;
    if (isSuperAdmin(req)) {
      // Admin: view any scan
      result = await pool.query(
        'SELECT s.*, u.email as user_email, u.username as user_name FROM scans s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = $1',
        [req.params.scanId]
      );
    } else {
      // Regular user: view only their scan
      result = await pool.query(
        'SELECT s.*, u.email as user_email, u.username as user_name FROM scans s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = $1 AND s.user_id = $2',
        [req.params.scanId, req.userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    global.logger?.error('Get scan error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve scan' });
  }
});

/**
 * Get scans list
 * - Admins: see all users' scans
 * - Regular users: see only their own scans
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    let result, countResult;

    if (isSuperAdmin(req)) {
      // Admin: return all scans with user info
      result = await pool.query(
        `SELECT s.*, u.email as user_email, u.username as user_name 
         FROM scans s 
         LEFT JOIN users u ON s.user_id = u.id 
         ORDER BY s.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      countResult = await pool.query('SELECT COUNT(*) FROM scans');
    } else {
      // Regular user: return only their scans
      result = await pool.query(
        `SELECT s.*, u.email as user_email, u.username as user_name 
         FROM scans s 
         LEFT JOIN users u ON s.user_id = u.id 
         WHERE s.user_id = $1 
         ORDER BY s.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      );
      countResult = await pool.query(
        'SELECT COUNT(*) FROM scans WHERE user_id = $1',
        [req.userId]
      );
    }

    res.json({
      scans: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
      isAdminView: isSuperAdmin(req)
    });
  } catch (error) {
    global.logger?.error('Get scans error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve scans' });
  }
});

/**
 * Delete a scan
 * - Users can delete their own scans
 * - Admins can delete any scan
 */
router.delete('/:scanId', verifyToken, async (req, res) => {
  try {
    let result;

    if (isSuperAdmin(req)) {
      // Admin: delete any scan
      result = await pool.query(
        'DELETE FROM scans WHERE id = $1 RETURNING id',
        [req.params.scanId]
      );
    } else {
      // Regular user: delete only their own scan
      result = await pool.query(
        'DELETE FROM scans WHERE id = $1 AND user_id = $2 RETURNING id',
        [req.params.scanId, req.userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found or unauthorized' });
    }

    await AuditLogger.logAction(req.userId, 'scan_deleted', 'scan', req.params.scanId, 
      { deleted: true }, req);

    res.json({ success: true, message: 'Scan deleted' });
  } catch (error) {
    global.logger?.error('Delete scan error:', error.message);
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

module.exports = router;
