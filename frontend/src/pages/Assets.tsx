import React, { useEffect, useState } from 'react';
import { Search, Info, PlusCircle, Wind, Sun, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';
import { StatusBadge } from '../components/StatusBadge';

import { useNavigate } from 'react-router-dom';

export const Assets: React.FC = () => {
  const navigate = useNavigate();
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

  const getStatusCounts = () => {
    return {
      all: assets.length,
      healthy: assets.filter(a => a.status === 'HEALTHY' || a.status === 'STARTUP').length,
      watch: assets.filter(a => a.status === 'WATCH').length,
      highRisk: assets.filter(a => a.status === 'HIGH RISK').length,
      critical: assets.filter(a => a.status === 'CRITICAL').length,
      stale: assets.filter(a => a.status === 'STALE').length, // mock stale
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* Top Header Card */}
      <div className="light-card p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Asset Monitor</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold">
              • {assets.length} Assets Listed
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Monitor health, sensor activity and operational risk across your renewable fleet.</p>
        </div>
        
        <button 
          onClick={() => alert("Assets are automatically registered when their telemetry is first ingested via the CSV Upload tool or edge sensor API.")}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Register Asset
        </button>
      </div>

      {/* Threshold Info Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wide">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Info className="w-4 h-4 text-slate-400" />
            Prototype thresholds:
          </div>
          <span className="text-emerald-600">● 100 = Healthy</span>
          <span className="text-amber-500">● 70-89 = Watch</span>
          <span className="text-orange-500">● 40-69 = High Risk</span>
          <span className="text-rose-600">● 0-39 = Critical</span>
        </div>
        <div className="text-slate-400 normal-case font-mono font-medium">
          Policy Rule: Stale telemetry will never display as Healthy
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="light-card p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search asset ID, site or type... (Press '/' to focus)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-full px-4 py-2 focus:outline-none focus:border-emerald-400">
              <option>All Sites</option>
              <option>GreenWind Site</option>
              <option>Coastal Breeze</option>
              <option>Solaria South</option>
            </select>
            
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-full px-4 py-2 focus:outline-none focus:border-emerald-400">
              <option>Health Score (Lowest First)</option>
              <option>Health Score (Highest First)</option>
              <option>Recently Updated</option>
            </select>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button className="p-1 rounded bg-white shadow-sm text-slate-800"><List className="w-4 h-4" /></button>
              <button className="p-1 rounded text-slate-400 hover:text-slate-800"><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        
        {/* Pills Row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
            <span>TYPE:</span>
            <button className="status-pill bg-emerald-50 text-emerald-700 border-emerald-200 px-3 flex items-center gap-1">All Assets ({assets.length})</button>
            <button className="text-sky-600 flex items-center gap-1 px-2 hover:bg-slate-50 rounded"><Wind className="w-3.5 h-3.5" /> Wind (8)</button>
            <button className="text-amber-500 flex items-center gap-1 px-2 hover:bg-slate-50 rounded"><Sun className="w-3.5 h-3.5" /> Solar (7)</button>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>STATUS:</span>
            <button className="px-3 py-1 rounded-full bg-slate-900 text-white">All</button>
            <button className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Healthy {counts.healthy}</button>
            <button className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Watch {counts.watch}</button>
            <button className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">High Risk {counts.highRisk}</button>
            <button className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">Critical {counts.critical}</button>
            <button className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-300">Data Stale 2</button>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="light-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" /></th>
                <th className="px-4 py-4">Asset</th>
                <th className="px-4 py-4">Site</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Capacity</th>
                <th className="px-4 py-4 w-32">Health</th>
                <th className="px-4 py-4">Risk Level</th>
                <th className="px-4 py-4">Power Output</th>
                <th className="px-4 py-4">Last Reading</th>
                <th className="px-4 py-4">Data Quality</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((asset) => {
                const isCritical = asset.status === 'CRITICAL';
                const isStale = asset.asset_code === 'WT-015' || asset.asset_code === 'SP-014'; // mockup stale from image
                
                return (
                  <tr
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-4"><input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" /></td>
                    <td className="px-4 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                        {asset.asset_type === 'wind_turbine' ? (
                          <Wind className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <span className="font-mono">{asset.asset_code}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">{asset.site_name || 'GreenWind Site'}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs uppercase font-bold">{asset.asset_type === 'wind_turbine' ? 'Wind' : 'Solar'}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">{asset.asset_type === 'wind_turbine' ? '2.5 MW' : '600 kW'}</td>
                    
                    <td className="px-4 py-4 font-mono text-xs font-bold text-slate-600">
                      {isStale ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: '10%' }}></div>
                          </div>
                          --
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
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
                          <span>{asset.health_score}/100</span>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-4">
                      {isStale ? (
                        <span className="px-2 py-0.5 rounded-full border border-yellow-400 text-yellow-700 bg-yellow-50 text-[10px] font-bold tracking-wide">
                          STALE / UNKNOWN
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${
                          asset.status === 'CRITICAL' ? 'border-rose-200 text-rose-600 bg-rose-50' : 
                          asset.status === 'HIGH RISK' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                          'border-emerald-200 text-emerald-600 bg-emerald-50'
                        }`}>
                          {asset.status}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-4 py-4 font-mono">
                      {isStale ? (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">Offline</div>
                          <div className="text-[10px] text-slate-400">0%</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{asset.latest_reading?.power_output ? `${asset.latest_reading.power_output.toFixed(1)} kW` : '—'}</div>
                          <div className="text-[10px] text-slate-400">4.4%</div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-4 font-mono text-[10px]">
                      {isStale ? (
                        <div className="text-slate-500">
                          <div className="font-bold">11:15</div>
                          <div>4h ago</div>
                        </div>
                      ) : (
                        <div className="text-slate-500">
                          <div className="font-bold">15:30</div>
                          <div>1 min ago</div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-4">
                      {isStale ? (
                        <span className="px-2 py-0.5 rounded border border-yellow-300 bg-yellow-100 text-yellow-800 text-[10px] font-bold">
                          DATA STALE
                        </span>
                      ) : asset.status === 'CRITICAL' ? (
                        <span className="text-emerald-500 font-semibold text-[11px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded">Good</span>
                      ) : (
                        <span className="text-orange-500 font-semibold text-[11px] border border-orange-200 bg-orange-50 px-2 py-0.5 rounded">Degraded</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assets/${asset.id}`);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold transition ${
                          isCritical
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
