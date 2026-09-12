import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Wrench, 
  ShieldCheck, 
  Thermometer, 
  Activity, 
  FileText 
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceTask } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const Technician: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTechnicianTasks = async () => {
    try {
      // Fetch tasks (e.g. assigned to Alex, id 2, or all open tasks)
      const allTasks = await api.getTasks();
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load technician tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicianTasks();
    const interval = setInterval(fetchTechnicianTasks, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleStartInspection = async (taskId: number) => {
    try {
      await api.updateTask(taskId, { status: 'in_progress' });
      fetchTechnicianTasks();
    } catch (err: any) {
      alert(`Failed to start inspection: ${err.message}`);
    }
  };

  const handleCompleteInspection = async (taskId: number) => {
    if (!outcomeNotes.trim()) {
      alert('Please enter your inspection outcome notes.');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateTask(taskId, {
        status: 'completed',
        outcome: outcomeNotes
      });
      // Also reset simulation for asset to normalize health
      const task = tasks.find(t => t.id === taskId);
      if (task?.asset?.asset_code) {
        await api.resetSimulation(task.asset.asset_code);
      }
      setOutcomeNotes('');
      setActiveTaskId(null);
      fetchTechnicianTasks();
    } catch (err: any) {
      alert(`Failed to complete task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Technician Banner */}
      <div className="light-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Technician Field Workspace</h2>
            <p className="text-sm text-slate-500 font-medium">
              Assigned Field Engineer: <strong className="text-slate-800">Alex Technician</strong> <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-1">Badge #TECH-409</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Pending Jobs</div>
            <div className="text-3xl font-black font-mono text-emerald-600 leading-none">{pendingTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Active & Pending Assigned Tasks */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-500" />
          Assigned Work Orders ({pendingTasks.length})
        </h3>

        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <div
              key={task.id}
              className={`p-6 rounded-xl border transition-all duration-300 space-y-4 ${
                task.status === 'in_progress'
                  ? 'bg-sky-50 border-sky-200 shadow-md shadow-sky-100'
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-black text-slate-900">
                    {task.asset?.asset_code || `Asset #${task.asset_id}`}
                  </span>
                  
                  {task.asset?.status ? (
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${
                      task.asset.status === 'CRITICAL' ? 'border-rose-200 text-rose-600 bg-rose-50' : 
                      task.asset.status === 'HIGH RISK' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                      'border-emerald-200 text-emerald-600 bg-emerald-50'
                    }`}>
                      {task.asset.status}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full border border-orange-200 text-orange-600 bg-orange-50 text-[10px] font-bold tracking-wide uppercase">
                      HIGH RISK
                    </span>
                  )}

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {task.priority}
                  </span>
                </div>

                <div className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Ticket #{task.id} • {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Task Scope & Notes */}
              <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">
                <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Operator Notes / Inspection Scope
                </span>
                {task.notes || 'Routine predictive inspection requested based on early warning telemetry alerts.'}
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {task.status === 'pending' ? (
                  <button
                    onClick={() => handleStartInspection(task.id)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    Start On-Site Inspection
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-sky-600 font-bold bg-sky-100/50 px-3 py-1.5 rounded-full w-fit">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                      </span>
                      Inspection In Progress
                    </div>

                    {activeTaskId === task.id ? (
                      <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <label className="block text-sm font-bold text-slate-900">
                          Record Inspection Outcome & Physical Remediation
                        </label>
                        <textarea
                          rows={3}
                          value={outcomeNotes}
                          onChange={(e) => setOutcomeNotes(e.target.value)}
                          placeholder="e.g. Cleared thermal intake, inspected bearing housing, applied high-speed lubrication. Telemetry returned to nominal."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-shadow resize-none font-medium"
                        />
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
                          <button
                            type="button"
                            onClick={() => setActiveTaskId(null)}
                            className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleCompleteInspection(task.id)}
                            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Submit Outcome & Close Work Order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTaskId(task.id)}
                        className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete & Log Inspection Outcome
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">All Clear</h4>
            <p className="text-sm">No open work orders assigned. All sites operational.</p>
          </div>
        )}
      </div>

      {/* Completed Job History */}
      <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Recently Resolved Inspections ({completedTasks.length})
        </h3>

        <div className="space-y-3">
          {completedTasks.length > 0 ? completedTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600 gap-3 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                  {task.asset?.asset_code || `Asset #${task.asset_id}`}
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                </span>
                <span className="text-slate-500 italic flex-1 truncate font-medium">"{task.outcome}"</span>
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded whitespace-nowrap">
                {task.resolved_at ? new Date(task.resolved_at).toLocaleString() : 'Just now'}
              </div>
            </div>
          )) : (
            <div className="text-sm text-slate-500 italic px-4 py-2">No recently resolved inspections.</div>
          )}
        </div>
      </div>
    </div>
  );
};
