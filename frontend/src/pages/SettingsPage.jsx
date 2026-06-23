import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { 
  Key, Shield, CheckCircle, XCircle, Eye, EyeOff,
  Trash2, ExternalLink, RefreshCw, Plus, AlertCircle,
  Info, Check
} from 'lucide-react';
import clsx from 'clsx';

const SERVICE_ICONS = {
  'Google Safe Browsing': { icon: '🛡️', color: 'from-blue-500 to-blue-600' },
  'NIST NVD API': { icon: '📋', color: 'from-green-500 to-green-600' },
  'VirusTotal': { icon: '🦠', color: 'from-purple-500 to-purple-600' },
  'Shodan': { icon: '🌐', color: 'from-orange-500 to-orange-600' },
  'Google Service Account': { icon: '📄', color: 'from-yellow-500 to-yellow-600' }
};

function KeyValuePreview({ value, visible }) {
  if (!value) return <span className="text-gray-500 italic">Not configured</span>;
  if (visible) return <span className="text-green-400 font-mono text-xs break-all">{value}</span>;
  return <span className="text-gray-400 font-mono text-xs">{'•'.repeat(32)}</span>;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [visibleKeyIds, setVisibleKeyIds] = useState(new Set());
  const [editModal, setEditModal] = useState(null); // { keyName, label, value }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [keyStatus, setKeyStatus] = useState(null);

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysRes, statusRes] = await Promise.all([
        settingsAPI.getKeys(),
        settingsAPI.getKeyStatus()
      ]);
      setKeys(keysRes.data.keys);
      setKeyStatus(statusRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const toggleVisibility = (id) => {
    setVisibleKeyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!editModal?.value?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await settingsAPI.saveKey(editModal.keyName, editModal.value);
      setSuccessMsg(`${editModal.label} API key saved successfully`);
      setEditModal(null);
      fetchKeys();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await settingsAPI.toggleKey(id);
      fetchKeys();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle API key');
    }
  };

  const handleDelete = async (id) => {
    try {
      await settingsAPI.deleteKey(id);
      setSuccessMsg('API key deleted');
      setConfirmDelete(null);
      fetchKeys();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Key className="w-6 h-6 text-blue-400" />
              API Keys
            </h1>
            <p className="text-gray-400 mt-1">
              Manage third-party API keys used for security scanning and threat intelligence
            </p>
          </div>
          <button
            onClick={fetchKeys}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Key Status Summary */}
        {keyStatus && (
          <div className="flex flex-wrap gap-4 mt-4">
            <div className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm border',
              keyStatus.allConfigured 
                ? 'bg-green-900/20 text-green-400 border-green-500/30'
                : 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
            )}>
              {keyStatus.allConfigured ? (
                <><CheckCircle size={16} /> All keys configured</>
              ) : (
                <><AlertCircle size={16} /> {keyStatus.missingKeys} of {keyStatus.totalKeys} keys missing</>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300">
              <Shield size={16} className="text-blue-400" />
              {keyStatus.configuredKeys}/{keyStatus.totalKeys} active
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="mb-6 px-4 py-3 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-sm animate-fade-in">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* API Keys Grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {keys.map((key) => {
            const serviceInfo = SERVICE_ICONS[key.label] || { icon: '🔑', color: 'from-gray-500 to-gray-600' };
            return (
              <div
                key={key.key}
                className={clsx(
                  'bg-gray-800/50 border rounded-xl p-5 transition-all duration-300 hover-lift',
                  key.configured && key.isActive
                    ? 'border-green-500/20 glow-green'
                    : key.configured
                    ? 'border-yellow-500/20 glow-blue'
                    : 'border-gray-700/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Service Icon */}
                    <div className={clsx(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0',
                      serviceInfo.color
                    )}>
                      {serviceInfo.icon}
                    </div>

                    {/* Key Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold">{key.label}</h3>
                        <span className={clsx(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          key.configured && key.isActive
                            ? 'bg-green-900/40 text-green-400 border border-green-500/30'
                            : 'bg-gray-700/40 text-gray-400 border border-gray-600/30'
                        )}>
                          {key.configured && key.isActive ? 'Active' : key.configured ? 'Disabled' : 'Not configured'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{key.description}</p>

                      {/* Key value area */}
                      {key.configured ? (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Value:</span>
                          <KeyValuePreview value={key.maskedValue || '••••••••'} visible={visibleKeyIds.has(key.id)} />
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-500/70 mt-1">
                          Configure this key to enable {key.label} features
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {key.configured && key.id && (
                      <>
                        <button
                          onClick={() => toggleVisibility(key.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                          title={visibleKeyIds.has(key.id) ? 'Hide' : 'Show'}
                        >
                          {visibleKeyIds.has(key.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleToggle(key.id)}
                          className={clsx(
                            'p-2 rounded-lg transition-all',
                            key.isActive
                              ? 'text-green-400 hover:bg-green-900/30'
                              : 'text-gray-400 hover:bg-gray-700'
                          )}
                          title={key.isActive ? 'Disable' : 'Enable'}
                        >
                          {key.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(key.id)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}

                    {/* Save / Configure button */}
                    <button
                      onClick={() => setEditModal({
                        keyName: key.key,
                        label: key.label,
                        value: ''
                      })}
                      className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                        key.configured
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      )}
                    >
                      {key.configured ? <RefreshCw size={14} /> : <Plus size={14} />}
                      {key.configured ? 'Update' : 'Configure'}
                    </button>

                    {/* Docs Link */}
                    <a
                      href={key.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                      title="View documentation"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                {/* Last Used */}
                {key.configured && key.lastUsedAt && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-500">
                      Last used: {new Date(key.lastUsedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-5 bg-blue-900/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-medium text-sm">About API Key Security</h3>
            <p className="text-gray-400 text-sm mt-1">
              API keys are encrypted at rest using AES-256-GCM before being stored in the database. 
              They are never exposed in plain text in the UI or API responses. 
              You can also configure keys through environment variables (e.g., <code className="text-blue-300 bg-blue-900/30 px-1 rounded">.env</code>) 
              which take precedence over database-stored keys.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">
                {editModal.keyName === editModal.label ? '' : editModal.label} API Key
              </h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Key Name</label>
              <input
                type="text"
                value={editModal.keyName}
                disabled
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed text-sm font-mono"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key Value <span className="text-red-400">*</span>
              </label>
              <textarea
                value={editModal.value}
                onChange={e => setEditModal({ ...editModal, value: e.target.value })}
                placeholder="Paste your API key here..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm font-mono placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                This value will be encrypted before storage and is only transmitted over HTTPS
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editModal.value?.trim()}
                className={clsx(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  saving || !editModal.value?.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                )}
              >
                {saving ? (
                  <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={14} /> Save Key</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Delete API Key?</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently remove this API key from the database. 
              Features relying on this key will fall back to environment variables if available.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
