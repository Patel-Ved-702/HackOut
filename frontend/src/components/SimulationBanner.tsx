import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface SimulationBannerProps {
  onSimulationUpdate: () => void;
  onNavigateAsset?: (assetId: number) => void;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({
  onSimulationUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [targetAsset, setTargetAsset] = useState<'WT-006' | 'WT-004'>('WT-006');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const stepDescriptions = [
    { step: 1, label: 'Notice', detail: '52°C, 2.8 mm/s, 88 kW (Health ~94)' },
    { step: 2, label: 'Watch', detail: '57°C, 3.9 mm/s, 82 kW (Health ~78)' },
    { step: 3, label: 'High Risk', detail: '63°C, 5.6 mm/s, 74 kW (Health ~50)' },
    { step: 4, label: 'Critical', detail: '69.2°C, 7.4 mm/s, 64.8 kW (Health ~18, 31.2 kW Deficit)' },
  ];

  const handleDegrade = async () => {
    setLoading(true);
    try {
      const nextStep = Math.min(currentStep + 1, 4);
      const res = await api.triggerDegrade(targetAsset, nextStep);
      setCurrentStep(nextStep);
      setLastAction(`Step ${nextStep}/4 applied to ${targetAsset}: Health ${res.result.health_score}/100 (${res.result.risk_level})`);
      onSimulationUpdate();
    } catch (err: any) {
      setLastAction(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetSimulation(targetAsset);
      setCurrentStep(0);
      setLastAction(`${targetAsset} reset to normal baseline conditions (Health 100/100, Deficit 0 kW)`);
      onSimulationUpdate();
    } catch (err: any) {
      setLastAction(`Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-y sm:border sm:rounded-xl border-indigo-800/40 p-4 mb-6 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Play className="w-4 h-4 fill-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Live Hackathon Demonstration Control</h3>
              
              {/* Asset Target Selector */}
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-700 rounded-lg p-0.5 text-[11px] font-mono">
                <span className="text-slate-400 px-1.5 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-indigo-400" /> Target:
                </span>
                <button
                  type="button"
                  onClick={() => { setTargetAsset('WT-006'); setCurrentStep(0); }}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    targetAsset === 'WT-006' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WT-006 (CSV Target)
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetAsset('WT-004'); setCurrentStep(0); }}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    targetAsset === 'WT-004' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WT-004
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Progressively simulates thermal rise (52°C → 69.2°C), bearing vibration spikes (2.8 → 7.4 mm/s), and generation loss (31.2 kW deficit) to demonstrate live ML anomaly detection, explainability, and priority dispatch.
            </p>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] font-mono">
              {stepDescriptions.map((s) => (
                <div 
                  key={s.step} 
                  className={`px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                    currentStep === s.step
                      ? 'bg-rose-950/60 border-rose-600 text-rose-300 font-bold'
                      : currentStep > s.step
                      ? 'bg-slate-950/60 border-slate-700 text-slate-400'
                      : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
                  }`}
                  title={s.detail}
                >
                  <span>Step {s.step}: {s.label}</span>
                  {s.step < 4 && <ArrowRight className="w-2.5 h-2.5 opacity-40" />}
                </div>
              ))}
            </div>

            {lastAction && (
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {lastAction}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={handleDegrade}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {currentStep === 0 ? `Simulate Degradation (${targetAsset})` : `Degrade Further (${currentStep}/4)`}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
            title={`Reset ${targetAsset} back to healthy operating conditions`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
        </div>
      </div>
    </div>
  );
};
