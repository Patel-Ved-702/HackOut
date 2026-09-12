import React, { useEffect, useState } from 'react';
import { Search, Info, PlusCircle, Wind, Sun, ChevronRight, LayoutGrid, List, Activity, Settings2 } from 'lucide-react';
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(fetchAssets, 8000);
    return () => clearInterval(interval);
  }, []);

  const criticalAssets = assets.filter(a => a.status === 'CRITICAL').length;

  const filteredAssets = assets.filter(a => {
    const currentStatus = a.status || a.health_status;
    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) return false;
    if (typeFilter !== 'ALL' && a.asset_type !== typeFilter) return false;
    if (search && !a.asset_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      
      {/* Header section matching new dashboard */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Asset Monitor</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and monitor all deployed turbines and panels.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("To register new assets, please upload a telemetry CSV containing the new asset codes.")} 
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-900/10 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Register Asset
          </button>
        </div>
      </div>

      {/* Filters & Search - New sleek input style */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by asset code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="WATCH">Watch</option>
            <option value="CRITICAL">Critical</option>
          </select>
          
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="wind_turbine">Wind Turbines</option>
            <option value="solar_inverter">Solar Panels</option>
          </select>

          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 ml-2">
            <button className="p-1.5 rounded-lg bg-white shadow-sm text-slate-700"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              onClick={() => navigate(`/assets/${asset.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Top Accent line for critical assets */}
              {(asset.status === 'CRITICAL' || asset.health_status === 'CRITICAL') && (
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
              )}
              {(asset.status === 'WATCH' || asset.health_status === 'WATCH') && (
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  {asset.asset_type === 'wind_turbine' ? (
                    <Wind className="w-5 h-5 text-slate-700 group-hover:text-emerald-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-slate-700 group-hover:text-emerald-600" />
                  )}
                </div>
                <StatusBadge status={asset.status || asset.health_status || 'HEALTHY'} />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-1">{asset.asset_code}</h3>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {asset.site_name || asset.location || `Site #${asset.site_id}`}
              </div>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{asset.asset_type === 'wind_turbine' ? 'Wind Turbine' : 'Solar Panel'}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Activity className="w-3 h-3" /> Score
                  </div>
                  <div className={`text-xl font-black ${
                    asset.health_score > 90 ? 'text-emerald-600' : 
                    asset.health_score > 70 ? 'text-amber-500' : 'text-rose-600'
                  }`}>
                    {asset.health_score}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Settings2 className="w-3 h-3" /> Capacity
                  </div>
                  <div className="text-sm font-bold text-slate-700 truncate">
                    {asset.rated_capacity ? `${asset.rated_capacity} kW` : (asset.model || 'Standard')}
                  </div>
                </div>
              </div>

              {(asset.status === 'CRITICAL' || asset.health_status === 'CRITICAL') && (
                <div className="mt-4 px-3 py-2 bg-rose-50 rounded-lg border border-rose-100 text-xs font-medium text-rose-700 flex items-center justify-between">
                  Action Required
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </div>
              )}
            </div>
          ))}

          {filteredAssets.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No assets found</h3>
              <p className="text-sm text-slate-500 font-medium">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
