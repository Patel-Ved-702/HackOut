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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Technician Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Technician Field Workspace</h2>
            <p className="text-xs text-slate-400">
              Assigned Field Engineer: <strong className="text-slate-200">Alex Technician</strong> (Badge #TECH-409)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Pending Jobs</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{pendingTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Active & Pending Assigned Tasks */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          Assigned Work Orders ({pendingTasks.length})
        </h3>

        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <div
              key={task.id}
              className={`p-5 rounded-xl border transition space-y-4 ${
                task.status === 'in_progress'
                  ? 'bg-sky-950/20 border-sky-800/80 shadow-sky-900/20 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 shadow-md'
              }`}
            >
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-white">
                    {task.asset?.asset_code || `Asset #${task.asset_id}`}
                  </span>
                  <StatusBadge status={task.asset?.status || 'HIGH RISK'} />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    task.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Ticket #{task.id} • {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Task Scope & Notes */}
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-400 block mb-1">Operator Notes / Inspection Scope:</span>
                {task.notes || 'Routine predictive inspection requested.'}
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                {task.status === 'pending' ? (
                  <button
                    onClick={() => handleStartInspection(task.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Start On-Site Inspection
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                      Inspection In Progress
                    </div>

                    {activeTaskId === task.id ? (
                      <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <label className="block text-xs font-semibold text-white">
                          Record Inspection Outcome & Physical Remediation
                        </label>
                        <textarea
                          rows={3}
                          value={outcomeNotes}
                          onChange={(e) => setOutcomeNotes(e.target.value)}
                          placeholder="e.g. Cleared thermal intake, inspected bearing housing, applied high-speed lubrication. Telemetry returned to nominal."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTaskId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleCompleteInspection(task.id)}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Submit Outcome & Close Work Order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTaskId(task.id)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete & Log Inspection Outcome
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No open work orders assigned. All sites operational.
          </div>
        )}
      </div>

      {/* Completed Job History */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Recently Resolved Inspections ({completedTasks.length})
        </h3>

        <div className="space-y-2">
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{task.asset?.asset_code || `Asset #${task.asset_id}`}</span>
                <span className="text-emerald-400 font-semibold">• Resolved</span>
                <span className="text-slate-300 italic">{task.outcome}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {task.resolved_at ? new Date(task.resolved_at).toLocaleString() : 'Just now'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
