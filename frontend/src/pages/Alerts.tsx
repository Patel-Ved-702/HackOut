import React, { useEffect, useState } from 'react';
import { ShieldAlert, Bell, AlertTriangle, AlertCircle, Eye, CheckCircle, Search, Wind, Thermometer, Activity, Zap, TrendingDown, Clock, Info, BrainCircuit, LineChart as LineChartIcon, Wrench, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

import { useNavigate } from 'react-router-dom';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'High Risk' | 'Watch' | 'Acknowledged' | 'Closed'>('All');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Quick Task Creation Modal state
  const [taskModalAlert, setTaskModalAlert] = useState<Alert | null>(null);
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [taskNotes, setTaskNotes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: number, action: 'acknowledge' | 'resolve', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateAlert(id, action);
      fetchAlerts();
      if (selectedAlert?.id === id) {
        setSelectedAlert(null);
      }
    } catch (err: any) {
      alert(`Failed to update alert: ${err.message}`);
    }
  };

  const handleOpenTaskModal = (al: Alert, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskModalAlert(al);
    setTaskPriority(al.severity === 'CRITICAL' ? 'URGENT' : 'HIGH');
    setTaskNotes(`Anomaly investigation: ${al.message}`);
  };

  const handleCreateTaskFromAlert = async () => {
    if (!taskModalAlert) return;
    setIsSubmittingTask(true);
    try {
      await api.createTask({
        asset_id: taskModalAlert.asset_id,
        assigned_to: 2, // Alex Technician
        priority: taskPriority,
        notes: `[Dispatched from Alert #${taskModalAlert.id}] ${taskModalAlert.title}\n${taskNotes}`
      });
      try {
        await api.updateAlert(taskModalAlert.id, 'acknowledge');
      } catch (e) {}

      setTaskSuccess(`Work order ticket dispatched to Alex Technician!`);
      setTimeout(() => setTaskSuccess(null), 6000);
      setTaskModalAlert(null);
      fetchAlerts();
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const sparkData = [{v: 5}, {v: 8}, {v: 6}, {v: 10}, {v: 15}, {v: 12}];

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-emerald-600" />
            Diagnostics & Alerts
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review persistent abnormal behaviour and operational risk.</p>
        </div>
      </div>

      {/* Task Creation Success Toast */}
      {taskSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-bold shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{taskSuccess}</span>
          </div>
          <button onClick={() => setTaskSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 relative">
        
        {/* Main Content (Left) */}
        <div className={`flex-1 space-y-6 ${selectedAlert ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
          
          {/* Top Summary Cards */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Threat Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3">
                  <Bell className="w-3.5 h-3.5" /> Active Alerts
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-black text-slate-900">{alerts.filter(a => a.status === 'active').length}</div>
                  <div className="w-16 h-8 opacity-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line type="monotone" dataKey="v" stroke="#e11d48" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-rose-500 text-[10px] uppercase tracking-widest font-bold mb-3">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical
                </div>
                <div className="text-4xl font-black text-slate-900">{alerts.filter(a => a.severity === 'CRITICAL').length}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase tracking-widest font-bold mb-3">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Risk
                </div>
                <div className="text-4xl font-black text-slate-900">{alerts.filter(a => a.severity === 'WARNING').length}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-sky-500 text-[10px] uppercase tracking-widest font-bold mb-3">
                  <Eye className="w-3.5 h-3.5" /> Watch
                </div>
                <div className="text-4xl font-black text-slate-900">{alerts.filter(a => a.severity === 'INFO').length}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] uppercase tracking-widest font-bold mb-3">
                  <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                </div>
                <div className="text-4xl font-black text-slate-900">{alerts.filter(a => a.status === 'acknowledged').length}</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Critical', 'High Risk', 'Watch', 'Acknowledged', 'Closed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search alert ID or asset..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Main Alert Feed */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Alert Feed</h3>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 w-1/3">Incident</th>
                    <th className="px-5 py-4">Time</th>
                    <th className="px-5 py-4">Persistence</th>
                    <th className="px-5 py-4">Evidence</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {alerts.length > 0 ? alerts.map((al) => {
                    const isCritical = al.severity === 'CRITICAL';
                    return (
                      <tr 
                        key={al.id} 
                        onClick={() => setSelectedAlert(al)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedAlert?.id === al.id ? 'bg-slate-50 border-l-[6px] border-l-emerald-500' : 'border-l-[6px] border-l-transparent'}`}
                      >
                        <td className="px-5 py-4">
                          <div className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mb-1.5 ${
                            isCritical ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {isCritical ? 'Critical' : 'High Risk'}
                          </div>
                          <div className="font-mono font-black text-slate-900 mb-1">{al.asset?.asset_code || al.title.split(' ')[0]}</div>
                          <div className="text-xs text-slate-500 font-medium">{al.message}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono font-bold text-xs">
                          {new Date(al.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-bold text-xs">
                          {al.persistence_count * 5} min
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 flex-wrap w-16">
                            {isCritical ? (
                              <>
                                <div className="p-1 bg-slate-100 rounded text-slate-500"><Activity className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-500"><Thermometer className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-500"><Zap className="w-3.5 h-3.5" /></div>
                              </>
                            ) : (
                              <>
                                <div className="p-1 bg-slate-100 rounded text-slate-500"><TrendingDown className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-500"><Wind className="w-3.5 h-3.5" /></div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col gap-1.5 items-end">
                            {al.status === 'acknowledged' ? (
                              <button 
                                disabled
                                className="w-28 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest text-center opacity-70 cursor-not-allowed"
                              >
                                Acknowledged
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => handleAction(al.id, 'acknowledge', e)}
                                className="w-28 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-center hover:bg-slate-200 transition-colors"
                              >
                                Acknowledge
                              </button>
                            )}
                            <button 
                              onClick={(e) => handleOpenTaskModal(al, e)}
                              className="w-28 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest text-center hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Create Task
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <CheckCircle className="w-10 h-10 mb-2 opacity-50" />
                          <span className="font-bold">No active alerts</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special States */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">System Anomalies</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Info className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">DATA STALE</h4>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">Sensor data has not updated recently.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><BrainCircuit className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">MODEL OFFLINE</h4>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">AI health prediction currently unavailable.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="p-2 bg-sky-50 text-sky-500 rounded-xl"><LineChartIcon className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">INSUFFICIENT HIST</h4>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">Insufficient history for reliable assessment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Detail Drawer (Right) */}
        {selectedAlert && (
          <div className="hidden lg:block w-1/3 transition-all duration-300">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Incident Report</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl sticky top-24 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${selectedAlert.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-6">Alert Profile</h2>
              
              <div className="space-y-4 text-sm mb-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Severity</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                    selectedAlert.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Target</span>
                  <span className="font-mono font-black text-slate-900">{selectedAlert.asset?.asset_code}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Registered</span>
                  <span className="font-mono font-bold text-slate-700">{new Date(selectedAlert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Persistence</span>
                  <span className="font-bold text-slate-700">{selectedAlert.persistence_count * 5} min</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Threat Identifiers</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-rose-500" /> Rising vibration</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-rose-500" /> Elevated temperature</span>
                  </div>
                </div>
              </div>

              <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-100">
                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Financial Impact Risk</h4>
                <div className="text-xl font-black text-rose-700">
                  ₹{selectedAlert.severity === 'CRITICAL' ? '3,240' : '1,890'} <span className="text-sm font-bold text-rose-500">/day</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={(e) => handleAction(selectedAlert.id, 'acknowledge', e)}
                  className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
                >
                  Acknowledge & Mute
                </button>
                <button 
                  onClick={() => navigate(`/maintenance?asset_id=${selectedAlert.asset_id}`)}
                  className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  Generate Work Order
                </button>
                <button 
                  onClick={() => navigate(`/assets/${selectedAlert.asset_id}`)}
                  className="w-full py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                >
                  View Live Telemetry
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Quick Task Creation Modal */}
      {taskModalAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create Maintenance Task</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Dispatch work order for <span className="text-slate-900 font-mono font-bold">{taskModalAlert.asset?.asset_code || 'Asset'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTaskModalAlert(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Triggering Alert</div>
                <div className="font-bold text-slate-900 text-xs">{taskModalAlert.title}</div>
                <div className="text-xs text-slate-500">{taskModalAlert.message}</div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['URGENT', 'HIGH', 'MEDIUM'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTaskPriority(p)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        taskPriority === p 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Assign Technician
                </label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Alex Technician (Field Engineer)</span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">AVAILABLE</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Task Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Specific inspection or repair instructions..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = taskModalAlert.asset_id;
                    setTaskModalAlert(null);
                    navigate(`/maintenance?asset_id=${id}`);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Open in Decision Center (Full Queue) &rarr;
                </button>

                <div className="flex items-center gap-2 self-end">
                  <button
                    type="button"
                    onClick={() => setTaskModalAlert(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingTask}
                    onClick={handleCreateTaskFromAlert}
                    className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-md shadow-emerald-900/10 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                    Dispatch Task
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
