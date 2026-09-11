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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            Upload Sensor Telemetry CSV
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ingest external or historical equipment data through the live feature extraction and Isolation Forest pipeline.
          </p>
        </div>

        {/* Sample CSV Download Banner */}
        <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Need a test file? Download pre-formatted sample with normal & degrading data:</span>
          </div>
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold transition shrink-0 ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            Sample CSV
          </button>
        </div>

        {/* Upload Zone */}
        {!result && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-950/40">
              <UploadCloud className="w-8 h-8 text-slate-400" />
              <div className="text-xs text-slate-300 text-center">
                <span className="font-semibold text-emerald-400">Click to select CSV</span> or drag and drop
              </div>
              <p className="text-[11px] text-slate-500">Supports full 15-column HackOut'26 schema or standard sensor feeds</p>
              <div className="flex flex-wrap gap-1 justify-center max-w-md pt-1">
                {['timestamp', 'asset_id', 'asset_type', 'temperature', 'vibration', 'current', 'power_output', 'voltage', 'wind_speed', 'wind_direction', 'solar_irradiance', 'panel_soiling', 'humidity', 'expected_power', 'status'].map(c => (
                  <span key={c} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                    {c}
                  </span>
                ))}
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="flex items-center justify-between p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-white font-mono">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || uploading}
                onClick={handleUpload}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
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
          <div className="space-y-4">
            <div className={`p-4 rounded-xl space-y-3 border ${
              result.processed_rows === 0 && result.duplicates_skipped > 0
                ? 'bg-sky-950/30 border-sky-800/60'
                : 'bg-emerald-950/30 border-emerald-800/60'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className={`flex items-center gap-2 font-semibold text-sm ${
                  result.processed_rows === 0 && result.duplicates_skipped > 0
                    ? 'text-sky-300'
                    : 'text-emerald-400'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                  {result.processed_rows === 0 && result.duplicates_skipped > 0
                    ? 'Deduplicated — Existing Analysis Retained'
                    : 'Batch Ingestion & Analysis Completed!'}
                </div>
                <div className="flex items-center gap-1.5">
                  {result.batch_id && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/70">
                      ID: {result.batch_id}
                    </span>
                  )}
                  {result.processed_rows === 0 && result.duplicates_skipped > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/60 text-sky-200 border border-sky-700/60">
                      0 New Records • Unchanged
                    </span>
                  )}
                </div>
              </div>
              <div className={`grid ${result.duplicates_skipped > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 text-xs`}>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Total Rows</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">{result.total_rows}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0 ? 'New Ingested' : 'Valid Ingested'}
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{result.newly_ingested ?? result.processed_rows}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Anomalies in Upload</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${(result.anomalies_in_upload ?? result.anomalies_flagged) > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {result.anomalies_in_upload ?? result.anomalies_flagged}
                  </div>
                </div>
                {result.duplicates_skipped > 0 && (
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-800/60">
                    <div className="text-amber-400 text-[11px]">Duplicates Skipped</div>
                    <div className="text-base font-bold font-mono text-amber-300 mt-0.5">{result.duplicates_skipped}</div>
                  </div>
                )}
              </div>

              {/* Deduplication Note if duplicates skipped */}
              {result.duplicates_skipped > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-lg text-[11px] text-amber-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Deduplication Safeguard:</strong> {result.duplicates_note || `${result.duplicates_skipped} records matched existing records in database and were safely deduplicated.`}
                  </span>
                </div>
              )}

              {/* Anomaly Breakdown Badges */}
              {result.anomaly_breakdown && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium">Risk Breakdown:</span>
                  {result.anomaly_breakdown.critical > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {result.anomaly_breakdown.critical} Critical
                    </span>
                  )}
                  {result.anomaly_breakdown.high_risk > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                      {result.anomaly_breakdown.high_risk} High Risk
                    </span>
                  )}
                  {result.anomaly_breakdown.watch > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {result.anomaly_breakdown.watch} Watch
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {result.anomaly_breakdown.healthy} Healthy
                  </span>
                </div>
              )}
            </div>

            {/* Assets Updated (Sorted with highest priority/critical on top) */}
            {result.assets_analyzed && result.assets_analyzed.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0
                      ? 'Fleet Equipment Status (Existing Analysis Retained):'
                      : 'Updated Assets (Ranked by Urgency):'}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0 && result.existing_anomalies_count !== undefined
                      ? `${result.existing_anomalies_count} existing anomalies across ${result.assets_analyzed.length} assets`
                      : 'Critical & At-Risk prioritized at top'}
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {result.assets_analyzed.map((a: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg text-xs flex items-start justify-between border transition ${
                        a.latest_risk_level === 'CRITICAL' 
                          ? 'bg-rose-950/30 border-rose-800/60' 
                          : a.latest_risk_level === 'HIGH RISK' 
                            ? 'bg-orange-950/25 border-orange-800/50' 
                            : a.latest_risk_level === 'WATCH' 
                              ? 'bg-amber-950/20 border-amber-800/40' 
                              : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-mono font-bold text-white flex-wrap">
                          <span>{a.asset_code}</span>
                          <StatusBadge status={a.latest_risk_level} />
                          {/* Batch vs Historical Anomaly count & Deviation display (Section 7 & 8) */}
                          {(a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count) > 0 ? (
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-700/50">
                                {a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count} ML {((a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count) === 1) ? 'anomaly' : 'anomalies'} in upload
                              </span>
                              {a.historical_anomaly_count && a.historical_anomaly_count > (a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count) && (
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {a.historical_anomaly_count} total in DB
                                </span>
                              )}
                            </div>
                          ) : (a.has_operational_deviations || a.has_sensor_deviations || (a.operational_deviation_count && a.operational_deviation_count > 0) || (a.sensor_deviation_count && a.sensor_deviation_count > 0)) ? (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                                0 ML anomalies
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                                Operational deviations detected
                              </span>
                              {a.historical_anomaly_count && a.historical_anomaly_count > 0 && (
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {a.historical_anomaly_count} historical in DB
                                </span>
                              )}
                            </div>
                          ) : (a.historical_anomaly_count && a.historical_anomaly_count > 0) ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              0 ML anomalies in upload • {a.historical_anomaly_count} historical in DB
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400/80 border border-emerald-800/40">
                              0 ML anomalies • Nominal
                            </span>
                          )}
                        </div>
                        {a.top_evidence && a.top_evidence.length > 0 ? (
                          <div className="space-y-1">
                            {a.top_evidence.map((ev: any, evIdx: number) => {
                              const categoryLabel = 
                                ev.category === 'ML_ANOMALY' ? 'ML Anomaly' :
                                ev.category === 'SENSOR_DEVIATION' ? 'Sensor Drift' :
                                ev.category === 'OPERATIONAL_DEGRADATION' ? 'Operational Loss' :
                                ev.category === 'DATA_QUALITY' ? 'Data Quality' : null;
                              return (
                                <div key={evIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    ev.severity === 'CRITICAL' ? 'bg-rose-400' : ev.severity === 'WARNING' ? 'bg-amber-400' : 'bg-slate-500'
                                  }`}></span>
                                  {categoryLabel && (
                                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase font-semibold ${
                                      ev.category === 'ML_ANOMALY' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                                      ev.category === 'SENSOR_DEVIATION' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60' :
                                      ev.category === 'OPERATIONAL_DEGRADATION' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                                      'bg-slate-800 text-slate-300'
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
                          <div className="text-[11px] text-slate-400">
                            {a.why_flagged || 'Nominal telemetry baselines'}
                          </div>
                        )}
                        {a.baseline_label && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                            <span className="text-slate-500">Baseline:</span>
                            <span className="font-mono text-slate-300">{a.baseline_label}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right font-mono shrink-0 ml-3">
                        <div className="text-slate-400 text-[10px]">Health</div>
                        <div className={`font-bold text-sm ${
                          a.latest_health_score < 35 
                            ? 'text-rose-400' 
                            : a.latest_health_score < 60 
                              ? 'text-orange-400' 
                              : a.latest_health_score < 80 
                                ? 'text-amber-300' 
                                : 'text-emerald-400'
                        }`}>
                          {a.latest_health_score}/100
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setResult(null); setFile(null); }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                Close & View Fleet Updates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
