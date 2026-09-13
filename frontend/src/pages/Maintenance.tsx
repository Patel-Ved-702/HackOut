import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Wind, Sun, ClipboardList, CheckCircle2, AlertTriangle, AlertCircle, 
  TrendingDown, ArrowRight, Loader2, Wrench, ShieldAlert, Clock, 
  Activity, DollarSign, Zap, FileText, Check, Database, RefreshCw,
  ExternalLink, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { PriorityQueueItem, User, MaintenanceTask } from '../types';

export const Maintenance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<PriorityQueueItem[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<PriorityQueueItem | null>(null);
  const [selectedPriorityClass, setSelectedPriorityClass] = useState<string>('AUTO');
  
  // Work order form state
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [assignedTo, setAssignedTo] = useState<number>(2); // Default to Alex Technician
  const [actionNotes, setActionNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentWorkOrder, setRecentWorkOrder] = useState<MaintenanceTask | null>(null);

  const fetchData = async () => {
    try {
      const [pData, tData] = await Promise.all([
        api.getPriorities('all'),
        api.getTasks()
      ]);
      setPriorities(pData);
      setTasks(tData);
      
      // If asset_id is provided in URL query, select that asset
      const targetAssetIdStr = searchParams.get('asset_id');
      if (targetAssetIdStr) {
        const targetId = Number(targetAssetIdStr);
        const found = pData.find(p => p.asset_id === targetId);
        if (found) {
          setSelectedAsset(found);
        } else {
          // Fallback: fetch detail directly for this asset
          try {
            const detail = await api.getAssetDetail(targetId);
            if (detail) {
              const synthetic: PriorityQueueItem = {
                rank: pData.length + 1,
                priority_score: 50,
                asset_id: detail.id,
                asset_code: detail.asset_code,
                asset_type: detail.asset_type,
                site_name: detail.site_name || '',
                health_score: detail.health_score || 100,
                risk_level: detail.status || 'HEALTHY',
                rated_capacity: detail.rated_capacity || 100,
                persistence_hours: 0,
                estimated_revenue_loss_daily: detail.impact?.estimated_daily_revenue_loss || 0,
                active_alerts_count: 1,
                why_flagged: 'Operational work order dispatch requested from alert triage',
                recommended_action: 'Conduct prioritized on-site inspection and sensor verification',
                top_evidence: [],
                expected_output_kw: detail.impact?.expected_output_kw || detail.rated_capacity || 100,
                observed_output_kw: detail.impact?.observed_output_kw || 100,
                generation_loss_kw: detail.impact?.generation_loss_kw || 0,
                energy_price: detail.impact?.energy_price || 0.12,
                currency: detail.impact?.currency || '$',
                data_quality_status: 'NORMAL'
              };
              setSelectedAsset(synthetic);
            }
          } catch (e) {
            console.error('Failed to load asset detail fallback', e);
          }
        }
      } else if (pData.length > 0 && !selectedAsset) {
        setSelectedAsset(pData[0]);
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    // Fetch registered technicians or users
    const loadTechs = async () => {
      try {
        const users = await api.adminGetUsers();
        const techs = users.filter(u => u.role === 'technician' || u.role === 'operator');
        if (techs.length > 0) {
          setTechnicians(techs);
          setAssignedTo(techs[0].id);
        }
      } catch (err) {
        // Fallback default technician
        setTechnicians([
          { id: 2, name: 'Alex Technician', email: 'technician@renewguard.io', role: 'technician' }
        ]);
        setAssignedTo(2);
      }
    };
    loadTechs();
  }, []);

  // Update default priority class when selected asset changes
  useEffect(() => {
    if (selectedAsset) {
      setSelectedPriorityClass(selectedAsset.risk_level === 'CRITICAL' ? 'URGENT' : 'HIGH');
    }
  }, [selectedAsset?.asset_id, selectedAsset?.risk_level]);

  // Derived real values from live data (Req 1)
  const totalQueue = priorities.length;
  const criticalCount = priorities.filter(p => p.risk_level === 'CRITICAL').length;
  const highRiskCount = priorities.filter(p => p.risk_level === 'HIGH RISK' || p.risk_level === 'HIGH_RISK').length;
  const totalGenAtRiskKw = priorities
    .filter(p => p.risk_level === 'CRITICAL' || p.risk_level === 'HIGH RISK' || p.risk_level === 'HIGH_RISK')
    .reduce((sum, p) => sum + (p.generation_loss_kw || 0), 0);
  const totalRevAtRiskDaily = priorities
    .filter(p => p.risk_level === 'CRITICAL' || p.risk_level === 'HIGH RISK' || p.risk_level === 'HIGH_RISK')
    .reduce((sum, p) => sum + (p.estimated_revenue_loss_daily || 0), 0);
  const currencySymbol = priorities[0]?.currency || '₹';

  // Check if current selected asset has an active work order
  const assetWorkOrders = tasks.filter(t => selectedAsset && t.asset_id === selectedAsset.asset_id);
  const latestAssetWorkOrder = assetWorkOrders.length > 0 ? assetWorkOrders[0] : null;

  const handleDispatchWorkOrder = async () => {
    if (!selectedAsset) return;
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const fullNotes = [
        `Recommended Action: ${selectedAsset.recommended_action || 'Immediate on-site inspection'}`,
        `Telemetry Anomaly Context: ${selectedAsset.why_flagged || 'Abnormal sensor deviations detected'}`,
        selectedAsset.top_evidence && selectedAsset.top_evidence.length > 0 
          ? `Sensor Deviations: ${selectedAsset.top_evidence.map(e => `${e.metric} (${e.description})`).join('; ')}`
          : '',
        actionNotes ? `Operator Notes: ${actionNotes}` : ''
      ].filter(Boolean).join('\n\n');

      const task = await api.createTask({
        asset_id: selectedAsset.asset_id,
        assigned_to: assignedTo,
        priority: selectedPriorityClass as any,
        notes: fullNotes
      });

      setRecentWorkOrder(task);
      setSuccessMessage(`Work Order #${task.id} successfully created and dispatched to Technician Workspace!`);
      setActionNotes('');
      // Refresh tasks list
      const refreshedTasks = await api.getTasks();
      setTasks(refreshedTasks);
      // Auto-clear notification after 8 seconds
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch work order');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              OPERATIONAL DECISION CENTER
            </span>
            <span className="text-xs text-slate-400 font-mono">• Live Telemetry Feed</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-emerald-600" />
            Maintenance Operations
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            AI-Ranked decision queue determining which asset needs attention first, why, and what action to dispatch.
          </p>
        </div>

        <div className="text-right max-w-sm bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm hidden md:block">
          <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1 flex items-center justify-end gap-1">
            <RefreshCw className="w-3 h-3 text-emerald-500" /> EXPLAINABLE PRIORITY ENGINE
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Deterministic ranking derived directly from <strong>risk severity</strong> (45%), <strong>anomaly persistence</strong> (20%), <strong>daily revenue loss</strong> (25%), and <strong>rated capacity</strong> (10%).
          </p>
        </div>
      </div>

      {/* Target Asset Active Banner */}
      {searchParams.get('asset_id') && selectedAsset && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-900/10">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Work Order Target: <span className="font-mono text-emerald-800">{selectedAsset.asset_code}</span>
                <span className="text-xs text-slate-500 font-normal">({selectedAsset.site_name || 'Fleet Site'})</span>
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Pre-selected from alert triage. Review diagnostic evidence below and dispatch the work order to field technician.
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
            selectedAsset.risk_level === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {selectedAsset.risk_level}
          </span>
        </div>
      )}

      {/* 1. PRIORITY OVERVIEW (Live metrics from API/State, no hardcoding) */}
      <div>
        <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Priority Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Total Queue
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">{totalQueue}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Ranked renewable assets</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Critical Assets
            </div>
            <div className="text-3xl font-black text-rose-600 font-mono">{criticalCount}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Immediate dispatch required</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> High Risk Assets
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">{highRiskCount}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Priority 24-48h inspection</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Gen. Deficit at Risk
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono flex items-baseline gap-1">
              {totalGenAtRiskKw.toFixed(1)} <span className="text-xs font-bold text-slate-500">kW</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Expected vs observed drop</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm col-span-2 md:col-span-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-rose-500" /> Revenue at Risk
            </div>
            <div className="text-3xl font-black text-rose-600 font-mono flex items-baseline gap-0.5">
              <span>{currencySymbol}</span>{totalRevAtRiskDaily.toFixed(2)}
              <span className="text-xs font-bold text-slate-500">/day</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Based on site energy tariff</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative">
        {/* Main Content (Left) */}
        <div className={`flex-1 space-y-6 ${selectedAsset ? 'lg:w-3/5' : 'w-full'} transition-all duration-300`}>
          
          {/* Main Ranked Queue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> AI Ranked Dispatch Queue ({priorities.length} Assets)
              </h3>
              <span className="text-[11px] font-medium text-slate-400">
                Click any row to view diagnostic evidence & dispatch work order
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex">
              
              {/* Priority Visual Indicator Strip */}
              <div className="w-2.5 flex flex-col bg-slate-100 py-4 items-center">
                <div className="flex-1 w-full bg-rose-500 rounded-full mb-1"></div>
                <div className="flex-1 w-full bg-amber-400 rounded-full mb-1"></div>
                <div className="flex-1 w-full bg-emerald-500 rounded-full"></div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto relative">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5 text-center">Rank</th>
                      <th className="px-4 py-3.5">Asset</th>
                      <th className="px-4 py-3.5">Risk & Status</th>
                      <th className="px-4 py-3.5 text-center">Health</th>
                      <th className="px-4 py-3.5">Deficit / Revenue Impact</th>
                      <th className="px-4 py-3.5">Persistence</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white relative">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                          Evaluating fleet telemetry & ranking priority queue...
                        </td>
                      </tr>
                    ) : priorities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                          No active assets found in maintenance queue.
                        </td>
                      </tr>
                    ) : priorities.map((item) => {
                      const isCritical = item.risk_level === 'CRITICAL';
                      const isHighRisk = item.risk_level === 'HIGH RISK' || item.risk_level === 'HIGH_RISK';
                      const isWatch = item.risk_level === 'WATCH';
                      const isDataStale = item.data_quality_status === 'DATA STALE' || item.risk_level === 'DATA_STALE';
                      const isPredictionUnavailable = item.data_quality_status === 'AI PREDICTION UNAVAILABLE';
                      const isSelected = selectedAsset?.asset_id === item.asset_id;
                      
                      return (
                        <tr 
                          key={item.asset_id} 
                          onClick={() => setSelectedAsset(item)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                            isSelected ? 'bg-emerald-50/40 ring-1 ring-emerald-500/20' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <span className={`font-mono font-black text-lg ${
                              item.rank === 1 ? 'text-rose-600' : item.rank <= 3 ? 'text-amber-600' : 'text-slate-300'
                            }`}>
                              #{item.rank}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                {item.asset_type === 'wind_turbine' ? (
                                  <Wind className="w-4 h-4 text-slate-600" />
                                ) : (
                                  <Sun className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div>
                                <div className="font-mono font-black text-slate-900 text-sm flex items-center gap-1.5">
                                  {item.asset_code}
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  {item.site_name}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {isDataStale ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-700">
                                  <ShieldAlert className="w-3 h-3" /> DATA STALE
                                </span>
                              ) : isPredictionUnavailable ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-slate-300 bg-slate-50 text-slate-600">
                                  PREDICTION UNAVAILABLE
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                  isCritical ? 'text-rose-700 bg-rose-50 border-rose-200' : 
                                  isHighRisk ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                  isWatch ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                  'text-emerald-700 bg-emerald-50 border-emerald-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isCritical ? 'bg-rose-500 animate-ping' : 
                                    isHighRisk ? 'bg-orange-500' : 
                                    isWatch ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}></span>
                                  {item.risk_level}
                                </span>
                              )}
                              <div className="text-[10px] text-slate-400 font-mono">
                                Score: {item.priority_score}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`font-mono font-black text-sm ${
                                item.health_score < 50 ? 'text-rose-600' : 
                                item.health_score < 75 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {item.health_score}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">/ 100</span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-0.5 font-mono text-xs">
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>{(item.generation_loss_kw || 0).toFixed(1)} kW deficit</span>
                              </div>
                              <div className="text-[11px] font-black text-rose-600">
                                {currencySymbol}{(item.estimated_revenue_loss_daily || 0).toFixed(2)}/day
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.persistence_hours > 0 ? `${item.persistence_hours} hrs` : '< 15m'}</span>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAsset(item);
                              }}
                              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 ml-auto ${
                                isSelected 
                                  ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              Action <ArrowRight className="w-3 h-3" />
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

          {/* Explainability & Operational Impact Section (Req 3 & 4) */}
          {selectedAsset && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    EXPLAINABLE DIAGNOSTICS & ECONOMIC IMPACT
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Priority Breakdown: {selectedAsset.asset_code} ({selectedAsset.site_name})
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Rank #{selectedAsset.rank} • Score: {selectedAsset.priority_score}
                  </span>
                </div>
              </div>

              {/* Explainability: Why it was prioritized */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Why This Asset Was Prioritized
                </h4>
                
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {selectedAsset.why_flagged 
                      ? `${selectedAsset.asset_code} was prioritized because abnormal behaviour was detected: ${selectedAsset.why_flagged}. Telemetry persistence has been sustained for ${selectedAsset.persistence_hours} hours.`
                      : `${selectedAsset.asset_code} was prioritized due to operational telemetry divergence from baseline. Physical inspection recommended.`
                    }
                  </p>
                  <p className="text-xs text-slate-500 italic">
                    Note: Diagnostic engine identifies empirical telemetry anomalies (sensor deviations & ML anomaly persistence); physical component failure state confirmed during on-site inspection.
                  </p>
                </div>

                {/* Evidence items if available */}
                {selectedAsset.top_evidence && selectedAsset.top_evidence.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {selectedAsset.top_evidence.map((ev, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                          <span className="text-slate-500">{ev.metric}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                            ev.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>{ev.severity}</span>
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {ev.value} <span className="text-slate-400 font-normal">vs baseline {ev.baseline}</span>
                        </div>
                        <div className="text-[10px] font-mono text-rose-600 font-bold">
                          {ev.delta_pct > 0 ? `+${ev.delta_pct}% deviation` : `${ev.delta_pct}% deviation`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Economic & Generation Impact (Req 4) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Generation Deficit & Revenue Impact Breakdown
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected Output</span>
                    <span className="font-mono font-black text-slate-800 text-base">
                      {(selectedAsset.expected_output_kw || 0).toFixed(1)} kW
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Telemetry/capacity target</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Observed Output</span>
                    <span className="font-mono font-black text-slate-800 text-base">
                      {(selectedAsset.observed_output_kw || 0).toFixed(1)} kW
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Actual sensor output</span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] text-rose-600 uppercase font-black block">Generation Loss</span>
                    <span className="font-mono font-black text-rose-700 text-base">
                      {(selectedAsset.generation_loss_kw || 0).toFixed(1)} kW
                    </span>
                    <span className="text-[10px] text-rose-500 block mt-0.5">Deficit at risk</span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] text-rose-600 uppercase font-black block">Daily Revenue Loss</span>
                    <span className="font-mono font-black text-rose-700 text-base">
                      {selectedAsset.currency || '₹'}{(selectedAsset.estimated_revenue_loss_daily || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-rose-500 block mt-0.5">@ {selectedAsset.currency || '₹'}{selectedAsset.energy_price || 0.12}/kWh tariff</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  Calculation: generation loss = (expected output - observed output) × {selectedAsset.currency || '₹'}{selectedAsset.energy_price || 0.12}/kWh × 24h
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Work Order Panel (Right Side - Req 5, 6, 7) */}
        {selectedAsset && (
          <div className="w-full lg:w-2/5 transition-all duration-300 space-y-4">
            
            {/* Work Order Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl sticky top-20 relative overflow-hidden space-y-5">
              <div className={`absolute top-0 left-0 w-full h-2 ${
                selectedAsset.risk_level === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
              }`}></div>
              
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Generate Work Order</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Dispatches directly to field engineer workspace
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  ASSET #{selectedAsset.asset_id}
                </span>
              </div>

              {/* Existing Task Status Banner (Req 6) */}
              {latestAssetWorkOrder && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Current Work Order Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeStyle(latestAssetWorkOrder.status)}`}>
                      {latestAssetWorkOrder.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-medium">
                    Ticket #{latestAssetWorkOrder.id} • Assigned to: <strong>{latestAssetWorkOrder.assignee?.name || 'Technician'}</strong>
                  </div>

                  {latestAssetWorkOrder.outcome && (
                    <div className="text-xs text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                      Outcome: "{latestAssetWorkOrder.outcome}"
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/technician')}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 mt-1 transition-colors"
                  >
                    View in Technician Field Workspace <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Form Content */}
              <div className="space-y-4 text-sm">
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Equipment</span>
                  <span className="font-mono font-black text-slate-900 text-base">{selectedAsset.asset_code}</span>
                </div>
                
                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Work Order Priority
                  </label>
                  <select 
                    value={selectedPriorityClass}
                    onChange={(e) => setSelectedPriorityClass(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    <option value="URGENT">URGENT (Immediate Dispatch)</option>
                    <option value="HIGH">HIGH (Within 24 Hours)</option>
                    <option value="MEDIUM">MEDIUM (Scheduled Maintenance)</option>
                    <option value="LOW">LOW (Monitoring Routine)</option>
                  </select>
                </div>

                {/* Assigned Technician (Req 5 & 7) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Assigned Field Engineer
                  </label>
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(Number(e.target.value))}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Recommended Action */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recommended Inspection Action
                  </label>
                  <div className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700">
                    {selectedAsset.recommended_action || 'Immediate on-site inspection and bearing telemetry review.'}
                  </div>
                </div>

                {/* Diagnostics Context */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Sensor Telemetry Diagnosis Context
                  </label>
                  <div className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-700 text-xs font-mono font-medium max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {`[DIAGNOSTICS]\n${selectedAsset.why_flagged || 'Abnormal sensor deviations detected.'}\nPersistence: ${selectedAsset.persistence_hours}h`}
                  </div>
                </div>

                {/* Operator Additional Notes */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Operator Inspection Instructions / Notes
                  </label>
                  <textarea 
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-3 text-slate-700 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    placeholder="Enter specific instructions for field technician..."
                  ></textarea>
                </div>

                {/* Success & Error Banners */}
                {successMessage && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex flex-col gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                    <button
                      onClick={() => navigate('/technician')}
                      className="text-emerald-700 underline hover:text-emerald-900 text-left font-bold flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" /> View Work Order in Technician Workspace &rarr;
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Dispatch Button */}
                <button 
                  disabled={submitting}
                  onClick={handleDispatchWorkOrder}
                  className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Persisting Work Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Dispatch Work Order to Technician
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

