import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Wind, Sun, Thermometer, Activity, Zap, DollarSign, Wrench, 
  AlertCircle, CheckCircle, MapPin, Zap as PowerIcon, ActivitySquare, BrainCircuit,
  Play, RotateCcw, AlertTriangle, X, Radio, Loader2, Sparkles
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

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

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

  // Live streaming simulator loop (runs every 2.5s when toggled on)
  useEffect(() => {
    let streamTimer: any = null;
    if (isStreaming) {
      streamTimer = setInterval(async () => {
        try {
          await api.simulateReading(assetId, 'normal');
          await fetchDetails();
        } catch (e) {
          console.error('Simulation stream error:', e);
        }
      }, 2500);
    }
    return () => {
      if (streamTimer) clearInterval(streamTimer);
    };
  }, [isStreaming, assetId]);

  const handleSimulate = async (mode: 'normal' | 'degrade' | 'spike' | 'reset') => {
    setIsSimulating(true);
    try {
      const res = await api.simulateReading(assetId, mode);
      await fetchDetails();
      const actionName = 
        mode === 'reset' ? 'Reset to Nominal Baseline' :
        mode === 'degrade' || mode === 'spike' ? 'Anomaly / Degradation Injected' :
        'Live Telemetry Ingested';
      const health = res?.result?.health_score ?? res?.health_score ?? '--';
      const risk = res?.result?.risk_level ?? res?.risk_level ?? 'HEALTHY';
      setSimFeedback(`${actionName} for ${asset?.asset_code || 'Asset'}. Health: ${health}/100 (${risk})`);
      setTimeout(() => setSimFeedback(null), 5000);
    } catch (err: any) {
      setSimFeedback(`Simulation failed: ${err.message}`);
      setTimeout(() => setSimFeedback(null), 4000);
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading && !asset) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isCritical = asset?.status === 'CRITICAL';
  const isWatch = asset?.status === 'WATCH';
  const isSolar = asset?.asset_type === 'solar_inverter' || (asset?.asset_code && asset.asset_code.startsWith('SP'));
  
  // Format sparkline data
  const sparkData = readings.map((r, i) => ({
    time: i,
    curr: r.current,
    power: r.power_output
  }));

  // Latest & previous reading metrics for dynamic stats & deltas
  const latest = asset?.latest_reading || (readings.length > 0 ? readings[readings.length - 1] : null);
  const previous = readings.length > 1 ? readings[readings.length - 2] : null;

  const calcDelta = (currVal?: number, prevVal?: number) => {
    if (currVal === undefined || currVal === null || prevVal === undefined || prevVal === null || prevVal === 0) return null;
    return ((currVal - prevVal) / Math.abs(prevVal)) * 100;
  };

  const tempDelta = calcDelta(latest?.temperature, previous?.temperature);
  const vibDelta = calcDelta(latest?.vibration, previous?.vibration);
  const currDelta = calcDelta(latest?.current, previous?.current);
  const powerDelta = calcDelta(latest?.power_output, previous?.power_output);

  // Dynamic Temperature Status
  const tempVal = latest?.temperature ?? 0;
  const tempStatus = isSolar
    ? (tempVal > 55 ? { label: 'Critical', color: 'border-rose-200 bg-rose-50 text-rose-600' }
      : tempVal > 46 ? { label: 'Elevated', color: 'border-amber-200 bg-amber-50 text-amber-700' }
      : { label: 'Optimal', color: 'border-emerald-200 bg-emerald-50 text-emerald-600' })
    : (tempVal > 62 ? { label: 'Critical', color: 'border-rose-200 bg-rose-50 text-rose-600' }
      : tempVal > 52 ? { label: 'Elevated', color: 'border-amber-200 bg-amber-50 text-amber-700' }
      : { label: 'Optimal', color: 'border-emerald-200 bg-emerald-50 text-emerald-600' });

  // Dynamic Vibration Status
  const vibVal = latest?.vibration ?? 0;
  const vibStatus = isSolar
    ? (vibVal > 1.8 ? { label: 'Critical', color: 'border-rose-200 bg-rose-50 text-rose-600 animate-pulse' }
      : vibVal > 0.9 ? { label: 'Elevated', color: 'border-amber-200 bg-amber-50 text-amber-700' }
      : { label: 'Stable', color: 'border-emerald-200 bg-emerald-50 text-emerald-600' })
    : (vibVal > 5.5 ? { label: 'Critical', color: 'border-rose-200 bg-rose-50 text-rose-600 animate-pulse' }
      : vibVal > 3.2 ? { label: 'Elevated', color: 'border-amber-200 bg-amber-50 text-amber-700' }
      : { label: 'Stable', color: 'border-emerald-200 bg-emerald-50 text-emerald-600' });

  // Dynamic Current Status
  const currStatus = (currDelta !== null && Math.abs(currDelta) > 15)
    ? { label: 'Fluctuating', color: 'border-amber-200 bg-amber-50 text-amber-700' }
    : { label: 'Stable', color: 'border-emerald-200 bg-emerald-50 text-emerald-600' };

  // Dynamic Power Status
  const powerVal = latest?.power_output ?? 0;
  const expPower = latest?.expected_power ?? asset?.rated_capacity ?? 100;
  const deficit = Math.max(0, expPower - powerVal);
  const powerStatus = (deficit > 20 || (expPower > 0 && deficit / expPower > 0.2))
    ? { label: 'Deficit', color: 'border-rose-200 bg-rose-50 text-rose-600' }
    : (deficit > 5 || (expPower > 0 && deficit / expPower > 0.08))
    ? { label: 'Moderate', color: 'border-amber-200 bg-amber-50 text-amber-700' }
    : { label: 'Optimal', color: 'border-emerald-200 bg-emerald-50 text-emerald-600' };

  // Delta Badge Formatter
  const renderDelta = (delta: number | null, inverseGood = false) => {
    if (delta === null) {
      return <div className="text-slate-400 font-bold text-xs bg-slate-50 px-2 py-1 rounded-md">Baseline</div>;
    }
    const isUp = delta > 0.05;
    const isDown = delta < -0.05;
    if (!isUp && !isDown) {
      return <div className="text-slate-500 font-bold text-xs bg-slate-50 px-2 py-1 rounded-md">± 0.0%</div>;
    }
    const isBad = inverseGood ? !isUp : isUp;
    const colorClass = isBad ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50';
    return (
      <div className={`${colorClass} font-bold text-xs px-2 py-1 rounded-md`}>
        {isUp ? `↗ +${delta.toFixed(1)}%` : `↘ ${delta.toFixed(1)}%`}
      </div>
    );
  };

  // Formatted Timestamp for Last Reading
  const formattedTime = latest?.timestamp
    ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">

      {/* Simulation Feedback Alert */}
      {simFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-bold shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{simFeedback}</span>
          </div>
          <button onClick={() => setSimFeedback(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {isCritical && <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>}
        <button onClick={() => navigate('/assets')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets
        </button>
        
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{asset?.asset_code || 'Unknown Asset'}</h1>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                {asset?.asset_type === 'wind_turbine' ? <Wind className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {asset?.asset_type === 'wind_turbine' ? 'Wind Turbine' : 'Solar Panel'}
              </span>
              
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5" /> {asset?.site_name || 'Unknown Site'}
              </span>
              
              <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                isCritical ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                isWatch ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'}`}></div> {asset?.status || 'HEALTHY'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl mr-2 text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Health Score</div>
              <div className={`text-xl font-black ${isCritical ? 'text-rose-500' : isWatch ? 'text-amber-500' : 'text-emerald-500'}`}>
                {Math.round(asset?.health_score || 100)}/100
              </div>
            </div>

            {/* Interactive Simulate Data Button */}
            <button 
              onClick={() => setShowSimModal(true)}
              className={`px-5 py-2.5 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                isStreaming 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 animate-pulse ring-2 ring-emerald-400/30' 
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <ActivitySquare className="w-4 h-4" /> 
              {isStreaming ? 'Streaming Live (2.5s)...' : 'Simulate Data'}
            </button>

            <button 
              onClick={() => navigate(`/maintenance?asset_id=${assetId}`)} 
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-emerald-900/10 hover:bg-emerald-800 transition-colors cursor-pointer"
            >
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
            <div className={`text-lg font-black mb-1 ${isCritical ? 'text-rose-600' : isWatch ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isCritical ? 'Critical Anomaly' : isWatch ? 'Telemetry Deviation' : 'Nominal System'}
            </div>
            <div className="text-[10px] font-bold text-slate-500">
              {asset?.anomaly_score ? `Anomaly Score: ${(asset.anomaly_score * 100).toFixed(0)}%` : 'Model v4.2b (High Sens.)'}
            </div>
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
            <div className="text-lg font-black text-slate-900 mb-1 font-mono flex items-center gap-2">
              {formattedTime}
              {isStreaming && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </div>
            <div className="text-[10px] font-bold text-slate-500">
              {isStreaming ? 'Streaming live (2.5s interval)' : 'Sampling interval: 5s'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <PowerIcon className="w-3.5 h-3.5" /> Rated Capacity
            </h4>
            <div className="text-lg font-black text-slate-900 mb-1">
              {asset?.rated_capacity ? `${asset.rated_capacity} kW` : '100 kW'}
            </div>
            <div className="text-[10px] font-bold text-slate-500">
              {isSolar ? 'SMA Sunny Central / PV Array' : 'Vestas V112 / Turbine'}
            </div>
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
            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${tempStatus.color}`}>
              {tempStatus.label}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter">
              {latest?.temperature ? `${latest.temperature.toFixed(1)}°` : '--°'}
            </div>
            {renderDelta(tempDelta, false)}
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
            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${vibStatus.color}`}>
              {vibStatus.label}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
              {latest?.vibration ? `${latest.vibration.toFixed(1)}` : '--'} <span className="text-sm text-slate-400 font-bold">mm/s</span>
            </div>
            {renderDelta(vibDelta, false)}
          </div>
          <div className="h-16 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="vib" stroke={vibVal > 3.0 ? "#e11d48" : "#f59e0b"} strokeWidth={2.5} dot={false} isAnimationActive={false} />
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
            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${currStatus.color}`}>
              {currStatus.label}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
              {latest?.current ? `${latest.current.toFixed(1)}` : '--'} <span className="text-sm text-slate-400 font-bold">A</span>
            </div>
            {renderDelta(currDelta, false)}
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
            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${powerStatus.color}`}>
              {powerStatus.label}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
              {latest?.power_output ? `${latest.power_output.toFixed(1)}` : '--'} <span className="text-sm text-slate-400 font-bold">kW</span>
            </div>
            {renderDelta(powerDelta, true)}
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

      {/* Telemetry Simulator Control Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
                  <ActivitySquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Telemetry Simulator</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Live dynamic telemetry for <span className="text-slate-900 font-mono font-bold">{asset?.asset_code}</span> ({asset?.asset_type === 'wind_turbine' ? 'Wind Turbine' : 'Solar Array'})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSimModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              
              {/* Option 1: Send Normal Reading */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-4 group">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-600" /> Send Normal Telemetry Reading
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Injects realistic operational telemetry with minor sensor drift within healthy bounds.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulate('normal')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors shrink-0 cursor-pointer shadow-md shadow-emerald-900/10"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Now'}
                </button>
              </div>

              {/* Option 2: Inject Anomaly / Degradation */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-all flex items-center justify-between gap-4 group">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Inject Anomaly / Degradation
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Simulates thermal spikes, abnormal vibration, and generation deficit to test ML anomaly detection.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulate('degrade')}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 disabled:opacity-50 transition-colors shrink-0 cursor-pointer shadow-md shadow-rose-900/10"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inject Anomaly'}
                </button>
              </div>

              {/* Option 3: Toggle Live Continuous Stream */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex items-center justify-between gap-4 group">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Radio className={`w-4 h-4 ${isStreaming ? 'text-emerald-500 animate-pulse' : 'text-sky-600'}`} /> 
                    Continuous Live Stream (2.5s)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {isStreaming 
                      ? 'Live streaming active! Generating telemetry every 2.5 seconds.' 
                      : 'Automatically generates live sensor readings every 2.5s. Watch sparklines slide in real time.'}
                  </div>
                </div>
                <button
                  onClick={() => setIsStreaming(!isStreaming)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-md ${
                    isStreaming 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200' 
                      : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-900/10'
                  }`}
                >
                  {isStreaming ? 'Stop Streaming' : 'Start Stream'}
                </button>
              </div>

              {/* Option 4: Reset Baseline */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between gap-4 group">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-slate-600" /> Reset to Nominal Baseline
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Clears anomalous readings, restores 100% health, and resolves pending alerts.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulate('reset')}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Baseline'}
                </button>
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSimModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Simulator
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
