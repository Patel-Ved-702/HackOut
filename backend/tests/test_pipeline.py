import pytest
import datetime
import io
from fastapi.testclient import TestClient
from app.main import app
from app.services.anomaly_service import anomaly_service
from app.services.health_service import health_service
from app.services.impact_service import impact_service
from app.services.priority_service import priority_service

client = TestClient(app)

def test_api_root():
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.json()
    assert "RenewGuard AI" in data["app"]

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "operator@renewguard.io",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "operator"

def test_auth_invalid():
    response = client.post("/api/auth/login", json={
        "email": "operator@renewguard.io",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_assets"] >= 10
    assert "critical_assets" in data

def test_assets_listing():
    response = client.get("/api/assets")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) >= 10
    wt4 = next(a for a in assets if a["asset_code"] == "WT-004")
    assert wt4["asset_type"] == "wind_turbine"

def test_economic_impact_calculation():
    # 100 kW turbine operating at 70 kW (30 kW loss) with $0.15/kWh tariff
    impact = impact_service.calculate_impact(1, "WT-001", 100.0, 70.0, energy_price=0.15, currency="$")
    assert impact["expected_output_kw"] == 92.0
    assert impact["generation_loss_kw"] == 22.0
    assert impact["estimated_hourly_revenue_loss"] == round(22.0 * 0.15, 2)
    assert impact["estimated_daily_revenue_loss"] == round(22.0 * 0.15 * 24, 2)

def test_data_quality_rejection():
    # Physically impossible or missing values should be rejected (Spec §14)
    bad_reading = {"temperature": -99.0, "vibration": 2.0, "current": 30.0, "power_output": 80.0}
    is_valid, err = anomaly_service.check_data_quality(bad_reading, [])
    assert not is_valid
    assert err == "PHYSICALLY_IMPOSSIBLE_TEMPERATURE"

def test_degradation_simulation_workflow():
    # 1. Check WT-004 initial state
    res_before = client.get("/api/assets")
    wt4_before = next(a for a in res_before.json() if a["asset_code"] == "WT-004")

    # 2. Trigger step 4 severe degradation
    deg_res = client.post("/api/simulator/degrade?asset_code=WT-004&step=4")
    assert deg_res.status_code == 200
    deg_data = deg_res.json()["result"]

    assert deg_data["risk_level"] in ["CRITICAL", "HIGH RISK"]
    assert deg_data["health_score"] < 50.0
    assert len(deg_data["evidence"]) >= 1

    # 3. Verify alert was generated
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert any(al["asset_id"] == wt4_before["id"] for al in alerts)

    # 4. Clean up WT-004 back to baseline
    reset_res = client.post("/api/simulator/reset?asset_code=WT-004")
    assert reset_res.status_code == 200

def test_sample_csv_download():
    response = client.get("/api/sensors/sample-csv")
    assert response.status_code == 200
    assert "temperature,vibration,current,power_output" in response.text
    assert "WT-004" in response.text

def test_csv_upload_pipeline():
    sample_csv = (
        "asset_code,temperature,vibration,current,power_output\n"
        "WT-004,68.5,7.1,35.2,65.0\n"
        "WT-001,48.0,2.1,38.0,91.0\n"
    )
    files = {"file": ("test_telemetry.csv", io.BytesIO(sample_csv.encode("utf-8")), "text/csv")}
    response = client.post("/api/sensors/upload-csv", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 2
    assert data["processed_rows"] == 2
    assert data["anomalies_flagged"] >= 1
    assert any(a["asset_code"] == "WT-004" for a in data["assets_analyzed"])

def test_generation_deficit_exact_telemetry():
    """
    Priority Fix #3:
    Direct deficit from telemetry expected_power (96.0) - power_output (64.8) = 31.2 kW.
    Estimated daily revenue loss at $0.12/kWh = 31.2 * 0.12 * 24 = $89.86/day.
    """
    from app.services.impact_service import impact_service
    res = impact_service.calculate_impact(
        asset_id=6,
        asset_code="WT-006",
        rated_capacity=100.0,
        observed_power=64.8,
        energy_price=0.12,
        expected_power=96.0
    )
    assert res["generation_loss_kw"] == 31.2
    assert res["deficit_pct"] == 32.5
    assert res["estimated_daily_revenue_loss"] == 89.86
    assert res["expected_output_kw"] == 96.0

def test_startup_offline_state_handling():
    """
    Priority Fix #4:
    SP-001 row 1 with zero current, zero power, and zero irradiance/temp
    must be classified as STARTUP/STANDBY without triggering false catastrophic failure alarms.
    """
    from app.services.anomaly_service import anomaly_service
    from app.services.health_service import health_service
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
    assert any("standby" in e["description"].lower() or "startup" in e["description"].lower() for e in evidence)

def test_gradual_health_scoring_no_zero_cliff():
    """
    Priority Fix #5:
    WT-006 at maximum degradation (Step 4: Temp 69.2°C, Vib 7.4 mm/s, Power 64.8 kW)
    must score in the Critical range (~15-25/100), rather than dropping to 0/100.
    """
    from app.services.health_service import health_service
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
    score, risk, evidence, action = health_service.calculate_health_and_risk(
        features,
        {"anomaly_score": 0.85}
    )
    assert risk == "CRITICAL"
    assert 12.0 <= score <= 30.0, f"Expected gradual score 12-30, got {score}"

def test_simulation_workflow_wt006_steps():
    """
    Priority Fix #1 & #5:
    Simulation defaults to WT-006 and progresses through all 4 steps gradually.
    """
    # Reset first
    r0 = client.post("/api/simulator/reset?asset_code=WT-006")
    assert r0.status_code == 200

    # Step 1: Normal/Notice
    r1 = client.post("/api/simulator/degrade?asset_code=WT-006&step=1")
    assert r1.status_code == 200
    res1 = r1.json()["result"]
    assert res1["health_score"] >= 75.0

    # Step 4: Critical with gradual score
    r4 = client.post("/api/simulator/degrade?asset_code=WT-006&step=4")
    assert r4.status_code == 200
    res4 = r4.json()["result"]
    assert res4["risk_level"] == "CRITICAL"
    assert 12.0 <= res4["health_score"] <= 35.0
