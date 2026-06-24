import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import {
  DEMO_USER,
  DEMO_TOKEN,
  MockStore,
  generateScanReport,
  mockDashboardMetrics,
  mockScans,
  mockScanDetail,
  mockCVESearch,
  mockCVE,
  mockThreatIntel,
  mockThreats,
  mockAuditTrail,
  mockAuditSummary,
  mockNotifications,
  mockUnreadCount,
  mockApiKeys,
  mockKeyStatus,
  mockSupportedKeys,
  mockSOC2Report,
  mockISO27001Report,
  mockActiveUsers,
  mockUpgradePlans,
  addAuditEntry,
  blockUserById,
  unblockUserById,
  deleteUserById
} from './mockData';

// ── Demo Mode Detection ──────────────────────────────────────
// Automatically uses demo mode when deployed to Cloudflare
// (i.e., when the site is not accessed via localhost).
// Demo mode uses mock data when no backend is available.
// Set VITE_DEMO_MODE=false to connect to a real backend.
const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ── Demo Mode Helpers ────────────────────────────────────────
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ── Auth API ──────────────────────────────────────────────────
export const authAPI = {
  register: async (data) => {
    if (isDemo) {
      await delay();
      return { data: { message: 'Registration successful. Please login.', user: { ...DEMO_USER, ...data } } };
    }
    return api.post('/auth/register', data);
  },
  login: async (data) => {
    if (isDemo) {
      await delay(500);
      return { data: { token: DEMO_TOKEN, user: DEMO_USER } };
    }
    return api.post('/auth/login', data);
  },
  verify: async () => {
    if (isDemo) {
      await delay();
      return { data: { valid: true, user: DEMO_USER } };
    }
    return api.get('/auth/verify');
  }
};

// ── Scans API ─────────────────────────────────────────────────
export const scansAPI = {
  createScan: async (data) => {
    if (isDemo) {
      await delay(800);
      const currentUser = useAuthStore.getState().user;
      const scanId = 'scan-demo-' + Date.now();
      
      // Generate a complete scan report for the website being scanned
      const scanUrl = data.website_url;
      const report = generateScanReport(scanUrl);
      
      const newScan = {
        id: scanId,
        type: data.scan_type || 'Full Vulnerability',
        website_url: scanUrl,
        target: scanUrl,
        created_at: new Date().toISOString(),
        status: 'completed',
        user_id: currentUser?.id || 'demo-user-001',
        user_email: currentUser?.email || 'demo@kavachiq.com',
        user_name: currentUser?.username || 'demouser',
        // Store the full report data so mockScanDetail returns it directly
        findings: report.findings,
        ssl_status: report.ssl_status,
        impact_analysis: report.impact_analysis,
        severity: report.severity,
        vulnerabilitiesFound: report.vulnerabilitiesFound,
        score: report.score,
        summary: report.summary,
        vulnerabilities: report.vulnerabilities
      };
      MockStore.addScan(newScan);
      return { data: { ...newScan, message: 'Scan completed. Full report generated.' } };
    }
    return api.post('/scans', data);
  },
  getScan: async (id) => {
    if (isDemo) {
      await delay();
      const currentUser = useAuthStore.getState().user;
      return { data: mockScanDetail(id, currentUser) };
    }
    return api.get(`/scans/${id}`);
  },
  getScans: async (params) => {
    if (isDemo) {
      await delay();
      const currentUser = useAuthStore.getState().user;
      return { data: mockScans(params?.page, params?.limit, currentUser) };
    }
    return api.get('/scans', { params });
  },
  getScanHistory: async () => {
    if (isDemo) {
      await delay();
      const currentUser = useAuthStore.getState().user;
      return { data: { historyData: mockDashboardMetrics(currentUser).scanHistory, isAdminView: currentUser?.role === 'admin' } };
    }
    return api.get('/dashboard/scan-history');
  },
  deleteScan: async (id) => {
    if (isDemo) {
      await delay(400);
      // Find the scan from the persistent store and soft-delete it
      const scanToDelete = MockStore.getAllScans().find(s => s.id === id);
      if (scanToDelete) {
        MockStore.softDeleteScan(scanToDelete);
      } else {
        // Already in trash — permanently delete
        MockStore.permanentDeleteScan(id);
      }
      return { data: { success: true, message: 'Scan moved to trash' } };
    }
    return api.delete(`/scans/${id}`);
  }
};

