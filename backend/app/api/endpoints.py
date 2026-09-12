import datetime
import io
import csv
import uuid
import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models import User, Site, Asset, SensorReading, HealthPrediction, Alert, MaintenanceTask, EconomicConfig
from app.schemas import (
    UserLogin, UserCreate, Token, UserOut,
    SiteOut, AssetOut, SensorReadingCreate, SensorReadingOut,
    HealthPredictionOut, AlertOut, MaintenanceTaskCreate, MaintenanceTaskUpdate,
    MaintenanceTaskOut, ImpactAssessmentOut, PriorityQueueItem, DashboardSummaryOut,
    CsvUploadResponseOut, CsvUploadAssetSummaryOut, AssetDiagnosticsOut,
    UserUpdateRole, WebDataSummaryOut
)
from app.services.auth_service import verify_password, create_access_token, hash_password
from app.services.anomaly_service import anomaly_service
from app.services.health_service import health_service
from app.services.impact_service import impact_service
from app.services.priority_service import priority_service
from app.services.alert_service import alert_service

router = APIRouter()

# Global state tracking most recent CSV telemetry batch assets
LAST_CSV_UPLOADED_ASSET_CODES = [
    "WT-101", "WT-102", "WT-103", "WT-104", "WT-105", "WT-106",
    "SP-201", "SP-202", "SP-203", "SP-204", "SP-205", "SP-206"
]

# --- Auth ---
@router.post("/auth/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=user_in.role or "operator"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

# --- Dashboard Summary ---
@router.get("/dashboard/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    scope: Optional[str] = Query("all", description="Fleet scope: 'reporting' for active CSV imported assets, 'all' for all registered assets"),
    db: Session = Depends(get_db)
):
    all_registered_assets = db.query(Asset).all()
    total_registered = len(all_registered_assets)
    
    # Active CSV telemetry reporting assets
    reporting_codes = LAST_CSV_UPLOADED_ASSET_CODES if LAST_CSV_UPLOADED_ASSET_CODES else [a.asset_code for a in all_registered_assets]
    reporting_assets = [a for a in all_registered_assets if a.asset_code in reporting_codes]
    
    # Select asset scope (defaults to 'all' for full fleet, frontend sends 'reporting' for active CSV import)
    if scope == "reporting":
        assets = reporting_assets if reporting_assets else all_registered_assets
    else:
        assets = all_registered_assets

    total_assets = len(assets)
    active_alerts = db.query(Alert).filter(Alert.status.in_(["active", "acknowledged"])).count()

    # Collect asset priority ranking and financial calculations
    asset_summaries = []
    total_gen_risk = 0.0
    total_rev_risk = 0.0
    health_scores = []

    for a in assets:
        # Latest health prediction
        hp = db.query(HealthPrediction).filter(HealthPrediction.asset_id == a.id).order_by(desc(HealthPrediction.timestamp)).first()
        h_score = hp.health_score if hp else 100.0
        r_level = hp.risk_level if hp else a.status
        health_scores.append(h_score)

        # Latest reading
        lr = db.query(SensorReading).filter(SensorReading.asset_id == a.id).order_by(desc(SensorReading.timestamp)).first()
        observed_power = lr.power_output if lr else (a.rated_capacity * 0.92)
        exp_power = lr.expected_power if (lr and lr.expected_power is not None and lr.expected_power > 0) else None

        # Site economic config
        econ = db.query(EconomicConfig).filter(EconomicConfig.site_id == a.site_id).first()
        price = econ.energy_price if econ else 0.12
        curr = econ.currency if econ else "$"

        impact = impact_service.calculate_impact(
            a.id, a.asset_code, a.rated_capacity, observed_power, price, curr, expected_power=exp_power
        )
        if r_level in ["HIGH RISK", "CRITICAL", "HIGH_RISK"]:
            total_gen_risk += impact["generation_loss_kw"]
            total_rev_risk += impact["estimated_daily_revenue_loss"]

        site_name = a.site.name if a.site else "Unknown"
        asset_alerts = db.query(Alert).filter(Alert.asset_id == a.id, Alert.status == "active").count()

        # Dynamic persistence calculation from consecutive anomalous telemetry
        preds_for_asset = db.query(HealthPrediction).filter(
            HealthPrediction.asset_id == a.id
        ).order_by(HealthPrediction.timestamp).all()
        
        consecutive_count = 0
        prev_ts = None
        for p in reversed(preds_for_asset):
            is_anom = p.risk_level in ["CRITICAL", "HIGH RISK", "HIGH_RISK", "WATCH"] or (p.anomaly_score or 0) >= 0.55
            if not is_anom:
                break
            if prev_ts is not None:
                gap_seconds = (prev_ts - p.timestamp).total_seconds()
                if gap_seconds > 45 * 60 or gap_seconds < 0:
                    break
            prev_ts = p.timestamp
            consecutive_count += 1
        
        if consecutive_count > 1:
            first_anom_ts = preds_for_asset[-consecutive_count].timestamp
            latest_anom_ts = preds_for_asset[-1].timestamp
            dur_seconds = (latest_anom_ts - first_anom_ts).total_seconds()
            persistence_hours = round(max(0.1, dur_seconds / 3600.0), 1)
        elif consecutive_count == 1:
            persistence_hours = 0.2
        else:
            persistence_hours = 0.0

        top_ev = (hp.explanation or [])[:3] if (hp and hp.explanation) else []
        why_text = top_ev[0].get("description") if top_ev else "Nominal telemetry baseline"

        asset_summaries.append({
            "asset_id": a.id,
            "asset_code": a.asset_code,
            "asset_type": a.asset_type,
            "site_name": site_name,
            "health_score": h_score,
            "risk_level": r_level,
            "rated_capacity": a.rated_capacity,
            "persistence_hours": persistence_hours,
            "estimated_revenue_loss_daily": impact["estimated_daily_revenue_loss"],
            "active_alerts_count": asset_alerts,
            "why_flagged": why_text,
            "top_evidence": top_ev
        })

    categories = [health_service.calculate_risk_level(a["health_score"], a.get("top_evidence"))[0] for a in asset_summaries]
    critical = categories.count("CRITICAL")
    high_risk = categories.count("HIGH RISK")
    watch = categories.count("WATCH")
    healthy = categories.count("HEALTHY")

    ranked_items = priority_service.rank_assets(asset_summaries)
    critical_only = [item for item in ranked_items if item["risk_level"] in ["HIGH RISK", "CRITICAL", "WATCH"]][:6]

    avg_health = round(sum(health_scores) / max(len(health_scores), 1), 1)

    # Authentic telemetry trend data across the complete timestamp range of scoped assets
    scoped_asset_ids = [a.id for a in assets]
    distinct_timestamps = db.query(SensorReading.timestamp).filter(
        SensorReading.asset_id.in_(scoped_asset_ids)
    ).distinct().order_by(SensorReading.timestamp).all()
    
    trend_data = []
    ts_list = [t[0] for t in distinct_timestamps]
    if len(ts_list) > 24:
        step = max(1, len(ts_list) // 24)
        ts_list = ts_list[::step]

    asset_dict_map = {a.id: a for a in assets}

    for ts in ts_list:
        preds_at_ts = db.query(HealthPrediction).filter(
            HealthPrediction.asset_id.in_(scoped_asset_ids),
            HealthPrediction.timestamp == ts
        ).all()
        avg_h = round(sum(p.health_score for p in preds_at_ts) / max(len(preds_at_ts), 1), 1) if preds_at_ts else avg_health

        readings_at_ts = db.query(SensorReading).filter(
            SensorReading.asset_id.in_(scoped_asset_ids),
            SensorReading.timestamp == ts
        ).all()
        loss_kw = 0.0
        for r in readings_at_ts:
            a_obj = asset_dict_map.get(r.asset_id)
            if a_obj:
                exp = r.expected_power if (r.expected_power and r.expected_power > 0) else (a_obj.rated_capacity * 0.9)
                loss = max(0.0, exp - r.power_output)
                matching_p = next((p for p in preds_at_ts if p.asset_id == r.asset_id), None)
                if matching_p and matching_p.risk_level in ['WATCH', 'HIGH RISK', 'CRITICAL']:
                    loss_kw += loss

        trend_data.append({
            "time": ts.strftime("%H:%M") if hasattr(ts, "strftime") else str(ts)[11:16],
            "health": avg_h,
            "activeRiskKW": round(loss_kw, 1)
        })

    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "total_assets": total_assets,
        "total_registered_assets": total_registered,
        "active_reporting_assets": len(reporting_codes),
        "reporting_asset_codes": reporting_codes,
        "healthy_count": healthy,
        "healthy_assets": healthy,
        "watch_count": watch,
        "high_risk_count": high_risk,
        "critical_count": critical,
        "active_alerts_count": active_alerts,
        "anomalies_detected": active_alerts,
        "total_active_power_kw": round(sum(a.get("rated_capacity", 100.0) * 0.85 for a in asset_summaries), 1),
        "fleet_efficiency_pct": round(avg_health * 0.95, 1),
        "hourly_revenue_loss": round(total_rev_risk / 24.0, 2),
        "daily_revenue_loss": round(total_rev_risk, 2),
        "total_generation_at_risk_kw": round(total_gen_risk, 1),
        "total_revenue_at_risk_daily": round(total_rev_risk, 2),
        "currency": "$",
        "fleet_health_avg": avg_health,
        "critical_assets": critical_only,
        "trend_data": trend_data,
        "scope": scope or "all"
    }

# --- Assets ---
@router.get("/assets", response_model=List[dict])
def list_assets(
    site_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Asset)
    if site_id:
        query = query.filter(Asset.site_id == site_id)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)

    assets = query.all()
    results = []
    for a in assets:
        latest_reading = db.query(SensorReading).filter(SensorReading.asset_id == a.id).order_by(desc(SensorReading.timestamp)).first()
        latest_health = db.query(HealthPrediction).filter(HealthPrediction.asset_id == a.id).order_by(desc(HealthPrediction.timestamp)).first()
        results.append({
            "id": a.id,
            "asset_code": a.asset_code,
            "site_id": a.site_id,
            "site_name": a.site.name if a.site else "",
            "asset_type": a.asset_type,
            "rated_capacity": a.rated_capacity,
            "installation_date": a.installation_date,
            "status": a.status,
            "health_score": latest_health.health_score if latest_health else 100.0,
            "evidence": latest_health.explanation if latest_health else [],
            "latest_reading": {
                "temperature": latest_reading.temperature if latest_reading else 0,
                "vibration": latest_reading.vibration if latest_reading else 0,
                "power_output": latest_reading.power_output if latest_reading else 0,
                "expected_power": latest_reading.expected_power if latest_reading else None,
                "timestamp": latest_reading.timestamp if latest_reading else None
            } if latest_reading else None
        })
    return results

