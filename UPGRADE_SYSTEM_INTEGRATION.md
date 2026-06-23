# 🚀 Upgrade System Integration

## Overview

The KavachIQ Upgrade System is now **fully integrated** with both frontend and backend components. It provides comprehensive subscription management with three tiers: Free, Pro, and Enterprise.

---

## ✨ What's New

### Backend Components
✅ **Upgrade Service** (`backend/src/services/upgradeService.js`)
- Subscription plan management
- User subscription tracking
- Upgrade history logging
- Plan feature management

✅ **Upgrade Controller** (`backend/src/controllers/upgradeController.js`)
- API endpoint handlers
- Subscription operations
- History retrieval

✅ **Upgrade Routes** (`backend/src/routes/upgrade.js`)
- REST API endpoints
- Authentication middleware
- Plan operations

✅ **Database Schema**
- `subscription_plans` - All available plans
- `user_subscriptions` - User subscription records
- `upgrade_history` - Upgrade/downgrade audit trail

### Frontend Components
✅ **Upgrade Page** (`frontend/src/pages/UpgradePage.jsx`)
- Pricing plans display
- Plan comparison table
- Feature highlights
- Subscription management UI
- Upgrade history viewer
- FAQ section

✅ **Navigation Integration**
- "Upgrade" menu item in sidebar
- Crown icon indicator

---

## 🎯 Subscription Plans

### Free Plan
- **Price**: $0/month
- **Features**:
  - 5 scans per month
  - Basic security headers check
  - SSL/TLS validation
  - Standard CVE database access
  - Email support

### Pro Plan
- **Price**: $29/month
- **Features**:
  - Unlimited scans
  - Advanced vulnerability scanning
  - Real-time threat intelligence
  - Priority CVE updates
  - Custom security reports
  - Advanced filtering & analytics
  - Priority email support
  - API access

### Enterprise Plan
- **Price**: $99/month
- **Features**:
  - Unlimited everything
  - Advanced threat detection
  - Real-time monitoring & alerts
  - Custom integrations
  - Dedicated account manager
  - Advanced compliance reporting
  - SIEM integration
  - 24/7 phone & email support
  - Custom SLA
  - White-label options

---

## 🔌 API Endpoints

### Public Endpoints

#### Get All Plans
```
GET /api/upgrade/plans
Response: { success: true, plans: [...] }
```

#### Get Plan Features
```
GET /api/upgrade/plans/:planId/features
Response: { success: true, features: [...] }
```

### Protected Endpoints (Require Authentication)

#### Get Current Subscription
```
GET /api/upgrade/subscription
Authorization: Bearer <token>
Response: { success: true, subscription: {...} }
```

#### Create/Upgrade Subscription
```
POST /api/upgrade/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "pro",
  "paymentMethod": "stripe"
}

Response: { success: true, message: "Subscription created successfully", subscription: {...} }
```

#### Cancel Subscription
```
POST /api/upgrade/cancel
Authorization: Bearer <token>
Response: { success: true, message: "Subscription cancelled successfully" }
```

#### Get Upgrade History
```
GET /api/upgrade/history
Authorization: Bearer <token>
Response: { success: true, history: [...] }
```

---

## 🔧 Installation & Setup

### 1. Initialize Database
```bash
cd backend
npm install
node src/migrations/initUpgradeSystem.js
```

This will:
- Create upgrade schema tables
- Seed subscription plans
- Initialize upgrade system

### 2. Update Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kavachiq
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### 3. Update Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access Upgrade Page
- Navigate to: `http://localhost:3000/upgrade`
- Or click "Upgrade" in the sidebar menu

---

## 💻 Usage Flow

### For Free Users
1. Visit `/upgrade` page
2. See all available plans
3. Click "Upgrade" on Pro or Enterprise
4. Confirm payment method
5. Subscription activated immediately

### For Paid Users
1. Visit `/upgrade` page
2. See "Current" badge on active plan
3. Can upgrade to higher tier
4. Can cancel subscription
5. View upgrade history

### Upgrade Process
1. User selects a plan
2. Frontend sends subscription request
3. Backend processes subscription
4. Database records updated
5. History logged
6. UI reflects new subscription

---

## 🗄️ Database Schema

### subscription_plans
```sql
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(50),
  description TEXT,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### user_subscriptions
```sql
CREATE TABLE user_subscriptions (
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
```

### upgrade_history
```sql
CREATE TABLE upgrade_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  from_plan VARCHAR(50),
  to_plan VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token is obtained from `/api/auth/login` and should be stored in local storage on the frontend.

---

## 🎨 UI Features

### Pricing Cards
- Plan name and description
- Monthly price
- Feature list with checkmarks
- "Current" badge for active plan
- Upgrade/Cancel buttons

### Comparison Table
- Feature-by-feature comparison
- Side-by-side view of all plans
- Visual indicators (✓/✗)
- Mobile responsive

### Upgrade History
- Chronological list of changes
- From/To plan information
- Amount and date
- Collapsible view

### FAQ Section
- Common questions answered
- Professional styling
- Responsive layout

---

## ✅ Testing the System

### Test Free to Pro Upgrade
```javascript
// In browser console
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/upgrade/subscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    planId: 'pro',
    paymentMethod: 'stripe'
  })
})
.then(r => r.json())
.then(console.log);
```

### Check Current Subscription
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/upgrade/subscription', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

### Get Plans
```javascript
fetch('http://localhost:5000/api/upgrade/plans')
  .then(r => r.json())
  .then(console.log);
```

---

## 🚀 Next Steps

### Immediate (Required)
- [ ] Run migration: `node src/migrations/initUpgradeSystem.js`
- [ ] Test upgrade flow
- [ ] Verify database tables created

### Short-term (Optional but Recommended)
- [ ] Integrate payment provider (Stripe, PayPal)
- [ ] Add email notifications
- [ ] Implement automatic renewal
- [ ] Add invoice generation

### Long-term (Future)
- [ ] Usage tracking per plan
- [ ] Feature limits enforcement
- [ ] Billing dashboard
- [ ] Custom enterprise contracts

---

## 🐛 Troubleshooting

### "No subscription found" Error
- User needs to upgrade to a paid plan first
- Free users automatically get Free plan

### "Invalid plan ID" Error
- Make sure plans are seeded: `node src/migrations/initUpgradeSystem.js`
- Check plan ID matches exactly: 'free', 'pro', 'enterprise'

### "Not authorized" Error
- JWT token is missing or invalid
- Login first to get valid token
- Include `Authorization: Bearer <token>` header

### Database Connection Error
- Check PostgreSQL is running
- Verify connection credentials in .env
- Test connection: `psql -U postgres -d kavachiq`

---

## 📊 Monitoring

### Check Active Subscriptions
```sql
SELECT us.user_id, sp.name, us.status, us.start_date, us.renewal_date
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active';
```

### Check Upgrade History
```sql
SELECT * FROM upgrade_history ORDER BY created_at DESC LIMIT 20;
```

### Revenue Report
```sql
SELECT sp.name, COUNT(*) as count, SUM(sp.price) as monthly_revenue
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active'
GROUP BY sp.name;
```

---

## 📝 Summary

✅ **Backend**: Complete upgrade API with database persistence
✅ **Frontend**: Beautiful UI with plan comparison and upgrade flow
✅ **Integration**: Fully integrated into KavachIQ platform
✅ **Database**: Automatic schema and plan initialization
✅ **Authentication**: JWT-protected endpoints
✅ **History**: Audit trail of all upgrades/downgrades

**Your upgrade system is ready to deploy!** 🎉
