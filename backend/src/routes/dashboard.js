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
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Get dashboard metrics
 */
router.get('/metrics', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Total scans
    const totalScans = await pool.query(
      'SELECT COUNT(*) FROM scans WHERE user_id = $1',
      [userId]
    );

    // Recent scans
    const recentScans = await pool.query(
      'SELECT COUNT(*) FROM scans WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
      [userId]
    );

    // Critical issues
    const criticalIssues = await pool.query(
      `SELECT COUNT(*) FROM scans 
       WHERE user_id = $1 AND severity = 'critical'`,
      [userId]
    );

    // Average security score
    const avgScore = await pool.query(
      `SELECT AVG(CAST(findings->>'overallScore' AS FLOAT)) as avg_score
       FROM scans
       WHERE user_id = $1 AND findings IS NOT NULL`,
      [userId]
    );

    res.json({
      metrics: {
        totalScans: parseInt(totalScans.rows[0].count),
        scansLast7Days: parseInt(recentScans.rows[0].count),
        criticalIssuesFound: parseInt(criticalIssues.rows[0].count),
        averageSecurityScore: Math.round(avgScore.rows[0]?.avg_score || 0)
      },
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
 */
router.get('/scan-history', verifyToken, async (req, res) => {
  try {
    const data = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium
       FROM scans
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [req.userId]
    );

    res.json({ historyData: data.rows });
  } catch (error) {
    global.logger?.error('Scan history error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

module.exports = router;
