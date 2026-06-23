const upgradeService = require('../services/upgradeService');

async function initializeUpgradeSystem() {
  try {
    console.log('🚀 Initializing Upgrade System...');
    
    // Initialize schema
    await upgradeService.initializeSchema();
    console.log('✅ Schema initialized');
    
    // Seed plans
    await upgradeService.seedPlans();
    console.log('✅ Plans seeded');
    
    console.log('🎉 Upgrade system initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing upgrade system:', error);
    process.exit(1);
  }
}

initializeUpgradeSystem();
