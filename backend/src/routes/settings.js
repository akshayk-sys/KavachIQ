const express = require('express');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../services/apiKeyEncryption');

const router = express.Router();

// Known API key types the system supports
const SUPPORTED_API_KEYS = [
  {
    key: 'GOOGLE_SAFE_BROWSING_API_KEY',
    label: 'Google Safe Browsing',
    description: 'Used for real-time malware and phishing URL detection',
    docsUrl: 'https://console.cloud.google.com/apis/library/safebrowsing.googleapis.com',
    icon: '🔍'
  },
  {
    key: 'NIST_CVE_API',
    label: 'NIST NVD API',
    description: 'Used for CVE vulnerability database lookups (optional, has free tier)',
    docsUrl: 'https://nvd.nist.gov/developers/request-an-api-key',
    icon: '📋'
  },
  {
    key: 'VIRUSTOTAL_API_KEY',
    label: 'VirusTotal',
    description: 'Used for enhanced malware scanning and threat intelligence',
    docsUrl: 'https://www.virustotal.com/gui/my-apikey',
    icon: '🦠'
  },
  {
    key: 'SHODAN_API_KEY',
    label: 'Shodan',
    description: 'Used for internet-facing service discovery and vulnerability mapping',
    docsUrl: 'https://account.shodan.io/',
    icon: '🌐'
  },
  {
    key: 'GOOGLE_SERVICE_ACCOUNT_KEY_FILE',
    label: 'Google Service Account',
    description: 'Used for Google Docs audit report generation',
    docsUrl: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
    icon: '📄'
  }
];

// Middleware: Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * GET /api/settings/keys
 * Get all configured API keys (without exposing the actual values)
 */
router.get('/keys', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, key_name, service, is_active, last_used_at, created_at, updated_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY service ASC`,
      [req.userId]
    );

    // Merge configured keys with supported key definitions
    const configuredKeys = result.rows;
    const keyMap = {};
    configuredKeys.forEach(k => { keyMap[k.key_name] = k; });

    const merged = SUPPORTED_API_KEYS.map(sk => ({
      ...sk,
      configured: !!keyMap[sk.key],
      id: keyMap[sk.key]?.id || null,
      isActive: keyMap[sk.key]?.is_active || false,
      lastUsedAt: keyMap[sk.key]?.last_used_at || null,
      createdAt: keyMap[sk.key]?.created_at || null
    }));

    res.json({ keys: merged });
  } catch (error) {
    global.logger?.error('Failed to fetch API keys:', error.message);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * GET /api/settings/keys/:id
 * Get a specific API key (value only returned in masked form)
 */
router.get('/keys/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const key = result.rows[0];
    const decrypted = decrypt(key.encrypted_value);
    const masked = decrypted.slice(0, 4) + '*'.repeat(Math.max(decrypted.length - 8, 0)) + decrypted.slice(-4);

    res.json({
      id: key.id,
      keyName: key.key_name,
      service: key.service,
      maskedValue: masked,
      valuePreview: decrypted.slice(0, 8) + '...',
      isActive: key.is_active,
      lastUsedAt: key.last_used_at,
      createdAt: key.created_at
    });
  } catch (error) {
    global.logger?.error('Failed to fetch API key:', error.message);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

/**
 * POST /api/settings/keys
 * Save a new API key
 */
router.post('/keys', verifyToken, async (req, res) => {
  try {
    const { keyName, value } = req.body;

    if (!keyName || !value) {
      return res.status(400).json({ error: 'keyName and value are required' });
    }

    // Validate key name is supported
    const supported = SUPPORTED_API_KEYS.find(k => k.key === keyName);
    if (!supported) {
      return res.status(400).json({ error: `Unknown key: ${keyName}. Supported keys: ${SUPPORTED_API_KEYS.map(k => k.key).join(', ')}` });
    }

    // Encrypt the value
    const encrypted = encrypt(value);

    // Upsert: insert or update
    const result = await pool.query(
      `INSERT INTO api_keys (user_id, key_name, service, encrypted_value, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (user_id, key_name)
       DO UPDATE SET encrypted_value = $4, is_active = TRUE, updated_at = CURRENT_TIMESTAMP
       RETURNING id, key_name, service, is_active, created_at, updated_at`,
      [req.userId, keyName, supported.label, encrypted]
    );

    // Log the audit
    try {
      const auditLogger = require('../services/AuditLogger');
      await auditLogger.log(req.userId, 'API_KEY_SAVED', 'settings', result.rows[0].id, {
        action: 'save',
        keyName
      }, req.ip);
    } catch (e) { /* audit logging is optional */ }

    res.json({
      message: `${supported.label} API key saved successfully`,
      key: result.rows[0]
    });
  } catch (error) {
    global.logger?.error('Failed to save API key:', error.message);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

/**
 * PUT /api/settings/keys/:id/toggle
 * Toggle API key active/inactive
 */
router.put('/keys/:id/toggle', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE api_keys SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, key_name, is_active`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      message: `API key ${result.rows[0].is_active ? 'enabled' : 'disabled'}`,
      key: result.rows[0]
    });
  } catch (error) {
    global.logger?.error('Failed to toggle API key:', error.message);
    res.status(500).json({ error: 'Failed to toggle API key' });
  }
});