// ── CVE API ───────────────────────────────────────────────────
export const cveAPI = {
  search: async (params) => {
    if (isDemo) {
      await delay();
      return { data: mockCVESearch(params?.q || '') };
    }
    return api.get('/cve/search', { params });
  },
  getCVE: async (id) => {
    if (isDemo) {
      await delay();
      return { data: mockCVE(id) };
    }
    return api.get(`/cve/${id}`);
  },
  getThreatIntel: async (keyword) => {
    if (isDemo) {
      await delay();
      return { data: mockThreatIntel(keyword) };
    }
    return api.get(`/cve/threat-intel/${keyword}`);
  }
};

// ── Audit API ─────────────────────────────────────────────────
export const auditAPI = {
  getTrail: async (resourceType, resourceId, params) => {
    if (isDemo) {
      await delay();
      return { data: mockAuditTrail(resourceType, resourceId) };
    }
    return api.get(`/audit/trail/${resourceType}/${resourceId}`, { params });
  },
  exportReport: async (params) => {
    if (isDemo) {
      await delay();
      return { data: { url: '#', message: 'Report export simulated in demo mode' } };
    }
    return api.get('/audit/report/export', { params });
  },
  getSummary: async () => {
    if (isDemo) {
      await delay();
      return { data: mockAuditSummary() };
    }
    return api.get('/audit/summary');
  }
};

// ── Dashboard API ─────────────────────────────────────────────
export const dashboardAPI = {
  getMetrics: async () => {
    if (isDemo) {
      await delay();
      const currentUser = useAuthStore.getState().user;
      const metrics = mockDashboardMetrics(currentUser);
      return { data: { metrics, isAdminView: currentUser?.role === 'admin' || currentUser?.role === 'super_admin' } };
    }
    return api.get('/dashboard/metrics');
  },
  getThreats: async (params) => {
    if (isDemo) {
      await delay();
      return { data: mockThreats(params) };
    }
    return api.get('/dashboard/threats', { params });
  }
};

// ── Notifications API ─────────────────────────────────────────
export const notificationAPI = {
  getAll: async (params) => {
    if (isDemo) {
      await delay();
      return { data: mockNotifications(params) };
    }
    return api.get('/notifications', { params });
  },
  markRead: async (id) => {
    if (isDemo) {
      await delay();
      return { data: { success: true } };
    }
    return api.put(`/notifications/${id}/read`);
  },
  markAllRead: async () => {
    if (isDemo) {
      await delay();
      return { data: { success: true } };
    }
    return api.put('/notifications/read-all');
  },
  getUnreadCount: async () => {
    if (isDemo) {
      await delay();
      return { data: mockUnreadCount() };
    }
    return api.get('/notifications/unread-count');
  }
};

// ── Compliance API ────────────────────────────────────────────
export const complianceAPI = {
  getSOC2Report: async (params) => {
    if (isDemo) {
      await delay();
      return { data: mockSOC2Report() };
    }
    return api.get('/audit/report/soc2', { params });
  },
  getISO27001Report: async (params) => {
    if (isDemo) {
      await delay();
      return { data: mockISO27001Report() };
    }
    return api.get('/audit/report/iso27001', { params });
  }
};

// ── Settings API ──────────────────────────────────────────────
export const settingsAPI = {
  getKeys: async () => {
    if (isDemo) {
      await delay();
      return { data: mockApiKeys() };
    }
    return api.get('/settings/keys');
  },
  getKey: async (id) => {
    if (isDemo) {
      await delay();
      return { data: { id, name: 'Demo Key', status: 'configured', lastUsed: new Date().toISOString(), createdAt: '2026-06-01' } };
    }
    return api.get(`/settings/keys/${id}`);
  },
  saveKey: async (keyName, value) => {
    if (isDemo) {
      await delay();
      return { data: { id: 'key-' + Date.now(), name: keyName, status: 'configured', createdAt: new Date().toISOString() } };
    }
    return api.post('/settings/keys', { keyName, value });
  },
  toggleKey: async (id) => {
    if (isDemo) {
      await delay();
      return { data: { success: true, enabled: true } };
    }
    return api.put(`/settings/keys/${id}/toggle`);
  },
  deleteKey: async (id) => {
    if (isDemo) {
      await delay();
      return { data: { success: true } };
    }
    return api.delete(`/settings/keys/${id}`);
  },
  getKeyStatus: async () => {
    if (isDemo) {
      await delay();
      return { data: mockKeyStatus() };
    }
    return api.get('/settings/keys/status');
  },
  getSupportedKeys: async () => {
    if (isDemo) {
      await delay();
      return { data: mockSupportedKeys() };
    }
    return api.get('/settings/keys/supported');
  }
};

