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

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [outcomeModalTask, setOutcomeModalTask] = useState<MaintenanceTask | null>(null);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    setDraggedTaskId(taskId);
  };

  const handleDragOverCol = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeaveCol = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDropOnColumn = async (e: React.DragEvent, targetStatus: 'pending' | 'in_progress' | 'completed') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = taskIdStr ? Number(taskIdStr) : draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    if (targetStatus === 'completed') {
      // Prompt modal to log inspection outcome notes
      setOutcomeModalTask(task);
      setOutcomeNotes(task.notes ? `Inspected & repaired per ticket notes.` : 'Completed on-site remediation. Telemetry returned to nominal.');
      return;
    }

    try {
      await api.updateTask(taskId, { status: targetStatus });
      fetchTechnicianTasks();
    } catch (err: any) {
      alert(`Failed to update task status: ${err.message}`);
    }
  };

  const handleConfirmModalCompletion = async () => {
    if (!outcomeModalTask) return;
    if (!outcomeNotes.trim()) {
      alert('Please enter your inspection outcome notes.');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateTask(outcomeModalTask.id, {
        status: 'completed',
        outcome: outcomeNotes
      });
      if (outcomeModalTask.asset?.asset_code) {
        await api.resetSimulation(outcomeModalTask.asset.asset_code);
      }
      setOutcomeNotes('');
      setOutcomeModalTask(null);
      fetchTechnicianTasks();
    } catch (err: any) {
      alert(`Failed to complete task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
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

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'board' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Drag & Drop Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              List View
            </button>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Active Work Orders</div>
            <div className="text-3xl font-black font-mono text-emerald-600 leading-none">{pendingTasks.length + inProgressTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Kanban Drag and Drop Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Pending (To Do) */}
          <div 
            onDragOver={(e) => handleDragOverCol(e, 'pending')}
            onDragLeave={handleDragLeaveCol}
            onDrop={(e) => handleDropOnColumn(e, 'pending')}
            className={`flex flex-col rounded-2xl p-4 transition-all duration-200 border-2 ${
              dragOverColumn === 'pending'
                ? 'bg-amber-50/70 border-amber-400 ring-4 ring-amber-400/20'
                : 'bg-slate-50/80 border-dashed border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Assigned / Pending</h3>
              </div>
              <span className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 text-xs font-black rounded-full shadow-sm">
                {pendingTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 min-h-[220px]">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-base">
                        {task.asset?.asset_code || `Asset #${task.asset_id}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-sans">
                      {task.notes || 'Routine predictive inspection requested.'}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
                      <span>#{task.id}</span>
                      <button
                        onClick={() => handleStartInspection(task.id)}
                        className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Wrench className="w-3 h-3" /> Start
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200/60 rounded-xl">
                  Drag tasks here or await dispatch
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div 
            onDragOver={(e) => handleDragOverCol(e, 'in_progress')}
            onDragLeave={handleDragLeaveCol}
            onDrop={(e) => handleDropOnColumn(e, 'in_progress')}
            className={`flex flex-col rounded-2xl p-4 transition-all duration-200 border-2 ${
              dragOverColumn === 'in_progress'
                ? 'bg-sky-50/70 border-sky-400 ring-4 ring-sky-400/20'
                : 'bg-slate-50/80 border-dashed border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Inspection In Progress</h3>
              </div>
              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 text-xs font-black rounded-full shadow-sm">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 min-h-[220px]">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-base">
                        {task.asset?.asset_code || `Asset #${task.asset_id}`}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-sky-600 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span> Active
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium line-clamp-3 bg-white p-2.5 rounded-lg border border-slate-100">
                      {task.notes || 'Routine predictive inspection requested.'}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-400">#{task.id}</span>
                      <button
                        onClick={() => {
                          setOutcomeModalTask(task);
                          setOutcomeNotes('Completed on-site remediation. Telemetry returned to nominal.');
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200/60 rounded-xl">
                  Drag tasks here to start work
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Completed / Resolved */}
          <div 
            onDragOver={(e) => handleDragOverCol(e, 'completed')}
            onDragLeave={handleDragLeaveCol}
            onDrop={(e) => handleDropOnColumn(e, 'completed')}
            className={`flex flex-col rounded-2xl p-4 transition-all duration-200 border-2 ${
              dragOverColumn === 'completed'
                ? 'bg-emerald-50/70 border-emerald-400 ring-4 ring-emerald-400/20'
                : 'bg-slate-50/80 border-dashed border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Resolved / Completed</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black rounded-full shadow-sm">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 min-h-[220px] max-h-[600px] overflow-y-auto">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {task.asset?.asset_code || `Asset #${task.asset_id}`}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 italic font-medium">
                      "{task.outcome || 'Task successfully resolved.'}"
                    </p>

                    <div className="text-[10px] font-mono text-slate-400 text-right">
                      {task.resolved_at ? new Date(task.resolved_at).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200/60 rounded-xl">
                  Drag tasks here to resolve and log outcome
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Traditional List View */
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-500" />
            Assigned Work Orders ({pendingTasks.length + inProgressTasks.length})
          </h3>

          {[...pendingTasks, ...inProgressTasks].length > 0 ? (
            [...pendingTasks, ...inProgressTasks].map((task) => (
              <div
                key={task.id}
                className={`p-6 rounded-xl border transition-all duration-300 space-y-4 ${
                  task.status === 'in_progress'
                    ? 'bg-sky-50 border-sky-200 shadow-md shadow-sky-100'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-black text-slate-900">
                      {task.asset?.asset_code || `Asset #${task.asset_id}`}
                    </span>
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

                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Operator Notes / Inspection Scope
                  </span>
                  {task.notes || 'Routine predictive inspection requested based on early warning telemetry alerts.'}
                </div>

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
                    <button
                      onClick={() => {
                        setOutcomeModalTask(task);
                        setOutcomeNotes('Completed on-site remediation. Telemetry returned to nominal.');
                      }}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete & Log Inspection Outcome
                    </button>
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
      )}

      {/* Outcome Modal (Appears when dragging to Completed or clicking Complete) */}
      {outcomeModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              Complete Work Order #{outcomeModalTask.id}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Asset: <strong className="text-slate-900 font-mono">{outcomeModalTask.asset?.asset_code || `Asset #${outcomeModalTask.asset_id}`}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Physical Remediation & Inspection Outcome
              </label>
              <textarea
                rows={3}
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="e.g. Cleared thermal intake, inspected bearing housing, applied high-speed lubrication. Telemetry returned to nominal."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOutcomeModalTask(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmModalCompletion}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Close Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