/**
 * DELETE /api/settings/keys/:id
 * Delete an API key
 */
router.delete('/keys/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id, key_name',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: `API key "${result.rows[0].key_name}" deleted successfully` });
  } catch (error) {
    global.logger?.error('Failed to delete API key:', error.message);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/**
 * GET /api/settings/keys/resolve/:keyName
 * Resolve an API key value from DB (used internally, admin only)
 * Falls back to process.env if not in DB
 */
router.get('/keys/resolve/:keyName', verifyToken, async (req, res) => {
  try {
    const keyName = req.params.keyName;
    let value = process.env[keyName] || null;

    if (!value) {
      const result = await pool.query(
        'SELECT encrypted_value FROM api_keys WHERE key_name = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
        [keyName]
      );

      if (result.rows.length > 0) {
        value = decrypt(result.rows[0].encrypted_value);

        // Update last_used_at
        await pool.query(
          'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
          [result.rows[0].id]
        );
      }
    }

    res.json({
      keyName,
      configured: !!value,
      value: value || null
    });
  } catch (error) {
    global.logger?.error('Failed to resolve API key:', error.message);
    res.status(500).json({ error: 'Failed to resolve API key' });
  }
});

/**
 * GET /api/settings/keys/supported
 * Get list of supported API keys with descriptions
 */
router.get('/keys/supported', verifyToken, async (req, res) => {
  try {
    // Get which ones are already configured
    const result = await pool.query(
      'SELECT key_name FROM api_keys WHERE user_id = $1 AND is_active = TRUE',
      [req.userId]
    );
    const configured = new Set(result.rows.map(r => r.key_name));

    const keysWithStatus = SUPPORTED_API_KEYS.map(sk => ({
      ...sk,
      configured: configured.has(sk.key)
    }));

    res.json({ supportedKeys: keysWithStatus });
  } catch (error) {
    global.logger?.error('Failed to fetch supported keys:', error.message);
    res.status(500).json({ error: 'Failed to fetch supported keys' });
  }
});

/**
 * GET /api/settings/keys/status
 * Get overall API key configuration status
 */
router.get('/keys/status', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key_name, is_active FROM api_keys WHERE user_id = $1',
      [req.userId]
    );

    const configuredCount = result.rows.filter(r => r.is_active).length;
    const totalCount = SUPPORTED_API_KEYS.length;

    res.json({
      totalKeys: totalCount,
      configuredKeys: configuredCount,
      missingKeys: totalCount - configuredCount,
      allConfigured: configuredCount === totalCount,
      keys: result.rows.map(r => ({
        keyName: r.key_name,
        isActive: r.is_active
      }))
    });
  } catch (error) {
    global.logger?.error('Failed to fetch API key status:', error.message);
    res.status(500).json({ error: 'Failed to fetch API key status' });
  }
});

module.exports = router;
