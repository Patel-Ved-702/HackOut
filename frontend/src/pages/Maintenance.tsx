import React, { useEffect, useState } from 'react';
import { Wind, Sun, ClipboardList, CheckCircle2, AlertTriangle, AlertCircle, TrendingDown, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { PriorityQueueItem } from '../types';

export const Maintenance: React.FC = () => {
  const [priorities, setPriorities] = useState<PriorityQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<PriorityQueueItem | null>(null);

  const fetchData = async () => {
    try {
      const pData = await api.getPriorities();
      setPriorities(pData);
      if (pData.length > 0 && !selectedAsset) {
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
  }, []);

  const displayData = priorities;

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-emerald-600" />
            Maintenance Operations
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">AI-Ranked queue determining which asset needs attention first.</p>
        </div>
        <div className="text-right max-w-xs bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm hidden md:block">
          <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">PRIORITY ENGINE</div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Ranking is determined deterministically by combining risk severity, anomaly persistence, and estimated revenue impact.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative">
        {/* Main Content (Left) */}
        <div className={`flex-1 space-y-6 ${selectedAsset ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
          
          {/* Top Priority Overview */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Priority Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total Queue
                </div>
                <div className="text-4xl font-black text-slate-900">14</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Critical
                </div>
                <div className="text-4xl font-black text-slate-900">3</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Risk
                </div>
                <div className="text-4xl font-black text-slate-900">5</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" /> Gen. at Risk
                </div>
                <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1">1,248 <span className="text-sm font-bold text-slate-500">kWh</span></div>
              </div>
            </div>
          </div>

          {/* Main Ranked Queue */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">AI Ranked Dispatch Queue</h3>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex">
              
              {/* Priority Indicator Column */}
              <div className="w-6 flex flex-col bg-slate-50 border-r border-slate-100 py-6 items-center">
                <div className="flex-1 w-2 min-h-[90px] bg-rose-500 rounded-full mb-2 shadow-sm"></div>
                <div className="flex-1 w-2 min-h-[90px] bg-orange-400 rounded-full mb-2 shadow-sm"></div>
                <div className="flex-1 w-2 min-h-[90px] bg-emerald-500 rounded-full shadow-sm"></div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto relative">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4">Rank</th>
                      <th className="px-5 py-4">Asset</th>
                      <th className="px-5 py-4">Risk Level</th>
                      <th className="px-5 py-4">Health</th>
                      <th className="px-5 py-4">Energy Deficit</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white relative">
                    {displayData.map((item, index) => {
                      const isCritical = item.risk_level === 'CRITICAL';
                      const isSelected = selectedAsset?.asset_id === item.asset_id;
                      
                      return (
                        <tr 
                          key={item.asset_id} 
                          onClick={() => setSelectedAsset(item as any)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors group ${isSelected ? 'bg-slate-50' : ''}`}
                        >
                          <td className="px-5 py-6">
                            <span className="font-black text-2xl text-slate-300">
                              #{item.rank}
                            </span>
                          </td>
                          <td className="px-5 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                {item.site_name.includes('Wind') ? <Wind className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-slate-600" />}
                              </div>
                              <div>
                                <div className="font-mono font-black text-slate-900 text-base">{item.asset_code}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.site_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                              isCritical ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-amber-600 bg-amber-50 border-amber-200'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div> {item.risk_level}
                            </span>
                          </td>
                          <td className="px-5 py-6">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                  <circle cx="50" cy="50" r="45" fill="none" stroke={isCritical ? '#f43f5e' : '#f59e0b'} strokeWidth="10" strokeDasharray={`${item.health_score * 2.8} 300`} strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">{item.health_score}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-6 font-mono text-slate-900 font-black text-sm flex flex-col gap-1">
                            <div className="text-xs text-rose-600 font-bold font-sans">₹{item.estimated_revenue_loss_daily}</div>
                          </td>
                          <td className="px-5 py-6 text-right">
                            <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 ml-auto">
                              {item.recommended_action || 'Inspect'} <ArrowRight className="w-3 h-3" />
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
        </div>

        {/* Detail Drawer (Right) */}
        {selectedAsset && (
          <div className="hidden lg:block w-1/3 transition-all duration-300">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Work Order Generation</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl sticky top-24 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${selectedAsset?.risk_level === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Draft Work Order</h2>
              
              <div className="space-y-5 text-sm mb-8">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Asset</span>
                  <span className="font-mono font-black text-slate-900 text-base">{selectedAsset?.asset_code}</span>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Class</span>
                  <span className={`font-black uppercase text-[10px] tracking-widest px-2 py-0.5 rounded border ${selectedAsset?.risk_level === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {selectedAsset?.risk_level}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Technician</label>
                  <select className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer">
                    <option>Select a technician...</option>
                    <option>Sarah Jenkins (Level 3 Tech)</option>
                    <option>Mark Otto (Level 2 Tech)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Recommended Action</label>
                  <select className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer">
                    <option>Inspect, Review, etc.</option>
                    <option selected>{selectedAsset?.recommended_action || 'Immediate Inspection'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnosis / Context</label>
                  <textarea 
                    rows={3}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 text-slate-700 text-xs font-mono font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    defaultValue={`[AI DIAGNOSTICS]\n${selectedAsset?.why_flagged || 'Review telemetry for details.'}`}
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Additional Notes</label>
                  <textarea 
                    rows={2}
                    className="w-full border border-slate-200 bg-white rounded-xl p-4 text-slate-700 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    placeholder="Enter manual override notes..."
                  ></textarea>
                </div>

                <button className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Dispatch Work Order
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