@router.get("/assets/{id}")
def get_asset_detail(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    latest_reading = db.query(SensorReading).filter(SensorReading.asset_id == id).order_by(desc(SensorReading.timestamp)).first()
    latest_health = db.query(HealthPrediction).filter(HealthPrediction.asset_id == id).order_by(desc(HealthPrediction.timestamp)).first()
    recent_readings = db.query(SensorReading).filter(SensorReading.asset_id == id).order_by(desc(SensorReading.timestamp)).limit(20).all()
    recent_predictions = db.query(HealthPrediction).filter(HealthPrediction.asset_id == id).order_by(desc(HealthPrediction.timestamp)).limit(20).all()

    econ = db.query(EconomicConfig).filter(EconomicConfig.site_id == asset.site_id).first()
    price = econ.energy_price if econ else 0.12
    curr = econ.currency if econ else "$"

    power = latest_reading.power_output if latest_reading else (asset.rated_capacity * 0.92)
    exp_power = latest_reading.expected_power if (latest_reading and latest_reading.expected_power is not None and latest_reading.expected_power > 0) else None
    impact = impact_service.calculate_impact(asset.id, asset.asset_code, asset.rated_capacity, power, price, curr, expected_power=exp_power)

    return {
        "id": asset.id,
        "asset_code": asset.asset_code,
        "site_id": asset.site_id,
        "site_name": asset.site.name if asset.site else "",
        "asset_type": asset.asset_type,
        "rated_capacity": asset.rated_capacity,
        "installation_date": asset.installation_date,
        "status": asset.status,
        "health_score": latest_health.health_score if latest_health else 100.0,
        "anomaly_score": latest_health.anomaly_score if latest_health else 0.0,
        "baseline_temp": 52.0 if "WT" in asset.asset_code else 40.0,
        "baseline_vib": 2.8 if "WT" in asset.asset_code else 0.1,
        "evidence": latest_health.explanation if latest_health else [],
        "impact": impact,
        "latest_reading": latest_reading,
        "readings": list(reversed(recent_readings)),
        "predictions": list(reversed(recent_predictions))
    }

@router.get("/assets/{id}/readings", response_model=List[SensorReadingOut])
def get_asset_readings(
    id: int,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    readings = db.query(SensorReading).filter(
        SensorReading.asset_id == id
    ).order_by(desc(SensorReading.timestamp)).limit(limit).all()
    return list(reversed(readings))

# --- Sensor Ingestion API ---
@router.post("/sensors/readings")
def ingest_sensor_reading(payload: SensorReadingCreate, db: Session = Depends(get_db), is_batch: bool = False, batch_id: Optional[str] = None):
    # 1. Match asset or auto-register on the fly
    asset = None
    if payload.asset_id:
        asset = db.query(Asset).filter(Asset.id == payload.asset_id).first()
    elif payload.asset_code:
        asset = db.query(Asset).filter(Asset.asset_code == payload.asset_code).first()

    if not asset:
        if payload.asset_code:
            type_str = (payload.asset_type or "").lower()
            is_solar = "solar" in type_str or payload.asset_code.upper().startswith(("SP", "SOL", "PV"))
            site = db.query(Site).filter(Site.site_type == ("solar" if is_solar else "wind")).first()
            if not site:
                site = db.query(Site).first()
            cap = payload.expected_power if payload.expected_power and payload.expected_power > 0 else 100.0
            asset = Asset(
                asset_code=payload.asset_code.strip(),
                site_id=site.id if site else 1,
                asset_type="solar_inverter" if is_solar else "wind_turbine",
                rated_capacity=cap,
                status="HEALTHY"
            )
            db.add(asset)
            db.commit()
            db.refresh(asset)
        else:
            raise HTTPException(status_code=404, detail="Asset not found for provided id/code")

    # TC-10: Immediate duplicate check before feature extraction, preventing baseline contamination and redundant ML inference
    if payload.timestamp:
        existing = db.query(SensorReading).filter(
            SensorReading.asset_id == asset.id,
            SensorReading.timestamp == payload.timestamp
        ).first()
        if existing:
            existing_pred = db.query(HealthPrediction).filter(
                HealthPrediction.asset_id == asset.id,
                HealthPrediction.timestamp == payload.timestamp
            ).first()
            if not existing_pred:
                existing_pred = db.query(HealthPrediction).filter(
                    HealthPrediction.asset_id == asset.id
                ).order_by(desc(HealthPrediction.timestamp)).first()

            return {
                "status": "duplicate_skipped",
                "asset_code": asset.asset_code,
                "health_score": existing_pred.health_score if existing_pred else 100.0,
                "risk_level": existing_pred.risk_level if existing_pred else "HEALTHY",
                "anomaly_score": existing_pred.anomaly_score if existing_pred else 0.0,
                "model_used": "isolation_forest",
                "evidence": existing_pred.explanation if (existing_pred and existing_pred.explanation) else [],
                "alert_id": None,
                "message": f"Duplicate timestamp {payload.timestamp} ignored for {asset.asset_code}"
            }

    # 2. Retrieve recent history for rolling baseline calculation
    recent_readings_orm = db.query(SensorReading).filter(
        SensorReading.asset_id == asset.id
    ).order_by(desc(SensorReading.timestamp)).limit(20).all()

    recent_dicts = [{
        "temperature": r.temperature,
        "vibration": r.vibration,
        "current": r.current,
        "power_output": r.power_output,
        "timestamp": r.timestamp
    } for r in reversed(recent_readings_orm)]

    current_dict = {
        "temperature": payload.temperature,
        "vibration": payload.vibration,
        "current": payload.current,
        "power_output": payload.power_output,
        "expected_power": payload.expected_power,
        "voltage": payload.voltage,
        "wind_speed": payload.wind_speed,
        "solar_irradiance": payload.solar_irradiance,
        "panel_soiling": payload.panel_soiling or payload.soiling,
        "humidity": payload.humidity,
        "timestamp": payload.timestamp or datetime.datetime.utcnow()
    }

    # 3. Check data quality (Section 14: reject corrupt or handle stale)
    is_valid, quality_issue = anomaly_service.check_data_quality(current_dict, recent_dicts, is_batch_upload=is_batch)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Data Quality Rejection: {quality_issue}")

    # 4. Feature engineering (incorporates expected_power if provided)
    cap = payload.expected_power if payload.expected_power and payload.expected_power > 0 else asset.rated_capacity
    features = anomaly_service.extract_features(current_dict, recent_dicts, cap, asset_type=asset.asset_type)
    if payload.expected_power and payload.expected_power > 0:
        features["expected_power"] = payload.expected_power
        drop = max(0.0, (payload.expected_power - payload.power_output) / payload.expected_power) * 100.0
        features["power_drop_pct"] = drop

    # 5. ML Anomaly Prediction (Isolation Forest)
    anomaly_result = anomaly_service.predict_anomaly(features)

    # 6. Health & Risk Assessment
    health_score, risk_level, evidence, action = health_service.calculate_health_and_risk(
        features, anomaly_result, quality_issue
    )

    # 7. Persist sensor reading with all 15 parameters
    reading = SensorReading(
        asset_id=asset.id,
        timestamp=payload.timestamp or datetime.datetime.utcnow(),
        temperature=payload.temperature,
        vibration=payload.vibration,
        current=payload.current,
        power_output=payload.power_output,
        soiling=payload.panel_soiling if payload.panel_soiling is not None else payload.soiling,
        voltage=payload.voltage,
        wind_speed=payload.wind_speed,
        wind_direction=payload.wind_direction,
        solar_irradiance=payload.solar_irradiance,
        panel_soiling=payload.panel_soiling,
        humidity=payload.humidity,
        expected_power=payload.expected_power,
        dataset_status=payload.dataset_status,
        batch_id=batch_id or payload.batch_id
    )
    db.add(reading)

    # 8. Persist health prediction
    is_ml_anom = anomaly_result.get("is_ml_anomaly", False)
    prediction = HealthPrediction(
        asset_id=asset.id,
        timestamp=reading.timestamp,
        anomaly_score=anomaly_result["anomaly_score"],
        is_ml_anomaly=is_ml_anom,
        health_score=health_score,
        risk_level=risk_level,
        explanation=evidence,
        batch_id=batch_id or payload.batch_id
    )
    db.add(prediction)

    # 9. Update asset status
    asset.status = risk_level

    # 10. Update Alert state (handles de-duplication and persistence)
    alert = alert_service.process_health_update(db, asset.id, health_score, risk_level, evidence)

    db.commit()

    return {
        "status": "ingested",
        "asset_code": asset.asset_code,
        "health_score": health_score,
        "risk_level": risk_level,
        "anomaly_score": anomaly_result["anomaly_score"],
        "is_ml_anomaly": is_ml_anom,
        "model_used": anomaly_result.get("model_used"),
        "evidence": evidence,
        "features": features,
        "anomaly_result": anomaly_result,
        "alert_id": alert.id if alert else None,
        "batch_id": batch_id or payload.batch_id
    }

# --- Alerts ---
@router.get("/alerts", response_model=List[AlertOut])
def list_alerts(
    status_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).order_by(desc(Alert.created_at))
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if severity_filter:
        query = query.filter(Alert.severity == severity_filter)
    return query.limit(50).all()

@router.patch("/alerts/{id}")
def update_alert(
    id: int,
    action: str = Query(..., pattern="^(acknowledge|resolve)$"),
    db: Session = Depends(get_db)
):
    if action == "acknowledge":
        alert = alert_service.acknowledge_alert(db, id)
    else:
        alert = alert_service.resolve_alert(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

# --- Maintenance Priorities ---
@router.get("/maintenance/queue", response_model=List[PriorityQueueItem])
@router.get("/maintenance/priorities", response_model=List[PriorityQueueItem])
def get_maintenance_priorities(
    scope: Optional[str] = Query("all", description="Scope for maintenance queue: 'reporting' or 'all'"),
    db: Session = Depends(get_db)
):
    all_assets = db.query(Asset).all()
    reporting_codes = LAST_CSV_UPLOADED_ASSET_CODES if LAST_CSV_UPLOADED_ASSET_CODES else [a.asset_code for a in all_assets]
    if scope == "reporting" and reporting_codes:
        assets = [a for a in all_assets if a.asset_code in reporting_codes]
    else:
        assets = all_assets

    summaries = []
    for a in assets:
        hp = db.query(HealthPrediction).filter(HealthPrediction.asset_id == a.id).order_by(desc(HealthPrediction.timestamp)).first()
        h_score = hp.health_score if hp else 100.0
        r_level = hp.risk_level if hp else a.status

        lr = db.query(SensorReading).filter(SensorReading.asset_id == a.id).order_by(desc(SensorReading.timestamp)).first()
        power = lr.power_output if lr else (a.rated_capacity * 0.92)

        econ = db.query(EconomicConfig).filter(EconomicConfig.site_id == a.site_id).first()
        price = econ.energy_price if econ else 0.12
        curr = econ.currency if econ else "$"

        exp_power = lr.expected_power if (lr and lr.expected_power is not None and lr.expected_power > 0) else None
        impact = impact_service.calculate_impact(a.id, a.asset_code, a.rated_capacity, power, price, curr, expected_power=exp_power)
        alerts_count = db.query(Alert).filter(Alert.asset_id == a.id, Alert.status.in_(["active", "acknowledged"])).count()

        # Dynamic persistence calculation from consecutive anomalous telemetry
        preds_for_asset = db.query(HealthPrediction).filter(
            HealthPrediction.asset_id == a.id
        ).order_by(HealthPrediction.timestamp).all()
        
        consecutive_count = 0
        prev_ts = None
        for p in reversed(preds_for_asset):
            is_anom = p.risk_level in ["CRITICAL", "HIGH RISK", "HIGH_RISK", "WATCH"] or (p.anomaly_score or 0) >= 0.55
            if not is_anom:
                break
            if prev_ts is not None:
                gap_seconds = (prev_ts - p.timestamp).total_seconds()
                if gap_seconds > 45 * 60 or gap_seconds < 0:
                    break
            prev_ts = p.timestamp
            consecutive_count += 1
        
        if consecutive_count > 1:
            first_ts = preds_for_asset[-consecutive_count].timestamp
            last_ts = preds_for_asset[-1].timestamp
            persistence_hours = round(max(0.1, (last_ts - first_ts).total_seconds() / 3600.0), 1)
        elif consecutive_count == 1:
            persistence_hours = 0.2
        else:
            persistence_hours = 0.0

        top_ev = (hp.explanation or [])[:3] if (hp and hp.explanation) else []
        why_text = top_ev[0].get("description") if top_ev else "Nominal telemetry baseline"

        summaries.append({
            "asset_id": a.id,
            "asset_code": a.asset_code,
            "asset_type": a.asset_type,
            "site_name": a.site.name if a.site else "",
            "health_score": h_score,
            "risk_level": r_level,
            "rated_capacity": a.rated_capacity,
            "persistence_hours": persistence_hours,
            "estimated_revenue_loss_daily": impact["estimated_daily_revenue_loss"],
            "active_alerts_count": alerts_count,
            "why_flagged": why_text,
            "top_evidence": top_ev
        })

    return priority_service.rank_assets(summaries)

# --- Maintenance Tasks ---
@router.get("/maintenance/tasks", response_model=List[MaintenanceTaskOut])
def list_tasks(
    status_filter: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceTask).order_by(desc(MaintenanceTask.created_at))
    if status_filter:
        query = query.filter(MaintenanceTask.status == status_filter)
    if assigned_to:
        query = query.filter(MaintenanceTask.assigned_to == assigned_to)
    return query.all()

@router.post("/maintenance/tasks", response_model=MaintenanceTaskOut)
def create_task(payload: MaintenanceTaskCreate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == payload.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    task = MaintenanceTask(
        asset_id=payload.asset_id,
        assigned_to=payload.assigned_to,
        priority=payload.priority,
        status="pending",
        notes=payload.notes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/maintenance/tasks/{id}", response_model=MaintenanceTaskOut)
def update_task(id: int, payload: MaintenanceTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.status:
        task.status = payload.status
        if payload.status == "completed":
            task.resolved_at = datetime.datetime.utcnow()
            # If resolved, reset asset to healthy and resolve active alert
            task.asset.status = "HEALTHY"
            for al in task.asset.alerts:
                if al.status in ["active", "acknowledged"]:
                    al.status = "resolved"
    if payload.assigned_to is not None:
        task.assigned_to = payload.assigned_to
    if payload.notes:
        task.notes = payload.notes
    if payload.outcome:
        task.outcome = payload.outcome

    db.commit()
    db.refresh(task)
    return task

# --- Economic Impact Endpoint ---
@router.get("/impact/{assetId}", response_model=ImpactAssessmentOut)
def get_asset_impact(
    assetId: int,
    custom_tariff: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == assetId).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    latest_reading = db.query(SensorReading).filter(SensorReading.asset_id == assetId).order_by(desc(SensorReading.timestamp)).first()
    observed_power = latest_reading.power_output if latest_reading else (asset.rated_capacity * 0.92)
    exp_power = latest_reading.expected_power if (latest_reading and latest_reading.expected_power is not None and latest_reading.expected_power > 0) else None

    econ = db.query(EconomicConfig).filter(EconomicConfig.site_id == asset.site_id).first()
    price = custom_tariff if custom_tariff is not None else (econ.energy_price if econ else 0.12)
    currency = econ.currency if econ else "$"

    return impact_service.calculate_impact(asset.id, asset.asset_code, asset.rated_capacity, observed_power, price, currency, expected_power=exp_power)

# --- Live Degradation Trigger for Demo (Default: WT-006 matching CSV) ---
@router.post("/simulator/degrade")
def trigger_degradation_demo(
    asset_code: str = Query("WT-006"),
    step: int = Query(1, ge=1, le=4),
    db: Session = Depends(get_db)
):
    """
    Progressively degrades asset (defaults to WT-006 matching CSV dataset) to demonstrate live
    anomaly detection, progressive health score decay, exact deficit calculation, and priority ranking.
    """
    asset = db.query(Asset).filter(Asset.asset_code == asset_code).first()
    if not asset:
        # Auto-create if not yet registered
        site = db.query(Site).filter(Site.site_type == "wind").first()
        asset = Asset(
            asset_code=asset_code,
            site_id=site.id if site else 1,
            asset_type="wind_turbine",
            rated_capacity=100.0,
            status="HEALTHY"
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

    # 4 Progressive Degradation Profiles directly from the CSV test dataset:
    # Step 1 (Normal/Notice): Temp 52°C, Vib 2.8 mm/s, Power 88.0 kW, Exp 96.0 kW (Deficit 8 kW)
    # Step 2 (Watch): Temp 57°C, Vib 3.9 mm/s, Power 82.0 kW, Exp 96.0 kW (Deficit 14 kW)
    # Step 3 (High Risk): Temp 63°C, Vib 5.6 mm/s, Power 74.0 kW, Exp 96.0 kW (Deficit 22 kW)
    # Step 4 (Critical): Temp 69.2°C, Vib 7.4 mm/s, Power 64.8 kW, Exp 96.0 kW (Deficit 31.2 kW, Health ~18/100)
    degrade_profiles = [
        {"temp": 52.0, "vib": 2.8, "curr": 37.2, "power": 88.0, "exp": 96.0, "volt": 412.0, "wind_spd": 8.2, "wind_dir": 188.0, "humid": 59.0},
        {"temp": 57.0, "vib": 3.9, "curr": 36.5, "power": 82.0, "exp": 96.0, "volt": 410.0, "wind_spd": 8.0, "wind_dir": 190.0, "humid": 60.0},
        {"temp": 63.0, "vib": 5.6, "curr": 35.8, "power": 74.0, "exp": 96.0, "volt": 408.0, "wind_spd": 7.8, "wind_dir": 192.0, "humid": 61.0},
        {"temp": 69.2, "vib": 7.4, "curr": 35.1, "power": 64.8, "exp": 96.0, "volt": 405.0, "wind_spd": 7.5, "wind_dir": 195.0, "humid": 62.0},
    ]

    chosen = degrade_profiles[min(step - 1, len(degrade_profiles) - 1)]

    # Ingest through standard pipeline
    ingest_payload = SensorReadingCreate(
        asset_id=asset.id,
        asset_code=asset.asset_code,
        temperature=chosen["temp"],
        vibration=chosen["vib"],
        current=chosen["curr"],
        power_output=chosen["power"],
        expected_power=chosen["exp"],
        voltage=chosen["volt"],
        wind_speed=chosen["wind_spd"],
        wind_direction=chosen["wind_dir"],
        humidity=chosen["humid"],
        timestamp=datetime.datetime.utcnow()
    )
    result = ingest_sensor_reading(ingest_payload, db)
    return {
        "message": f"Degradation step {step} applied to {asset_code}",
        "step": step,
        "asset_code": asset.asset_code,
        "result": result
    }

@router.post("/simulator/reset")
def reset_asset_demo(
    asset_code: str = Query("WT-006"),
    db: Session = Depends(get_db)
):
    """Resets asset back to healthy baseline operating conditions."""
    asset = db.query(Asset).filter(Asset.asset_code == asset_code).first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {asset_code} not found")

    # Ingest healthy baseline reading after clearing contaminated simulation telemetry
    db.query(SensorReading).filter(SensorReading.asset_id == asset.id).delete()
    db.query(HealthPrediction).filter(HealthPrediction.asset_id == asset.id).delete()
    db.commit()

    reading = SensorReadingCreate(
        asset_id=asset.id,
        asset_code=asset.asset_code,
        temperature=48.2,
        vibration=2.1,
        current=38.4,
        power_output=91.4,
        expected_power=96.0,
        voltage=415.0,
        wind_speed=8.4,
        wind_direction=185.0,
        humidity=58.0,
        timestamp=datetime.datetime.utcnow()
    )
    result = ingest_sensor_reading(reading, db)
    asset.status = "HEALTHY"
    # Resolve alerts
    for al in asset.alerts:
        al.status = "resolved"
    db.commit()
    return {"message": f"Asset {asset_code} reset to healthy baseline", "asset_code": asset.asset_code, "result": result}

# --- CSV Batch Telemetry Ingestion & Analysis ---
@router.post("/sensors/upload-csv", response_model=CsvUploadResponseOut)
async def upload_telemetry_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Accepts a CSV file of sensor readings, executes full feature engineering,
    Isolation Forest anomaly detection, health scoring, revenue impact, and alert creation.
    Tags each upload batch with a unique batch_id and decouples current-upload anomalies
    from cumulative historical database records (Section 11).
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported")

    content = await file.read()
    try:
        decoded = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        decoded = content.decode('latin1')

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or missing headers")

    # Column mapping helper
    def find_col(possible_names):
        for name in possible_names:
            for field in reader.fieldnames:
                if field.strip().lower() == name.lower():
                    return field
        return None

    col_time = find_col(["timestamp", "time", "date", "datetime"])
    col_asset = find_col(["asset_id", "asset_code", "asset", "turbine_id", "inverter_id", "device_id"])
    col_type = find_col(["asset_type", "type", "equipment_type"])
    col_temp = find_col(["temperature", "temp", "ambient_temp", "temp_c", "temperature_c"])
    col_vib = find_col(["vibration", "vib", "vibration_mm_s", "vib_rms", "vibration_level"])
    col_curr = find_col(["current", "curr", "amps", "phase_current", "current_a"])
    col_power = find_col(["power_output", "power", "power_kw", "active_power", "generation_kw"])
    col_volt = find_col(["voltage", "volt", "volts", "phase_voltage"])
    col_wind_spd = find_col(["wind_speed", "windspeed", "speed_m_s"])
    col_wind_dir = find_col(["wind_direction", "winddirection", "direction_deg"])
    col_irrad = find_col(["solar_irradiance", "irradiance", "ghi", "poa"])
    col_soiling = find_col(["panel_soiling", "soiling", "soiling_ratio", "soiling_pct"])
    col_humid = find_col(["humidity", "humid", "rh", "rel_humidity"])
    col_exp_power = find_col(["expected_power", "baseline_power", "expected_kw", "rated_power"])
    col_status = find_col(["status", "ground_truth", "label", "dataset_status"])

    if not (col_temp and col_vib and col_curr and col_power):
        raise HTTPException(
            status_code=422,
            detail=f"CSV missing essential sensor columns. Found headers: {list(reader.fieldnames)}. Required at minimum: temperature, vibration, current, power_output"
        )

    def parse_float_safe(row_dict, col_name):
        if not col_name or not row_dict.get(col_name):
            return None
        try:
            val = str(row_dict[col_name]).strip()
            return float(val) if val else None
        except ValueError:
            return None

    # Unique batch identification (Section 10 & 11)
    batch_id = f"batch_{int(datetime.datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"

    total_rows = 0
    newly_ingested = 0
    duplicates_skipped = 0
    anomalies_in_upload = 0
    errors = []
    assets_affected = {}
    asset_batch_anomalies = {}  # Strict count of ML anomalies generated in THIS batch
    asset_batch_sensor_devs = {}
    asset_batch_oper_devs = {}
    asset_new_counts = {}
    asset_duplicate_counts = {}
    asset_latest_ingested_info = {}  # Latest res from newly ingested rows for each asset
    asset_codes_seen = []
    asset_type_map = {}

    for row_idx, row in enumerate(reader, start=1):
        total_rows += 1
        asset_code = (row.get(col_asset) or "WT-004").strip() if col_asset else "WT-004"
        if asset_code not in asset_codes_seen:
            asset_codes_seen.append(asset_code)
        raw_type = (row.get(col_type) or "").strip() if col_type else None
        if raw_type and asset_code not in asset_type_map:
            asset_type_map[asset_code] = raw_type

        try:
            temp_val = float(str(row[col_temp]).strip())
            vib_val = float(str(row[col_vib]).strip())
            curr_val = float(str(row[col_curr]).strip())
            power_val = float(str(row[col_power]).strip())
        except (ValueError, KeyError) as e:
            errors.append(f"Row {row_idx}: Missing or non-numeric core readings ({e})")
            continue

        volt_val = parse_float_safe(row, col_volt)
        wind_spd_val = parse_float_safe(row, col_wind_spd)
        wind_dir_val = parse_float_safe(row, col_wind_dir)
        irrad_val = parse_float_safe(row, col_irrad)
        soil_val = parse_float_safe(row, col_soiling)
        humid_val = parse_float_safe(row, col_humid)
        exp_power_val = parse_float_safe(row, col_exp_power)
        stat_label = (row.get(col_status) or "").strip() if col_status else None

        # Parse timestamp if valid
        ts_val = None
        if col_time and row.get(col_time):
            try:
                from dateutil import parser
                ts_val = parser.parse(str(row[col_time]).strip())
            except Exception:
                ts_val = datetime.datetime.utcnow()

        ingest_payload = SensorReadingCreate(
            asset_code=asset_code,
            asset_type=raw_type,
            temperature=temp_val,
            vibration=vib_val,
            current=curr_val,
            power_output=power_val,
            voltage=volt_val,
            wind_speed=wind_spd_val,
            wind_direction=wind_dir_val,
            solar_irradiance=irrad_val,
            panel_soiling=soil_val,
            humidity=humid_val,
            expected_power=exp_power_val,
            dataset_status=stat_label,
            timestamp=ts_val or datetime.datetime.utcnow(),
            batch_id=batch_id
        )

        try:
            res = ingest_sensor_reading(ingest_payload, db, is_batch=True, batch_id=batch_id)
            if res.get("status") == "duplicate_skipped":
                duplicates_skipped += 1
                asset_duplicate_counts[asset_code] = asset_duplicate_counts.get(asset_code, 0) + 1
            else:
                newly_ingested += 1
                asset_new_counts[asset_code] = asset_new_counts.get(asset_code, 0) + 1

                # Section 7 & 9: Strict ML anomaly classification
                is_anomaly = bool(res.get("is_ml_anomaly", False))
                if is_anomaly:
                    anomalies_in_upload += 1
                    asset_batch_anomalies[asset_code] = asset_batch_anomalies.get(asset_code, 0) + 1

                # Track deviations separately from ML anomalies
                for ev in res.get("evidence", []):
                    cat = ev.get("category")
                    sev = ev.get("severity")
                    if sev in ["WARNING", "CRITICAL"]:
                        if cat == "SENSOR_DEVIATION":
                            asset_batch_sensor_devs[asset_code] = asset_batch_sensor_devs.get(asset_code, 0) + 1
                        elif cat == "OPERATIONAL_DEGRADATION":
                            asset_batch_oper_devs[asset_code] = asset_batch_oper_devs.get(asset_code, 0) + 1

                asset_latest_ingested_info[asset_code] = res
        except Exception as ex:
            errors.append(f"Row {row_idx} ({asset_code}): {str(ex)}")

    if total_rows == 0:
        raise HTTPException(status_code=422, detail="CSV file contains headers but no data rows.")

    # Populate asset summaries (Cause #1: strictly decouple batch anomalies from historical anomalies)
    for code in asset_codes_seen:
        asset_obj = db.query(Asset).filter(Asset.asset_code == code).first()
        raw_type = asset_type_map.get(code) or (asset_obj.asset_type if asset_obj else None)
        normalized_type = "solar_inverter" if ("SP" in code or "SOL" in code or "solar" in (raw_type or "").lower()) else "wind_turbine"

        # Query total historical ML anomalies for this asset in database (Section 9)
        hist_anoms = 0
        if asset_obj:
            hist_anoms = db.query(HealthPrediction).filter(
                HealthPrediction.asset_id == asset_obj.id,
                HealthPrediction.is_ml_anomaly == True
            ).count()

        batch_anoms = asset_batch_anomalies.get(code, 0)
        sensor_devs = asset_batch_sensor_devs.get(code, 0)
        oper_devs = asset_batch_oper_devs.get(code, 0)
        new_cnt = asset_new_counts.get(code, 0)
        dup_cnt = asset_duplicate_counts.get(code, 0)

        if code in asset_latest_ingested_info:
            res = asset_latest_ingested_info[code]
            h_score = res.get("health_score", 100.0)
            r_level = res.get("risk_level", "HEALTHY")
            top_ev = res.get("evidence", [])[:3]
            why_text = (res.get("evidence") or [{}])[0].get("description", "Nominal telemetry baseline")
            features_for_breakdown = res.get("features", {})
            anomaly_res_for_breakdown = res.get("anomaly_result", {})
        else:
            # Asset only had duplicate rows in this upload batch
            if asset_obj:
                latest_pred = db.query(HealthPrediction).filter(
                    HealthPrediction.asset_id == asset_obj.id
                ).order_by(desc(HealthPrediction.timestamp)).first()
                h_score = latest_pred.health_score if latest_pred else 100.0
                r_level = latest_pred.risk_level if latest_pred else "HEALTHY"
                top_ev = (latest_pred.explanation or [])[:3] if (latest_pred and latest_pred.explanation) else []
                why_text = top_ev[0].get("description", "Nominal telemetry baseline") if top_ev else "Nominal telemetry baseline"
                anomaly_res_for_breakdown = {
                    "anomaly_score": latest_pred.anomaly_score if latest_pred else 0.0,
                    "is_ml_anomaly": latest_pred.is_ml_anomaly if latest_pred else False
                }
            else:
                h_score = 100.0
                r_level = "HEALTHY"
                top_ev = []
                why_text = "Nominal telemetry baseline"
                anomaly_res_for_breakdown = {"anomaly_score": 0.0, "is_ml_anomaly": False}

            features_for_breakdown = {}

        # Expected and observed power
        lr = db.query(SensorReading).filter(SensorReading.asset_id == asset_obj.id).order_by(desc(SensorReading.timestamp)).first() if asset_obj else None
        obs_p = lr.power_output if lr else 0.0
        exp_p = lr.expected_power if (lr and lr.expected_power is not None and lr.expected_power > 0) else (asset_obj.rated_capacity * 0.9 if asset_obj else 100.0)
        power_deficit = round(max(0.0, exp_p - obs_p), 2)

        if not features_for_breakdown:
            features_for_breakdown = {
                "power_output": obs_p,
                "expected_power": exp_p,
                "power_drop_pct": max(0.0, (exp_p - obs_p) / max(exp_p, 1.0) * 100.0)
            }

        # Dynamic persistence calculation from consecutive anomalous telemetry
        preds_for_asset = db.query(HealthPrediction).filter(
            HealthPrediction.asset_id == asset_obj.id
        ).order_by(HealthPrediction.timestamp).all() if asset_obj else []

        consecutive_count = 0
        prev_ts = None
        for p in reversed(preds_for_asset):
            is_anom = p.is_ml_anomaly or p.risk_level in ["CRITICAL", "HIGH RISK", "HIGH_RISK"]
            if not is_anom:
                break
            if prev_ts is not None:
                gap_seconds = (prev_ts - p.timestamp).total_seconds()
                if gap_seconds > 45 * 60 or gap_seconds < 0:
                    break
            prev_ts = p.timestamp
            consecutive_count += 1

        if consecutive_count > 1:
            first_ts = preds_for_asset[-consecutive_count].timestamp
            last_ts = preds_for_asset[-1].timestamp
            persistence_hours = round(max(0.1, (last_ts - first_ts).total_seconds() / 3600.0), 1)
        elif consecutive_count == 1:
            persistence_hours = 0.2
        else:
            persistence_hours = 0.0

        baseline_src = "telemetry_expected_power" if col_exp_power else "rated_capacity_90pct"
        baseline_lbl = "SCADA Theoretical Expected Power" if col_exp_power else "Estimated Expected Output (~90% Rated)"

        # Diagnostics for Section 17
        total_unique = db.query(SensorReading).filter(SensorReading.asset_id == asset_obj.id).count() if asset_obj else 0
        h_breakdown = health_service.calculate_health_breakdown(features_for_breakdown, anomaly_res_for_breakdown)
        r_breakdown = {
            "risk_level": r_level,
            "health_score": h_score,
            "ml_anomalies": batch_anoms,
            "sensor_deviations": sensor_devs,
            "operational_deviations": oper_devs
        }
        diagnostics_dict = {
            "asset_id": asset_obj.id if asset_obj else code,
            "asset_code": code,
            "total_unique_readings": total_unique,
            "new_readings": new_cnt,
            "duplicate_readings": dup_cnt,
            "ml_anomaly_count": batch_anoms,
            "sensor_deviation_count": sensor_devs,
            "operational_deviation_count": oper_devs,
            "anomaly_rate": round(batch_anoms / max(new_cnt, 1), 4) if new_cnt > 0 else 0.0,
            "health_score": h_score,
            "risk_level": r_level,
            "persistence_duration": f"{persistence_hours:.1f}h",
            "expected_power": round(exp_p, 2),
            "observed_power": round(obs_p, 2),
            "power_deficit": power_deficit,
            "health_score_breakdown": h_breakdown,
            "risk_score_breakdown": r_breakdown
        }

        assets_affected[code] = {
            "asset_code": code,
            "asset_type": normalized_type,
            "latest_health_score": h_score,
            "latest_risk_level": r_level,
            "batch_anomaly_count": batch_anoms,
            "historical_anomaly_count": hist_anoms,
            "anomaly_count": batch_anoms,
            "ml_anomaly_count": batch_anoms,
            "sensor_deviation_count": sensor_devs,
            "operational_deviation_count": oper_devs,
            "has_operational_deviations": oper_devs > 0,
            "has_sensor_deviations": sensor_devs > 0,
            "why_flagged": why_text,
            "top_evidence": top_ev,
            "baseline_source": baseline_src,
            "baseline_label": baseline_lbl,
            "diagnostics": diagnostics_dict
        }

    global LAST_CSV_UPLOADED_ASSET_CODES
    if len(assets_affected) >= 3:
        LAST_CSV_UPLOADED_ASSET_CODES = list(assets_affected.keys())

    risk_rank = {"CRITICAL": 0, "HIGH RISK": 1, "HIGH_RISK": 1, "WATCH": 2, "HEALTHY": 3, "STARTUP": 4, "STANDBY": 5}
    sorted_assets = sorted(
        assets_affected.values(),
        key=lambda a: (risk_rank.get(a.get("latest_risk_level", "HEALTHY"), 9), a.get("latest_health_score", 100))
    )

    breakdown = {
        "critical": sum(1 for a in assets_affected.values() if a.get("latest_risk_level") == "CRITICAL"),
        "high_risk": sum(1 for a in assets_affected.values() if a.get("latest_risk_level") in ["HIGH RISK", "HIGH_RISK"]),
        "watch": sum(1 for a in assets_affected.values() if a.get("latest_risk_level") == "WATCH"),
        "healthy": sum(1 for a in assets_affected.values() if a.get("latest_risk_level") in ["HEALTHY", "STARTUP", "STANDBY"])
    }

    existing_anomalies_count = sum(a.get("historical_anomaly_count", 0) for a in assets_affected.values())

    if newly_ingested == 0 and duplicates_skipped > 0:
        duplicates_note = (
            f"All {duplicates_skipped} readings matched pre-existing records in the database and were safely deduplicated. "
            "No new telemetry ingested; existing analysis unchanged."
        )
        message = "No new telemetry ingested; existing analysis unchanged."
    elif duplicates_skipped > 0:
        duplicates_note = (
            f"{duplicates_skipped} readings matched pre-existing records and were safely deduplicated. "
            f"{newly_ingested} new records ingested."
        )
        message = f"Batch ingestion completed: {newly_ingested} new records processed, {duplicates_skipped} duplicates skipped."
    else:
        duplicates_note = "0 duplicate records detected."
        message = f"Batch ingestion completed: {newly_ingested} records processed."

    return {
        "status": "success",
        "message": message,
        "file_name": file.filename,
        "batch_id": batch_id,
        "total_rows": total_rows,
        "valid_rows": total_rows - len(errors),
        "newly_ingested": newly_ingested,
        "processed_rows": newly_ingested,
        "duplicates_skipped": duplicates_skipped,
        "rejected_invalid": len(errors),
        "anomalies_in_upload": anomalies_in_upload,
        "anomalies_flagged": anomalies_in_upload,
        "assets_affected_count": len(asset_codes_seen),
        "existing_anomalies_count": existing_anomalies_count,
        "anomaly_breakdown": breakdown,
        "errors": errors[:10],
        "assets_analyzed": sorted_assets,
        "duplicates_note": duplicates_note
    }

@router.get("/sensors/sample-csv")
def download_sample_csv():
    """Generates a downloadable sample CSV with all 15 columns requested by HackOut'26 specification."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "timestamp", "asset_id", "asset_type", "temperature", "vibration",
        "current", "power_output", "voltage", "wind_speed", "wind_direction",
        "solar_irradiance", "panel_soiling", "humidity", "expected_power", "status"
    ])

    # 1. Normal Wind Turbine WT-004 (With realistic natural variance)
    normal_wind = [
        ("11-09-2026 10:01", 48.2, 2.11, 38.4, 91.2, 415, 8.4, 185, 58, 96.0, "normal"),
        ("11-09-2026 10:02", 48.4, 2.08, 38.2, 90.8, 416, 8.3, 186, 58, 96.0, "normal"),
        ("11-09-2026 10:03", 47.9, 2.14, 38.6, 91.5, 414, 8.5, 184, 57, 96.0, "normal"),
        ("11-09-2026 10:04", 48.3, 2.10, 38.3, 91.0, 415, 8.4, 185, 58, 96.0, "normal"),
        ("11-09-2026 10:05", 48.1, 2.09, 38.5, 91.3, 415, 8.6, 187, 59, 96.0, "normal"),
    ]
    for row in normal_wind:
        writer.writerow([
            row[0], "WT-004", "wind", row[1], row[2],
            row[3], row[4], row[5], row[6], row[7],
            "", "", row[8], row[9], row[10]
        ])

    # 2. Solar Inverter SP-001 (Startup/zero-irradiance followed by normal generation curve)
    writer.writerow([
        "11-09-2026 10:01", "SP-001", "solar", 0.0, 0.0,
        0.0, 0.0, 0, "", "",
        0, 0.0, 0, 98.0, "startup"
    ])
    solar_normal = [
        ("11-09-2026 10:02", 44.2, 0.34, 41.6, 94.2, 401, 815, 12.2, 42, 98.0, "normal"),
        ("11-09-2026 10:03", 44.5, 0.35, 41.8, 94.6, 400, 820, 12.5, 42, 98.0, "normal"),
        ("11-09-2026 10:04", 44.7, 0.36, 42.0, 94.8, 399, 825, 12.6, 41, 98.0, "normal"),
        ("11-09-2026 10:05", 44.6, 0.35, 41.9, 94.5, 400, 822, 12.5, 42, 98.0, "normal"),
    ]
    for row in solar_normal:
        writer.writerow([
            row[0], "SP-001", "solar", row[1], row[2],
            row[3], row[4], row[5], "", "",
            row[6], row[7], row[8], row[9], row[10]
        ])

    # 3. Degrading Wind Turbine WT-006 (Exact progressive failure sequence)
    degrade_steps = [
        ("11-09-2026 10:11", 52.0, 2.8, 37.2, 88.0, 412, 8.2, 188, 59, 96.0, "normal"),
        ("11-09-2026 10:12", 57.0, 3.9, 36.5, 82.0, 410, 8.0, 190, 60, 96.0, "warning"),
        ("11-09-2026 10:13", 63.0, 5.6, 35.8, 74.0, 408, 7.8, 192, 61, 96.0, "critical"),
        ("11-09-2026 10:14", 69.2, 7.4, 35.1, 64.8, 405, 7.5, 195, 62, 96.0, "critical"),
    ]
    for row in degrade_steps:
        writer.writerow([
            row[0], "WT-006", "wind", row[1], row[2],
            row[3], row[4], row[5], row[6], row[7],
            "", "", row[8], row[9], row[10]
        ])

    # 4. Solar Inverter SP-002 (Heavy Panel Soiling Degradation)
    solar_soiled = [
        ("11-09-2026 10:11", 46.2, 0.38, 33.4, 76.2, 388, 850, 32.0, 38, 98.0, "warning"),
        ("11-09-2026 10:12", 47.8, 0.40, 31.8, 71.5, 382, 860, 38.5, 37, 98.0, "warning"),
    ]
    for row in solar_soiled:
        writer.writerow([
            row[0], "SP-002", "solar", row[1], row[2],
            row[3], row[4], row[5], "", "",
            row[6], row[7], row[8], row[9], row[10]
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=renewguard_15_column_telemetry.csv"}
    )

def _build_asset_diagnostics(asset: Asset, db: Session) -> Dict[str, Any]:
    total_unique = db.query(SensorReading).filter(SensorReading.asset_id == asset.id).count()
    ml_anoms = db.query(HealthPrediction).filter(
        HealthPrediction.asset_id == asset.id,
        HealthPrediction.is_ml_anomaly == True
    ).count()

    latest_pred = db.query(HealthPrediction).filter(
        HealthPrediction.asset_id == asset.id
    ).order_by(desc(HealthPrediction.timestamp)).first()

    lr = db.query(SensorReading).filter(SensorReading.asset_id == asset.id).order_by(desc(SensorReading.timestamp)).first()
    obs_p = lr.power_output if lr else 0.0
    exp_p = lr.expected_power if (lr and lr.expected_power is not None and lr.expected_power > 0) else (asset.rated_capacity * 0.9)
    power_deficit = round(max(0.0, exp_p - obs_p), 2)

    h_score = latest_pred.health_score if latest_pred else 100.0
    r_level = latest_pred.risk_level if latest_pred else asset.status

    preds_for_asset = db.query(HealthPrediction).filter(
        HealthPrediction.asset_id == asset.id
    ).order_by(HealthPrediction.timestamp).all()

    consecutive_count = 0
    prev_ts = None
    for p in reversed(preds_for_asset):
        is_anom = bool(p.is_ml_anomaly) or p.risk_level in ["CRITICAL", "HIGH RISK", "HIGH_RISK"]
        if not is_anom:
            break
        if prev_ts is not None:
            gap_seconds = (prev_ts - p.timestamp).total_seconds()
            if gap_seconds > 45 * 60 or gap_seconds < 0:
                break
        prev_ts = p.timestamp
        consecutive_count += 1

    if consecutive_count > 1:
        first_ts = preds_for_asset[-consecutive_count].timestamp
        last_ts = preds_for_asset[-1].timestamp
        persistence_hours = round(max(0.1, (last_ts - first_ts).total_seconds() / 3600.0), 1)
    elif consecutive_count == 1:
        persistence_hours = 0.2
    else:
        persistence_hours = 0.0

    sensor_devs = 0
    oper_devs = 0
    if latest_pred and latest_pred.explanation:
        for ev in latest_pred.explanation:
            cat = ev.get("category")
            if cat == "SENSOR_DEVIATION":
                sensor_devs += 1
            elif cat == "OPERATIONAL_DEGRADATION":
                oper_devs += 1

    features_for_breakdown = {
        "power_output": obs_p,
        "expected_power": exp_p,
        "power_drop_pct": max(0.0, (exp_p - obs_p) / max(exp_p, 1.0) * 100.0)
    }
    anom_res = {
        "anomaly_score": latest_pred.anomaly_score if latest_pred else 0.0,
        "is_ml_anomaly": latest_pred.is_ml_anomaly if latest_pred else False
    }
    h_breakdown = health_service.calculate_health_breakdown(features_for_breakdown, anom_res)
    r_breakdown = {
        "risk_level": r_level,
        "health_score": h_score,
        "ml_anomalies": ml_anoms,
        "sensor_deviations": sensor_devs,
        "operational_deviations": oper_devs
    }

    return {
        "asset_id": asset.id,
        "asset_code": asset.asset_code,
        "total_unique_readings": total_unique,
        "new_readings": 0,
        "duplicate_readings": 0,
        "ml_anomaly_count": ml_anoms,
        "sensor_deviation_count": sensor_devs,
        "operational_deviation_count": oper_devs,
        "anomaly_rate": round(ml_anoms / max(total_unique, 1), 4),
        "health_score": h_score,
        "risk_level": r_level,
        "persistence_duration": f"{persistence_hours:.1f}h",
        "expected_power": round(exp_p, 2),
        "observed_power": round(obs_p, 2),
        "power_deficit": power_deficit,
        "health_score_breakdown": h_breakdown,
        "risk_score_breakdown": r_breakdown
    }

# --- Diagnostic / Debug Endpoints (Section 17) ---
@router.get("/assets/{asset_identifier}/diagnostics", response_model=AssetDiagnosticsOut)
def get_asset_diagnostics(asset_identifier: str, db: Session = Depends(get_db)):
    if asset_identifier.isdigit():
        asset = db.query(Asset).filter(Asset.id == int(asset_identifier)).first()
    else:
        asset = db.query(Asset).filter(Asset.asset_code == asset_identifier).first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_identifier}' not found")
    return _build_asset_diagnostics(asset, db)

@router.get("/diagnostics/fleet", response_model=List[AssetDiagnosticsOut])
def get_fleet_diagnostics(
    scope: Optional[str] = Query("all"),
    db: Session = Depends(get_db)
):
    all_assets = db.query(Asset).all()
    if scope == "reporting" and LAST_CSV_UPLOADED_ASSET_CODES:
        assets = [a for a in all_assets if a.asset_code in LAST_CSV_UPLOADED_ASSET_CODES]
    else:
        assets = all_assets
    return [_build_asset_diagnostics(a, db) for a in assets]


# --- Super Admin Management ---

@router.get("/admin/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.patch("/admin/users/{user_id}/role", response_model=UserOut)
def update_user_role(user_id: int, role_update: UserUpdateRole, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role_update.role not in ["operator", "technician", "superadmin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/admin/web-data", response_model=WebDataSummaryOut)
def get_web_data_summary(db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "total_sites": db.query(Site).count(),
        "total_assets": db.query(Asset).count(),
        "total_sensor_readings": db.query(SensorReading).count(),
        "total_health_predictions": db.query(HealthPrediction).count(),
        "total_alerts": db.query(Alert).count(),
        "total_maintenance_tasks": db.query(MaintenanceTask).count()
    }

@router.post("/admin/purge-data")
def purge_old_data(db: Session = Depends(get_db)):
    # Delete telemetry data older than 30 days
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    readings_deleted = db.query(SensorReading).filter(SensorReading.timestamp < thirty_days_ago).delete()
    predictions_deleted = db.query(HealthPrediction).filter(HealthPrediction.timestamp < thirty_days_ago).delete()
    db.commit()
    return {
        "message": "Data purged successfully",
        "readings_deleted": readings_deleted,
        "predictions_deleted": predictions_deleted
    }
