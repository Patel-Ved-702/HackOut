import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, X, Loader2, Info, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadCsv(file);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    window.open('/api/sensors/sample-csv', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-emerald-500" />
            Upload Sensor Telemetry CSV
          </h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Ingest external or historical equipment data through the live feature extraction and ML anomaly pipeline.
          </p>
        </div>

        {/* Sample CSV Download Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-sky-50 border border-sky-100 rounded-xl text-sm gap-3">
          <div className="flex items-center gap-2 text-sky-800 font-medium">
            <FileText className="w-5 h-5 text-sky-500 shrink-0" />
            <span>Need a test file? Download our pre-formatted sample dataset:</span>
          </div>
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white border border-sky-200 hover:bg-sky-100 text-sky-700 font-bold transition-colors shrink-0 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Sample CSV
          </button>
        </div>

        {/* Upload Zone */}
        {!result && (
          <div className="space-y-4 pt-2">
            <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-slate-50">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                <UploadCloud className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm text-slate-600 text-center">
                <span className="font-bold text-emerald-600">Click to select CSV</span> or drag and drop
              </div>
              <p className="text-xs text-slate-400 font-medium text-center">Supports full 15-column HackOut'26 schema</p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  {file.name} <span className="text-slate-400 font-mono font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || uploading}
                onClick={handleUpload}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Telemetry...
                  </>
                ) : (
                  'Ingest & Run Anomaly Pipeline'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Success Banner & Metrics */}
            <div className={`p-5 rounded-2xl border ${
              result.processed_rows === 0 && result.duplicates_skipped > 0
                ? 'bg-sky-50 border-sky-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div className={`flex items-center gap-2 font-bold text-base ${
                  result.processed_rows === 0 && result.duplicates_skipped > 0
                    ? 'text-sky-700'
                    : 'text-emerald-700'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                  {result.processed_rows === 0 && result.duplicates_skipped > 0
                    ? 'Deduplicated — Existing Analysis Retained'
                    : 'Batch Ingestion & Analysis Completed!'}
                </div>
                {result.batch_id && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white text-slate-500 border border-slate-200 font-bold shadow-sm">
                    ID: {result.batch_id}
                  </span>
                )}
              </div>
              
              <div className={`grid ${result.duplicates_skipped > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-3 text-sm`}>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Rows</div>
                  <div className="text-2xl font-black font-mono text-slate-800 mt-1">{result.total_rows}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0 ? 'New Ingested' : 'Valid Ingested'}
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-600 mt-1">{result.newly_ingested ?? result.processed_rows}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Anomalies Detected</div>
                  <div className={`text-2xl font-black font-mono mt-1 ${(result.anomalies_in_upload ?? result.anomalies_flagged) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {result.anomalies_in_upload ?? result.anomalies_flagged}
                  </div>
                </div>
                {result.duplicates_skipped > 0 && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 shadow-sm">
                    <div className="text-amber-700 text-xs font-bold uppercase tracking-wider">Duplicates Skipped</div>
                    <div className="text-2xl font-black font-mono text-amber-600 mt-1">{result.duplicates_skipped}</div>
                  </div>
                )}
              </div>

              {/* Anomaly Breakdown Badges */}
              {result.anomaly_breakdown && (
                <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-200/60">
                  <span className="text-xs text-slate-600 font-bold uppercase tracking-wider mr-1">Risk Breakdown:</span>
                  {result.anomaly_breakdown.critical > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">
                      {result.anomaly_breakdown.critical} Critical
                    </span>
                  )}
                  {result.anomaly_breakdown.high_risk > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 shadow-sm">
                      {result.anomaly_breakdown.high_risk} High Risk
                    </span>
                  )}
                  {result.anomaly_breakdown.watch > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                      {result.anomaly_breakdown.watch} Watch
                    </span>
                  )}
                  {result.anomaly_breakdown.healthy > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                      {result.anomaly_breakdown.healthy} Healthy
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Assets Updated List */}
            {result.assets_analyzed && result.assets_analyzed.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0
                      ? 'Fleet Equipment Status (Existing Analysis Retained):'
                      : 'Updated Assets (Ranked by Urgency):'}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0 && result.existing_anomalies_count !== undefined
                      ? `${result.existing_anomalies_count} existing anomalies`
                      : 'Most Critical At Top'}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {result.assets_analyzed.map((a: any, idx: number) => {
                    const isCritical = a.latest_risk_level === 'CRITICAL';
                    const isHighRisk = a.latest_risk_level === 'HIGH RISK';
                    const isWatch = a.latest_risk_level === 'WATCH';
                    
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl text-sm flex items-start justify-between border shadow-sm transition-all hover:shadow-md ${
                          isCritical 
                            ? 'bg-rose-50/50 border-rose-200' 
                            : isHighRisk 
                              ? 'bg-orange-50/50 border-orange-200' 
                              : isWatch 
                                ? 'bg-amber-50/50 border-amber-200' 
                                : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
                            <span className="font-black text-base">{a.asset_code}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-widest uppercase ${
                                isCritical ? 'border-rose-200 text-rose-700 bg-rose-100' : 
                                isHighRisk ? 'border-orange-200 text-orange-700 bg-orange-100' :
                                isWatch ? 'border-amber-200 text-amber-700 bg-amber-100' :
                                'border-emerald-200 text-emerald-700 bg-emerald-100'
                              }`}>
                              {a.latest_risk_level}
                            </span>
                            
                            {(a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count) > 0 ? (
                              <div className="inline-flex items-center gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">
                                  {a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count} ML {((a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count) === 1) ? 'anomaly' : 'anomalies'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">
                                0 ML anomalies • Nominal
                              </span>
                            )}
                          </div>
                          
                          {a.top_evidence && a.top_evidence.length > 0 ? (
                            <div className="space-y-1.5 mt-2">
                              {a.top_evidence.map((ev: any, evIdx: number) => {
                                const categoryLabel = 
                                  ev.category === 'ML_ANOMALY' ? 'ML Anomaly' :
                                  ev.category === 'SENSOR_DEVIATION' ? 'Sensor Drift' :
                                  ev.category === 'OPERATIONAL_DEGRADATION' ? 'Operational Loss' :
                                  ev.category === 'DATA_QUALITY' ? 'Data Quality' : null;
                                return (
                                  <div key={evIdx} className="text-xs text-slate-600 flex items-center gap-2 flex-wrap font-medium">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      ev.severity === 'CRITICAL' ? 'bg-rose-500' : ev.severity === 'WARNING' ? 'bg-amber-500' : 'bg-slate-400'
                                    }`}></span>
                                    {categoryLabel && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                                        ev.category === 'ML_ANOMALY' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                        ev.category === 'SENSOR_DEVIATION' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                        ev.category === 'OPERATIONAL_DEGRADATION' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}>
                                        {categoryLabel}
                                      </span>
                                    )}
                                    <span>{ev.description}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 font-medium italic">
                              {a.why_flagged || 'Operating within nominal telemetry baselines'}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right shrink-0 ml-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-w-[70px]">
                          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Health</div>
                          <div className={`font-black text-xl leading-none ${
                            a.latest_health_score < 35 
                              ? 'text-rose-600' 
                              : a.latest_health_score < 60 
                                ? 'text-orange-600' 
                                : a.latest_health_score < 80 
                                  ? 'text-amber-500' 
                                  : 'text-emerald-500'
                          }`}>
                            {a.latest_health_score}
                          </div>
                          <div className="text-slate-300 text-[10px] font-bold leading-none mt-0.5">/100</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => { setResult(null); setFile(null); }}
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors"
              >
                Close & View Updates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
