import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { AlertTriangle } from 'lucide-react';

export default function ThreatIntelPage() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

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
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      default: return 'bg-green-600 text-white';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Live Threat Intelligence</h1>

      {loading ? (
        <div>Loading threats...</div>
      ) : threats.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
          <p>No active threats detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threats.map((threat) => (
            <div key={threat.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{threat.threat_type}</h3>
                  <p className="text-gray-300 mb-3">{threat.threat_description}</p>
                  
                  {threat.mitigation_steps && (
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-2">Mitigation Steps:</p>
                      <p className="text-sm text-gray-300">{threat.mitigation_steps}</p>
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getSeverityColor(threat.severity)} whitespace-nowrap ml-4`}>
                  {threat.severity?.toUpperCase()}
                </span>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Source: {threat.source} • Updated: {new Date(threat.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
