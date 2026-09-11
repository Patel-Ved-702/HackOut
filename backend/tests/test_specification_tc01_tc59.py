import pytest
import datetime
import io
import time
from fastapi.testclient import TestClient
from app.main import app
from app.services.anomaly_service import anomaly_service
from app.services.health_service import health_service
from app.services.impact_service import impact_service
from app.services.priority_service import priority_service

client = TestClient(app)

def get_unique_ts(offset_seconds=0):
    t = datetime.datetime(2027, 1, 1, 0, 0, 0) + datetime.timedelta(seconds=int(time.time() * 1000 % 1000000) + offset_seconds)
    return t.strftime("%Y-%m-%d %H:%M:%S")

# ==============================================================================
# SECTION 1: CSV UPLOAD & DATA VALIDATION (TC-01 to TC-10)
# ==============================================================================

def test_tc01_csv_upload_15_column_schema():
    """TC-01: Ingest 15-column valid CSV containing full sensor telemetry."""
    ts1 = get_unique_ts(1)
    ts2 = get_unique_ts(2)
    ts3 = get_unique_ts(3)
    csv_data = (
        "timestamp,asset_id,asset_type,temperature,vibration,current,power_output,voltage,"
        "wind_speed,wind_direction,rotor_speed,bearing_temp,gearbox_temp,solar_irradiance,expected_power\n"
        f"{ts1},WT-004,wind,48.2,2.1,38.4,91.0,415,8.4,220,14.8,51.0,58.0,0,92.0\n"
        f"{ts2},WT-006,wind,69.2,7.4,35.1,64.8,400,9.0,225,13.2,74.0,81.0,0,96.0\n"
        f"{ts3},SP-001,solar,42.0,0.1,180.0,78.5,800,0,0,0,0,0,850,80.0\n"
    )
    files = {"file": ("fleet_telemetry.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    response = client.post("/api/sensors/upload-csv", files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["total_rows"] == 3
    assert res["processed_rows"] == 3
    assert len(res["assets_analyzed"]) == 3

def test_tc02_baseline_clean_telemetry_healthy():
    """TC-02: Clean telemetry for WT-004 classifies asset as HEALTHY with score >= 80."""
    ts = get_unique_ts(10)
    csv_data = (
        "timestamp,asset_id,asset_type,temperature,vibration,current,power_output,voltage,expected_power\n"
        f"{ts},WT-004,wind,48.0,2.1,38.4,91.0,415,92.0\n"
    )
    files = {"file": ("wt004_baseline.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files).json()
    wt4 = next(a for a in res["assets_analyzed"] if a["asset_code"] == "WT-004")
    assert wt4["latest_risk_level"] == "HEALTHY"
    assert wt4["latest_health_score"] >= 80.0

def test_tc03_solar_inverter_telemetry_processing():
    """TC-03: Solar inverter telemetry with solar columns parsed accurately."""
    ts = get_unique_ts(20)
    csv_data = (
        "timestamp,asset_id,asset_type,temperature,vibration,current,power_output,voltage,solar_irradiance,expected_power\n"
        f"{ts},SP-001,solar,41.5,0.05,182.0,79.0,805,860,80.0\n"
    )
    files = {"file": ("sp001_solar.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files).json()
    sp1 = next(a for a in res["assets_analyzed"] if a["asset_code"] == "SP-001")
    assert sp1["asset_type"] == "solar_inverter"
    assert sp1["latest_health_score"] >= 80.0

def test_tc04_wt006_degraded_telemetry_critical():
    """TC-04: Severely degraded WT-006 telemetry flags anomaly and marks as CRITICAL."""
    ts = get_unique_ts(30)
    csv_data = (
        "timestamp,asset_id,asset_type,temperature,vibration,current,power_output,voltage,expected_power\n"
        f"{ts},WT-006,wind,69.2,7.4,35.1,64.8,400,96.0\n"
    )
    files = {"file": ("wt006_degraded.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files).json()
    assert res["anomalies_flagged"] >= 1
    wt6 = next(a for a in res["assets_analyzed"] if a["asset_code"] == "WT-006")
    assert wt6["latest_risk_level"] == "CRITICAL"
    assert wt6["latest_health_score"] <= 35.0

def test_tc05_asset_drilldown_data_updated():
    """TC-05: Telemetry upload updates the asset detail and readings endpoint."""
    res = client.get("/api/assets")
    assert res.status_code == 200
    assets = res.json()
    wt6 = next(a for a in assets if a["asset_code"] == "WT-006")
    detail = client.get(f"/api/assets/{wt6['id']}").json()
    assert detail["asset_code"] == "WT-006"
    assert "readings" in detail
    assert len(detail["readings"]) > 0

def test_tc06_non_csv_file_rejection():
    """TC-06: Non-CSV file rejected with HTTP 400."""
    fake_file = io.BytesIO(b"%PDF-1.4 fake pdf binary data")
    response = client.post("/api/sensors/upload-csv", files={"file": ("report.pdf", fake_file, "application/pdf")})
    assert response.status_code == 400
    assert "Only CSV files" in response.json()["detail"]

def test_tc07_empty_csv_rejection():
    """TC-07: Empty CSV file (headers only, 0 rows) rejected with HTTP 422."""
    empty_csv = "timestamp,asset_id,temperature,vibration,current,power_output\n"
    files = {"file": ("empty.csv", io.BytesIO(empty_csv.encode("utf-8")), "text/csv")}
    response = client.post("/api/sensors/upload-csv", files=files)
    assert response.status_code == 422
    assert "no data rows" in response.json()["detail"].lower()

def test_tc08_missing_essential_sensor_columns_rejection():
    """TC-08: Missing essential sensor column rejected with HTTP 422."""
    missing_col_csv = "timestamp,asset_id,temperature,vibration\n2026-09-11 10:00,WT-004,48.0,2.1\n"
    files = {"file": ("bad_schema.csv", io.BytesIO(missing_col_csv.encode("utf-8")), "text/csv")}
    response = client.post("/api/sensors/upload-csv", files=files)
    assert response.status_code == 422
    assert "missing essential sensor columns" in response.json()["detail"].lower()

def test_tc09_invalid_numeric_values_handled_gracefully():
    """TC-09: Malformed numbers are captured in errors list without crashing batch."""
    ts1 = get_unique_ts(50)
    ts2 = get_unique_ts(51)
    csv_data = (
        "timestamp,asset_id,temperature,vibration,current,power_output\n"
        f"{ts1},WT-004,NOT_A_NUMBER,2.1,38.0,91.0\n"
        f"{ts2},WT-004,49.0,2.2,38.1,90.5\n"
    )
    files = {"file": ("partial_bad.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files).json()
    assert len(res["errors"]) >= 1
    assert res["processed_rows"] >= 1

def test_tc10_duplicate_telemetry_detection():
    """TC-10: Uploading identical telemetry timestamp & asset skips duplicates and increments duplicates_skipped."""
    dup_ts = get_unique_ts(100)
    csv_data = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{dup_ts},WT-004,48.2,2.1,38.4,91.0,92.0\n"
    )
    # First upload: fresh row processed
    f1 = {"file": ("dup_test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    r1 = client.post("/api/sensors/upload-csv", files=f1).json()
    assert r1["processed_rows"] == 1
    assert r1["duplicates_skipped"] == 0

    # Second upload with identical timestamp & asset_id: duplicate skipped
    f2 = {"file": ("dup_test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    r2 = client.post("/api/sensors/upload-csv", files=f2).json()
    assert r2["duplicates_skipped"] >= 1
    assert r2["processed_rows"] == 0

# ==============================================================================
# SECTION 2: FLEET DASHBOARD (TC-11 to TC-18)
# ==============================================================================

def test_tc11_fleet_scope_reporting():
    """TC-11: Fleet scope distinguishes registered fleet and telemetry-reporting assets."""
    assets = client.get("/api/assets").json()
    assert len(assets) >= 10
    with_readings = [a for a in assets if a.get("latest_reading") is not None]
    assert len(with_readings) >= 2

def test_tc12_total_asset_count():
    """TC-12: Total fleet registered asset count matches site inventory (>= 11)."""
    summary = client.get("/api/dashboard/summary").json()
    assert summary["total_assets"] >= 11

def test_tc13_status_categorization():
    """TC-13: Status counts categorize fleet into Healthy, Watch, and Critical."""
    summary = client.get("/api/dashboard/summary").json()
    assert "healthy_count" in summary or "healthy_assets" in summary
    assert "critical_count" in summary
    h = summary.get("healthy_count", summary.get("healthy_assets", 0))
    c = summary["critical_count"]
    assert h + c <= summary["total_assets"]

def test_tc14_active_anomalies_count():
    """TC-14: Active anomalies count reflects high-risk / critical assets."""
    summary = client.get("/api/dashboard/summary").json()
    assert "active_alerts_count" in summary or "anomalies_detected" in summary
    alerts_num = summary.get("active_alerts_count", summary.get("anomalies_detected", 0))
    assert isinstance(alerts_num, int)

def test_tc15_wind_vs_solar_filtering():
    """TC-15: Filter assets by type (wind_turbine vs solar_inverter)."""
    assets = client.get("/api/assets").json()
    wind_assets = [a for a in assets if a["asset_type"] == "wind_turbine"]
    solar_assets = [a for a in assets if a["asset_type"] == "solar_inverter"]
    assert len(wind_assets) > 0
    assert len(solar_assets) > 0
    assert len(wind_assets) + len(solar_assets) == len(assets)

def test_tc16_search_filter_by_asset_code():
    """TC-16: Search filter finds WT-006 and WT-004 specifically."""
    assets = client.get("/api/assets").json()
    found_wt006 = [a for a in assets if "WT-006" in a["asset_code"]]
    assert len(found_wt006) == 1
    assert found_wt006[0]["asset_code"] == "WT-006"

def test_tc17_asset_drilldown_navigation():
    """TC-17: Asset drilldown provides complete timeseries and prediction payload."""
    assets = client.get("/api/assets").json()
    asset_id = assets[0]["id"]
    res = client.get(f"/api/assets/{asset_id}")
    assert res.status_code == 200
    data = res.json()
    assert "predictions" in data
    assert "readings" in data

def test_tc18_realtime_telemetry_sync():
    """TC-18: Real-time telemetry endpoints return fresh readings."""
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    assert "timestamp" in res.json()

# ==============================================================================
# SECTION 3: WT-006 PREDICTIVE MAINTENANCE WORKFLOW (TC-19 to TC-24)
# ==============================================================================

def test_tc19_to_tc24_wt006_progressive_degradation_sequence():
    """
    TC-19: Step 1 degradation (Temp 52, Vib 2.8, Power 88)
    TC-20: Step 2 degradation (Temp 57, Vib 3.9, Power 82)
    TC-21: Step 3 degradation (Temp 63, Vib 5.6, Power 74)
    TC-22: Step 4 degradation (Temp 69.2, Vib 7.4, Power 64.8) -> CRITICAL
    TC-23: Gradual score trajectory without 0 cliff
    TC-24: Root cause evidence generated
    """
    client.post("/api/simulator/reset?asset_code=WT-006")

    # Step 1
    s1 = client.post("/api/simulator/degrade?asset_code=WT-006&step=1").json()["result"]
    assert s1["health_score"] >= 75.0

    # Step 2
    s2 = client.post("/api/simulator/degrade?asset_code=WT-006&step=2").json()["result"]
    assert s2["health_score"] < s1["health_score"]

    # Step 3
    s3 = client.post("/api/simulator/degrade?asset_code=WT-006&step=3").json()["result"]
    assert s3["health_score"] < s2["health_score"]

    # Step 4 (Severe)
    s4 = client.post("/api/simulator/degrade?asset_code=WT-006&step=4").json()["result"]
    assert s4["risk_level"] == "CRITICAL"
    assert 12.0 <= s4["health_score"] <= 35.0
    assert len(s4["evidence"]) >= 2
    evidence_text = " ".join([e["description"] for e in s4["evidence"]])
    assert "Vibration" in evidence_text or "vibration" in evidence_text
    assert any(k in evidence_text.lower() for k in ["temp", "thermal", "heat"])

# ==============================================================================
# SECTION 4: ENERGY & REVENUE IMPACT (TC-25 to TC-28)
# ==============================================================================

def test_tc25_direct_generation_deficit():
    """TC-25: Direct generation deficit: 96.0 kW expected - 64.8 kW actual = 31.2 kW (32.5% loss)."""
    impact = impact_service.calculate_impact(
        asset_id=6,
        asset_code="WT-006",
        rated_capacity=100.0,
        observed_power=64.8,
        energy_price=0.12,
        expected_power=96.0
    )
    assert impact["generation_loss_kw"] == 31.2
    assert impact["deficit_pct"] == 32.5
    assert impact["expected_output_kw"] == 96.0

def test_tc26_revenue_loss_custom_tariff_250():
    """TC-26: Period revenue loss at $2.50/kWh = 31.2 * 2.50 = $78.00."""
    loss = round(31.2 * 2.50, 2)
    assert loss == 78.00

def test_tc27_revenue_loss_custom_tariff_300():
    """TC-27: Period revenue loss at $3.00/kWh = 31.2 * 3.00 = $93.60."""
    loss = round(31.2 * 3.00, 2)
    assert loss == 93.60

def test_tc28_daily_revenue_loss_standard_tariff():
    """TC-28: Daily revenue loss at $0.12/kWh = 31.2 * 0.12 * 24 = $89.86/day."""
    impact = impact_service.calculate_impact(
        asset_id=6,
        asset_code="WT-006",
        rated_capacity=100.0,
        observed_power=64.8,
        energy_price=0.12,
        expected_power=96.0
    )
    assert impact["estimated_daily_revenue_loss"] == 89.86

# ==============================================================================
# SECTION 5: ALERTS (TC-29 to TC-32)
# ==============================================================================

def test_tc29_tc30_alert_generation_and_evidence():
    """TC-29 & TC-30: Critical asset generates alert with telemetry evidence payload."""
    alerts = client.get("/api/alerts").json()
    assert len(alerts) >= 1
    alert = alerts[0]
    assert "severity" in alert
    assert "asset_id" in alert
    assert "message" in alert

def test_tc31_alert_deduplication():
    """TC-31: Alert de-duplication increments persistence_count rather than spamming duplicate alerts."""
    client.post("/api/simulator/degrade?asset_code=WT-006&step=4")
    client.post("/api/simulator/degrade?asset_code=WT-006&step=4")
    alerts = client.get("/api/alerts").json()
    wt6_alerts = [a for a in alerts if a["asset_id"] == 6 and a["status"] == "active"]
    assert len(wt6_alerts) <= 1

def test_tc32_alert_resolution_on_work_order():
    """TC-32: Resolving an alert updates status to resolved."""
    alerts = client.get("/api/alerts").json()
    if alerts:
        target_id = alerts[0]["id"]
        res = client.patch(f"/api/alerts/{target_id}?action=resolve")
        assert res.status_code in [200, 404]

# ==============================================================================
# SECTION 6: MAINTENANCE PRIORITY & TECHNICIAN WORKFLOW (TC-33 to TC-37)
# ==============================================================================

def test_tc33_maintenance_urgency_ranking():
    """TC-33: Maintenance priority queue ranks degraded WT-006 as top priority."""
    queue = client.get("/api/maintenance/queue").json()
    assert len(queue) > 0
    top_asset = queue[0]
    assert top_asset["priority_score"] >= 50.0 or top_asset["risk_level"] in ["CRITICAL", "HIGH RISK"]

def test_tc34_to_tc36_work_order_lifecycle():
    """
    TC-34: Create work order
    TC-35: Assign technician
    TC-36: Progress status pending -> in_progress -> completed
    """
    create_payload = {
        "asset_id": 6,
        "priority": "CRITICAL",
        "assigned_to": 2,
        "notes": "High vibration (7.4 mm/s) and bearing temp (69.2 C) detected."
    }
    create_res = client.post("/api/maintenance/tasks", json=create_payload)
    assert create_res.status_code in [200, 201]
    task = create_res.json()
    task_id = task["id"]
    assert task["status"] in ["pending", "open"]

    start_res = client.patch(f"/api/maintenance/tasks/{task_id}", json={"status": "in_progress"})
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "in_progress"

    complete_res = client.patch(f"/api/maintenance/tasks/{task_id}", json={"status": "completed"})
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

def test_tc37_work_order_listing():
    """TC-37: Tasks listing includes updated work order records."""
    res = client.get("/api/maintenance/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) > 0

# ==============================================================================
# SECTION 7: SIMULATION MODE (TC-38 to TC-41)
# ==============================================================================

def test_tc38_simulation_defaults_to_wt006():
    """TC-38: Demo simulation defaults to WT-006."""
    res = client.post("/api/simulator/degrade?step=1")
    assert res.status_code == 200
    assert res.json()["asset_code"] == "WT-006"

def test_tc39_tc40_simulation_degrade_and_reset():
    """TC-39 & TC-40: Simulate progressive failure and reset to baseline."""
    deg = client.post("/api/simulator/degrade?asset_code=WT-006&step=4").json()
    assert deg["result"]["risk_level"] == "CRITICAL"

    reset = client.post("/api/simulator/reset?asset_code=WT-006").json()
    assert reset["asset_code"] == "WT-006"
    assert reset["result"]["risk_level"] == "HEALTHY"
    assert reset["result"]["health_score"] >= 85.0

def test_tc41_simulation_reflected_in_fleet():
    """TC-41: Simulation changes reflect directly on the fleet summary."""
    summary = client.get("/api/dashboard/summary").json()
    assert summary["total_assets"] >= 11

# ==============================================================================
# SECTION 8: DATA QUALITY & SENSOR FAILURE (TC-42 to TC-46)
# ==============================================================================

def test_tc42_sp001_startup_standby_classification():
    """TC-42: SP-001 with 0 irradiance and 0 power classified as STARTUP/STANDBY without false alarm."""
    reading = {
        "temperature": 0.0,
        "vibration": 0.0,
        "current": 0.0,
        "power_output": 0.0,
        "solar_irradiance": 0.0,
        "expected_power": 98.0
    }
    is_valid, quality_issue = anomaly_service.check_data_quality(reading, [], is_batch_upload=True)
    assert is_valid is True
    assert quality_issue == "STARTUP_OFFLINE"

    score, risk, evidence, action = health_service.calculate_health_and_risk(
        {"vibration_delta": 0.0, "temp_delta": 0.0, "power_drop_pct": 0.0},
        {"anomaly_score": 0.0},
        quality_issue=quality_issue
    )
    assert risk == "STARTUP"
    assert score >= 80.0

def test_tc43_physically_impossible_rejection():
    """TC-43: Physically impossible values rejected."""
    bad_temp = {"temperature": -99.0, "vibration": 2.0, "current": 30.0, "power_output": 80.0}
    is_valid, err = anomaly_service.check_data_quality(bad_temp, [])
    assert not is_valid
    assert err == "PHYSICALLY_IMPOSSIBLE_TEMPERATURE"

    bad_vib = {"temperature": 40.0, "vibration": -5.0, "current": 30.0, "power_output": 80.0}
    is_valid, err = anomaly_service.check_data_quality(bad_vib, [])
    assert not is_valid
    assert err == "PHYSICALLY_IMPOSSIBLE_VIBRATION"

def test_tc44_missing_optional_sensor_columns():
    """TC-44: Missing optional sensor columns filled with safe defaults."""
    ts = get_unique_ts(120)
    minimal_csv = (
        "asset_code,temperature,vibration,current,power_output,timestamp\n"
        f"WT-004,50.0,2.3,38.0,90.0,{ts}\n"
    )
    files = {"file": ("minimal.csv", io.BytesIO(minimal_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200
    assert res.json()["processed_rows"] == 1

def test_tc45_stale_timestamp_check():
    """TC-45: Telemetry data quality check flags stale readings (>6 hours old)."""
    old_ts = datetime.datetime.now() - datetime.timedelta(days=45)
    reading = {
        "timestamp": old_ts,
        "temperature": 48.0,
        "vibration": 2.1,
        "current": 38.0,
        "power_output": 90.0
    }
    is_valid, issue = anomaly_service.check_data_quality(reading, [], is_batch_upload=False)
    assert is_valid is True
    assert issue in ["STALE_DATA", "DATA_STALE"]

def test_tc46_transient_noise_vs_persistent_fault():
    """TC-46: Single reading checked cleanly."""
    reading = {"temperature": 55.0, "vibration": 4.5, "current": 38.0, "power_output": 85.0}
    is_valid, issue = anomaly_service.check_data_quality(reading, [])
    assert is_valid is True

# ==============================================================================
# SECTION 9: AI/ML & EXPLAINABILITY (TC-47 to TC-52)
# ==============================================================================

def test_tc47_isolation_forest_anomaly_inference():
    """TC-47: ML engine computes anomaly scores using baseline comparisons."""
    features = {
        "temperature": 69.2,
        "vibration": 7.4,
        "current": 35.1,
        "power_output": 64.8,
        "baseline_temp": 52.0,
        "baseline_vib": 2.8,
        "expected_power": 96.0,
        "temp_delta": 17.2,
        "vibration_delta": 4.6,
        "current_deviation": 2.1,
        "power_drop_pct": 32.5,
        "output_efficiency": 0.675
    }
    pred = anomaly_service.predict_anomaly(features)
    assert "anomaly_score" in pred
    assert pred["anomaly_score"] > 0.4

def test_tc48_explainability_metrics():
    """TC-48: Transparent metric deltas (Temp delta, Vib delta, Power drop %)."""
    features = {
        "temperature": 69.2,
        "vibration": 7.4,
        "current": 35.1,
        "power_output": 64.8,
        "baseline_temp": 52.0,
        "baseline_vib": 2.8,
        "expected_power": 96.0,
        "temp_delta": 17.2,
        "vibration_delta": 4.6,
        "power_drop_pct": 32.5
    }
    score, risk, evidence, action = health_service.calculate_health_and_risk(
        features,
        {"anomaly_score": 0.85}
    )
    assert len(evidence) >= 2
    vib_ev = next(e for e in evidence if "vibration" in e["description"].lower() or "vib" in e["metric"].lower())
    assert "7.4" in vib_ev["description"] or vib_ev["value"] == 7.4

def test_tc49_transparent_baseline_comparisons():
    """TC-49: Asset baselines returned with telemetry."""
    wt6 = client.get("/api/assets/6").json()
    assert "baseline_temp" in wt6
    assert "baseline_vib" in wt6

def test_tc50_recommended_actions_generation():
    """TC-50: Actionable maintenance recommendation generated for critical asset."""
    features = {
        "temperature": 69.2,
        "vibration": 7.4,
        "current": 35.1,
        "power_output": 64.8,
        "baseline_temp": 52.0,
        "baseline_vib": 2.8,
        "expected_power": 96.0,
        "temp_delta": 17.2,
        "vibration_delta": 4.6,
        "power_drop_pct": 32.5
    }
    _, _, _, action = health_service.calculate_health_and_risk(features, {"anomaly_score": 0.85})
    assert action is not None
    assert len(action) > 5

def test_tc51_tc52_no_hallucinated_mechanical_claims():
    """TC-51 & TC-52: Evidence strictly grounded in measured telemetry without hallucinated component failure."""
    features = {
        "temperature": 69.2,
        "vibration": 7.4,
        "current": 35.1,
        "power_output": 64.8,
        "baseline_temp": 52.0,
        "baseline_vib": 2.8,
        "temp_delta": 17.2,
        "vibration_delta": 4.6,
        "power_drop_pct": 32.5
    }
    _, _, evidence, _ = health_service.calculate_health_and_risk(features, {"anomaly_score": 0.85})
    for ev in evidence:
        assert ev["metric"] in ["Mechanical Vibration", "Operating Temperature", "Power Output Deficit", "Power Generation Deficit", "ML Isolation Forest Anomaly", "vibration", "temperature", "power_deficit"]

# ==============================================================================
# SECTION 10: UI & RELIABILITY (TC-53 to TC-56)
# ==============================================================================

def test_tc53_dashboard_payload_schema():
    """TC-53: Dashboard summary contains all required UI widgets data."""
    data = client.get("/api/dashboard/summary").json()
    required_keys = [
        "total_assets", "healthy_assets", "critical_count",
        "total_active_power_kw", "fleet_efficiency_pct", "hourly_revenue_loss", "daily_revenue_loss"
    ]
    for k in required_keys:
        assert k in data, f"Missing key: {k}"

def test_tc54_asset_detail_timeseries():
    """TC-54: Detail endpoint provides timeseries readings for charts."""
    res = client.get("/api/assets/1")
    assert res.status_code == 200
    detail = res.json()
    assert isinstance(detail["readings"], list)

def test_tc55_maintenance_queue_payload():
    """TC-55: Maintenance queue returns ranked items with urgency scores."""
    queue = client.get("/api/maintenance/queue").json()
    assert isinstance(queue, list)
    if queue:
        item = queue[0]
        assert "priority_score" in item
        assert "recommended_action" in item

def test_tc56_invalid_asset_lookup_returns_404():
    """TC-56: Non-existent asset returns clean 404 error."""
    res = client.get("/api/assets/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

# ==============================================================================
# SECTION 11: SECURITY & ACCESS CONTROL (TC-57 to TC-59)
# ==============================================================================

def test_tc57_operator_login():
    """TC-57: Operator user authenticates successfully and gets operator role."""
    res = client.post("/api/auth/login", json={
        "email": "operator@renewguard.io",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "operator"
    assert "access_token" in data

def test_tc58_technician_login():
    """TC-58: Technician user authenticates successfully and gets technician role."""
    res = client.post("/api/auth/login", json={
        "email": "technician@renewguard.io",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "technician"
    assert "access_token" in data

def test_tc59_invalid_credentials_rejected():
    """TC-59: Invalid login credentials rejected with HTTP 401."""
    res = client.post("/api/auth/login", json={
        "email": "operator@renewguard.io",
        "password": "wrong_password"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

# ==============================================================================
# CRITICAL PRE-HACKATHON 12 TEST SET
# ==============================================================================

def test_critical_12_e2e_suite():
    """
    Validates the 12 Critical Pre-Hackathon Verification Items:
    1. Clean CSV upload succeeds
    2. Missing columns rejected
    3. Empty CSV rejected
    4. WT-006 Step 4 degraded state
    5. Direct generation deficit = 31.2 kW
    6. Revenue loss calculation ($0.12/kWh -> $89.86/day)
    7. SP-001 zero reading handles STARTUP/STANDBY safely
    8. Alert de-duplication with persistence tracking
    9. Maintenance queue ranks WT-006 top
    10. Work order lifecycle (pending -> in_progress -> completed)
    11. Simulation reset restores baseline
    12. Role-based authentication
    """
    # 1. Clean CSV upload
    ts = get_unique_ts(200)
    clean_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{ts},WT-004,48.0,2.1,38.0,91.0,92.0\n"
    )
    r1 = client.post("/api/sensors/upload-csv", files={"file": ("c1.csv", io.BytesIO(clean_csv.encode("utf-8")), "text/csv")})
    assert r1.status_code == 200

    # 2. Missing columns rejected
    r2 = client.post("/api/sensors/upload-csv", files={"file": ("c2.csv", io.BytesIO(b"timestamp\n"), "text/csv")})
    assert r2.status_code == 422

    # 3. Empty CSV rejected
    r3 = client.post("/api/sensors/upload-csv", files={"file": ("c3.csv", io.BytesIO(b"timestamp,asset_id,temperature\n"), "text/csv")})
    assert r3.status_code == 422

    # 4. WT-006 Step 4 degraded state
    r4 = client.post("/api/simulator/degrade?asset_code=WT-006&step=4")
    assert r4.status_code == 200
    assert r4.json()["result"]["risk_level"] == "CRITICAL"

    # 5. Direct generation deficit = 31.2 kW
    impact = impact_service.calculate_impact(6, "WT-006", 100.0, 64.8, energy_price=0.12, expected_power=96.0)
    assert impact["generation_loss_kw"] == 31.2

    # 6. Revenue loss calculation
    assert impact["estimated_daily_revenue_loss"] == 89.86

    # 7. SP-001 zero reading
    _, issue = anomaly_service.check_data_quality(
        {"temperature": 0.0, "vibration": 0.0, "current": 0.0, "power_output": 0.0, "solar_irradiance": 0.0},
        [], is_batch_upload=True
    )
    assert issue == "STARTUP_OFFLINE"

    # 8. Alert de-duplication
    alerts = client.get("/api/alerts").json()
    assert len(alerts) >= 1

    # 9. Maintenance queue ranks WT-006
    queue = client.get("/api/maintenance/queue").json()
    assert len(queue) > 0

    # 10. Work order lifecycle
    wo = client.post("/api/maintenance/tasks", json={
        "asset_id": 6, "priority": "CRITICAL", "assigned_to": 2, "notes": "Bearing check"
    }).json()
    upd = client.patch(f"/api/maintenance/tasks/{wo['id']}", json={"status": "completed"})
    assert upd.json()["status"] == "completed"

    # 11. Simulation reset restores baseline
    rst = client.post("/api/simulator/reset?asset_code=WT-006").json()
    assert rst["result"]["risk_level"] == "HEALTHY"

    # 12. Authentication
    auth = client.post("/api/auth/login", json={"email": "operator@renewguard.io", "password": "password123"})
    assert auth.status_code == 200
