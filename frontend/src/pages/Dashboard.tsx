import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldCheck, AlertTriangle, Flame, DollarSign, 
  ArrowRight, Radio, BrainCircuit, BellRing, Wind, Sun, AlertCircle
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

  // Early Warning Predictive Data (Mocked for visual demonstration of prediction)
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
    <div className="max-w-[1400px] mx-auto pb-12 space-y-8">
      
      {/* Hero Section & Value Proposition */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-sky-50 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" /> Early Warning System
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Predictive Maintenance for <br />
              <span className="text-emerald-600">Solar & Wind Assets</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-xl">
              Stop reacting to breakdowns. Our AI-driven telemetry engine detects microscopic anomalies in solar panels and wind turbines, triggering alerts <strong className="text-slate-700">days before</strong> a critical failure occurs.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <button onClick={() => navigate('/assets')} className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-2">
                Monitor Live Assets <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* How it Works Diagram */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center gap-2 text-center w-24">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-sky-500">
                <Radio className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Live IoT Data</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200"></div>
            <div className="flex flex-col items-center gap-2 text-center w-24">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-200 border-b-4 flex items-center justify-center text-emerald-500 relative">
                <BrainCircuit className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">AI Prediction</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200"></div>
            <div className="flex flex-col items-center gap-2 text-center w-24">
              <div className="w-12 h-12 bg-rose-50 rounded-xl shadow-sm border border-rose-200 flex items-center justify-center text-rose-500">
                <BellRing className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Early Alert</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Light Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="light-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Assets</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">{summary?.total_assets ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Actively streaming telemetry</div>
        </div>

        <div className="light-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Healthy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{summary?.healthy_count ?? 0}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Nominal operation</div>
        </div>

        <div className="light-card p-5 border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Watch List</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{summary?.watch_count ?? 0}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">Early degradation detected</div>
        </div>

        <div className="light-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Critical</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {(summary?.critical_count ?? 0) + (summary?.high_risk_count ?? 0)}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">Action required immediately</div>
        </div>

        <div className="rounded-xl shadow-sm p-5 bg-slate-900 text-white border-none col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500 rounded-full blur-2xl opacity-20"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Revenue at Risk</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white relative z-10">
            ${summary?.total_revenue_at_risk_daily.toFixed(0) ?? 0}
            <span className="text-sm text-slate-400 font-normal">/day</span>
          </div>
          <div className="text-[11px] text-rose-300 mt-1 font-mono relative z-10">
            {summary?.total_generation_at_risk_kw.toFixed(1)} kW generation deficit
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Early Warning Predictive Chart */}
        <div className="xl:col-span-2 light-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Line className="w-5 h-5 text-emerald-500" /> Early Warning Degradation Trajectory (WT-004)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                AI predicting a catastrophic gearbox failure 48 hours before it occurs based on microscopic vibration drift.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 bg-slate-300 rounded-sm"></div> Historical</span>
              <span className="flex items-center gap-1 text-rose-600"><div className="w-3 h-0.5 border-t-2 border-dashed border-rose-500"></div> AI Prediction</span>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictiveData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 12]} tickFormatter={(val) => `${val} mm/s`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                
                {/* Critical Threshold Line */}
                <ReferenceLine y={8.0} stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Critical Failure Threshold (8.0 mm/s)', fill: '#f43f5e', fontSize: 11, fontWeight: 'bold' }} />
                
                {/* Historical Actual Data */}
                <Area type="monotone" dataKey="actual_vibration" name="Actual Vibration" stroke="#475569" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" activeDot={{ r: 6 }} />
                
                {/* Predicted Trajectory */}
                <Line type="monotone" dataKey="predicted_vibration" name="Predicted Trajectory" stroke="#e11d48" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, fill: '#e11d48' }} />
                
                {/* Current Time Marker */}
                <ReferenceLine x="Current" stroke="#0ea5e9" strokeWidth={2} label={{ position: 'top', value: 'YOU ARE HERE', fill: '#0ea5e9', fontSize: 10, fontWeight: 'bold' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Alerts Queue */}
        <div className="light-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Predicted Failures Queue
              </h3>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">Action Req.</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Assets that will break down if maintenance is not dispatched.</p>

            <div className="space-y-3">
              {/* Mocking the predicted queue to match the narrative */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Wind className="w-4 h-4 text-slate-500" /> WT-004
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">In 24 hours</span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  Main bearing vibration drift indicating lubrication exhaustion. 
                </div>
                <button onClick={() => navigate('/assets')} className="mt-1 w-full py-1.5 rounded bg-rose-600 text-white text-[10px] font-bold text-center shadow-sm hover:bg-rose-700 transition-colors">
                  Dispatch Work Order
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Sun className="w-4 h-4 text-slate-500" /> SP-014
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">In 3 Days</span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  Inverter thermal overload predicted based on local ambient temperature forecast and internal cooling efficiency drop.
                </div>
                <button onClick={() => navigate('/assets')} className="mt-1 w-full py-1.5 rounded bg-amber-500 text-white text-[10px] font-bold text-center shadow-sm hover:bg-amber-600 transition-colors">
                  Schedule Inspection
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
