export interface User {
  id: number;
  name: string;
  email: string;
  role: 'operator' | 'technician' | 'superadmin';
}

export interface SensorReading {
  id: number;
  asset_id: number;
  timestamp: string;
  temperature: number;
  vibration: number;
  current: number;
  power_output: number;
  soiling?: number | null;
  voltage?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  solar_irradiance?: number | null;
  panel_soiling?: number | null;
  humidity?: number | null;
  expected_power?: number | null;
  dataset_status?: string | null;
}

export interface EvidenceItem {
  metric: string;
  category?: 'ML_ANOMALY' | 'SENSOR_DEVIATION' | 'OPERATIONAL_DEGRADATION' | 'DATA_QUALITY';
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  description: string;
  value: number;
  baseline: number;
  delta_pct: number;
}

export interface Asset {
  id: number;
  asset_code: string;
  site_id: number;
  site_name?: string;
  location?: string;
  asset_type: 'wind_turbine' | 'solar_inverter';
  rated_capacity: number;
  model?: string;
  installation_date: string;
  status: 'HEALTHY' | 'WATCH' | 'HIGH RISK' | 'CRITICAL' | 'DATA_STALE' | 'STARTUP' | 'OFFLINE' | 'STANDBY';
  health_status?: string;
  health_score: number;
  evidence?: EvidenceItem[];
  latest_reading?: {
    temperature: number;
    vibration: number;
    power_output: number;
    expected_power?: number | null;
    timestamp?: string;
  } | null;
}

export interface ImpactAssessment {
  asset_id: number;
  asset_code: string;
  rated_capacity: number;
  expected_output_kw: number;
  observed_output_kw: number;
  generation_loss_kw: number;
  deficit_pct?: number;
  estimated_hourly_revenue_loss: number;
  estimated_daily_revenue_loss: number;
  energy_price: number;
  currency: string;
}

export interface PriorityQueueItem {
  asset_id: number;
  asset_code: string;
  asset_type: string;
  site_name: string;
  health_score: number;
  risk_level: string;
  estimated_revenue_loss_daily: number;
  priority_score: number;
  rank: number;
  recommended_action: string;
  persistence_hours: number;
  active_alerts_count: number;
  why_flagged?: string;
  top_evidence?: EvidenceItem[];
  expected_output_kw?: number;
  observed_output_kw?: number;
  generation_loss_kw?: number;
  energy_price?: number;
  currency?: string;
  data_quality_status?: string;
}

export interface Alert {
  id: number;
  asset_id: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  persistence_count: number;
  created_at: string;
  acknowledged_at?: string | null;
  asset?: Asset;
}

export interface MaintenanceTask {
  id: number;
  asset_id: number;
  assigned_to?: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string | null;
  outcome?: string | null;
  created_at: string;
  resolved_at?: string | null;
  asset?: Asset;
  assignee?: User;
}

export interface TrendPoint {
  time: string;
  health: number;
  activeRiskKW: number;
}

export interface DashboardSummary {
  total_assets: number;
  total_registered_assets?: number;
  active_reporting_assets?: number;
  reporting_asset_codes?: string[];
  healthy_count: number;
  watch_count: number;
  high_risk_count: number;
  critical_count: number;
  active_alerts_count: number;
  total_generation_at_risk_kw: number;
  total_revenue_at_risk_daily: number;
  currency: string;
  fleet_health_avg: number;
  critical_assets: PriorityQueueItem[];
  trend_data?: TrendPoint[];
  scope?: string;
}

export interface CsvUploadAssetSummary {
  asset_code: string;
  asset_type: string;
  latest_health_score: number;
  latest_risk_level: string;
  batch_anomaly_count?: number;
  historical_anomaly_count?: number;
  anomaly_count: number;
  ml_anomaly_count?: number;
  sensor_deviation_count?: number;
  operational_deviation_count?: number;
  has_operational_deviations?: boolean;
  has_sensor_deviations?: boolean;
  why_flagged?: string;
  top_evidence?: EvidenceItem[];
  baseline_source?: string;
  baseline_label?: string;
  diagnostics?: Record<string, any>;
}

export interface AssetDiagnostics {
  asset_id: number | string;
  asset_code?: string;
  total_unique_readings: number;
  new_readings: number;
  duplicate_readings: number;
  ml_anomaly_count: number;
  sensor_deviation_count: number;
  operational_deviation_count: number;
  anomaly_rate: number;
  health_score: number;
  risk_level: string;
  persistence_duration: string | number;
  expected_power: number;
  observed_power: number;
  power_deficit: number;
  health_score_breakdown: Record<string, any>;
  risk_score_breakdown: Record<string, any>;
}

export interface CsvUploadResult {
  status: string;
  message: string;
  file_name: string;
  batch_id: string;
  total_rows: number;
  valid_rows: number;
  newly_ingested: number;
  processed_rows: number;
  duplicates_skipped: number;
  rejected_invalid: number;
  anomalies_in_upload: number;
  anomalies_flagged: number;
  assets_affected_count: number;
  existing_anomalies_count?: number;
  anomaly_breakdown?: {
    critical?: number;
    high_risk?: number;
    watch?: number;
    healthy?: number;
  };
  errors?: string[];
  assets_analyzed: CsvUploadAssetSummary[];
  duplicates_note?: string;
}

export interface WebDataSummary {
  total_users: number;
  total_sites: number;
  total_assets: number;
  total_sensor_readings: number;
  total_health_predictions: number;
  total_alerts: number;
  total_maintenance_tasks: number;
}

