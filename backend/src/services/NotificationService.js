const pool = require('../config/database');

class NotificationService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  /**
   * Initialize with Socket.IO server instance
   */
  init(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      const userId = socket.handshake.auth?.userId;
      
      if (userId) {
        // Track user connections
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Send unread notifications count
        this.sendUnreadCount(userId);
        
        socket.on('disconnect', () => {
          const sockets = this.userSockets.get(userId);
          if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.userSockets.delete(userId);
            }
          }
        });
        
        socket.on('notifications:mark_read', async (data) => {
          await this.markAsRead(userId, data.notificationId);
        });
        
        socket.on('notifications:mark_all_read', async () => {
          await this.markAllAsRead(userId);
        });
      }
    });
    
    global.logger?.info('Notification service initialized');
  }

  /**
   * Send a notification to a specific user
   */
  async sendNotification(userId, notification) {
    try {
      // Store in database
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, severity, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          userId,
          notification.type,
          notification.title,
          notification.message,
          notification.severity || 'info',
          JSON.stringify(notification.data || {})
        ]
      );
      
      const saved = result.rows[0];
      
      // Emit to user's room if connected
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification', {
          id: saved.id,
          type: saved.type,
          title: saved.title,
          message: saved.message,
          severity: saved.severity,
          data: saved.data,
          createdAt: saved.created_at,
          read: false
        });
        
        // Also emit updated unread count
        this.sendUnreadCount(userId);
      }
      
      return saved;
    } catch (error) {
      global.logger?.error('Send notification error:', error.message);
    }
  }

  /**
   * Broadcast alert to all connected users
   */
  async broadcastAlert(alert) {
    try {
      // Store in database
      await pool.query(
        `INSERT INTO security_alerts (alert_type, severity, message, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [alert.type, alert.severity, alert.message]
      );
      
      // Broadcast to all connected clients
      if (this.io) {
        this.io.emit('security_alert', {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      global.logger?.error('Broadcast alert error:', error.message);
    }
  }

  /**
   * Send scan completion notification
   */
  async notifyScanComplete(userId, scanId, url, severity) {
    const title = `Scan Complete: ${url}`;
    const message = `Security scan completed with ${severity} severity`;
    
    await this.sendNotification(userId, {
      type: 'scan_complete',
      title,
      message,
      severity: severity === 'critical' || severity === 'high' ? 'warning' : 'success',
      data: { scanId, url, severity }
    });
  }

  /**
   * Send threat alert notification
   */
  async notifyThreatDetected(userId, threat) {
    await this.sendNotification(userId, {
      type: 'threat_detected',
      title: '🚨 Threat Detected',
      message: threat.message || 'A security threat has been detected',
      severity: 'critical',
      data: threat
    });
  }

  /**
   * Send SSL expiration warning
   */
  async notifySSLExpiring(userId, domain, daysRemaining) {
    await this.sendNotification(userId, {
      type: 'ssl_expiring',
      title: 'SSL Certificate Expiring',
      message: `SSL certificate for ${domain} expires in ${daysRemaining} days`,
      severity: daysRemaining <= 7 ? 'critical' : 'warning',
      data: { domain, daysRemaining }
    });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
        [userId]
      );
      
      return {
        notifications: result.rows.map(n => ({
          ...n,
          data: typeof n.data === 'string' ? JSON.parse(n.data) : n.data
        })),
        unreadCount: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      global.logger?.error('Get notifications error:', error.message);
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Send unread count to user
   */
  async sendUnreadCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
        [userId]
      );
      
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notifications:unread_count', {
          count: parseInt(result.rows[0].count)
        });
      }
    } catch (error) {
      global.logger?.error('Send unread count error:', error.message);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId, notificationId) {
    try {
      await pool.query(
        'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      this.sendUnreadCount(userId);
    } catch (error) {
      global.logger?.error('Mark as read error:', error.message);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      await pool.query(
        'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
        [userId]
      );
      this.sendUnreadCount(userId);
    } catch (error) {
      global.logger?.error('Mark all as read error:', error.message);
    }
  }

  /**
   * Get user's online status
   */
  isUserOnline(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  /**
   * Get count of online users
   */
  getOnlineUserCount() {
    return this.userSockets.size;
  }
}

module.exports = new NotificationService();
