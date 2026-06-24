import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { scansAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  Zap, Plus, UserCog, Eye, Globe, Clock, ArrowUpRight,
  History, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

export default function ScansPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedWebsites, setExpandedWebsites] = useState({});
  const [url, setUrl] = useState('');

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const res = await scansAPI.getScans();
      setScans(res.data.scans);
    } catch (error) {
      console.error('Fetch scans error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    try {
      await scansAPI.createScan({ website_url: url, scan_type: 'full' });
      setUrl('');
      setShowForm(false);
      fetchScans();
    } catch (error) {
      console.error('Create scan error:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/10 border-green-500/20 text-green-400';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const formatTimeAgo = (dateStr) => {
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

  // Group scans by website URL, sorted newest-first per group
  const groupedScans = useMemo(() => {
    const groups = {};
    for (const scan of scans) {
      const url = scan.website_url || scan.target || 'Unknown';
      if (!groups[url]) groups[url] = [];
      groups[url].push(scan);
    }
    // Sort scans within each group by date (newest first)
    for (const url of Object.keys(groups)) {
      groups[url].sort((a, b) => new Date(b.created_at || b.startedAt) - new Date(a.created_at || a.startedAt));
    }
    // Sort groups by the newest scan across all groups
    const sorted = Object.entries(groups).sort(([, a], [, b]) => 
      new Date(b[0].created_at || b[0].startedAt) - new Date(a[0].created_at || a[0].startedAt)
    );
    return sorted;
  }, [scans]);

  const toggleWebsite = (url) => {
    setExpandedWebsites(prev => ({ ...prev, [url]: !prev[url] }));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Security Scans</h1>
          <p className="text-gray-400 text-sm mt-1">
            {scans.length} scan{scans.length !== 1 ? 's' : ''} across {groupedScans.length} website{groupedScans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus size={20} />
          New Scan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateScan} className="mb-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              required
            />
            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              Scan Now
            </button>
          </div>
        </form>
      )}

      {/* Admin view indicator */}
      {isAdmin && (
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-sm text-amber-300 font-medium">Admin View</p>
            <p className="text-xs text-amber-400/70">Showing scans from all users</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Zap className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-400">Loading scans...</p>
          </div>
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Zap size={48} className="mx-auto mb-4 opacity-50" />
          <p>No scans yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedScans.map(([websiteUrl, websiteScans]) => {
            const latestScan = websiteScans[0];
            const hasMultiple = websiteScans.length > 1;
            const isExpanded = expandedWebsites[websiteUrl] !== false; // default expanded
            const worstSeverity = websiteScans.reduce((worst, s) => {
              const order = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
              return order[s.severity] > order[worst] ? s.severity : worst;
            }, 'none');

            return (
              <div key={websiteUrl} className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                {/* Website Header */}
                <div
                  onClick={() => hasMultiple && toggleWebsite(websiteUrl)}
                  className={`flex items-center justify-between p-5 border-b border-gray-700/50 ${hasMultiple ? 'cursor-pointer hover:bg-gray-700/30' : ''} transition`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                      <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold truncate">{websiteUrl}</h2>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBg(worstSeverity)}`}>
                          {worstSeverity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Latest: {formatTimeAgo(latestScan.created_at || latestScan.startedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3" />
                          {websiteScans.length} scan{websiteScans.length !== 1 ? 's' : ''}
                        </span>
                        {isAdmin && latestScan.user_email && (
                          <span className="flex items-center gap-1">
                            <UserCog className="w-3 h-3" />
                            {latestScan.user_name || latestScan.user_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hasMultiple && (
                      <button className="text-gray-500 hover:text-gray-300 transition">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Latest Scan Preview (always visible) */}
                <div
                  onClick={() => navigate(`/scans/${latestScan.id}`)}
                  className="p-4 border-b border-gray-700/30 cursor-pointer hover:bg-gray-700/20 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status icon */}
                      <div className={`p-1.5 rounded-full flex-shrink-0 ${
                        latestScan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        latestScan.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        latestScan.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {latestScan.status === 'completed' ? <CheckCircle2 size={14} /> :
                         latestScan.status === 'in_progress' ? <Clock size={14} /> :
                         latestScan.status === 'failed' ? <XCircle size={14} /> :
                         <AlertTriangle size={14} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {latestScan.type || 'Security Scan'}
                          </span>
                          {/* Latest badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            <ArrowUpRight size={10} />
                            Latest
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{formatTimeAgo(latestScan.created_at || latestScan.startedAt)}</span>
                          <span>•</span>
                          <span className="capitalize">{latestScan.status?.replace('_', ' ')}</span>
                          {latestScan.score && (
                            <>
                              <span>•</span>
                              <span>Score: {latestScan.score}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {latestScan.severity && (
                        <span className={`inline-block px-2.5 py-1 rounded text-white text-xs font-semibold ${getSeverityColor(latestScan.severity)}`}>
                          {latestScan.severity.toUpperCase()}
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition" />
                    </div>
                  </div>
                </div>

                {/* Older scans (collapsible) */}
                {hasMultiple && isExpanded && (
                  <div className="divide-y divide-gray-700/30">
                    {websiteScans.slice(1).map((scan) => (
                      <div
                        key={scan.id}
                        onClick={() => navigate(`/scans/${scan.id}`)}
                        className="p-3.5 pl-14 cursor-pointer hover:bg-gray-700/20 transition group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1 rounded-full flex-shrink-0 ${
                              scan.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                              scan.status === 'in_progress' ? 'bg-yellow-500/15 text-yellow-400' :
                              scan.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                              'bg-gray-500/15 text-gray-400'
                            }`}>
                              {scan.status === 'completed' ? <CheckCircle2 size={12} /> :
                               scan.status === 'in_progress' ? <Clock size={12} /> :
                               scan.status === 'failed' ? <XCircle size={12} /> :
                               <AlertTriangle size={12} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300">{scan.type || 'Security Scan'}</span>
                                {scan.score && (
                                  <span className="text-xs text-gray-500">Score: {scan.score}%</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {formatTimeAgo(scan.created_at || scan.startedAt)}
                                <span className="mx-1.5">•</span>
                                <span className="capitalize">{scan.status?.replace('_', ' ')}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {scan.severity && (
                              <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-semibold ${getSeverityColor(scan.severity)}`}>
                                {scan.severity.toUpperCase()}
                              </span>
                            )}
                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show count of older scans when collapsed */}
                {hasMultiple && !isExpanded && (
                  <div className="px-5 py-2.5 text-xs text-gray-500">
                    {websiteScans.length - 1} older scan{websiteScans.length - 1 !== 1 ? 's' : ''} — click to expand
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
