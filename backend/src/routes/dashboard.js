const express = require('express');
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
 * Get dashboard metrics
 * - Admins: aggregated across all users
 * - Regular users: only their own metrics
 */
router.get('/metrics', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const adminView = isSuperAdmin(req);

    // Build WHERE clause based on role
    const userFilter = adminView ? '' : 'WHERE user_id = $1';
    const params = adminView ? [] : [userId];
    const paramIndex = (n) => adminView ? n : n + 1;

    // Total scans
    const totalScans = await pool.query(
      `SELECT COUNT(*) FROM scans ${userFilter}`,
      params
    );

    // Recent scans (7 days)
    const recentScans = await pool.query(
      `SELECT COUNT(*) FROM scans ${adminView ? '' : 'WHERE user_id = $1 AND'} created_at > NOW() - INTERVAL '7 days'`,
      params
    );

    // Critical issues
    const criticalIssues = await pool.query(
      `SELECT COUNT(*) FROM scans ${adminView ? '' : 'WHERE user_id = $1 AND'} severity = 'critical'`,
      params
    );

    // Average security score
    const avgScore = await pool.query(
      `SELECT AVG(CAST(findings->>'overallScore' AS FLOAT)) as avg_score
       FROM scans
       ${adminView ? "WHERE findings IS NOT NULL" : "WHERE user_id = $1 AND findings IS NOT NULL"}`,
      params
    );

    // For admin: also count unique users with scans
    let uniqueUsers = null;
    if (adminView) {
      const userCount = await pool.query('SELECT COUNT(DISTINCT user_id) FROM scans');
      uniqueUsers = parseInt(userCount.rows[0].count);
    }

    res.json({
      metrics: {
        totalScans: parseInt(totalScans.rows[0].count),
        scansLast7Days: parseInt(recentScans.rows[0].count),
        criticalIssuesFound: parseInt(criticalIssues.rows[0].count),
        averageSecurityScore: Math.round(avgScore.rows[0]?.avg_score || 0),
        ...(adminView ? { uniqueUsers } : {})
      },
      isAdminView: adminView,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    global.logger?.error('Dashboard metrics error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

/**
 * Get recent threats/alerts
 */
router.get('/threats', verifyToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const threats = await pool.query(
      `SELECT * FROM threat_intelligence 
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ threats: threats.rows, total: threats.rows.length });
  } catch (error) {
    global.logger?.error('Dashboard threats error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve threats' });
  }
});

/**
 * Get scan history chart data
 * - Admins: aggregated across all users
 * - Regular users: only their own data
 */
router.get('/scan-history', verifyToken, async (req, res) => {
  try {
    const adminView = isSuperAdmin(req);
    let query;
    let params;

    if (adminView) {
      query = `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium
       FROM scans
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`;
      params = [];
    } else {
      query = `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium
       FROM scans
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`;
      params = [req.userId];
    }

    const data = await pool.query(query, params);

    res.json({ historyData: data.rows, isAdminView: adminView });
  } catch (error) {
    global.logger?.error('Scan history error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

module.exports = router;
