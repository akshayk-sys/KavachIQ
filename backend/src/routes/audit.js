const express = require('express');
const AuditLogger = require('../services/AuditLogger');
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
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Get audit trail for a resource
 */
router.get('/trail/:resourceType/:resourceId', verifyToken, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { limit = 100 } = req.query;

    const trail = await AuditLogger.getAuditTrail(resourceType, resourceId, limit);
    res.json({ resourceType, resourceId, trail });
  } catch (error) {
    global.logger?.error('Get audit trail error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
});

/**
 * Export audit report
 */
router.get('/report/export', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }

    const report = await AuditLogger.exportAuditReport(
      new Date(startDate),
      new Date(endDate)
    );

    res.json(report);
  } catch (error) {
    global.logger?.error('Export report error:', error.message);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

/**
 * Get audit summary dashboard
 */
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const logs = await pool.query(
      `SELECT action, COUNT(*) as count 
       FROM audit_logs 
       WHERE created_at > $1 
       GROUP BY action 
       ORDER BY count DESC`,
      [sevenDaysAgo]
    );

    const users = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as unique_users, COUNT(*) as total_actions
       FROM audit_logs 
       WHERE created_at > $1`,
      [sevenDaysAgo]
    );

    res.json({
      period: '7 days',
      summary: {
        uniqueUsers: users.rows[0]?.unique_users || 0,
        totalActions: users.rows[0]?.total_actions || 0,
        actionBreakdown: logs.rows
      }
    });
  } catch (error) {
    global.logger?.error('Audit summary error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve audit summary' });
  }
});

/**
 * Generate SOC 2 compliance report
 */
router.get('/report/soc2', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const report = await AuditLogger.generateSOC2Report(start, end);
    if (!report) {
      return res.status(500).json({ error: 'Failed to generate SOC 2 report' });
    }

    res.json(report);
  } catch (error) {
    global.logger?.error('SOC 2 report error:', error.message);
    res.status(500).json({ error: 'Failed to generate SOC 2 report' });
  }
});

/**
 * Generate ISO 27001 compliance report
 */
router.get('/report/iso27001', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const report = await AuditLogger.generateISO27001Report(start, end);
    if (!report) {
      return res.status(500).json({ error: 'Failed to generate ISO 27001 report' });
    }

    res.json(report);
  } catch (error) {
    global.logger?.error('ISO 27001 report error:', error.message);
    res.status(500).json({ error: 'Failed to generate ISO 27001 report' });
  }
});

module.exports = router;
