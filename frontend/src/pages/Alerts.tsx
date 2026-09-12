import React, { useEffect, useState } from 'react';
import { ShieldAlert, Bell, AlertTriangle, AlertCircle, Eye, CheckCircle, Search, Wind, Thermometer, Activity, Zap, TrendingDown, Clock, Info, BrainCircuit, LineChart as LineChartIcon } from 'lucide-react';
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

  // Fake sparkline data for the top summary
  const sparkData = [{v: 5}, {v: 8}, {v: 6}, {v: 10}, {v: 15}, {v: 12}];

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-emerald-600" />
          Alert Center
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Review persistent abnormal behaviour and operational risk.
        </p>
      </div>

      <div className="flex gap-6 relative">
        
        {/* Main Content (Left) */}
        <div className={`flex-1 space-y-6 ${selectedAlert ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
          
          {/* Top Summary Cards */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">TOP SUMMARY</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="light-card p-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                  <Bell className="w-3.5 h-3.5" /> Active Alerts
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-black text-slate-900">{alerts.filter(a => a.status === 'active').length || 12}</div>
                  <div className="w-16 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line type="monotone" dataKey="v" stroke="#e11d48" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="light-card p-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Critical
                </div>
                <div className="text-3xl font-black text-slate-900">{alerts.filter(a => a.severity === 'CRITICAL').length || 3}</div>
              </div>
              <div className="light-card p-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> High Risk
                </div>
                <div className="text-3xl font-black text-slate-900">{alerts.filter(a => a.severity === 'WARNING').length || 5}</div>
              </div>
              <div className="light-card p-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                  <Eye className="w-3.5 h-3.5 text-sky-500" /> Watch
                </div>
                <div className="text-3xl font-black text-slate-900">4</div>
              </div>
              <div className="light-card p-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Acknowledged
                </div>
                <div className="text-3xl font-black text-slate-900">{alerts.filter(a => a.status === 'acknowledged').length || 8}</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">FILTER BAR</h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {['All', 'Critical', 'High Risk', 'Watch', 'Acknowledged', 'Closed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search asset..."
                  className="pl-9 pr-4 py-1.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Main Alert Feed */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">MAIN ALERT FEED</h3>
            <div className="light-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Row</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Persistence</th>
                    <th className="px-4 py-3">Evidence</th>
                    <th className="px-4 py-3">Impact</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {alerts.length > 0 ? alerts.map((al) => {
                    const isCritical = al.severity === 'CRITICAL';
                    return (
                      <tr 
                        key={al.id} 
                        onClick={() => setSelectedAlert(al)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedAlert?.id === al.id ? 'bg-slate-50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                      >
                        <td className="px-4 py-4">
                          <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${
                            isCritical ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {isCritical ? 'Critical' : 'High Risk'}
                          </div>
                          <div className="font-mono font-bold text-slate-900 mb-1">{al.title.split(' ')[0] || 'WT-004'}</div>
                          <div className="text-xs text-slate-600 font-medium">{al.message}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-mono text-xs">
                          {new Date(al.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium text-xs">
                          {al.persistence_count * 5} minutes
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1.5 flex-wrap w-16">
                            {isCritical ? (
                              <>
                                <div className="p-1 bg-slate-100 rounded text-slate-600"><Activity className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-600"><Thermometer className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-600"><Zap className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-600"><TrendingDown className="w-3.5 h-3.5" /></div>
                              </>
                            ) : (
                              <>
                                <div className="p-1 bg-slate-100 rounded text-slate-600"><TrendingDown className="w-3.5 h-3.5" /></div>
                                <div className="p-1 bg-slate-100 rounded text-slate-600"><Wind className="w-3.5 h-3.5" /></div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 text-xs">
                          Estimated <strong className="text-slate-900">₹{isCritical ? '3,240' : '1,890'}</strong> revenue at risk
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col gap-1.5 items-end">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/assets/${al.asset_id}`); }}
                              className="w-24 px-2 py-1.5 rounded bg-gradient-to-r from-sky-400 to-sky-500 text-white text-[10px] font-bold text-center shadow-sm hover:opacity-90"
                            >
                              View Asset
                            </button>
                            <button 
                              onClick={(e) => handleAction(al.id, 'acknowledge', e)}
                              className="w-24 px-2 py-1.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold text-center hover:bg-slate-300"
                            >
                              Acknowledge
                            </button>
                            <button 
                              className="w-24 px-2 py-1.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold text-center hover:bg-emerald-200"
                            >
                              Create Task
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-medium">No alerts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special States */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">SPECIAL STATES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="light-card p-4 flex gap-3 items-start">
                <div className="p-1.5 bg-orange-100 text-orange-500 rounded-lg"><Info className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">DATA STALE</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Sensor data has not updated recently. Health prediction should not be interpreted as healthy.</p>
                </div>
              </div>
              <div className="light-card p-4 flex gap-3 items-start">
                <div className="p-1.5 bg-amber-100 text-amber-500 rounded-lg"><BrainCircuit className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">MODEL UNAVAILABLE</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Monitoring data available. AI health prediction currently unavailable.</p>
                </div>
              </div>
              <div className="light-card p-4 flex gap-3 items-start">
                <div className="p-1.5 bg-sky-100 text-sky-500 rounded-lg"><LineChartIcon className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">INSUFFICIENT HISTORY</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Insufficient history for reliable anomaly assessment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Detail Drawer (Right) */}
        {selectedAlert && (
          <div className="hidden lg:block w-1/3 transition-all duration-300">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">OPTIONAL DETAIL DRAWER</h3>
            <div className="light-card p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Alert Details</h2>
              
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Severity:</span>
                  <span className={`font-bold uppercase ${selectedAlert.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Asset:</span>
                  <span className="font-mono font-bold text-slate-900">WT-004</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-mono text-slate-900">{new Date(selectedAlert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Persistence:</span>
                  <span className="text-slate-900">{selectedAlert.persistence_count * 5} min</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-3">Why flagged:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> Rising vibration</span>
                    <span className="text-slate-400">⌄</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-slate-400" /> Rising temperature</span>
                    <span className="text-slate-400">⌄</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-slate-400" /> Declining power</span>
                    <span className="text-slate-400">⌄</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-1">Impact</h4>
                <div className="text-sm text-slate-600 leading-relaxed">
                  Generation: 420 kWh<br/>
                  Revenue: ₹2,520
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-slate-900 mb-1">Recommended Action</h4>
                <div className="text-sm text-slate-600 leading-relaxed">
                  Inspection recommended according to site procedure.
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={(e) => handleAction(selectedAlert.id, 'acknowledge', e)}
                  className="w-full py-2.5 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
                >
                  Acknowledge Alert
                </button>
                <button className="w-full py-2.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-200 transition-colors">
                  Create Maintenance Task
                </button>
                <button 
                  onClick={() => navigate(`/assets/${selectedAlert.asset_id}`)}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-400 to-sky-500 text-white font-bold hover:opacity-90 transition-opacity"
                >
                  View Asset
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
