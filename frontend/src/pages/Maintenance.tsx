import React, { useEffect, useState } from 'react';
import { Wind, Sun } from 'lucide-react';
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

  // Use dummy data if api returns empty for visual demonstration of Image 5
  const displayData = priorities.length > 0 ? priorities : [
    { asset_id: 1, rank: 1, asset_code: 'WT-004', site_name: 'Wind Turbine', risk_level: 'CRITICAL', health_score: 24, estimated_revenue_loss_daily: 3240, recommended_action: 'Inspect' },
    { asset_id: 2, rank: 2, asset_code: 'WT-004', site_name: 'Wind Turbine', risk_level: 'HIGH RISK', health_score: 24, estimated_revenue_loss_daily: 3240, recommended_action: 'Inspect' },
    { asset_id: 3, rank: 3, asset_code: 'SP-021', site_name: 'Solar Panel', risk_level: 'HIGH RISK', health_score: 48, estimated_revenue_loss_daily: 1890, recommended_action: 'Review' },
    { asset_id: 4, rank: 4, asset_code: 'WT-009', site_name: 'Wind Turbine', risk_level: 'HIGH RISK', health_score: 56, estimated_revenue_loss_daily: 1440, recommended_action: 'Inspect' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Maintenance Priority</h1>
          <p className="text-slate-500 font-medium mt-1">Which asset needs attention first?</p>
        </div>
        <div className="text-right max-w-xs">
          <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">EXPLANATION</div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Priority combines risk severity, persistence and estimated operational impact.
          </p>
        </div>
      </div>

      <div className="flex gap-6 relative">
        {/* Main Content (Left) */}
        <div className={`flex-1 space-y-6 ${selectedAsset ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
          
          {/* Top Priority Overview */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">TOP PRIORITY OVERVIEW</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="light-card p-4">
                <div className="text-slate-500 text-xs font-bold mb-2">Assets requiring attention</div>
                <div className="text-4xl font-black text-slate-900">14</div>
              </div>
              <div className="light-card p-4">
                <div className="text-slate-500 text-xs font-bold mb-2 flex items-center gap-1.5">
                  <span className="text-rose-500">⚠️</span> Critical
                </div>
                <div className="text-4xl font-black text-rose-600">3</div>
              </div>
              <div className="light-card p-4">
                <div className="text-slate-500 text-xs font-bold mb-2 flex items-center gap-1.5">
                  <span className="text-amber-500">⚠️</span> High Risk
                </div>
                <div className="text-4xl font-black text-amber-600">5</div>
              </div>
              <div className="light-card p-4">
                <div className="text-slate-500 text-xs font-bold mb-2">Estimated generation at risk</div>
                <div className="text-4xl font-black text-slate-900">1,248 <span className="text-base text-slate-500 font-medium">kWh</span></div>
              </div>
            </div>
          </div>

          {/* Main Ranked Queue */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">MAIN RANKED QUEUE</h3>
            <div className="light-card overflow-hidden flex">
              
              {/* Priority Indicator Column */}
              <div className="w-4 flex flex-col bg-slate-50 border-r border-slate-100 py-4">
                <div className="flex-1 min-h-[80px] bg-rose-500 rounded-full mx-1.5 mb-1"></div>
                <div className="flex-1 min-h-[80px] bg-orange-400 rounded-full mx-1.5 mb-1"></div>
                <div className="flex-1 min-h-[80px] bg-emerald-500 rounded-full mx-1.5"></div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto relative">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Asset ID</th>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3">Health</th>
                      <th className="px-4 py-3">Persistence</th>
                      <th className="px-4 py-3">Energy Impact</th>
                      <th className="px-4 py-3">Revenue Impact</th>
                      <th className="px-4 py-3 text-right">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white relative">
                    {displayData.map((item, index) => {
                      const isCritical = item.risk_level === 'CRITICAL';
                      const isSelected = selectedAsset?.asset_id === item.asset_id;
                      
                      return (
                        <tr 
                          key={item.asset_id} 
                          onClick={() => setSelectedAsset(item as any)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors group ${isSelected ? 'bg-slate-50' : ''}`}
                        >
                          <td className="px-4 py-5 font-black text-xl text-slate-900">
                            #{item.rank}
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-2">
                              {item.site_name.includes('Wind') ? <Wind className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-slate-500" />}
                              <div>
                                <div className="font-mono font-bold text-slate-900">{item.asset_code}</div>
                                <div className="text-[10px] text-slate-500 font-medium">{item.site_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              isCritical ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-amber-600 bg-amber-50 border border-amber-200'
                            }`}>
                              ⚠️ {item.risk_level}
                            </span>
                          </td>
                          <td className="px-4 py-5">
                            {/* Semi circle gauge */}
                            <div className="flex items-center gap-2">
                              <div className="relative w-10 h-5 overflow-hidden">
                                <div className={`absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-slate-200 border-t-${isCritical ? 'rose-500' : 'amber-500'} border-l-${isCritical ? 'rose-500' : 'amber-500'} transform -rotate-45`}></div>
                              </div>
                              <span className="font-bold text-slate-900">{item.health_score}/100</span>
                            </div>
                          </td>
                          <td className="px-4 py-5 font-medium text-slate-900">
                            {index === 3 ? '12 min' : '18 min'}
                          </td>
                          <td className="px-4 py-5 font-mono text-slate-900 font-bold text-xs">
                            {index === 2 ? '310' : index === 3 ? '240' : '420'} kWh
                          </td>
                          <td className="px-4 py-5 font-mono text-slate-900 font-bold text-xs">
                            ₹{item.estimated_revenue_loss_daily || 3240}
                          </td>
                          <td className="px-4 py-5 text-right relative">
                            <button className="px-4 py-1.5 bg-gradient-to-r from-sky-400 to-sky-500 text-white text-xs font-bold rounded shadow-sm hover:opacity-90">
                              {item.recommended_action || 'Inspect'}
                            </button>

                            {/* Popup on row 1 matching the screenshot */}
                            {index === 0 && (
                              <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 mr-4 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72 z-20 pointer-events-none hidden group-hover:block">
                                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-white border-r border-t border-slate-200 transform rotate-45"></div>
                                <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 text-left">WHY PRIORITIZED?</h4>
                                
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-slate-700 text-left">
                                  <div>Risk severity</div>
                                  <div className="flex gap-0.5"><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div></div>
                                  
                                  <div>Persistence</div>
                                  <div className="flex gap-0.5"><div className="w-2 h-3 bg-amber-400"></div><div className="w-2 h-3 bg-amber-400"></div><div className="w-2 h-3 bg-amber-400"></div></div>
                                  
                                  <div>Operational impact</div>
                                  <div className="flex gap-0.5"><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div><div className="w-2 h-3 bg-rose-500"></div></div>
                                  
                                  <div>Asset importance</div>
                                  <div className="flex gap-0.5"><div className="w-2 h-3 bg-slate-400"></div><div className="w-2 h-3 bg-slate-400"></div></div>
                                </div>
                                
                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-3 text-left">
                                  Priority score is a deterministic operational ranking, not a second ML model.
                                </p>
                              </div>
                            )}
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

        {/* Optional Detail Drawer (Right) */}
        <div className="hidden lg:block w-1/3 transition-all duration-300">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">OPTIONAL DETAIL DRAWER</h3>
          <div className="light-card p-5 sticky top-24">
            <h2 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-4">WORK ORDER MODAL</h2>
            
            <div className="space-y-4 text-sm mb-6">
              <div>
                <div className="text-slate-500 mb-0.5">Asset</div>
                <div className="font-mono font-bold text-slate-900">{selectedAsset?.asset_code || 'WT-004'}</div>
              </div>
              
              <div>
                <div className="text-slate-500 mb-0.5">Priority</div>
                <div className={`font-bold uppercase ${selectedAsset?.risk_level === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {selectedAsset?.risk_level || 'CRITICAL'}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Technician</label>
                <select className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-emerald-400">
                  <option>select a technician...</option>
                  <option>Alex Technician</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Due Date</label>
                <div className="relative">
                  <input type="text" placeholder="select a date..." className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-emerald-400" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">📅</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason</label>
                <textarea 
                  rows={2}
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-slate-700 text-xs outline-none focus:border-emerald-400 font-mono"
                  defaultValue="prefilled description&#10;prefilled description..."
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Recommended Action</label>
                <select className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-emerald-400">
                  <option>Inspect, Review, etc. ⌄</option>
                  <option>Replace Bearings</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes</label>
                <textarea 
                  rows={2}
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-slate-700 text-xs outline-none focus:border-emerald-400"
                  placeholder="Enter additional notes..."
                ></textarea>
              </div>

              <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-bold hover:opacity-90 transition-opacity mt-4 shadow-sm">
                Create Work Order
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
