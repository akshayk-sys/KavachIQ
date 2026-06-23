const db = require('../config/database');

// Subscription Plans Definition
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: null,
    description: 'Get started with basic security scanning',
    features: [
      'Up to 5 scans per month',
      'Basic security headers check',
      'SSL/TLS validation',
      'Standard CVE database access',
      'Email support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingCycle: 'monthly',
    description: 'Advanced security intelligence for professionals',
    features: [
      'Unlimited scans',
      'Advanced vulnerability scanning',
      'Real-time threat intelligence',
      'Priority CVE updates',
      'Custom security reports',
      'Advanced filtering & analytics',
      'Priority email support',
      'API access'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billingCycle: 'monthly',
    description: 'Complete security platform for enterprises',
    features: [
      'Unlimited everything',
      'Advanced threat detection',
      'Real-time monitoring & alerts',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced compliance reporting',
      'SIEM integration',
      '24/7 phone & email support',
      'Custom SLA',
      'White-label options'
    ]
  }
};

class UpgradeService {
  async initializeSchema() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          billing_cycle VARCHAR(50),
          description TEXT,
          features JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS user_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
          status VARCHAR(50) DEFAULT 'active',
          start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          renewal_date TIMESTAMP,
          cancellation_date TIMESTAMP,
          payment_method VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS upgrade_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          from_plan VARCHAR(50),
          to_plan VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          amount DECIMAL(10, 2),
          status VARCHAR(50) DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      global.logger.info('Upgrade schema initialized');
    } catch (error) {
      global.logger.error('Error initializing upgrade schema:', error);
      throw error;
    }
  }

  async seedPlans() {
    try {
      for (const [key, plan] of Object.entries(PLANS)) {
        await db.query(
          `INSERT INTO subscription_plans (id, name, price, billing_cycle, description, features)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [plan.id, plan.name, plan.price, plan.billingCycle, plan.description, JSON.stringify(plan.features)]
        );
      }
      global.logger.info('Subscription plans seeded');
    } catch (error) {
      global.logger.error('Error seeding plans:', error);
      throw error;
    }
  }

  async getAllPlans() {
    try {
      const result = await db.query('SELECT * FROM subscription_plans ORDER BY price ASC');
      return result.rows.map(row => ({
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features
      }));
    } catch (error) {
      global.logger.error('Error fetching all plans:', error);
      throw error;
    }
  }

  async getPlanFeatures(planId) {
    try {
      const result = await db.query(
        'SELECT features FROM subscription_plans WHERE id = $1',
        [planId]
      );

      if (result.rows.length === 0) {
        throw new Error('Plan not found');
      }

      const features = result.rows[0].features;
      return typeof features === 'string' ? JSON.parse(features) : features;
    } catch (error) {
      global.logger.error('Error fetching plan features:', error);
      throw error;
    }
  }

  async getUserSubscription(userId) {
    try {
      const result = await db.query(
        `SELECT us.*, sp.name, sp.price, sp.billing_cycle, sp.features
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = $1 AND us.status = 'active'`,
        [userId]
      );

      if (result.rows.length === 0) {
        // Return free plan if no subscription
        return {
          user_id: userId,
          plan_id: 'free',
          name: 'Free',
          price: 0,
          status: 'active',
          features: PLANS.free.features
        };
      }

      const subscription = result.rows[0];
      return {
        ...subscription,
        features: typeof subscription.features === 'string' ? JSON.parse(subscription.features) : subscription.features
      };
    } catch (error) {
      global.logger.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  async createSubscription(userId, planId, paymentMethod) {
    try {
      // Check if plan exists
      const planResult = await db.query(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Invalid plan ID');
      }

      // Cancel existing subscription if any
      await db.query(
        `UPDATE user_subscriptions SET status = 'cancelled', cancellation_date = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      // Create new subscription
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const result = await db.query(
        `INSERT INTO user_subscriptions (user_id, plan_id, status, renewal_date, payment_method)
         VALUES ($1, $2, 'active', $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET 
           plan_id = EXCLUDED.plan_id,
           status = 'active',
           renewal_date = EXCLUDED.renewal_date,
           payment_method = EXCLUDED.payment_method,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, planId, renewalDate, paymentMethod]
      );

      // Record upgrade history
      await db.query(
        `INSERT INTO upgrade_history (user_id, to_plan, action, amount, status)
         VALUES ($1, $2, 'upgrade', $3, 'completed')`,
        [userId, planId, planResult.rows[0].price]
      );

      global.logger.info(`User ${userId} upgraded to ${planId} plan`);
      return result.rows[0];
    } catch (error) {
      global.logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(userId) {
    try {
      const result = await db.query(
        `UPDATE user_subscriptions SET status = 'cancelled', cancellation_date = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND status = 'active'
         RETURNING *`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      // Record cancellation in history
      await db.query(
        `INSERT INTO upgrade_history (user_id, to_plan, action, status)
         VALUES ($1, 'free', 'downgrade', 'completed')`,
        [userId]
      );

      global.logger.info(`User ${userId} cancelled subscription`);
      return result.rows[0];
    } catch (error) {
      global.logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async getUpgradeHistory(userId) {
    try {
      const result = await db.query(
        `SELECT * FROM upgrade_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      global.logger.error('Error fetching upgrade history:', error);
      throw error;
    }
  }
}

module.exports = new UpgradeService();
