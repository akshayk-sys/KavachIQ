import { useEffect, useState, useMemo } from 'react';
import { dashboardAPI, cveAPI } from '../services/api';
import { 
  AlertTriangle, Shield, ShieldOff, Activity, Globe, Server,
  ExternalLink, Clock, ChevronDown, ChevronUp, Search, X,
  Filter, Bug, Info, Skull, Target, Terminal, Eye, EyeOff,
  TrendingUp, BarChart3
} from 'lucide-react';

export default function ThreatIntelPage() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedThreat, setExpandedThreat] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [timeRange, setTimeRange] = useState(24); // 24h or 48h

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const res = await dashboardAPI.getThreats({ limit: 100 });
        setThreats(res.data.threats);
      } catch (error) {
        console.error('Fetch threats error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchThreats();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/15 border-red-500/30 text-red-400', dot: 'bg-red-500', fill: 'text-red-400' };
      case 'high': return { bg: 'bg-orange-500/15 border-orange-500/30 text-orange-400', dot: 'bg-orange-500', fill: 'text-orange-400' };
      case 'medium': return { bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', dot: 'bg-yellow-500', fill: 'text-yellow-400' };
      case 'low': return { bg: 'bg-green-500/15 border-green-500/30 text-green-400', dot: 'bg-green-500', fill: 'text-green-400' };
      default: return { bg: 'bg-gray-500/15 border-gray-500/30 text-gray-400', dot: 'bg-gray-500', fill: 'text-gray-400' };
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-red-500/20 text-red-400';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400';
      case 'monitoring': return 'bg-blue-500/20 text-blue-400';
      case 'mitigated': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase().includes('ransom') ? 'ransomware' :
                 type?.toLowerCase().includes('ddos') ? 'ddos' :
                 type?.toLowerCase().includes('phish') ? 'phishing' :
                 type?.toLowerCase().includes('malware') ? 'malware' :
                 type?.toLowerCase().includes('injection') ? 'injection' :
                 type?.toLowerCase().includes('brute') ? 'brute' : 'default') {
      case 'ransomware': return Skull;
      case 'ddos': return Activity;
      case 'phishing': return Eye;
      case 'malware': return Bug;
      case 'injection': return Terminal;
      case 'brute': return ShieldOff;
      default: return AlertTriangle;
    }
  };

  // Derived stats
  const stats = useMemo(() => {
    const critical = threats.filter(t => t.severity === 'critical').length;
    const high = threats.filter(t => t.severity === 'high').length;
    const active = threats.filter(t => t.status === 'active').length;
    return { critical, high, active, total: threats.length };
  }, [threats]);

  // Timeline data: bucket threats by time period
  const timelineData = useMemo(() => {
    const now = Date.now();
    const rangeHours = timeRange;
    const buckets = [];
    const intervalMinutes = rangeHours <= 24 ? 60 : 120; // 1h buckets for 24h, 2h for 48h
    const numBuckets = Math.ceil((rangeHours * 60) / intervalMinutes);

    for (let i = 0; i < numBuckets; i++) {
      const endOffset = (rangeHours * 60 * 60 * 1000) - (i * intervalMinutes * 60 * 1000);
      const startOffset = endOffset - (intervalMinutes * 60 * 1000);
      const endTime = now - startOffset;
      const startTime = now - endOffset;

      // Format label
      const hourPos = Math.round(startOffset / 3600000);
      if (hourPos < 0) break;
      const isRecent = hourPos === 0;
      let label;
      if (rangeHours <= 24 && intervalMinutes === 60) {
        label = isRecent ? 'Now' : hourPos <= 23 ? `${hourPos}h ago` : '';
      } else {
        const startHour = Math.floor(startOffset / 3600000);
        const endHour = Math.floor((startOffset + intervalMinutes * 60000) / 3600000);
        if (startHour >= rangeHours) break;
        label = `${startHour}-${endHour}h`;
      }
      if (!label) continue;

      const threatsInBucket = threats.filter(t => {
        const tTime = new Date(t.timestamp).getTime();
        return tTime >= startTime && tTime < endTime;
      });

      buckets.push({
        label,
        critical: threatsInBucket.filter(t => t.severity === 'critical').length,
        high: threatsInBucket.filter(t => t.severity === 'high').length,
        medium: threatsInBucket.filter(t => t.severity === 'medium').length,
        low: threatsInBucket.filter(t => t.severity === 'low').length,
        total: threatsInBucket.length
      });
    }
    return buckets;
  }, [threats, timeRange]);

  const maxTimelineCount = useMemo(() => {
    return Math.max(1, ...timelineData.map(b => b.total));
  }, [timelineData]);

  // Filtered threats
  const filteredThreats = useMemo(() => {
    return threats.filter(t => {
      if (filter !== 'all' && t.severity !== filter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [t.name, t.type, t.description, t.source, t.target, t.cve, t.ip]
          .filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [threats, filter, statusFilter, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedThreat(expandedThreat === id ? null : id);
  };

  const openDetails = (threat) => {
    setSelectedThreat(threat);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400">Loading threat intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 text-red-400" />
            Threat Intelligence
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Live threat feed — {threats.length} threats monitored across {new Set(threats.map(t => t.source)).size} intelligence sources
          </p>
        </div>
      </div>

      {/* Threat Activity Timeline Chart */}
      <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-200">Threat Activity Timeline</h2>
          </div>
          <div className="flex gap-1 bg-gray-700/30 rounded-lg p-0.5">
            {[24, 48].map(h => (
              <button
                key={h}
                onClick={() => setTimeRange(h)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  timeRange === h
                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-7 w-8 flex flex-col justify-between text-[10px] text-gray-600">
            <span>{maxTimelineCount}</span>
            <span>{Math.ceil(maxTimelineCount / 2)}</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-8">
            <div className="flex items-end gap-1.5 h-36">
              {timelineData.map((bucket, i) => {
                const critH = maxTimelineCount > 0 ? (bucket.critical / maxTimelineCount) * 100 : 0;
                const highH = maxTimelineCount > 0 ? (bucket.high / maxTimelineCount) * 100 : 0;
                const medH = maxTimelineCount > 0 ? (bucket.medium / maxTimelineCount) * 100 : 0;
                const lowH = maxTimelineCount > 0 ? (bucket.low / maxTimelineCount) * 100 : 0;
                const isActive = bucket.total > 0;

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Stacked bar */}
                    <div className="w-full max-w-[28px] flex flex-col-reverse rounded-t cursor-pointer transition-all duration-200 hover:opacity-90 group/bartip">
                      {bucket.critical > 0 && (
                        <div
                          className="w-full bg-red-500 rounded-t"
                          style={{ height: `${Math.max(critH, 4)}%` }}
                        />
                      )}
                      {bucket.high > 0 && (
                        <div
                          className="w-full bg-orange-500"
                          style={{ height: `${Math.max(highH, 4)}%` }}
                        />
                      )}
                      {bucket.medium > 0 && (
                        <div
                          className="w-full bg-yellow-500"
                          style={{ height: `${Math.max(medH, 4)}%` }}
                        />
                      )}
                      {bucket.low > 0 && (
                        <div
                          className="w-full bg-green-500 rounded-b"
                          style={{ height: `${Math.max(lowH, 4)}%` }}
                        />
                      )}
                      {!isActive && (
                        <div className="w-full h-[2px] bg-gray-700/50 rounded-full mt-auto" />
                      )}
                    </div>

                    {/* Time label */}
                    <span className={`text-[9px] mt-1.5 whitespace-nowrap ${
                      isActive ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {bucket.label}
                    </span>

                    {/* Tooltip */}
                    {isActive && (
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-700 border border-gray-600 rounded-lg p-2.5 shadow-xl whitespace-nowrap">
                          <p className="text-xs font-semibold text-white mb-1.5">{bucket.label} Period</p>
                          <div className="space-y-1">
                            {bucket.critical > 0 && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-red-400">{bucket.critical} Critical</span>
                              </div>
                            )}
                            {bucket.high > 0 && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-orange-400">{bucket.high} High</span>
                              </div>
                            )}
                            {bucket.medium > 0 && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="text-yellow-400">{bucket.medium} Medium</span>
                              </div>
                            )}
                            {bucket.low > 0 && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-green-400">{bucket.low} Low</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-600/50">
                            Total: <span className="text-white font-medium">{bucket.total} threats</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-700/30">
            {[
              { label: 'Critical', color: 'bg-red-500' },
              { label: 'High', color: 'bg-orange-500' },
              { label: 'Medium', color: 'bg-yellow-500' },
              { label: 'Low', color: 'bg-green-500' }
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-sm ${l.color}`} />
                <span className="text-[10px] text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Threats', value: stats.total, icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Critical', value: stats.critical, icon: Skull, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'High Severity', value: stats.high, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Active Now', value: stats.active, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
        ].map((s, i) => (
          <div key={s.label} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-5 h-5 ${s.color} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
        <Filter className="w-4 h-4 text-gray-500" />
        
        {/* Severity filter */}
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === s
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Status filter */}
        <div className="flex gap-1">
          {['all', 'active', 'investigating', 'monitoring', 'mitigated'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threats, CVEs, IPs..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-600">
        Showing {filteredThreats.length} of {threats.length} threats
      </p>

      {/* Threat cards or empty state */}
      {filteredThreats.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShieldOff size={48} className="mx-auto mb-4 opacity-50" />
          <p>No threats match your filters</p>
          {(filter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => { setFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreats.map((threat, idx) => {
            const colors = getSeverityColor(threat.severity);
            const TypeIcon = getTypeIcon(threat.type);
            const isExpanded = expandedThreat === threat.id;

            return (
              <div
                key={threat.id}
                className="bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden transition hover:border-gray-600/50"
              >
                {/* Threat header (always visible) */}
                <div
                  onClick={() => toggleExpand(threat.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/20 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${colors.bg}`}>
                      <TypeIcon className={`w-4 h-4 ${colors.fill}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">{threat.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors.bg}`}>
                          {threat.severity?.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(threat.status)}`}>
                          {threat.status?.toUpperCase()}
                        </span>
                        {threat.cve && (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-mono">
                            {threat.cve}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{threat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-xs text-gray-600 hidden lg:block">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatTimeAgo(threat.timestamp)}
                    </span>
                    <span className="text-xs text-gray-600">{threat.source}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-700/30 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
                      {/* Main description */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="p-3 bg-gray-700/20 rounded-lg">
                          <p className="text-sm text-gray-300 leading-relaxed">{threat.description}</p>
                        </div>
                        
                        {threat.mitigation && (
                          <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                            <p className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" />
                              Mitigation
                            </p>
                            <p className="text-sm text-gray-400 leading-relaxed">{threat.mitigation}</p>
                          </div>
                        )}

                        {threat.iocs && threat.iocs.length > 0 && (
                          <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                            <p className="text-xs font-semibold text-blue-400 mb-1.5 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5" />
                              Indicators of Compromise (IoCs)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {threat.iocs.map((ioc, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300 font-mono">{ioc}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sidebar metadata */}
                      <div className="space-y-2.5">
                        {threat.target && (
                          <div className="flex items-center justify-between p-2.5 bg-gray-700/20 rounded-lg">
                            <span className="text-xs text-gray-500">Target</span>
                            <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              {threat.target}
                            </span>
                          </div>
                        )}
                        {threat.ip && (
                          <div className="flex items-center justify-between p-2.5 bg-gray-700/20 rounded-lg">
                            <span className="text-xs text-gray-500">Source IP</span>
                            <span className="text-xs text-gray-300 font-mono">{threat.ip}</span>
                          </div>
                        )}
                        {threat.score !== undefined && (
                          <div className="flex items-center justify-between p-2.5 bg-gray-700/20 rounded-lg">
                            <span className="text-xs text-gray-500">Confidence</span>
                            <span className={`text-xs font-bold ${threat.score >= 80 ? 'text-red-400' : threat.score >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {threat.score}%
                            </span>
                          </div>
                        )}
                        {threat.attack_vector && (
                          <div className="flex items-center justify-between p-2.5 bg-gray-700/20 rounded-lg">
                            <span className="text-xs text-gray-500">Vector</span>
                            <span className="text-xs text-gray-300">{threat.attack_vector}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-2.5 bg-gray-700/20 rounded-lg">
                          <span className="text-xs text-gray-500">Detected</span>
                          <span className="text-xs text-gray-300">{formatTimeAgo(threat.timestamp)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-700/20 rounded-lg">
                          <span className="text-xs text-gray-500">Source</span>
                          <span className="text-xs text-blue-400">{threat.source}</span>
                        </div>

                        {/* View Details button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetails(threat); }}
                          className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-lg transition text-xs"
                        >
                          <Info size={13} />
                          Full Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Threat Detail Modal */}
      {showDetailsModal && selectedThreat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-gray-800 border border-gray-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700/50 p-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getSeverityColor(selectedThreat.severity).bg}`}>
                  <Bug className={`w-5 h-5 ${getSeverityColor(selectedThreat.severity).fill}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedThreat.name}</h3>
                  <p className="text-xs text-gray-500">Threat Analysis Report</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700/30 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getSeverityColor(selectedThreat.severity).bg}`}>
                  {selectedThreat.severity?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(selectedThreat.status)}`}>
                  {selectedThreat.status?.toUpperCase()}
                </span>
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-mono">
                  {selectedThreat.source}
                </span>
                {selectedThreat.cve && (
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-bold">
                    {selectedThreat.cve}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-600/20 border border-gray-600/30 text-gray-400 rounded-lg text-xs">
                  {selectedThreat.type}
                </span>
              </div>

              {/* Full Description */}
              <div className="p-4 bg-gray-700/20 rounded-xl border border-gray-700/30">
                <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  Threat Description
                </h5>
                <p className="text-sm text-gray-400 leading-relaxed">{selectedThreat.longDescription || selectedThreat.description}</p>
              </div>

              {/* Impact Analysis */}
              {selectedThreat.impact && (
                <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                  <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Potential Impact
                  </h5>
                  <p className="text-sm text-gray-400 leading-relaxed">{selectedThreat.impact}</p>
                </div>
              )}

              {/* Mitigation */}
              {selectedThreat.mitigation && (
                <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                  <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Mitigation & Response
                  </h5>
                  <p className="text-sm text-gray-400 leading-relaxed">{selectedThreat.mitigation}</p>
                </div>
              )}

              {/* IoCs */}
              {selectedThreat.iocs?.length > 0 && (
                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Indicators of Compromise (IoCs)
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedThreat.iocs.map((ioc, i) => (
                      <span key={i} className="px-2.5 py-1.5 bg-gray-700/50 rounded-lg text-xs text-gray-300 font-mono border border-gray-600/30">
                        {ioc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Type', value: selectedThreat.type },
                  { label: 'Severity', value: selectedThreat.severity?.toUpperCase() },
                  { label: 'Status', value: selectedThreat.status?.toUpperCase() },
                  { label: 'Attack Vector', value: selectedThreat.attack_vector || 'N/A' },
                  { label: 'Confidence', value: selectedThreat.score !== undefined ? `${selectedThreat.score}%` : 'N/A' },
                  { label: 'Target', value: selectedThreat.target || 'N/A' },
                  { label: 'Source IP', value: selectedThreat.ip || 'N/A' },
                  { label: 'Detected', value: formatTimeAgo(selectedThreat.timestamp) },
                  { label: 'Intelligence Source', value: selectedThreat.source },
                  { label: 'MITRE ATT&CK', value: selectedThreat.mitre_id || 'N/A' },
                  { label: 'Affected Products', value: selectedThreat.affected_products || 'N/A' },
                  { label: 'CVE ID', value: selectedThreat.cve || 'N/A' }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-700/20 rounded-lg">
                    <p className="text-[10px] text-gray-500 mb-0.5">{item.label}</p>
                    <p className={`text-xs font-medium ${
                      item.value === 'CRITICAL' ? 'text-red-400' :
                      item.value === 'HIGH' ? 'text-orange-400' :
                      item.value === 'ACTIVE' ? 'text-red-400' :
                      item.value === 'N/A' ? 'text-gray-500' :
                      'text-gray-200'
                    }`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* CVE Reference */}
              {selectedThreat.cve && (
                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    External References
                  </h5>
                  <div className="space-y-2">
                    <a href={`https://nvd.nist.gov/vuln/detail/${selectedThreat.cve}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                      <ExternalLink size={14} /> NVD: {selectedThreat.cve}
                    </a>
                    {selectedThreat.mitre_id && (
                      <a href={`https://attack.mitre.org/techniques/${selectedThreat.mitre_id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                        <ExternalLink size={14} /> MITRE ATT&CK: {selectedThreat.mitre_id}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-md border-t border-gray-700/50 p-4 flex justify-end rounded-b-2xl">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: format time ago
function formatTimeAgo(dateStr) {
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
}