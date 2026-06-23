const express = require('express');
const CVEService = require('../services/CVEService');
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
 * Search for CVEs
 */
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, version } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const cves = await CVEService.searchCVE(q, version);
    res.json({ query: q, results: cves, total: cves.length });
  } catch (error) {
    global.logger?.error('CVE search error:', error.message);
    res.status(500).json({ error: 'Failed to search CVEs' });
  }
});

/**
 * Get CVE by ID
 */
router.get('/:cveId', verifyToken, async (req, res) => {
  try {
    const { cveId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM cve_records WHERE cve_id = $1',
      [cveId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'CVE not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    global.logger?.error('Get CVE error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve CVE' });
  }
});

/**
 * Get threat intelligence
 */
router.get('/threat-intel/:keyword', verifyToken, async (req, res) => {
  try {
    const { keyword } = req.params;
    const intel = await CVEService.getThreatIntelligence(keyword);
    res.json(intel);
  } catch (error) {
    global.logger?.error('Threat intel error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve threat intelligence' });
  }
});

module.exports = router;
