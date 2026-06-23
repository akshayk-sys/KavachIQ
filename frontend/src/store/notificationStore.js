import { create } from 'zustand';
import { notificationAPI } from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  showPanel: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0
      });
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      set({ loading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1
    }));
  },

  markAsRead: async (id) => {
    try {
      await notificationAPI.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
  closePanel: () => set({ showPanel: false })
}));
