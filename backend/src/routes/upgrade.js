const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgradeController');
const { authenticate } = require('../middleware/auth');

// Get all subscription plans
router.get('/plans', upgradeController.getPlans);

// Get user's current subscription
router.get('/subscription', authenticate, upgradeController.getUserSubscription);

// Create or upgrade subscription
router.post('/subscribe', authenticate, upgradeController.createSubscription);

// Cancel subscription
router.post('/cancel', authenticate, upgradeController.cancelSubscription);

// Get upgrade history
router.get('/history', authenticate, upgradeController.getUpgradeHistory);

// Get plan features
router.get('/plans/:planId/features', upgradeController.getPlanFeatures);

module.exports = router;
