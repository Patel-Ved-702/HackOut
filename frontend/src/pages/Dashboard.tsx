import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldCheck, AlertTriangle, Flame, DollarSign, 
  ArrowRight, Radio, BrainCircuit, BellRing, Wind, Sun, AlertCircle, TrendingUp, Zap
} from 'lucide-react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary } from '../types';

import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary('all');
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  const predictiveData = [
    { time: 'T-72h', health: 98, actual_vibration: 2.1 },
    { time: 'T-48h', health: 95, actual_vibration: 2.3 },
    { time: 'T-24h', health: 85, actual_vibration: 3.0 },
    { time: 'T-12h', health: 68, actual_vibration: 4.1 },
    { time: 'Current', health: 45, actual_vibration: 5.8, predicted_vibration: 5.8 },
    { time: 'T+12h', predicted_vibration: 7.2 },
    { time: 'T+24h', predicted_vibration: 8.5 }, // Hits critical threshold
    { time: 'T+48h', predicted_vibration: 10.1 },
  ];

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Live telemetry monitoring for all solar and wind assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/assets')} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> View All Assets
          </button>
          <button onClick={() => navigate('/maintenance')} className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-900/10 transition-colors flex items-center gap-2">
            <WrenchIcon className="w-4 h-4" /> Work Orders
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-slate-900" />
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Total Assets
          </div>
          <div className="text-4xl font-black text-slate-900">{summary?.total_assets ?? 0}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/> 100%</span> Online
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Healthy
          </div>
          <div className="text-4xl font-black text-slate-900">{summary?.healthy_count ?? 0}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">Nominal operation</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Watch List
          </div>
          <div className="text-4xl font-black text-slate-900">{summary?.watch_count ?? 0}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">Early degradation</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-16 h-16 text-rose-600" />
          </div>
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div> Critical
          </div>
          <div className="text-4xl font-black text-slate-900">
            {(summary?.critical_count ?? 0) + (summary?.high_risk_count ?? 0)}
          </div>
          <div className="text-xs text-rose-600 mt-2 font-bold">Action required immediately</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              Revenue at Risk
            </div>
            <div className="text-4xl font-black text-white">
              ${summary?.total_revenue_at_risk_daily.toFixed(0) ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 mt-4 font-mono font-bold bg-emerald-950/50 inline-block px-2 py-1 rounded">
            {summary?.total_generation_at_risk_kw.toFixed(1)} kW deficit
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        
        {/* Early Warning Chart */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <BrainCircuit className="w-4 h-4 text-emerald-600" /> AI Trajectory Analysis
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Vibration drift on <strong className="text-slate-700">WT-004</strong> predicts catastrophic gearbox failure in 48h.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-slate-500"><div className="w-2 h-2 bg-slate-300 rounded-sm"></div> Historical</span>
              <span className="flex items-center gap-1.5 text-rose-600"><div className="w-3 h-0.5 border-t-2 border-dashed border-rose-500"></div> Prediction</span>
            </div>
          </div>

          <div className="flex-1 min-h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictiveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}mm`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                
                <ReferenceLine y={8.0} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Failure Threshold', fill: '#f43f5e', fontSize: 10, fontWeight: 'bold' }} />
                
                <Area type="monotone" dataKey="actual_vibration" name="Actual" stroke="#64748b" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" activeDot={{ r: 6, fill: '#0f172a' }} />
                
                <Line type="monotone" dataKey="predicted_vibration" name="Prediction" stroke="#e11d48" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, fill: '#e11d48', strokeWidth: 0 }} />
                
                <ReferenceLine x="Current" stroke="#0ea5e9" strokeWidth={1.5} label={{ position: 'top', value: 'NOW', fill: '#0ea5e9', fontSize: 10, fontWeight: 'bold', dy: -10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Alerts Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Predicted Failures
            </h3>
            <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">Action Req.</span>
          </div>

          <div className="space-y-4 flex-1">
            {summary?.critical_assets?.slice(0, 3).map((asset) => (
              <div key={asset.asset_id} className={`p-4 rounded-xl border ${asset.risk_level === 'CRITICAL' ? 'border-rose-200 bg-rose-50 hover:bg-rose-100/50' : 'border-amber-200 bg-amber-50 hover:bg-amber-100/50'} transition-colors cursor-pointer group`} onClick={() => navigate(`/assets/${asset.asset_id}`)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    {asset.asset_type === 'wind_turbine' ? <Wind className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-slate-500" />} {asset.asset_code}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest bg-white px-2 py-0.5 rounded shadow-sm ${asset.risk_level === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>{asset.risk_level}</span>
                </div>
                <div className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                  {asset.why_flagged || 'Degradation detected'}
                </div>
                <button className={`w-full py-2 rounded-lg bg-white border text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${asset.risk_level === 'CRITICAL' ? 'border-rose-200 text-rose-700 hover:bg-rose-50 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600' : 'border-amber-200 text-amber-700 hover:bg-amber-50 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500'}`}>
                  Create Work Order <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!summary?.critical_assets || summary.critical_assets.length === 0) && (
              <div className="p-4 text-center text-sm font-medium text-slate-500">No critical assets found.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Quick stub for WrenchIcon until imported
function WrenchIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  );
}
