const express = require('express');
const jwt = require('jsonwebtoken');
const NotificationService = require('../services/NotificationService');

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
 * Get user's notifications
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await NotificationService.getUserNotifications(req.userId, limit, offset);
    res.json(result);
  } catch (error) {
    global.logger?.error('Get notifications error:', error.message);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * Mark notification as read
 */
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    global.logger?.error('Mark notification read error:', error.message);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * Mark all notifications as read
 */
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.userId);
    res.json({ success: true });
  } catch (error) {
    global.logger?.error('Mark all read error:', error.message);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * Get unread notification count
 */
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const result = await NotificationService.getUserNotifications(req.userId, 1, 0);
    res.json({ unreadCount: result.unreadCount });
  } catch (error) {
    global.logger?.error('Unread count error:', error.message);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
