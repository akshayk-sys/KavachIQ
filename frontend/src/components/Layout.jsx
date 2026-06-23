import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useSocket } from '../hooks/useSocket';
import { 
  LogOut, BarChart3, Zap, AlertCircle, FileText, Menu, X, Crown,
  Bell, CheckCheck, Info, AlertTriangle, Shield, XCircle,
  Settings
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    showPanel,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    togglePanel,
    closePanel
  } = useNotificationStore();

  const { on } = useSocket();
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const unsubNotif = on?.('notification', (data) => {
      addNotification(data);
    });
    const unsubAlert = on?.('security_alert', (data) => {
      addNotification({
        id: Date.now(),
        type: 'security_alert',
        title: '🚨 Security Alert',
        message: data.message,
        severity: data.severity,
        createdAt: data.timestamp,
        read: false
      });
    });
    const unsubCount = on?.('notifications:unread_count', (data) => {
      useNotificationStore.getState().setUnreadCount(data.count);
    });

    return () => {
      unsubNotif?.();
      unsubAlert?.();
      unsubCount?.();
    };
  }, [on]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closePanel]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: BarChart3 },
    { label: 'Security Scans', href: '/scans', icon: Zap },
    { label: 'Threat Intelligence', href: '/threats', icon: AlertCircle },
    { label: 'Audit & Compliance', href: '/audit-logs', icon: FileText },
    { label: 'Upgrade', href: '/upgrade', icon: Crown },
    { label: 'Settings', href: '/settings', icon: Settings }
  ];

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'success': return <CheckCheck className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBorder = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'success': return 'border-l-green-500';
      default: return 'border-l-blue-500';
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:sticky top-0 left-0 z-30 h-full',
        'bg-gray-800 border-r border-gray-700',
        'transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={clsx(
          'p-4 flex items-center',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-500" />
                <span className="text-xl font-bold">KavachIQ</span>
              </div>
              <button onClick={() => { setSidebarOpen(false); setMobileSidebarOpen(false); }} className="lg:hidden">
                <X size={20} />
              </button>
            </>
          ) : (
            <Shield className="w-8 h-8 text-blue-500" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 border border-transparent'
                )}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen && user?.email && (
            <div className="text-xs text-gray-500 mb-3 truncate px-1">{user.email}</div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-all duration-200 border border-red-500/20 text-sm"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="flex-1" />

            {/* Notification Bell */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={togglePanel}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse-glow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {showPanel && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && markAsRead(n.id)}
                          className={clsx(
                            'px-4 py-3 border-l-4 cursor-pointer transition-colors',
                            getSeverityBorder(n.severity),
                            n.read ? 'bg-gray-800/50' : 'bg-gray-700/30 hover:bg-gray-700/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getSeverityIcon(n.severity)}</div>
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                'text-sm',
                                n.read ? 'text-gray-400' : 'text-white font-medium'
                              )}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-600 mt-1">{formatTime(n.createdAt)}</p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
