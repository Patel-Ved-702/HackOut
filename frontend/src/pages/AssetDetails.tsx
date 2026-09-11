import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Wind, 
  Sun, 
  Thermometer, 
  Activity, 
  Zap, 
  DollarSign, 
  Wrench, 
  AlertCircle, 
  CheckCircle, 
  Sliders,
  TrendingDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceItem } from '../types';

interface AssetDetailsProps {
  assetId: number;
  onBack: () => void;
  onNavigateTab: (tab: string) => void;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({ assetId, onBack, onNavigateTab }) => {
  const [asset, setAsset] = useState<any | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customTariff, setCustomTariff] = useState<number>(0.12);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskCreatedMsg, setTaskCreatedMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      const [detailData, readingData] = await Promise.all([
        api.getAssetDetail(assetId),
        api.getAssetReadings(assetId, 30)
      ]);
      setAsset(detailData);
      setReadings(readingData);
      if (detailData?.impact?.energy_price) {
        setCustomTariff(detailData.impact.energy_price);
      }
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask({
        asset_id: assetId,
        priority: asset?.status === 'CRITICAL' ? 'URGENT' : 'HIGH',
        notes: taskNotes || `Dispatched for inspection on ${asset?.asset_code} due to ${asset?.status} condition.`
      });
      setTaskCreatedMsg('Work order successfully created and dispatched to maintenance queue!');
      setIsCreatingTask(false);
      setTaskNotes('');
      setTimeout(() => setTaskCreatedMsg(null), 5000);
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  // Format chart time
  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    temperature: r.temperature,
    vibration: r.vibration,
    power_output: r.power_output,
    expected_power: r.expected_power ?? asset?.latest_reading?.expected_power ?? (asset ? asset.rated_capacity * 0.92 : 96.0),
  }));

  // Recalculate impact dynamically based on user's tariff slider
  const observedPower = asset?.latest_reading?.power_output ?? (asset?.rated_capacity * 0.92);
  const expectedPower = (asset?.latest_reading?.expected_power && asset.latest_reading.expected_power > 0)
    ? asset.latest_reading.expected_power
    : (asset?.impact?.expected_output_kw ?? (asset?.rated_capacity * 0.92));
  const lossKw = Math.max(0, expectedPower - observedPower);
  const deficitPct = expectedPower > 0 ? (lossKw / expectedPower) * 100 : 0;
  const dynamicHourlyLoss = lossKw * customTariff;
  const dynamicDailyLoss = dynamicHourlyLoss * 24;

  if (loading && !asset) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet Assets
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingTask(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            Create Maintenance Work Order
          </button>
        </div>
      </div>

      {taskCreatedMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {taskCreatedMsg}
          </div>
          <button
            onClick={() => onNavigateTab('maintenance')}
            className="underline font-semibold hover:text-white"
          >
            View Queue
          </button>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-inner">
            {asset?.asset_type === 'wind_turbine' ? (
              <Wind className="w-7 h-7 text-sky-400" />
            ) : (
              <Sun className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{asset?.asset_code}</h1>
              <StatusBadge status={asset?.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {asset?.asset_type === 'wind_turbine' ? 'Wind Turbine Generator' : 'Solar Photovoltaic Inverter'} • {asset?.site_name} • Rated {asset?.rated_capacity} kW
            </p>
          </div>
        </div>

        {/* Health Dial Score */}
        <div className="flex items-center gap-6 bg-slate-950/60 border border-slate-800 px-5 py-3 rounded-xl">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Health Score</div>
            <div className={`text-3xl font-extrabold font-mono ${
              asset?.health_score > 75 ? 'text-emerald-400' : asset?.health_score > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {asset?.health_score}/100
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs"
               style={{
                 borderColor: asset?.health_score > 75 ? '#10b981' : asset?.health_score > 50 ? '#f59e0b' : '#f43f5e'
               }}>
            {asset?.health_score}%
          </div>
        </div>
      </div>

      {/* Live Sensor Dials Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operating Temp</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {asset?.latest_reading?.temperature ? `${asset.latest_reading.temperature.toFixed(1)}°C` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nominal: 45°C - 50°C</div>
        </div>

        {/* Vibration */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mechanical Vibration</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {asset?.latest_reading?.vibration ? `${asset.latest_reading.vibration.toFixed(2)} mm/s` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nominal: &lt; 2.5 mm/s</div>
        </div>

        {/* Current */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Phase Current</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {asset?.latest_reading?.current ? `${asset.latest_reading.current.toFixed(1)} A` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nominal: ~38.0 A</div>
        </div>

        {/* Power Output */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Power Output</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {asset?.latest_reading?.power_output ? `${asset.latest_reading.power_output.toFixed(1)} kW` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Expected: {asset?.latest_reading?.expected_power ? `${asset.latest_reading.expected_power.toFixed(1)} kW` : '~92.0 kW'}
          </div>
        </div>
      </div>

      {/* Extended Telemetry Grid (Voltage, Wind, Solar, Humidity, Soiling) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6 flex-wrap">
          {asset?.latest_reading?.voltage !== undefined && asset?.latest_reading?.voltage !== null && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Voltage:</span>
              <strong className="text-slate-200">{asset.latest_reading.voltage.toFixed(0)} V</strong>
            </div>
          )}
          {asset?.latest_reading?.wind_speed !== undefined && asset?.latest_reading?.wind_speed !== null && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Wind Speed:</span>
              <strong className="text-sky-300">{asset.latest_reading.wind_speed.toFixed(1)} m/s</strong>
              {asset?.latest_reading?.wind_direction && (
                <span className="text-slate-500 text-[10px]">({asset.latest_reading.wind_direction}°)</span>
              )}
            </div>
          )}
          {asset?.latest_reading?.solar_irradiance !== undefined && asset?.latest_reading?.solar_irradiance !== null && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Solar Irradiance:</span>
              <strong className="text-amber-300">{asset.latest_reading.solar_irradiance.toFixed(0)} W/m²</strong>
            </div>
          )}
          {asset?.latest_reading?.panel_soiling !== undefined && asset?.latest_reading?.panel_soiling !== null && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Panel Soiling:</span>
              <strong className="text-orange-300">{asset.latest_reading.panel_soiling.toFixed(1)}%</strong>
            </div>
          )}
          {asset?.latest_reading?.humidity !== undefined && asset?.latest_reading?.humidity !== null && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Humidity:</span>
              <strong className="text-indigo-300">{asset.latest_reading.humidity.toFixed(0)}%</strong>
            </div>
          )}
          {asset?.latest_reading?.expected_power !== undefined && asset?.latest_reading?.expected_power !== null && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Expected Power:</span>
              <strong className="text-emerald-300">{asset.latest_reading.expected_power.toFixed(1)} kW</strong>
            </div>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Condition: <span className="text-slate-300 uppercase">{asset?.latest_reading?.dataset_status || 'Telemetry Ingested'}</span>
        </div>
      </div>

      {/* Multi-Series Sensor Trend Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Live Time-Series Sensor Stream</h3>
            <p className="text-xs text-slate-400">Continuous telemetry feed (Vibration, Temperature, Power)</p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {readings.length} data points logged
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="expected_power" name="Expected Baseline Power (kW)" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="power_output" name="Observed Power Output (kW)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#f43f5e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Section: Why Flagged (Explainability) & Configurable Impact Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why Flagged (Transparent Explainability Engine - Spec §7 & §11) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Root Evidence & Anomaly Explainability
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Deterministic Model Proof
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Observable engineering factors contributing to current health evaluation:
            </p>

            <div className="space-y-3">
              {asset?.evidence && asset.evidence.length > 0 ? (
                asset.evidence.map((item: EvidenceItem, idx: number) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border text-xs ${
                      item.severity === 'CRITICAL' 
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                        : item.severity === 'WARNING'
                        ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>• {item.metric}</span>
                      <span className="font-mono text-[11px] uppercase tracking-wide">
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">{item.description}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800">
                  No anomalous deviations detected. Sensor values are within normal operating ranges.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-300">
            <span className="font-semibold block mb-1">Recommended Next Action:</span>
            {asset?.status === 'CRITICAL' 
              ? 'Immediately dispatch technician to inspect mechanical bearings, gearbox lubrication, and electrical dissipation.'
              : asset?.status === 'HIGH RISK'
              ? 'Schedule preventative maintenance within 48 hours to prevent accelerated component wear.'
              : 'Nominal operation. Continue standard automated telemetry monitoring.'}
          </div>
        </div>

        {/* Configurable Generation & Financial Impact Estimator (Spec §7) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Configurable Energy & Financial Impact Estimator
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              No Hardcoded Tariffs
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Financial losses calculated dynamically using site capacity and operator-configured electricity tariff.
          </p>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Baseline Expected Generation:</span>
              <span className="font-mono font-bold text-white">{expectedPower.toFixed(1)} kW</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Observed Real-Time Generation:</span>
              <span className="font-mono font-bold text-emerald-400">{observedPower.toFixed(1)} kW</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Generation Deficit (Loss):</span>
              <span className="font-mono font-bold text-rose-400">
                {lossKw.toFixed(1)} kW {deficitPct > 0 ? `(${deficitPct.toFixed(1)}% deficit)` : ''}
              </span>
            </div>
          </div>

          {/* Interactive Tariff Slider */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                Configured Power Tariff ($/kWh):
              </span>
              <span className="font-mono font-bold text-indigo-300">${customTariff.toFixed(2)}/kWh</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.40"
              step="0.01"
              value={customTariff}
              onChange={(e) => setCustomTariff(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>$0.04 (Off-peak)</span>
              <span>$0.12 (Standard)</span>
              <span>$0.40 (Peak)</span>
            </div>
          </div>

          {/* Resulting Impact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Estimated Hourly Deficit</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ${dynamicHourlyLoss.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-lg">
              <div className="text-[11px] text-rose-300">Projected Daily Inaction Loss</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                ${dynamicDailyLoss.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Creating Maintenance Work Order */}
      {isCreatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Dispatch Maintenance Work Order
            </h3>
            <p className="text-xs text-slate-400">
              Generate work ticket for {asset?.asset_code} ({asset?.site_name}). This will appear immediately in the field technician's workspace.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Urgency</label>
                <input
                  type="text"
                  disabled
                  value={asset?.status === 'CRITICAL' ? 'URGENT' : 'HIGH'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Technician Notes & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Specify inspection scope (e.g. check bearing vibration, cooling radiator, lubrication)..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTask(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
