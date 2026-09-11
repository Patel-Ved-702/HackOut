import React from 'react';
import { Activity, ShieldAlert, Wrench, LayoutDashboard, Cpu, UserCheck, UploadCloud } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  alertCount: number;
  onOpenUploadCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  setCurrentUser,
  alertCount,
  onOpenUploadCsv,
}) => {
  const toggleUserRole = () => {
    if (currentUser.role === 'operator') {
      setCurrentUser({
        id: 2,
        name: 'Alex Technician',
        email: 'technician@renewguard.io',
        role: 'technician',
      });
      setCurrentTab('technician');
    } else {
      setCurrentUser({
        id: 1,
        name: 'Sarah Operator',
        email: 'operator@renewguard.io',
        role: 'operator',
      });
      setCurrentTab('dashboard');
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">RenewGuard AI</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  HackOut'26
                </span>
              </div>
              <p className="text-xs text-slate-400">Predictive Maintenance for Solar & Wind Assets</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Fleet Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('assets')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'assets'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Asset Monitor
            </button>

            <button
              onClick={() => setCurrentTab('alerts')}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'alerts'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Alerts
              {alertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('maintenance')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'maintenance'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Maintenance Priority
            </button>

            <button
              onClick={() => setCurrentTab('technician')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'technician'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Technician Workspace
            </button>
          </nav>

          {/* User Role Switcher, Upload CSV & Simulation Tag */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenUploadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold shadow-sm transition"
              title="Upload CSV sensor telemetry dataset"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              SIMULATION MODE
            </div>

            <button
              onClick={toggleUserRole}
              title="Click to toggle user role for testing"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                {currentUser.name[0]}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-slate-200 font-medium leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Role: <span className="text-emerald-400 font-semibold">{currentUser.role}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
