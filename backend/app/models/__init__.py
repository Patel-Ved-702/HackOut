import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="operator")  # "operator" or "technician"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tasks = relationship("MaintenanceTask", back_populates="assignee")

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location_name = Column(String(100), nullable=False)
    site_type = Column(String(50), nullable=False)  # "wind", "solar", "hybrid"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assets = relationship("Asset", back_populates="site", cascade="all, delete-orphan")
    economic_config = relationship("EconomicConfig", back_populates="site", uselist=False, cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "WT-004", "SP-021"
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    asset_type = Column(String(50), nullable=False)  # "wind_turbine", "solar_inverter"
    rated_capacity = Column(Float, nullable=False)  # kW or MW
    installation_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="HEALTHY")  # HEALTHY, WATCH, HIGH_RISK, CRITICAL

    site = relationship("Site", back_populates="assets")
    readings = relationship("SensorReading", back_populates="asset", cascade="all, delete-orphan")
    health_predictions = relationship("HealthPrediction", back_populates="asset", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="asset", cascade="all, delete-orphan")
    tasks = relationship("MaintenanceTask", back_populates="asset", cascade="all, delete-orphan")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)  # mm/s
    current = Column(Float, nullable=False)  # A
    power_output = Column(Float, nullable=False)  # kW
    soiling = Column(Float, nullable=True)  # % for solar panels
    voltage = Column(Float, nullable=True)  # V
    wind_speed = Column(Float, nullable=True)  # m/s
    wind_direction = Column(Float, nullable=True)  # degrees
    solar_irradiance = Column(Float, nullable=True)  # W/m2
    panel_soiling = Column(Float, nullable=True)  # %
    humidity = Column(Float, nullable=True)  # %
    expected_power = Column(Float, nullable=True)  # kW
    dataset_status = Column(String(50), nullable=True)  # normal, degrading, warning
    batch_id = Column(String(100), nullable=True, index=True)

    asset = relationship("Asset", back_populates="readings")

class HealthPrediction(Base):
    __tablename__ = "health_predictions"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    anomaly_score = Column(Float, nullable=False)  # raw score from Isolation Forest or normalized
    health_score = Column(Float, nullable=False)  # 0 to 100
    risk_level = Column(String(50), nullable=False)  # HEALTHY, WATCH, HIGH_RISK, CRITICAL
    explanation = Column(JSON, nullable=True)  # structured list of evidence statements
    batch_id = Column(String(100), nullable=True, index=True)
    is_ml_anomaly = Column(Boolean, default=False, nullable=True, index=True)

    asset = relationship("Asset", back_populates="health_predictions")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True, nullable=False)
    severity = Column(String(50), nullable=False)  # INFO, WARNING, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="active")  # active, acknowledged, resolved
    persistence_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)

    asset = relationship("Asset", back_populates="alerts")

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True, nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(50), default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")

class EconomicConfig(Base):
    __tablename__ = "economic_config"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), unique=True, nullable=False)
    energy_price = Column(Float, default=0.12)
    currency = Column(String(10), default="$")

    site = relationship("Site", back_populates="economic_config")
