import datetime
from typing import Optional, List, Any, Dict, Union
from pydantic import BaseModel, Field

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "operator"

class UserCreate(UserBase):
    password: str

class UserUpdateRole(BaseModel):
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Site Schemas ---
class SiteBase(BaseModel):
    name: str
    location_name: str
    site_type: str

class SiteCreate(SiteBase):
    pass

class EconomicConfigOut(BaseModel):
    id: int
    site_id: int
    energy_price: float
    currency: str

    class Config:
        from_attributes = True

class SiteOut(SiteBase):
    id: int
    created_at: datetime.datetime
    economic_config: Optional[EconomicConfigOut] = None

    class Config:
        from_attributes = True

# --- Asset Schemas ---
class AssetBase(BaseModel):
    asset_code: str
    site_id: int
    asset_type: str
    rated_capacity: float
    status: str = "HEALTHY"

class AssetCreate(AssetBase):
    pass

class AssetOut(AssetBase):
    id: int
    installation_date: datetime.datetime

    class Config:
        from_attributes = True

# --- Sensor Reading Schemas ---
class SensorReadingBase(BaseModel):
    asset_id: Optional[int] = None
    asset_code: Optional[str] = None
    timestamp: Optional[datetime.datetime] = None
    temperature: float = Field(..., description="Temperature in °C")
    vibration: float = Field(..., description="Vibration in mm/s")
    current: float = Field(..., description="Current in Amperes")
    power_output: float = Field(..., description="Power output in kW")
    soiling: Optional[float] = Field(None, description="Soiling percentage (solar)")
    voltage: Optional[float] = Field(None, description="Electrical voltage in V")
    wind_speed: Optional[float] = Field(None, description="Wind speed in m/s")
    wind_direction: Optional[float] = Field(None, description="Wind direction in degrees")
    solar_irradiance: Optional[float] = Field(None, description="Solar irradiance in W/m2")
    panel_soiling: Optional[float] = Field(None, description="Panel soiling %")
    humidity: Optional[float] = Field(None, description="Environmental humidity %")
    expected_power: Optional[float] = Field(None, description="Expected power baseline in kW")
    dataset_status: Optional[str] = Field(None, description="Optional status label")
    batch_id: Optional[str] = Field(None, description="Unique batch ID for upload ingestion session")

class SensorReadingCreate(SensorReadingBase):
    asset_type: Optional[str] = None

class SensorReadingOut(BaseModel):
    id: int
    asset_id: int
    timestamp: datetime.datetime
    temperature: float
    vibration: float
    current: float
    power_output: float
    soiling: Optional[float] = None
    voltage: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    solar_irradiance: Optional[float] = None
    panel_soiling: Optional[float] = None
    humidity: Optional[float] = None
    expected_power: Optional[float] = None
    dataset_status: Optional[str] = None
    batch_id: Optional[str] = None

    class Config:
        from_attributes = True

class EvidenceItem(BaseModel):
    metric: str
    category: Optional[str] = None  # ML_ANOMALY, SENSOR_DEVIATION, OPERATIONAL_DEGRADATION, DATA_QUALITY
    severity: str  # NORMAL, WARNING, CRITICAL
    description: str
    value: float
    baseline: float
    delta_pct: float

class HealthPredictionOut(BaseModel):
    id: int
    asset_id: int
    timestamp: datetime.datetime
    anomaly_score: float
    is_ml_anomaly: Optional[bool] = False
    health_score: float
    risk_level: str
    explanation: Optional[List[dict]] = None
    batch_id: Optional[str] = None

    class Config:
        from_attributes = True

# --- Impact Assessment Schemas ---
class ImpactAssessmentOut(BaseModel):
    asset_id: int
    asset_code: str
    rated_capacity: float
    expected_output_kw: float
    observed_output_kw: float
    generation_loss_kw: float
    deficit_pct: Optional[float] = None
    estimated_hourly_revenue_loss: float
    estimated_daily_revenue_loss: float
    energy_price: float
    currency: str
    baseline_source: Optional[str] = None

# --- Priority Queue Schemas ---
class PriorityQueueItem(BaseModel):
    asset_id: int
    asset_code: str
    asset_type: str
    site_name: str
    health_score: float
    risk_level: str
    estimated_revenue_loss_daily: float
    priority_score: float  # deterministic ranking value
    rank: int
    recommended_action: str
    persistence_hours: float
    active_alerts_count: int
    why_flagged: Optional[str] = None
    top_evidence: Optional[List[Dict[str, Any]]] = None
    expected_output_kw: Optional[float] = None
    observed_output_kw: Optional[float] = None
    generation_loss_kw: Optional[float] = None
    energy_price: Optional[float] = None
    currency: Optional[str] = "$"
    data_quality_status: Optional[str] = "NORMAL"

