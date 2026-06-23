import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scansAPI } from '../services/api';
import { Zap, Plus } from 'lucide-react';

export default function ScansPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Security Scans</h1>
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

      {loading ? (
        <div>Loading scans...</div>
      ) : scans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Zap size={48} className="mx-auto mb-4 opacity-50" />
          <p>No scans yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => navigate(`/scans/${scan.id}`)}
              className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{scan.website_url}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(scan.created_at).toLocaleDateString()} • Status: {scan.status}
                  </p>
                </div>
                <div className="text-right">
                  {scan.severity && (
                    <span className={`inline-block px-3 py-1 rounded text-white text-sm font-semibold ${getSeverityColor(scan.severity)}`}>
                      {scan.severity.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
