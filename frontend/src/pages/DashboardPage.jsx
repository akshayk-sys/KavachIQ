import { useEffect, useState } from 'react';
import { dashboardAPI, scansAPI, complianceAPI, adminAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Shield, AlertTriangle, TrendingUp, Clock, ChevronRight, 
  Activity, FileText, Lock, Server, Users, ExternalLink,
  CheckCircle, XCircle, AlertCircle, Info, Eye,
  ShieldOff
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const currentUserRole = useAuthStore(s => s.user?.role);
  const isAdminUser = currentUserRole === 'admin' || currentUserRole === 'super_admin';
  const [threats, setThreats] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState({});
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ show: false, user: null, action: null });
  const [actingUserId, setActingUserId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, threatsRes, historyRes, soc2Res] = await Promise.all([
          dashboardAPI.getMetrics(),
          dashboardAPI.getThreats({ limit: 10 }),
          scansAPI.getScanHistory(),
          complianceAPI.getSOC2Report({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }).catch(() => null)
        ]);

        setMetrics(metricsRes.data.metrics);
        setIsAdminView(metricsRes.data.isAdminView || false);
        setThreats(threatsRes.data.threats);
        setScanHistory(historyRes.data.historyData);
        setComplianceStatus(soc2Res?.data);
        
        // Fetch active users if admin
        if (metricsRes.data.isAdminView) {
          try {
            const usersRes = await adminAPI.getActiveUsers();
            setUsers(usersRes.data.users);
          } catch (e) {
            console.error('Fetch users error:', e);
          } finally {
            setUsersLoading(false);
          }
        } else {
          setUsersLoading(false);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Animate metric values on load
  useEffect(() => {
    if (!metrics) return;
    const targets = {
      totalScans: metrics.totalScans,
      scansLast7Days: metrics.scansLast7Days,
      criticalIssuesFound: metrics.criticalIssuesFound,
      averageSecurityScore: metrics.averageSecurityScore
    };
    const intervals = {};
    Object.entries(targets).forEach(([key, target]) => {
      let current = 0;
      const step = Math.max(1, Math.floor(target / 30));
      intervals[key] = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(intervals[key]);
        }
        setAnimatedValues(prev => ({ ...prev, [key]: current }));
      }, 40);
    });
    return () => Object.values(intervals).forEach(clearInterval);
  }, [metrics]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  const handleBlockUser = async () => {
    if (!actionModal.user) return;
    const { user, action } = actionModal;
    setActingUserId(user.id);
    try {
      if (action === 'block') await adminAPI.blockUser(user.id);
      else if (action === 'unblock') await adminAPI.unblockUser(user.id);
      else if (action === 'delete') await adminAPI.deleteUser(user.id);
      const usersRes = await adminAPI.getActiveUsers();
      setUsers(usersRes.data.users);
    } catch (e) {
      console.error('User action error:', e);
    } finally {
      setActingUserId(null);
      setActionModal({ show: false, user: null, action: null });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-green-500', ring: 'ring-green-500/30', bg: 'bg-green-500/10' };
    if (score >= 60) return { text: 'text-yellow-500', ring: 'ring-yellow-500/30', bg: 'bg-yellow-500/10' };
    return { text: 'text-red-500', ring: 'ring-red-500/30', bg: 'bg-red-500/10' };
  };

  const scoreColor = getScoreColor(animatedValues.averageSecurityScore || 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time security posture overview</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminView && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Admin View — All Users</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">System Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { 
            label: 'Total Scans', value: animatedValues.totalScans || 0, 
            icon: Shield, color: 'blue', format: (v) => v?.toLocaleString(),
            desc: 'All time scans performed'
          },
          { 
            label: 'Last 7 Days', value: animatedValues.scansLast7Days || 0,
            icon: Clock, color: 'green', format: (v) => v?.toLocaleString(),
            desc: 'Scans in the past week'
          },
          { 
            label: 'Critical Issues', value: animatedValues.criticalIssuesFound || 0,
            icon: AlertTriangle, color: 'red', format: (v) => v?.toLocaleString(),
            desc: 'Active critical vulnerabilities'
          },
          { 
            label: 'Security Score', value: metrics?.averageSecurityScore || 0,
            icon: TrendingUp, color: scoreColor.text.includes('green') ? 'green' : scoreColor.text.includes('yellow') ? 'yellow' : 'red',
            format: (v) => `${v}%`,
            desc: 'Overall security rating'
          }
        ].map((card, i) => (
          <div
            key={card.label}
            className="group bg-gray-800/50 backdrop-blur-sm p-5 lg:p-6 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                <p className={`text-2xl lg:text-3xl font-bold mt-2 transition-colors ${
                  card.color === 'red' ? 'text-red-400' : 
                  card.color === 'green' ? 'text-green-400' : 
                  card.color === 'yellow' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {card.format(card.value)}
                </p>
                <p className="text-gray-600 text-xs mt-1">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-xl ${
                card.color === 'red' ? 'bg-red-500/10' : 
                card.color === 'green' ? 'bg-green-500/10' : 
                card.color === 'yellow' ? 'bg-yellow-500/10' :
                'bg-blue-500/10'
              } group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`w-6 h-6 ${
                  card.color === 'red' ? 'text-red-400' : 
                  card.color === 'green' ? 'text-green-400' : 
                  card.color === 'yellow' ? 'text-yellow-400' :
                  'text-blue-400'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin: User Management — gated by API check AND client-side role guard */}
      {isAdminUser && isAdminView && (
        <div className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-amber-400">User Management</h2>
                <p className="text-gray-500 text-xs mt-0.5">{users.length} registered users</p>
              </div>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Last Active</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Scans</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {users.map((user) => {
                    const isCurrentUser = user.id === useAuthStore.getState().user?.id;
                    return (
                      <tr key={user.id} className="hover:bg-gray-700/10 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-gray-200 font-medium text-sm">
                                {user.username}
                                {isCurrentUser && <span className="text-amber-500 text-[10px] ml-1.5">(you)</span>}
                              </p>
                              <p className="text-gray-500 text-xs">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            user.role === 'admin' 
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {user.status === 'blocked' ? (
                            <span className="flex items-center gap-1.5 text-red-400 text-xs">
                              <XCircle size={12} />
                              Blocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-green-400 text-xs">
                              <CheckCircle size={12} />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs">
                          {formatTimeAgo(user.lastActive)}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-300 text-sm font-medium">
                          {user.scanCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCurrentUser && (
                              <>
                                {user.status === 'blocked' ? (
                                  <button
                                    onClick={() => setActionModal({ show: true, user, action: 'unblock' })}
                                    disabled={actingUserId === user.id}
                                    className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition disabled:opacity-50"
                                    title="Unblock user"
                                  >
                                    {actingUserId === user.id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                                    ) : (
                                      <CheckCircle size={14} />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setActionModal({ show: true, user, action: 'block' })}
                                    disabled={actingUserId === user.id}
                                    className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition disabled:opacity-50"
                                    title="Block user"
                                  >
                                    {actingUserId === user.id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                                    ) : (
                                      <ShieldOff className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => setActionModal({ show: true, user, action: 'delete' })}
                                  disabled={actingUserId === user.id}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                  title="Delete user"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Confirmation Modal */}
          {actionModal.show && actionModal.user && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setActionModal({ show: false, user: null, action: null })}
            >
              <div
                className="bg-gray-800 border border-gray-700/50 rounded-xl w-full max-w-md shadow-2xl animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${
                      actionModal.action === 'delete' ? 'bg-red-500/15' :
                      actionModal.action === 'block' || actionModal.action === 'unblock' ? 'bg-yellow-500/15' :
                      'bg-blue-500/15'
                    }`}>
                      {actionModal.action === 'delete' ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : (
                        <ShieldOff className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {actionModal.action === 'block' ? 'Block User' :
                         actionModal.action === 'unblock' ? 'Unblock User' :
                         'Delete User'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{actionModal.user.email}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-5">
                    {actionModal.action === 'block'
                      ? `Are you sure you want to block ${actionModal.user.username}? They will not be able to log in or perform any scans until unblocked.`
                      : actionModal.action === 'unblock'
                        ? `Are you sure you want to unblock ${actionModal.user.username}? They will regain access to their account.`
                        : `Are you sure you want to permanently delete ${actionModal.user.username} and all their data? This action cannot be undone.`}
                  </p>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setActionModal({ show: false, user: null, action: null })}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBlockUser}
                      disabled={actingUserId === actionModal.user.id}
                      className={`px-4 py-2 rounded-lg transition text-sm font-medium disabled:opacity-50 ${
                        actionModal.action === 'delete'
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : actionModal.action === 'block'
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                      }`}
                    >
                      {actingUserId === actionModal.user.id ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {actionModal.action === 'block' ? 'Blocking...' :
                           actionModal.action === 'unblock' ? 'Unblocking...' :
                           'Deleting...'}
                        </span>
                      ) : (
                        actionModal.action === 'block' ? 'Block User' :
                        actionModal.action === 'unblock' ? 'Unblock User' :
                        'Delete User'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Activity Chart */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-5 lg:p-6 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Scan Activity (30 Days)
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-400">Total</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-400">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-400">Critical</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={scanHistory}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
              <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }} 
              />
              <Area type="monotone" dataKey="critical" stroke="#EF4444" fill="url(#colorCritical)" strokeWidth={2} />
              <Area type="monotone" dataKey="high" stroke="#F97316" fill="url(#colorHigh)" strokeWidth={2} />
              <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="url(#colorTotal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active Threats */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-5 lg:p-6 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Active Threats
          </h2>
          <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar">
            {threats.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No active threats</p>
                <p className="text-gray-600 text-xs mt-1">Your environment is secure</p>
              </div>
            ) : (
              threats.map((threat, i) => (
                <div
                  key={threat.id}
                  className="group p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:border-gray-500 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${
                      threat.severity === 'critical' ? 'bg-red-500/20' :
                      threat.severity === 'high' ? 'bg-orange-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <AlertTriangle className={`w-3.5 h-3.5 ${
                        threat.severity === 'critical' ? 'text-red-400' :
                        threat.severity === 'high' ? 'text-orange-400' :
                        'text-yellow-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{threat.threat_type}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{threat.threat_description}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                      threat.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      threat.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {threat.severity?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Compliance & Security Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Status */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-5 lg:p-6 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Compliance Status
            </h2>
            <a href="/audit-logs" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              View Reports <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { name: 'SOC 2', status: 'Compliant', icon: Shield, color: 'green' },
              { name: 'ISO 27001', status: 'Compliant', icon: Lock, color: 'green' },
              { name: 'GDPR', status: 'Compliant', icon: Server, color: 'green' },
              { name: 'PCI DSS', status: 'N/A', icon: Users, color: 'gray' }
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <div className={`p-2 rounded-lg ${
                  item.color === 'green' ? 'bg-green-500/10' :
                  item.color === 'gray' ? 'bg-gray-500/10' : 'bg-yellow-500/10'
                }`}>
                  <item.icon className={`w-4 h-4 ${
                    item.color === 'green' ? 'text-green-400' :
                    item.color === 'gray' ? 'text-gray-400' : 'text-yellow-400'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.name}</p>
                  <p className={`text-sm font-semibold ${
                    item.color === 'green' ? 'text-green-400' :
                    item.color === 'gray' ? 'text-gray-500' : 'text-yellow-400'
                  }`}>{item.status}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-400" />
            Last assessment: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Security Posture Summary */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-5 lg:p-6 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Security Posture
          </h2>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#374151" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke={metrics?.averageSecurityScore >= 80 ? '#10B981' : metrics?.averageSecurityScore >= 60 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40 * (metrics?.averageSecurityScore || 0) / 100} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${
                  metrics?.averageSecurityScore >= 80 ? 'text-green-400' :
                  metrics?.averageSecurityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>{metrics?.averageSecurityScore || 0}%</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'SSL/TLS', score: metrics?.averageSecurityScore >= 80 ? 'Good' : metrics?.averageSecurityScore >= 60 ? 'Fair' : 'Poor', color: metrics?.averageSecurityScore >= 80 ? 'text-green-400' : metrics?.averageSecurityScore >= 60 ? 'text-yellow-400' : 'text-red-400' },
                { label: 'Headers', score: metrics?.averageSecurityScore >= 70 ? 'Good' : 'Needs Work', color: metrics?.averageSecurityScore >= 70 ? 'text-green-400' : 'text-yellow-400' },
                { label: 'Malware', score: 'Clean', color: 'text-green-400' }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                  <span className="text-gray-400">{item.label}:</span>
                  <span className={`font-medium ${item.color}`}>{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-700/30 rounded-lg">
              <p className="text-lg font-bold text-green-400">{metrics?.totalScans || 0}</p>
              <p className="text-xs text-gray-500">Scans</p>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded-lg">
              <p className="text-lg font-bold text-blue-400">{metrics?.scansLast7Days || 0}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded-lg">
              <p className="text-lg font-bold text-red-400">{metrics?.criticalIssuesFound || 0}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: format time ago
function formatTimeAgo(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
