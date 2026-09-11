import React, { useEffect, useState } from 'react';
import { Wrench, ArrowUpRight, CheckCircle2, Clock, User, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { PriorityQueueItem, MaintenanceTask } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface MaintenanceProps {
  onSelectAsset: (assetId: number) => void;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ onSelectAsset }) => {
  const [priorities, setPriorities] = useState<PriorityQueueItem[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [pData, tData] = await Promise.all([
        api.getPriorities(),
        api.getTasks()
      ]);
      setPriorities(pData);
      setTasks(tData);
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

  const handleQuickDispatch = async (assetId: number, assetCode: string, riskLevel: string) => {
    try {
      await api.createTask({
        asset_id: assetId,
        assigned_to: 2, // Alex Technician
        priority: riskLevel === 'CRITICAL' ? 'URGENT' : 'HIGH',
        notes: `Priority auto-dispatch for ${assetCode} (${riskLevel}). Verify mechanical and thermal status.`
      });
      fetchData();
    } catch (err: any) {
      alert(`Error dispatching: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            Maintenance Priority Engine
          </h2>
          <p className="text-xs text-slate-400">
            Deterministic operational ranking: Risk Severity (45%) + Revenue Loss (25%) + Persistence (20%) + Capacity (10%)
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Priority Ranked Queue */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Ranked Asset Maintenance Queue</h3>
          <span className="text-xs text-slate-400 font-mono">1 = Most Urgent</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Daily Revenue at Risk</th>
                <th className="px-4 py-3">Recommended Operational Action</th>
                <th className="px-4 py-3 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {priorities.map((item) => (
                <tr
                  key={item.asset_id}
                  onClick={() => onSelectAsset(item.asset_id)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition ${
                    item.risk_level === 'CRITICAL' ? 'bg-rose-950/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      item.rank === 1 ? 'bg-rose-500/20 text-rose-400 font-extrabold border border-rose-500/40' :
                      item.rank === 2 ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{item.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-white">{item.asset_code}</div>
                    <div className="text-[11px] text-slate-500">{item.site_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.risk_level} />
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                    {item.health_score}/100
                  </td>
                  <td className="px-4 py-3 font-mono text-rose-400 font-semibold">
                    ${item.estimated_revenue_loss_daily.toFixed(0)}/day
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs">
                    {item.recommended_action}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDispatch(item.asset_id, item.asset_code, item.risk_level);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium transition"
                    >
                      Dispatch Work Order <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Technician Work Orders & History</h3>
            <p className="text-xs text-slate-400">Status of all dispatched field inspection tickets</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Inspection Notes / Scope</th>
                <th className="px-4 py-3">Resolution Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 font-mono text-slate-400">#{task.id}</td>
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {task.asset?.asset_code || `Asset #${task.asset_id}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      task.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300' :
                      task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                      task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      task.status === 'in_progress' ? 'bg-sky-500/20 text-sky-400' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {task.assignee?.name || 'Alex Technician'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                    {task.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono text-[11px]">
                    {task.outcome || (task.status === 'completed' ? 'Resolved' : 'Pending inspection')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
