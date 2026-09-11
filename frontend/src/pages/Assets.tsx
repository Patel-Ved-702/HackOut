import React, { useEffect, useState } from 'react';
import { Search, Filter, Wind, Sun, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface AssetsProps {
  onSelectAsset: (assetId: number) => void;
}

export const Assets: React.FC<AssetsProps> = ({ onSelectAsset }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchAssets = async () => {
    try {
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(fetchAssets, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = assets.filter((asset) => {
    const matchesSearch = asset.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      (asset.site_name && asset.site_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || asset.asset_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fleet Asset Monitor</h2>
          <p className="text-xs text-slate-400">Continuous telemetry verification across solar and wind generators</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="text"
            placeholder="Search by code (WT-004) or site name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="STARTUP">Startup / Standby</option>
            <option value="WATCH">Watch List</option>
            <option value="HIGH RISK">High Risk</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Types</option>
            <option value="wind_turbine">Wind Turbines</option>
            <option value="solar_inverter">Solar Arrays</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-4 py-3">Asset Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Site Location</th>
                <th className="px-4 py-3">Health Score</th>
                <th className="px-4 py-3">Operating Status</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3">Vibration</th>
                <th className="px-4 py-3">Power Output</th>
                <th className="px-4 py-3">Why Flagged / Evidence</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => onSelectAsset(asset.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-mono font-bold text-white flex items-center gap-2">
                    {asset.asset_type === 'wind_turbine' ? (
                      <Wind className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-400" />
                    )}
                    {asset.asset_code}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {asset.asset_type === 'wind_turbine' ? 'Wind Turbine' : 'Solar Inverter'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">
                    {asset.site_name || 'Site 1'}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            asset.health_score > 75
                              ? 'bg-emerald-500'
                              : asset.health_score > 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${asset.health_score}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-200">{asset.health_score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {asset.latest_reading?.temperature ? `${asset.latest_reading.temperature.toFixed(1)}°C` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {asset.latest_reading?.vibration ? `${asset.latest_reading.vibration.toFixed(2)} mm/s` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {asset.latest_reading?.power_output ? `${asset.latest_reading.power_output.toFixed(1)} kW` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[11px]">
                    {asset.evidence && asset.evidence.length > 0 ? (
                      <span className={`font-mono ${
                        asset.status === 'CRITICAL' 
                          ? 'text-rose-400 font-semibold' 
                          : asset.status === 'HIGH RISK' 
                          ? 'text-amber-300 font-semibold' 
                          : 'text-slate-400'
                      }`}>
                        {asset.evidence[0].description}
                      </span>
                    ) : (
                      <span className="text-slate-500">Nominal baseline</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(asset.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-medium transition"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
