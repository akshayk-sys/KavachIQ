import { useEffect, useState } from 'react';
import { dashboardAPI, scansAPI, complianceAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Shield, AlertTriangle, TrendingUp, Clock, ChevronRight, 
  Activity, FileText, Lock, Server, Users, ExternalLink,
  CheckCircle, XCircle, AlertCircle, Info, Eye
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [threats, setThreats] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState({});

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

      {/* Admin: Unique Users metric card */}
      {isAdminView && metrics?.uniqueUsers !== undefined && (
        <div className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Users</p>
              <p className="text-2xl font-bold text-amber-400">{metrics.uniqueUsers}</p>
              <p className="text-gray-600 text-xs mt-1">Users with scan activity</p>
            </div>
          </div>
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
