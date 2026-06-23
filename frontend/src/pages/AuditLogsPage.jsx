import { useEffect, useState } from 'react';
import { auditAPI, complianceAPI } from '../services/api';
import { 
  FileText, Download, BarChart3, Shield, Lock, CheckCircle, XCircle, 
  AlertTriangle, Info, ChevronDown, ChevronUp, ExternalLink, Clock,
  Users, Server, Activity, ArrowRight
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [soc2Report, setSoc2Report] = useState(null);
  const [isoReport, setIsoReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await auditAPI.getSummary();
        setSummary(res.data.summary);
        setLogs(res.data.summary.actionBreakdown || []);
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
              <FileText className="w-5 h-5 text-blue-400" />
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
                      <span className="text-sm text-gray-300">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs font-semibold">
                      {log.count}x
                    </span>
                  </div>
                ))}
              </div>
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