# --- Alert Schemas ---
class AlertBase(BaseModel):
    asset_id: int
    severity: str
    title: str
    message: str

class AlertCreate(AlertBase):
    pass

class AlertOut(AlertBase):
    id: int
    status: str
    persistence_count: int
    created_at: datetime.datetime
    acknowledged_at: Optional[datetime.datetime] = None
    asset: Optional[AssetOut] = None

    class Config:
        from_attributes = True

# --- Maintenance Task Schemas ---
class MaintenanceTaskCreate(BaseModel):
    asset_id: int
    assigned_to: Optional[int] = None
    priority: str = "MEDIUM"
    notes: Optional[str] = None

class MaintenanceTaskUpdate(BaseModel):
    status: Optional[str] = None  # pending, in_progress, completed
    assigned_to: Optional[int] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None

class MaintenanceTaskOut(BaseModel):
    id: int
    asset_id: int
    assigned_to: Optional[int] = None
    priority: str
    status: str
    notes: Optional[str] = None
    outcome: Optional[str] = None
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    asset: Optional[AssetOut] = None
    assignee: Optional[UserOut] = None

    class Config:
        from_attributes = True

# --- Dashboard Summary Schemas ---
class DashboardSummaryOut(BaseModel):
    total_assets: int
    total_registered_assets: Optional[int] = None
    active_reporting_assets: Optional[int] = None
    reporting_asset_codes: Optional[List[str]] = None
    healthy_count: int
    watch_count: int
    high_risk_count: int
    critical_count: int
    active_alerts_count: int
    total_generation_at_risk_kw: float
    total_revenue_at_risk_daily: float
    currency: str
    fleet_health_avg: float
    timestamp: Optional[str] = None
    healthy_assets: Optional[int] = None
    anomalies_detected: Optional[int] = None
    total_active_power_kw: Optional[float] = None
    fleet_efficiency_pct: Optional[float] = None
    hourly_revenue_loss: Optional[float] = None
    daily_revenue_loss: Optional[float] = None
    critical_assets: List[PriorityQueueItem]
    trend_data: Optional[List[Dict[str, Any]]] = None
    scope: Optional[str] = None

# --- Web Data Summary Schema ---
class WebDataSummaryOut(BaseModel):
    total_users: int
    total_sites: int
    total_assets: int
    total_sensor_readings: int
    total_health_predictions: int
    total_alerts: int
    total_maintenance_tasks: int

# --- CSV Batch Upload Schemas (Section 11) ---
class CsvUploadAssetSummaryOut(BaseModel):
    asset_code: str
    asset_type: str
    latest_health_score: float
    latest_risk_level: str
    batch_anomaly_count: int = 0
    historical_anomaly_count: int = 0
    anomaly_count: int = 0  # Mirrors batch_anomaly_count for backward compatibility
    ml_anomaly_count: int = 0
    sensor_deviation_count: int = 0
    operational_deviation_count: int = 0
    has_operational_deviations: bool = False
    has_sensor_deviations: bool = False
    why_flagged: str = "Nominal telemetry baseline"
    top_evidence: Optional[List[Dict[str, Any]]] = None
    baseline_source: Optional[str] = None
    baseline_label: Optional[str] = None
    diagnostics: Optional[Dict[str, Any]] = None

class AssetDiagnosticsOut(BaseModel):
    asset_id: Union[int, str]
    asset_code: Optional[str] = None
    total_unique_readings: int
    new_readings: int
    duplicate_readings: int
    ml_anomaly_count: int
    sensor_deviation_count: int
    operational_deviation_count: int
    anomaly_rate: float
    health_score: float
    risk_level: str
    persistence_duration: Union[str, float]
    expected_power: float
    observed_power: float
    power_deficit: float
    health_score_breakdown: Dict[str, Any]
    risk_score_breakdown: Dict[str, Any]

class CsvUploadResponseOut(BaseModel):
    status: str = "success"
    message: str
    file_name: str
    batch_id: str
    total_rows: int
    valid_rows: int
    newly_ingested: int
    processed_rows: int  # Backward compatibility alias for newly_ingested
    duplicates_skipped: int
    rejected_invalid: int = 0
    anomalies_in_upload: int
    anomalies_flagged: int  # Backward compatibility alias for anomalies_in_upload
    assets_affected_count: int
    existing_anomalies_count: int = 0
    anomaly_breakdown: Dict[str, int]
    errors: List[str] = []
    assets_analyzed: List[CsvUploadAssetSummaryOut]
    duplicates_note: Optional[str] = None

