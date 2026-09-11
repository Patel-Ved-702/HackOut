import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, Clock, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';

interface AlertsProps {
  onSelectAsset: (assetId: number) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onSelectAsset }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: number, action: 'acknowledge' | 'resolve') => {
    try {
      await api.updateAlert(id, action);
      fetchAlerts();
    } catch (err: any) {
      alert(`Failed to update alert: ${err.message}`);
    }
  };

  const filtered = alerts.filter((al) => {
    if (filter === 'all') return true;
    return al.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Active Alert Center
          </h2>
          <p className="text-xs text-slate-400">
            De-duplicated multi-cycle anomaly notifications (rejects single-reading noise spikes)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
            {(['all', 'active', 'acknowledged', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition ${
                  filter === tab
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                al.status === 'resolved'
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : al.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : 'bg-amber-950/20 border-amber-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    al.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{al.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        al.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {al.severity}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      Status: {al.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{al.message}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(al.created_at).toLocaleString()}
                    </span>
                    <span>
                      Persistence Count: <strong className="text-slate-300">{al.persistence_count} cycles</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                <button
                  onClick={() => onSelectAsset(al.asset_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  Asset <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {al.status === 'active' && (
                  <button
                    onClick={() => handleAction(al.id, 'acknowledge')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium transition"
                  >
                    Acknowledge
                  </button>
                )}

                {al.status !== 'resolved' && (
                  <button
                    onClick={() => handleAction(al.id, 'resolve')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
            No alerts match the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
};
