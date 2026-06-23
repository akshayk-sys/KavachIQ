import axios from 'axios';
import { useAuthStore } from '../store/authStore';

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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verify: () => api.get('/auth/verify')
};

export const scansAPI = {
  createScan: (data) => api.post('/scans', data),
  getScan: (id) => api.get(`/scans/${id}`),
  getScans: (params) => api.get('/scans', { params }),
  getScanHistory: () => api.get('/dashboard/scan-history')
};

export const cveAPI = {
  search: (params) => api.get('/cve/search', { params }),
  getCVE: (id) => api.get(`/cve/${id}`),
  getThreatIntel: (keyword) => api.get(`/cve/threat-intel/${keyword}`)
};

export const auditAPI = {
  getTrail: (resourceType, resourceId, params) => 
    api.get(`/audit/trail/${resourceType}/${resourceId}`, { params }),
  exportReport: (params) => api.get('/audit/report/export', { params }),
  getSummary: () => api.get('/audit/summary')
};

export const dashboardAPI = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getThreats: (params) => api.get('/dashboard/threats', { params })
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count')
};

export const complianceAPI = {
  getSOC2Report: (params) => api.get('/audit/report/soc2', { params }),
  getISO27001Report: (params) => api.get('/audit/report/iso27001', { params })
};

export const settingsAPI = {
  getKeys: () => api.get('/settings/keys'),
  getKey: (id) => api.get(`/settings/keys/${id}`),
  saveKey: (keyName, value) => api.post('/settings/keys', { keyName, value }),
  toggleKey: (id) => api.put(`/settings/keys/${id}/toggle`),
  deleteKey: (id) => api.delete(`/settings/keys/${id}`),
  getKeyStatus: () => api.get('/settings/keys/status'),
  getSupportedKeys: () => api.get('/settings/keys/supported')
};

export default api;
