import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  if (norm === 'HEALTHY') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        HEALTHY
      </span>
    );
  }

  if (norm === 'WATCH') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        WATCH
      </span>
    );
  }

  if (norm === 'HIGH RISK' || norm === 'HIGH_RISK') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-950/70 text-orange-300 border border-orange-800/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
        HIGH RISK
      </span>
    );
  }

  if (norm === 'CRITICAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
        CRITICAL
      </span>
    );
  }

  if (norm === 'STARTUP' || norm === 'STANDBY') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-950/70 text-sky-300 border border-sky-800/60 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
        STARTUP / STANDBY
      </span>
    );
  }

  if (norm === 'OFFLINE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        OFFLINE
      </span>
    );
  }

  if (norm === 'DATA_STALE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        DATA STALE
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 ${className}`}>
      {status}
    </span>
  );
};
