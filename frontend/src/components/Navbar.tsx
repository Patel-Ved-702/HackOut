import React from 'react';
import { Activity, ShieldAlert, Wrench, LayoutDashboard, Cpu, UserCheck, UploadCloud } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  alertCount: number;
  onOpenUploadCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  setCurrentUser,
  alertCount,
  onOpenUploadCsv,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">RENEWGUARD</span>
              <span className="ml-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <NavLink
              to="/"
              className={({ isActive }) => `pb-1 transition-colors ${isActive ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-900'}`}
            >
              Fleet Overview
            </NavLink>

            <NavLink
              to="/assets"
              className={({ isActive }) => `px-3 py-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'hover:text-slate-900'}`}
            >
              Asset Monitor
            </NavLink>

            <NavLink
              to="/alerts"
              className={({ isActive }) => `pb-1 transition-colors relative ${isActive ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-900'}`}
            >
              Diagnostics
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </NavLink>

            <NavLink
              to="/maintenance"
              className={({ isActive }) => `pb-1 transition-colors ${isActive ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-900'}`}
            >
              Work Orders
            </NavLink>
          </nav>

          {/* Right Side Info */}
          <div className="flex items-center gap-4">




            <button 
              onClick={onOpenUploadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold border border-slate-300 shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              Upload CSV
            </button>

            <NavLink to="/settings" className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                OP
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-sm font-bold text-slate-800">Operator Portal</div>
                <div className="text-[10px] text-slate-500 font-medium">Fleet Control Center</div>
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};
