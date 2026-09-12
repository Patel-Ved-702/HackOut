import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Wind, Sun, Thermometer, Activity, Zap, DollarSign, Wrench, 
  AlertCircle, CheckCircle, MapPin, Zap as PowerIcon, ActivitySquare
} from 'lucide-react';
import { 
  LineChart, Line, ResponsiveContainer, XAxis, Tooltip
} from 'recharts';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

import { useParams, useNavigate } from 'react-router-dom';

export const AssetDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const assetId = Number(id);
  const [asset, setAsset] = useState<any | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchDetails = async () => {
    try {
      const [detailData, readingData] = await Promise.all([
        api.getAssetDetail(assetId),
        api.getAssetReadings(assetId, 30)
      ]);
      setAsset(detailData);
      setReadings(readingData);
    } catch (err) {
      console.error('Failed to load asset details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);
  }, [assetId]);

  if (loading && !asset) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isCritical = asset?.status === 'CRITICAL';
  
  // Format sparkline data
  const sparkData = readings.map((r, i) => ({
    time: i,
    temp: r.temperature,
    vib: r.vibration,
    curr: r.current,
    power: r.power_output
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {isCritical && <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>}
        <button onClick={() => navigate('/assets')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets
        </button>
        
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{asset?.asset_code || 'WT-004'}</h1>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                {asset?.asset_type === 'wind_turbine' ? <Wind className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {asset?.asset_type === 'wind_turbine' ? 'Wind Turbine' : 'Solar Panel'}
              </span>
              
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5" /> {asset?.site_name || 'GreenWind Site'}
              </span>
              
              <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                isCritical ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div> {asset?.status || 'HEALTHY'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl mr-2 text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Health Score</div>
              <div className={`text-xl font-black ${isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>{asset?.health_score || 100}/100</div>
            </div>
            <button className="px-5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold text-sm flex items-center gap-2 hover:bg-amber-100 transition-colors shadow-sm">
              <ActivitySquare className="w-4 h-4" /> Simulate Data
            </button>
            <button onClick={() => setIsCreatingTask(true)} className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-emerald-900/10 hover:bg-emerald-800 transition-colors">
              <Wrench className="w-4 h-4" /> Issue Work Order
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8 items-center relative overflow-hidden">
        
        {/* Info Cards Grid */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full relative z-10">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" /> AI Inference State
            </h4>
            <div className={`text-lg font-black mb-1 ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isCritical ? 'Anomaly Detected' : 'Nominal System'}
            </div>
            <div className="text-[10px] font-bold text-slate-500">Model v4.2b (High Sens.)</div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Data Quality
            </h4>
            <div className="text-lg font-black text-slate-900 mb-1">
              Live Edge Sync
            </div>
            <div className="text-[10px] font-bold text-emerald-600">0.02% packet loss</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Last Reading
            </h4>
            <div className="text-lg font-black text-slate-900 mb-1 font-mono">
              15:30:00
            </div>
            <div className="text-[10px] font-bold text-slate-500">Sampling interval: 1s</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <PowerIcon className="w-3.5 h-3.5" /> Rated Capacity
            </h4>
            <div className="text-lg font-black text-slate-900 mb-1">
              {asset?.rated_capacity || '2.5'} MW
            </div>
            <div className="text-[10px] font-bold text-slate-500">Vestas V112 / #BRG-9842</div>
          </div>
        </div>
      </div>

      {/* Sensor Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Temperature */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-52 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><Thermometer className="w-4 h-4" /></div>
              Temperature
            </div>
            <span className="px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest">Elevated</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter">
              {asset?.latest_reading?.temperature ? `${asset.latest_reading.temperature.toFixed(1)}°` : '67.2°'}
            </div>
            <div className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-md">
              ↗ 18% 
            </div>
          </div>
          <div className="h-16 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="temp" stroke="#e11d48" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vibration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-52 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><Activity className="w-4 h-4" /></div>
              Vibration
            </div>
            <span className="px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest animate-pulse">Critical</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
              {asset?.latest_reading?.vibration ? `${asset.latest_reading.vibration.toFixed(1)}` : '6.8'} <span className="text-sm text-slate-400 font-bold">mm/s</span>
            </div>
            <div className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-md">
              ↗ 42% 
            </div>
          </div>
          <div className="h-16 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="vib" stroke="#e11d48" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-52 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Zap className="w-4 h-4" /></div>
              Current
            </div>
            <span className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">Stable</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
              {asset?.latest_reading?.current ? `${asset.latest_reading.current.toFixed(1)}` : '38.1'} <span className="text-sm text-slate-400 font-bold">A</span>
            </div>
            <div className="text-slate-500 font-bold text-xs bg-slate-50 px-2 py-1 rounded-md">
              ± 1.2%
            </div>
          </div>
          <div className="h-16 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="curr" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Power Output */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-52 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><PowerIcon className="w-4 h-4" /></div>
              Power Output
            </div>
            <span className="px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest">Deficit</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
              {asset?.latest_reading?.power_output ? `${asset.latest_reading.power_output.toFixed(1)}` : '68.4'} <span className="text-sm text-slate-400 font-bold">kW</span>
            </div>
            <div className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-md">
              ↘ 23%
            </div>
          </div>
          <div className="h-16 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
