import { useEffect, useState, useMemo } from 'react';
import { auditAPI, complianceAPI } from '../services/api';
import { 
  FileText, Download, BarChart3, Shield, Lock, CheckCircle, XCircle, 
  AlertTriangle, Info, ChevronDown, ChevronUp, ExternalLink, Clock,
  Users, Server, Activity, ArrowRight, Search, X, Filter, Calendar
} from 'lucide-react';

// ── Pagination Helper ─────────────────────────────────────────
function generatePageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('...');

  for (let i = start; i <= end; i++) pages.push(i);

  if (end < total - 1) pages.push('...');

  if (total > 1) pages.push(total);

  return pages;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trailEntries, setTrailEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [soc2Report, setSoc2Report] = useState(null);
  const [isoReport, setIsoReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  // ── Filter State ────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // ── Derived: unique actions for dropdown ────────────────
  const uniqueActions = useMemo(() => {
    const actions = new Set(trailEntries.map(e => e.action));
    return Array.from(actions).sort();
  }, [trailEntries]);

  // ── Derived: filtered entries ───────────────────────────
  const filteredEntries = useMemo(() => {
    let result = trailEntries;

    // Text search across multiple fields
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(e =>
        e.action?.toLowerCase().includes(q) ||
        e.user?.toLowerCase().includes(q) ||
        e.resourceType?.toLowerCase().includes(q) ||
        e.resourceId?.toString().toLowerCase().includes(q) ||
        e.ip?.toLowerCase().includes(q) ||
        e.details?.toLowerCase().includes(q) ||
        e.status?.toLowerCase().includes(q)
      );
    }

    // Action type filter
    if (actionFilter !== 'all') {
      result = result.filter(e => e.action === actionFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }

    // Date range filter
    if (dateStart) {
      const start = new Date(dateStart).getTime();
      result = result.filter(e => new Date(e.timestamp).getTime() >= start);
    }
    if (dateEnd) {
      const end = new Date(dateEnd).getTime() + 86400000; // end of day
      result = result.filter(e => new Date(e.timestamp).getTime() <= end);
    }

    return result;
  }, [trailEntries, searchText, actionFilter, statusFilter, dateStart, dateEnd]);

  const hasActiveFilters = searchText || actionFilter !== 'all' || statusFilter !== 'all' || dateStart || dateEnd;

  const clearFilters = () => {
    setSearchText('');
    setActionFilter('all');
    setStatusFilter('all');
    setDateStart('');
    setDateEnd('');
  };

  // ── Pagination State ───────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, actionFilter, statusFilter, dateStart, dateEnd]);

  // ── Derived: paginated entries ────────────────────────────
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredEntries.length / pageSize)), [filteredEntries.length, pageSize]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const goToPage = (page) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, trailRes] = await Promise.all([
          auditAPI.getSummary(),
          auditAPI.getTrail('all', 'all')
        ]);
        setSummary(summaryRes.data.summary);
        setLogs(summaryRes.data.summary.actionBreakdown || []);
        setTrailEntries(trailRes.data.entries || []);
      } catch (error) {
        console.error('Fetch audit logs error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      const res = await auditAPI.exportReport({ startDate, endDate });

      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportLoading(true);
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      const params = { startDate, endDate };

      const [soc2, iso] = await Promise.all([
        complianceAPI.getSOC2Report(params),
        complianceAPI.getISO27001Report(params)
      ]);

      setSoc2Report(soc2.data);
      setIsoReport(iso.data);
    } catch (error) {
      console.error('Fetch reports error:', error);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compliance') fetchReports();
  }, [activeTab]);

  const toggleSection = (key) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'compliant': return { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle };
      case 'partially compliant': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertTriangle };
      case 'non-compliant': return { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Info };
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Audit & Compliance</h1>
          <p className="text-gray-400 text-sm mt-1">Complete audit trail and compliance reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Exporting...' : 'Export Audit Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unique Users', value: summary?.uniqueUsers || 0, icon: Users, color: 'blue' },
          { label: 'Total Actions', value: summary?.totalActions || 0, icon: Activity, color: 'green' },
          { label: 'Tracking Period', value: '7 Days', icon: Clock, color: 'yellow' },
          { label: 'Frameworks', value: 'SOC 2 • ISO 27001', icon: Shield, color: 'purple' }
        ].map((card) => (
          <div key={card.label} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">{card.label}</p>
                <p className={`text-lg font-bold mt-1 ${
                  card.color === 'blue' ? 'text-blue-400' :
                  card.color === 'green' ? 'text-green-400' :
                  card.color === 'yellow' ? 'text-yellow-400' : 'text-purple-400'
                }`}>{card.value}</p>
              </div>
              <card.icon className={`w-5 h-5 ${
                card.color === 'blue' ? 'text-blue-400' :
                card.color === 'green' ? 'text-green-400' :
                card.color === 'yellow' ? 'text-yellow-400' : 'text-purple-400'
              } opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50 w-fit">
        {[
          { id: 'logs', label: 'Audit Logs', icon: FileText },
          { id: 'compliance', label: 'Compliance Reports', icon: Shield }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'logs' ? (
        <div className="space-y-6">
          {/* Action Breakdown */}
          <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Action Breakdown
            </h2>
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No audit logs found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-gray-300 capitalize">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs font-semibold">
                      {log.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Audit Log Table */}
          <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Detailed Audit Trail
                <span className="text-xs font-normal text-gray-500 ml-1">({trailEntries.length} entries)</span>
              </h2>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 mb-4 p-3 bg-gray-700/20 rounded-lg border border-gray-600/30">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search user, action, resource, IP..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600/50 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Filter */}
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600/50 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-200 appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[130px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600/50 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-200 appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600/50 rounded-lg pl-9 pr-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition [color-scheme:dark]"
                    placeholder="From"
                  />
                </div>
                <span className="text-gray-500 text-xs">—</span>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600/50 rounded-lg pl-9 pr-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition [color-scheme:dark]"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-700/40 hover:bg-gray-700 rounded-lg transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No matching entries found</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline transition"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500">
                    {hasActiveFilters
                      ? `${filteredEntries.length} of ${trailEntries.length} entries`
                      : `${trailEntries.length} entries`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left py-3 px-2 text-gray-400 font-medium">Timestamp</th>
                        <th className="text-left py-3 px-2 text-gray-400 font-medium">User</th>
                        <th className="text-left py-3 px-2 text-gray-400 font-medium">Action</th>
                        <th className="text-left py-3 px-2 text-gray-400 font-medium">Resource</th>
                        <th className="text-left py-3 px-2 text-gray-400 font-medium hidden md:table-cell">IP Address</th>
                        <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEntries.map((entry, idx) => {
                        const isFailure = entry.status === 'failure';
                        return (
                          <tr
                            key={entry.id || idx}
                            className="border-b border-gray-700/30 hover:bg-gray-700/20 transition"
                          >
                            <td className="py-3 px-2 text-gray-300 whitespace-nowrap text-xs">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-500" />
                                {new Date(entry.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-gray-200 text-xs font-medium">{entry.user}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-xs capitalize px-2 py-0.5 rounded bg-gray-700/40 text-gray-300 whitespace-nowrap">
                                {entry.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs text-gray-400">
                              <span className="font-mono">{entry.resourceType}</span>
                              <span className="text-gray-600">/</span>
                              <span className="text-gray-500">{entry.resourceId}</span>
                            </td>
                            <td className="py-3 px-2 text-xs text-gray-500 hidden md:table-cell font-mono">
                              {entry.ip}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                                  isFailure
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-green-500/10 text-green-400'
                                }`}
                              >
                                {isFailure ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-700/30">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-gray-800 border border-gray-600/50 rounded-lg px-2 py-1.5 text-xs text-gray-200 appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-1">
                    {/* Previous */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                    >
                      <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                      Prev
                    </button>

                    {/* Page Numbers */}
                    {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-gray-600">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-[32px] px-2 py-1.5 text-xs rounded-lg transition ${
                            currentPage === page
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                    >
                      Next
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Compliance Reports Tab */
        <div className="space-y-6">
          {reportLoading ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <Shield className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
              <p className="text-gray-400">Generating compliance reports...</p>
            </div>
          ) : (
            <>
              {/* SOC 2 Report */}
              {soc2Report && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      SOC 2 Compliance Report
                    </h2>
                    <span className="text-xs text-gray-500">Generated: {new Date(soc2Report.generatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Trust Services Criteria */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {Object.entries(soc2Report.trustServicesCriteria || {}).map(([key, criteria]) => {
                      const statusColor = getStatusColor(criteria.status);
                      const StatusIcon = statusColor.icon;
                      return (
                        <div key={key} className="p-4 bg-gray-700/20 rounded-lg border border-gray-600/30">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${statusColor.bg} ${statusColor.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {criteria.status}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {criteria.details?.map((detail, i) => (
                              <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendations */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-400 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {soc2Report.recommendations?.map((rec, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                          <ArrowRight className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ISO 27001 Report */}
              {isoReport && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Lock className="w-5 h-5 text-purple-400" />
                      ISO/IEC 27001:2022 Compliance Report
                    </h2>
                    <span className="text-xs text-gray-500">Generated: {new Date(isoReport.generatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Standard Clauses */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(isoReport.standardClauses || {}).map(([key, clause]) => {
                      const statusColor = getStatusColor(clause.status);
                      const StatusIcon = statusColor.icon;
                      return (
                        <div key={key} className="bg-gray-700/20 rounded-lg border border-gray-600/30">
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => toggleSection(key)}
                          >
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${statusColor.text}`} />
                              <span className="text-sm font-medium">{clause.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs rounded ${statusColor.bg} ${statusColor.text}`}>
                                {clause.status}
                              </span>
                              {expandedSection === key ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </div>
                          </div>
                          {expandedSection === key && (
                            <div className="px-3 pb-3">
                              <ul className="space-y-1">
                                {clause.evidence?.map((item, i) => (
                                  <li key={i} className="text-xs text-gray-400 flex items-start gap-1 pl-6">
                                    <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Annex A Controls */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => toggleSection('annex')}>
                      <h3 className="text-sm font-semibold">Annex A Controls</h3>
                      {expandedSection === 'annex' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                    {expandedSection === 'annex' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(isoReport.annexAControls || {}).map(([key, control]) => {
                          const statusColor = getStatusColor(control.status);
                          return (
                            <div key={key} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                              <span className="text-xs text-gray-300">{key.replace(/_/g, ' ')}</span>
                              <span className={`px-1.5 py-0.5 text-[10px] rounded ${statusColor.bg} ${statusColor.text}`}>
                                {control.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <h3 className="text-sm font-semibold text-purple-400 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {isoReport.recommendations?.map((rec, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                          <ArrowRight className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
