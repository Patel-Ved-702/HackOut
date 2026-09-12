import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, X, Loader2, Info } from 'lucide-react';
import { api } from '../services/api';

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

  const renderStatusPill = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-white bg-rose-600 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 animate-pulse"></span>
          CRITICAL
        </span>
      );
    }
    if (s === 'HIGH RISK' || s === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-white bg-orange-500 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 animate-pulse"></span>
          HIGH RISK
        </span>
      );
    }
    if (s === 'WATCH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          WATCH
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        {status}
      </span>
    );
  };

  const renderEvidenceCategoryTag = (category?: string) => {
    switch (category) {
      case 'ML_ANOMALY':
        return (
          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200/90 text-[10px] font-mono font-bold uppercase tracking-wide shrink-0">
            ML ANOMALY
          </span>
        );
      case 'SENSOR_DEVIATION':
        return (
          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200/90 text-[10px] font-mono font-bold uppercase tracking-wide shrink-0">
            SENSOR DRIFT
          </span>
        );
      case 'OPERATIONAL_DEGRADATION':
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200/90 text-[10px] font-mono font-bold uppercase tracking-wide shrink-0">
            OPERATIONAL LOSS
          </span>
        );
      case 'DATA_QUALITY':
        return (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/90 text-[10px] font-mono font-bold uppercase tracking-wide shrink-0">
            DATA QUALITY
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title Header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <UploadCloud className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Upload Sensor Telemetry CSV
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
              Ingest external or historical equipment data through the live feature extraction and Isolation Forest pipeline.
            </p>
          </div>
        </div>

        {/* Download Sample Banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
            <div className="p-1.5 rounded-lg bg-sky-100/70 text-sky-600">
              <FileText className="w-4 h-4" />
            </div>
            <span>Need a test file? Download pre-formatted sample with normal & degrading data:</span>
          </div>
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200/80 text-sky-700 font-semibold text-xs transition shrink-0 ml-3 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            Sample CSV
          </button>
        </div>

        {/* Upload Zone (No Result state) */}
        {!result && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-7 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition bg-emerald-50/20 hover:bg-emerald-50/40">
              <div className="w-12 h-12 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-600">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="text-sm text-slate-700 text-center">
                <span className="font-bold text-emerald-700">Click to select CSV</span> or drag and drop
              </div>
              <p className="text-xs text-slate-500">Supports full 15-column HackOut'26 schema or standard sensor feeds</p>
              <div className="flex flex-wrap gap-1.5 justify-center max-w-lg pt-1">
                {['timestamp', 'asset_id', 'asset_type', 'temperature', 'vibration', 'current', 'power_output', 'voltage', 'wind_speed', 'wind_direction', 'solar_irradiance', 'panel_soiling', 'humidity', 'expected_power', 'status'].map(c => (
                  <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shadow-2xs">
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
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-mono font-semibold">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || uploading}
                onClick={handleUpload}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
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

        {/* Results View (Matches Screenshot Design) */}
        {result && (
          <div className="space-y-4">
            {/* Batch Ingestion Banner & Stat Grid Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f2fcf5] border border-emerald-200/90 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                  <span className="text-emerald-900 font-bold text-base sm:text-lg tracking-tight">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0
                      ? 'Deduplicated — Existing Analysis Retained'
                      : 'Batch Ingestion & Analysis Completed!'}
                  </span>
                </div>
                {result.batch_id && (
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-indigo-100/90 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                    ID: {result.batch_id}
                  </span>
                )}
              </div>

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Total Rows</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{result.total_rows}</div>
                </div>
                <div className="bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0 ? 'New Ingested' : 'Valid Ingested'}
                  </div>
                  <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                    {result.newly_ingested ?? result.processed_rows}
                  </div>
                </div>
                <div className="bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Anomalies in Upload</div>
                  <div className={`text-2xl font-black mt-1 font-mono ${(result.anomalies_in_upload ?? result.anomalies_flagged) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {result.anomalies_in_upload ?? result.anomalies_flagged}
                  </div>
                </div>
              </div>

              {/* Deduplication Note if duplicates skipped */}
              {result.duplicates_skipped > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Deduplication Safeguard:</strong> {result.duplicates_note || `${result.duplicates_skipped} records matched existing records in database and were safely deduplicated.`}
                  </span>
                </div>
              )}

              {/* Risk Breakdown Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60">
                <span className="text-xs font-bold text-slate-600 mr-1">Risk Breakdown:</span>
                {(result.anomaly_breakdown?.critical ?? 0) > 0 && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-100/90 text-rose-700 border border-rose-200/90">
                    {result.anomaly_breakdown.critical} Critical
                  </span>
                )}
                {(result.anomaly_breakdown?.high_risk ?? 0) > 0 && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-orange-100/90 text-orange-700 border border-orange-200/90">
                    {result.anomaly_breakdown.high_risk} High Risk
                  </span>
                )}
                {(result.anomaly_breakdown?.watch ?? 0) > 0 && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100/90 text-amber-700 border border-amber-200/90">
                    {result.anomaly_breakdown.watch} Watch
                  </span>
                )}
                {(result.anomaly_breakdown?.healthy ?? 0) > 0 && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-700 border border-emerald-200/90">
                    {result.anomaly_breakdown.healthy} Healthy
                  </span>
                )}
              </div>
            </div>

            {/* Updated Assets List Section (Ranked by Urgency) */}
            {result.assets_analyzed && result.assets_analyzed.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    {result.processed_rows === 0 && result.duplicates_skipped > 0
                      ? 'Fleet Equipment Status (Existing Analysis Retained):'
                      : 'Updated Assets (Ranked by Urgency):'}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Critical & At-Risk prioritized at top
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {result.assets_analyzed.map((a: any, idx: number) => {
                    const mlCount = a.ml_anomaly_count ?? a.batch_anomaly_count ?? a.anomaly_count ?? 0;
                    const isCritical = a.latest_risk_level === 'CRITICAL';
                    const isHighRisk = a.latest_risk_level === 'HIGH RISK';
                    const isWatch = a.latest_risk_level === 'WATCH';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-2.5 transition ${
                          isCritical
                            ? 'bg-[#fff5f5] border-rose-200/90'
                            : isHighRisk
                            ? 'bg-[#fffaf0] border-orange-200/90'
                            : isWatch
                            ? 'bg-[#fffdf0] border-amber-200/90'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* Top Line: Asset Code, Status Badge, Anomaly Pill, DB Total, Health Score */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-slate-900 text-base">{a.asset_code}</span>
                            {renderStatusPill(a.latest_risk_level)}

                            {mlCount > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-rose-100/90 text-rose-700 border border-rose-200/80 font-mono">
                                {mlCount} ML {mlCount === 1 ? 'anomaly' : 'anomalies'} in upload
                              </span>
                            ) : (a.has_operational_deviations || a.has_sensor_deviations) ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-100/90 text-amber-800 border border-amber-200/80 font-mono">
                                Operational deviations detected
                              </span>
                            ) : null}

                            {a.historical_anomaly_count && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80 font-mono">
                                {a.historical_anomaly_count} total in DB
                              </span>
                            )}
                          </div>

                          {/* Health Score */}
                          <div className="text-right ml-auto">
                            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Health</div>
                            <div className={`text-lg font-black font-mono ${
                              a.latest_health_score < 35
                                ? 'text-rose-600'
                                : a.latest_health_score < 60
                                ? 'text-orange-600'
                                : a.latest_health_score < 80
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}>
                              {a.latest_health_score}/100
                            </div>
                          </div>
                        </div>

                        {/* Evidence Bullets */}
                        {a.top_evidence && a.top_evidence.length > 0 ? (
                          <div className="space-y-1.5 pl-1">
                            {a.top_evidence.map((ev: any, evIdx: number) => (
                              <div key={evIdx} className="text-xs text-slate-700 flex items-start gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                  ev.severity === 'CRITICAL' ? 'bg-rose-500' : ev.severity === 'WARNING' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />
                                {renderEvidenceCategoryTag(ev.category)}
                                <span className="font-medium text-slate-700 leading-snug">{ev.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 pl-1">
                            {a.why_flagged || 'Nominal telemetry baselines'}
                          </div>
                        )}

                        {/* Baseline Label */}
                        <div className="text-xs text-slate-400 font-mono pt-0.5">
                          Baseline: <span className="text-slate-600">{a.baseline_label || 'SCADA Theoretical Expected Power'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setResult(null); setFile(null); }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
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
