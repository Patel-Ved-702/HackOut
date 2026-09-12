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
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      
      {/* Header Card */}
      <div className="light-card p-5">
        <button onClick={() => navigate('/assets')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-semibold mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets
        </button>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-slate-900 font-mono tracking-tight">{asset?.asset_code || 'WT-004'}</h1>
            
            <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold">
              {asset?.asset_type === 'wind_turbine' ? <Wind className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              {asset?.asset_type === 'wind_turbine' ? 'Wind Turbine' : 'Solar Panel'}
            </span>
            
            <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
              <MapPin className="w-3.5 h-3.5" /> {asset?.site_name || 'GreenWind Site'}
            </span>
            
            <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${
              isCritical ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              • {asset?.status || 'HEALTHY'}
            </span>
            
            <span className="text-slate-400 font-bold ml-2 text-sm">
              Health: <span className={isCritical ? 'text-rose-500' : 'text-emerald-500'}>{asset?.health_score || 100}/100</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-full border-2 border-amber-400 text-amber-600 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-50">
              <ActivitySquare className="w-4 h-4" /> Simulate Degradation
            </button>
            <button onClick={() => setIsCreatingTask(true)} className="px-4 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-700">
              <Wrench className="w-4 h-4" /> Create Maintenance Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="light-card p-6 flex flex-col lg:flex-row gap-8 items-center">
        
        {/* Health Gauge */}
        <div className="flex items-center gap-6 lg:border-r border-slate-200 pr-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={isCritical ? '#f43f5e' : '#10b981'} strokeWidth="10" strokeDasharray={`${(asset?.health_score || 0) * 2.8} 300`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>{asset?.health_score || 100}</span>
              <span className="text-slate-400 font-bold text-xs">/ 100</span>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Health Status</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xl font-black uppercase ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                {asset?.status || 'Healthy'}
              </span>
              {isCritical && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">Zone D</span>}
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px]">
              Calculated from composite vibration harmonics, thermography, and aerodynamic yield.
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">AI Inference State</h4>
            <div className={`font-bold text-sm mb-1 ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isCritical ? 'Anomaly detected' : 'Nominal operation'}
            </div>
            <div className="text-[10px] text-slate-500">Model v4.2b (High Sens.)</div>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Data Quality</h4>
            <div className="font-bold text-emerald-600 text-sm mb-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Live / Good
            </div>
            <div className="text-[10px] text-slate-500">0.02% packet loss</div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Last Reading</h4>
            <div className="font-bold text-slate-700 text-sm mb-1 flex items-center gap-1 font-mono">
              15:30:00
            </div>
            <div className="text-[10px] text-slate-500">Sampling interval: 1s</div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Rated Capacity</h4>
            <div className="font-bold text-emerald-600 text-sm mb-1 flex items-center gap-1">
              <PowerIcon className="w-3.5 h-3.5" /> {asset?.rated_capacity || '2.5'} MW
            </div>
            <div className="text-[10px] text-slate-500">Vestas V112 / #BRG-9842</div>
          </div>
        </div>
      </div>

      {/* Sensor Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Temperature */}
        <div className="light-card p-5 relative overflow-hidden flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <div className="p-1.5 bg-rose-50 text-rose-500 rounded"><Thermometer className="w-4 h-4" /></div>
              Temperature
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">Elevated</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
              {asset?.latest_reading?.temperature ? `${asset.latest_reading.temperature.toFixed(1)}°C` : '67.2°C'}
            </div>
            <div className="text-rose-600 font-bold text-xs flex items-center gap-0.5">
              ↗ 18% <span className="text-slate-400 font-normal">vs baseline</span>
            </div>
          </div>
          <div className="h-12 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="temp" stroke="#e11d48" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 z-10 border-t border-slate-100 pt-2">
            <span>Baseline: 57.0°C</span>
            <span>Trip Threshold: 75.0°C</span>
          </div>
        </div>

        {/* Vibration */}
        <div className="light-card p-5 relative overflow-hidden flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <div className="p-1.5 bg-rose-50 text-rose-500 rounded"><Activity className="w-4 h-4" /></div>
              Vibration (RMS)
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">Critical Spike</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
              {asset?.latest_reading?.vibration ? `${asset.latest_reading.vibration.toFixed(1)}` : '6.8'} <span className="text-base text-slate-500 font-medium">mm/s</span>
            </div>
            <div className="text-rose-600 font-bold text-xs flex items-center gap-0.5">
              ↗ 42% <span className="text-slate-400 font-normal">vs baseline</span>
            </div>
          </div>
          <div className="h-12 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="vib" stroke="#e11d48" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 z-10 border-t border-slate-100 pt-2">
            <span>Baseline: 4.8 mm/s</span>
            <span>ISO 10816 Zone D Limit: 4.5</span>
          </div>
        </div>

        {/* Current */}
        <div className="light-card p-5 relative overflow-hidden flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded"><Zap className="w-4 h-4" /></div>
              Current
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">Stable</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
              {asset?.latest_reading?.current ? `${asset.latest_reading.current.toFixed(1)}` : '38.1'} <span className="text-base text-slate-500 font-medium">A</span>
            </div>
            <div className="text-slate-500 font-bold text-xs flex items-center gap-0.5">
              ± 1.2% <span className="text-slate-400 font-normal">variance</span>
            </div>
          </div>
          <div className="h-12 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="curr" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 z-10 border-t border-slate-100 pt-2">
            <span>Baseline: 37.8 A</span>
            <span>Max Stator Load: 65.0 A</span>
          </div>
        </div>

        {/* Power Output */}
        <div className="light-card p-5 relative overflow-hidden flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <div className="p-1.5 bg-amber-50 text-amber-500 rounded"><PowerIcon className="w-4 h-4" /></div>
              Power Output
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">Deficit</span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
              {asset?.latest_reading?.power_output ? `${asset.latest_reading.power_output.toFixed(1)}` : '68.4'} <span className="text-base text-slate-500 font-medium">kW</span>
            </div>
            <div className="text-rose-600 font-bold text-xs flex items-center gap-0.5">
              ↘ 23% <span className="text-slate-400 font-normal">vs baseline</span>
            </div>
          </div>
          <div className="h-12 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 z-10 border-t border-slate-100 pt-2">
            <span>Expected: 88.8 kW</span>
            <span>Curtailment: Active</span>
          </div>
        </div>

      </div>

    </div>
  );
};
