import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { scansAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp,
  DollarSign, Users, TrendingDown, Target, BarChart3, FileText,
  ExternalLink, Clock, Server, Lock
} from 'lucide-react';

export default function ScanDetailPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('findings');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const res = await scansAPI.getScan(scanId);
        setScan(res.data);
      } catch (error) {
        console.error('Fetch scan error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [scanId]);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-400">Scan not found</p>
      </div>
    );
  }

  const findings = scan.findings ? 
    JSON.parse(typeof scan.findings === 'string' ? scan.findings : JSON.stringify(scan.findings)) : {};
  const ssl = scan.ssl_status ? 
    JSON.parse(typeof scan.ssl_status === 'string' ? scan.ssl_status : JSON.stringify(scan.ssl_status)) : {};
  const impact = scan.impact_analysis ?
    JSON.parse(typeof scan.impact_analysis === 'string' ? scan.impact_analysis : JSON.stringify(scan.impact_analysis)) : null;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' };
      case 'high': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' };
      case 'medium': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-500' };
      case 'low': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-500' };
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl lg:text-2xl font-bold truncate max-w-md">{scan.website_url}</h1>
            <span className={`px-3 py-0.5 rounded text-xs font-semibold ${getSeverityColor(scan.severity).bg} ${getSeverityColor(scan.severity).text}`}>
              {scan.severity?.toUpperCase() || 'PENDING'}
            </span>
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {new Date(scan.created_at).toLocaleString()} • Scan #{scan.id}
          </p>
          {/* Show scan owner for admin view */}
          {isAdmin && scan.user_email && (
            <p className="text-amber-400/80 text-xs flex items-center gap-1.5 mt-1">
              <Users className="w-3 h-3" />
              Scanned by {scan.user_name || scan.user_email}
            </p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Status', value: scan.status, icon: CheckCircle, color: scan.status === 'completed' ? 'green' : 'yellow' },
          { 
            label: 'Security Score', 
            value: findings.overallScore !== undefined ? `${findings.overallScore}%` : 'N/A', 
            icon: BarChart3, 
            color: findings.overallScore >= 80 ? 'green' : findings.overallScore >= 60 ? 'yellow' : 'red' 
          },
          { 
            label: 'Risk Exposure', 
            value: impact?.overallRiskExposure !== undefined ? `${impact.overallRiskExposure}%` : 'N/A', 
            icon: Target, 
            color: impact?.overallRiskExposure < 30 ? 'green' : impact?.overallRiskExposure < 60 ? 'yellow' : 'red' 
          },
          { 
            label: 'Est. Annual Loss', 
            value: impact?.financialImpact?.estimatedAnnualLoss ? `$${(impact.financialImpact.estimatedAnnualLoss).toLocaleString()}` : 'N/A', 
            icon: DollarSign, 
            color: 'blue' 
          }
        ].map((card, i) => (
          <div key={card.label} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${
                  card.color === 'green' ? 'text-green-400' :
                  card.color === 'yellow' ? 'text-yellow-400' :
                  card.color === 'red' ? 'text-red-400' : 'text-blue-400'
                }`}>{card.value}</p>
              </div>
              <card.icon className={`w-5 h-5 ${
                card.color === 'green' ? 'text-green-400' :
                card.color === 'yellow' ? 'text-yellow-400' :
                card.color === 'red' ? 'text-red-400' : 'text-blue-400'
              } opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50 w-fit">
        {[
          { id: 'findings', label: 'Findings', icon: Shield },
          { id: 'impact', label: 'Impact Analysis', icon: TrendingDown },
          { id: 'compliance', label: 'Compliance', icon: FileText }
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
      {activeTab === 'findings' && (
        <div className="space-y-6">
          {/* SSL/TLS */}
          <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('ssl')}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                SSL/TLS Configuration
              </h2>
              {expandedSections.ssl ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
            {expandedSections.ssl !== false && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Status', value: ssl.valid ? '✅ Valid' : '❌ Invalid', color: ssl.valid ? 'text-green-400' : 'text-red-400' },
                  { label: 'Grade', value: ssl.grade || 'N/A', color: 'text-white' },
                  { label: 'Expires In', value: ssl.daysRemaining ? `${ssl.daysRemaining} days` : 'N/A', color: ssl.daysRemaining < 30 ? 'text-red-400' : 'text-white' },
                  { label: 'Protocol', value: ssl.protocol || 'N/A', color: 'text-white' }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`font-semibold mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Headers */}
          {findings.securityHeaders && (
            <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('headers')}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-400" />
                  Security Headers ({findings.securityHeaders.passed}/7)
                </h2>
                {expandedSections.headers ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
              {expandedSections.headers !== false && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(findings.securityHeaders.details || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                      <span className="text-sm text-gray-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      <span className={value ? 'text-green-400' : 'text-red-400'}>
                        {value ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vulnerabilities */}
          {findings.vulnerabilities && findings.vulnerabilities.vulnerabilitiesFound > 0 && (
            <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('vulns')}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Vulnerabilities ({findings.vulnerabilities.vulnerabilitiesFound})
                </h2>
                {expandedSections.vulns ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
              {expandedSections.vulns !== false && (
                <div className="space-y-3">
                  {(findings.vulnerabilities.vulnerabilities || []).map((vuln, idx) => (
                    <div key={idx} className="p-3 bg-gray-700/30 rounded-lg border-l-4 border-red-500">
                      <p className="font-semibold text-sm">{vuln.type}</p>
                      <p className="text-xs text-gray-400 mt-1">{vuln.recommendation}</p>
                    </div>
                  ))}
                  {findings.vulnerabilities.recommendations?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-400 mb-2">General Recommendations:</p>
                      <ul className="space-y-1">
                        {findings.vulnerabilities.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                            <Info className="w-3 h-3 text-blue-400" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Malware Status */}
          {findings.malware && (
            <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('malware')}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Malware Status
                </h2>
                {expandedSections.malware ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
              {expandedSections.malware !== false && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${findings.malware.clean ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="flex items-center gap-2">
                      {findings.malware.clean ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                      <span className={`font-semibold ${findings.malware.clean ? 'text-green-400' : 'text-red-400'}`}>
                        {findings.malware.status || (findings.malware.clean ? 'Clean' : 'Threats Detected')}
                      </span>
                    </div>
                    {findings.malware.riskScore !== undefined && (
                      <p className="text-xs text-gray-400 mt-2">Risk Score: {findings.malware.riskScore}/100</p>
                    )}
                  </div>
                  {findings.malware.threats?.map((threat, i) => (
                    <div key={i} className="p-2 bg-gray-700/20 rounded text-sm text-gray-300">
                      {threat.type} - {threat.platform}
                    </div>
                  ))}
                  {findings.malware.suspiciousPatterns?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Suspicious patterns detected:</p>
                      <div className="flex flex-wrap gap-1">
                        {findings.malware.suspiciousPatterns.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 text-xs rounded">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Impact Analysis Tab */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          {impact ? (
            <>
              {/* Executive Summary */}
              <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Executive Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-gray-700/30 rounded-lg text-center">
                    <p className="text-3xl font-bold text-white">{impact.summary?.grade || 'N/A'}</p>
                    <p className="text-xs text-gray-400 mt-1">Security Grade</p>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-400">{impact.summary?.overallScore || 0}%</p>
                    <p className="text-xs text-gray-400 mt-1">Overall Score</p>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg text-center">
                    <p className={`text-3xl font-bold ${impact.overallRiskExposure > 50 ? 'text-red-400' : 'text-green-400'}`}>
                      {impact.overallRiskExposure || 0}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Risk Exposure</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {impact.summary?.keyFindings?.map((finding, i) => (
                    <p key={i} className="text-sm text-gray-300">{finding}</p>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400 font-medium">{impact.summary?.recommendedAction}</p>
                </div>
              </div>

              {/* Financial Impact */}
              {impact.financialImpact && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('financial')}>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                      Financial Impact Assessment
                    </h2>
                    {expandedSections.financial ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                  {expandedSections.financial !== false && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-xs text-gray-400">Est. Annual Loss</p>
                        <p className="text-lg font-bold text-red-400">${impact.financialImpact.estimatedAnnualLoss?.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-xs text-gray-400">Breach Cost (Avg)</p>
                        <p className="text-lg font-bold text-yellow-400">${impact.financialImpact.breachCost?.average?.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-xs text-gray-400">Remediation Cost</p>
                        <p className="text-lg font-bold text-blue-400">${impact.financialImpact.remediationCost?.estimated?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Operational Impact */}
              {impact.operationalImpact && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('operational')}>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Server className="w-5 h-5 text-orange-400" />
                      Operational Impact
                    </h2>
                    {expandedSections.operational ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                  {expandedSections.operational !== false && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">Overall Risk:</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          impact.operationalImpact.overallOperationalRisk === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          impact.operationalImpact.overallOperationalRisk === 'High' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{impact.operationalImpact.overallOperationalRisk}</span>
                      </div>
                      {impact.operationalImpact.specificImpacts?.map((imp, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-700/20 rounded-lg">
                          <div className={`p-1.5 rounded ${
                            imp.impact === 'Critical' ? 'bg-red-500/20' :
                            imp.impact === 'High' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                          }`}>
                            <AlertTriangle className={`w-3.5 h-3.5 ${
                              imp.impact === 'Critical' ? 'text-red-400' :
                              imp.impact === 'High' ? 'text-orange-400' : 'text-yellow-400'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{imp.area}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{imp.description}</p>
                            <div className="flex gap-1 mt-1">
                              {(imp.affectedTeams || []).map((team, j) => (
                                <span key={j} className="px-1.5 py-0.5 bg-gray-600/30 text-gray-400 text-[10px] rounded">
                                  {team}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reputational Risk */}
              {impact.reputationalRisk && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection('reputation')}>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Reputational Risk
                    </h2>
                    {expandedSections.reputation ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                  {expandedSections.reputation !== false && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Risk Level:</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          impact.reputationalRisk.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          impact.reputationalRisk.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>{impact.reputationalRisk.riskLevel}</span>
                      </div>
                      {impact.reputationalRisk.factors?.map((factor, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 bg-gray-700/20 rounded">
                          <div className="flex-1">
                            <p className="text-sm">{factor.factor}</p>
                            <p className="text-xs text-gray-500">{factor.detail}</p>
                          </div>
                          <span className={`text-xs font-medium ${
                            factor.severity === 'High' ? 'text-red-400' :
                            factor.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>{factor.severity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Prioritized Risks */}
              {impact.prioritizedRisks?.length > 0 && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-400" />
                    Prioritized Risks ({impact.prioritizedRisks.length})
                  </h2>
                  <div className="space-y-3">
                    {impact.prioritizedRisks.map((risk, i) => {
                      const colors = getSeverityColor(risk.riskScore >= 80 ? 'critical' : risk.riskScore >= 60 ? 'high' : 'medium');
                      return (
                        <div key={i} className="p-4 bg-gray-700/20 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                              <span className="text-sm font-semibold">{risk.category}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                              Risk: {risk.riskScore}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{risk.risk}</p>
                          <p className="text-xs text-gray-500 mb-2">{risk.businessImpact}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded">Likelihood: {risk.likelihood}</span>
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded">Impact: {risk.impact}</span>
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-300 rounded">Cost: {risk.mitigationCost}</span>
                            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 rounded">Timeline: {risk.mitigationTimeframe}</span>
                          </div>
                          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {risk.mitigation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {impact.recommendations?.length > 0 && (
                <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Strategic Recommendations
                  </h2>
                  <div className="space-y-3">
                    {impact.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/30">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                              rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>{rec.priority}</span>
                            <span className="text-sm font-medium">{rec.category}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{rec.action}</p>
                        <p className="text-xs text-gray-500">{rec.impact}</p>
                        <div className="flex gap-2 mt-2 text-xs text-gray-400">
                          <span>Effort: {rec.effort}</span>
                          <span>•</span>
                          <span>Timeline: {rec.timeline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <TrendingDown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Impact analysis not available for this scan</p>
            </div>
          )}
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && impact?.complianceImpact && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-700/50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Compliance Framework Impact
            </h2>
            <p className="text-sm text-gray-400 mb-4">{impact.complianceImpact.overallComplianceRisk}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {impact.complianceImpact.frameworks?.map((fw, i) => (
                <div key={i} className="p-4 bg-gray-700/20 rounded-lg border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{fw.name}</h3>
                    <span className="text-xs text-gray-400">{fw.relevance}</span>
                  </div>
                  <ul className="space-y-1 mb-2">
                    {fw.requirements?.map((req, j) => (
                      <li key={j} className="text-xs text-gray-400 flex items-start gap-1">
                        <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-400">{fw.potentialFines}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Link */}
      {scan.report_url && (
        <a
          href={scan.report_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          View Full Report in Google Docs
        </a>
      )}
    </div>
  );
}
