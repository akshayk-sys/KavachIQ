const db = require('../config/database');
const upgradeService = require('../services/upgradeService');

exports.getPlans = async (req, res) => {
  try {
    const plans = await upgradeService.getAllPlans();
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    global.logger.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

exports.getPlanFeatures = async (req, res) => {
  try {
    const { planId } = req.params;
    const features = await upgradeService.getPlanFeatures(planId);
    res.json({
      success: true,
      features
    });
  } catch (error) {
    global.logger.error('Error fetching plan features:', error);
    res.status(500).json({ error: 'Failed to fetch plan features' });
  }
};

exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await upgradeService.getUserSubscription(userId);
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    global.logger.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, paymentMethod } = req.body;

    if (!planId || !paymentMethod) {
      return res.status(400).json({ error: 'Plan ID and payment method required' });
    }

    const subscription = await upgradeService.createSubscription(userId, planId, paymentMethod);
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    global.logger.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await upgradeService.cancelSubscription(userId);
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      result
    });
  } catch (error) {
    global.logger.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
};

exports.getUpgradeHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await upgradeService.getUpgradeHistory(userId);
    res.json({
      success: true,
      history
    });
  } catch (error) {
    global.logger.error('Error fetching upgrade history:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade history' });
  }
};