// ── Trash / Recycle Bin API (Demo Mode) ─────────────────────
export const trashAPI = {
  getDeletedScans: async () => {
    if (isDemo) {
      await delay(200);
      return { data: { scans: MockStore.getDeletedScans() } };
    }
    return api.get('/scans/trash');
  },
  restoreScan: async (id) => {
    if (isDemo) {
      await delay(300);
      MockStore.restoreScan(id);
      return { data: { success: true, message: 'Scan restored from trash' } };
    }
    return api.post(`/scans/${id}/restore`);
  },
  permanentDelete: async (id) => {
    if (isDemo) {
      await delay(300);
      MockStore.permanentDeleteScan(id);
      return { data: { success: true, message: 'Scan permanently deleted' } };
    }
    return api.delete(`/scans/${id}/permanent`);
  },
  emptyTrash: async () => {
    if (isDemo) {
      await delay(400);
      MockStore.emptyTrash();
      return { data: { success: true, message: 'Trash emptied' } };
    }
    return api.delete('/scans/trash/empty');
  },
  hasExampleScans: async () => {
    if (isDemo) {
      return { data: { hasExamples: MockStore.hasExampleScans() } };
    }
    return api.get('/scans/has-examples');
  },
  removeExampleScans: async () => {
    if (isDemo) {
      await delay(300);
      const count = MockStore.removeExampleScans();
      return { data: { success: true, count, message: `${count} example scan${count !== 1 ? 's' : ''} removed` } };
    }
    return api.post('/scans/remove-examples');
  }
};

// ── Admin / User Management API ──────────────────────────────
export const adminAPI = {
  getActiveUsers: async () => {
    if (isDemo) {
      await delay();
      return { data: { users: mockActiveUsers() } };
    }
    return api.get('/admin/users');
  },
  blockUser: async (userId) => {
    if (isDemo) {
      await delay(400);
      const currentUser = useAuthStore.getState().user;
      blockUserById(userId);
      addAuditEntry('user_blocked', { id: userId, username: userId }, `User ${userId} blocked by ${currentUser?.username || 'admin'}`);
      return { data: { success: true, message: 'User blocked successfully' } };
    }
    return api.post(`/admin/users/${userId}/block`);
  },
  unblockUser: async (userId) => {
    if (isDemo) {
      await delay(400);
      const currentUser = useAuthStore.getState().user;
      unblockUserById(userId);
      addAuditEntry('user_unblocked', { id: userId, username: userId }, `User ${userId} unblocked by ${currentUser?.username || 'admin'}`);
      return { data: { success: true, message: 'User unblocked successfully' } };
    }
    return api.post(`/admin/users/${userId}/unblock`);
  },
  deleteUser: async (userId) => {
    if (isDemo) {
      await delay(400);
      const currentUser = useAuthStore.getState().user;
      deleteUserById(userId);
      addAuditEntry('user_deleted', { id: userId, username: userId }, `User ${userId} deleted by ${currentUser?.username || 'admin'}`);
      return { data: { success: true, message: 'User deleted successfully' } };
    }
    return api.delete(`/admin/users/${userId}`);
  }
};

// ── Upgrade API ───────────────────────────────────────────────
export const upgradeAPI = {
  getPlans: async () => {
    if (isDemo) {
      await delay();
      return { data: mockUpgradePlans() };
    }
    return api.get('/upgrade/plans');
  },
  getSubscription: async () => {
    if (isDemo) {
      await delay();
      return { data: { subscription: { plan_id: 'free', name: 'Free', status: 'active' } } };
    }
    return api.get('/upgrade/subscription');
  },
  getHistory: async () => {
    if (isDemo) {
      await delay();
      return { data: { history: [] } };
    }
    return api.get('/upgrade/history');
  },
  subscribe: async (planId, paymentMethod) => {
    if (isDemo) {
      await delay(800);
      return { data: { success: true, message: `Upgrade to ${planId} successful (demo)`, subscription: { plan_id: planId, name: planId.charAt(0).toUpperCase() + planId.slice(1), status: 'active' } } };
    }
    return api.post('/upgrade/subscribe', { planId, paymentMethod });
  },
  cancel: async () => {
    if (isDemo) {
      await delay(500);
      return { data: { success: true, message: 'Subscription cancelled (demo)' } };
    }
    return api.post('/upgrade/cancel');
  }
};

export default api;
