import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import {
  DEMO_USER,
  DEMO_TOKEN,
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
  mockUpgradePlans
} from './mockData';

// ── Demo Mode Detection ──────────────────────────────────────
// Automatically uses demo mode when deployed to Cloudflare
// (i.e., when the site is not accessed via localhost).
const isDemo =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  (!window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1'));

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
      await delay();
      return { data: { id: 'scan-demo-' + Date.now(), ...data, status: 'in_progress', startedAt: new Date().toISOString() } };
    }
    return api.post('/scans', data);
  },
  getScan: async (id) => {
    if (isDemo) {
      await delay();
      return { data: mockScanDetail(id) };
    }
    return api.get(`/scans/${id}`);
  },
  getScans: async (params) => {
    if (isDemo) {
      await delay();
      return { data: mockScans(params?.page, params?.limit) };
    }
    return api.get('/scans', { params });
  },
  getScanHistory: async () => {
    if (isDemo) {
      await delay();
      return { data: mockDashboardMetrics().scanHistory };
    }
    return api.get('/dashboard/scan-history');
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
      return { data: mockDashboardMetrics() };
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
