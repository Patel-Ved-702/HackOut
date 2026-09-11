import io
import time
import random
import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models import Asset, SensorReading, HealthPrediction, Alert
from app.services.anomaly_service import anomaly_service
from app.services.health_service import health_service

client = TestClient(app)

def make_unique_ts(offset_minutes=0):
    base_epoch = time.time() + random.randint(20000000, 99999999)
    dt = datetime.datetime.fromtimestamp(base_epoch + offset_minutes * 60)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

# ==============================================================================
# TEST 1: Upload a new CSV -> records inserted correctly
# ==============================================================================
def test_case_1_upload_new_csv():
    t0 = make_unique_ts(0)
    t1 = make_unique_ts(5)
    t2 = make_unique_ts(10)

    csv_text = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-102,48.1,2.05,38.2,91.0,96.0\n"
        f"{t1},WT-102,48.3,2.08,38.0,90.8,96.0\n"
        f"{t2},WT-102,48.0,2.02,38.1,91.2,96.0\n"
    )

    files = {"file": ("test1_new_upload.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    response = client.post("/api/sensors/upload-csv", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["total_rows"] == 3
    assert data["valid_rows"] == 3
    assert data["newly_ingested"] == 3
    assert data["duplicates_skipped"] == 0
    assert data["anomalies_in_upload"] == 0

    wt102 = next((a for a in data["assets_analyzed"] if a["asset_code"] == "WT-102"), None)
    assert wt102 is not None
    assert wt102["batch_anomaly_count"] == 0
    assert wt102["latest_risk_level"] == "HEALTHY"
    assert wt102["latest_health_score"] >= 90.0

# ==============================================================================
# TEST 2: Upload the exact same CSV again -> zero new records
# ==============================================================================
def test_case_2_reupload_same_csv_idempotency():
    t0 = make_unique_ts(0)
    t1 = make_unique_ts(5)

    csv_text = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-103,47.9,2.10,37.8,90.5,95.0\n"
        f"{t1},WT-103,48.1,2.12,38.0,90.2,95.0\n"
    )

    files1 = {"file": ("test2_batch.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    res1 = client.post("/api/sensors/upload-csv", files=files1)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["newly_ingested"] == 2
    assert data1["duplicates_skipped"] == 0

    files2 = {"file": ("test2_batch.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    res2 = client.post("/api/sensors/upload-csv", files=files2)
    assert res2.status_code == 200
    data2 = res2.json()

    assert data2["total_rows"] == 2
    assert data2["newly_ingested"] == 0
    assert data2["duplicates_skipped"] == 2
    assert data2["anomalies_in_upload"] == 0
    assert "safely deduplicated" in data2["duplicates_note"]

# ==============================================================================
# TEST 3: Upload CSV containing 50 rows where 10 are duplicates -> exactly 40 new records
# ==============================================================================
def test_case_3_partial_duplicate_upload():
    pre_ts = [make_unique_ts(i * 2) for i in range(10)]
    pre_csv = "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
    for ts in pre_ts:
        pre_csv += f"{ts},WT-104,48.5,2.15,38.0,91.0,96.0\n"

    res_pre = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("pre_batch.csv", io.BytesIO(pre_csv.encode("utf-8")), "text/csv")}
    )
    assert res_pre.status_code == 200
    assert res_pre.json()["newly_ingested"] == 10

    batch_50_csv = "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
    for ts in pre_ts:
        batch_50_csv += f"{ts},WT-104,48.5,2.15,38.0,91.0,96.0\n"
    for i in range(40):
        new_ts = make_unique_ts(50 + i * 2)
        batch_50_csv += f"{new_ts},WT-104,48.6,2.18,38.1,90.8,96.0\n"

    res_50 = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("fifty_row_batch.csv", io.BytesIO(batch_50_csv.encode("utf-8")), "text/csv")}
    )
    assert res_50.status_code == 200
    data_50 = res_50.json()

    assert data_50["total_rows"] == 50
    assert data_50["newly_ingested"] == 40
    assert data_50["duplicates_skipped"] == 10

# ==============================================================================
# TEST 4: Zero ML anomalies but power deficit -> distinguish operational deviation
# ==============================================================================
def test_case_4_distinguish_operational_deviation_from_ml_anomaly():
    t0 = make_unique_ts(0)
    t1 = make_unique_ts(5)

    csv_text = (
        "timestamp,asset_id,asset_type,temperature,vibration,current,power_output,expected_power,panel_soiling\n"
        f"{t0},SP-203,solar_inverter,38.0,0.78,27.0,88.0,96.0,8.5\n"
        f"{t1},SP-203,solar_inverter,38.1,0.79,27.1,87.5,96.0,8.8\n"
    )

    res = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("soiled_solar.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()

    sp203 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "SP-203")
    assert sp203["ml_anomaly_count"] == 0
    assert sp203["batch_anomaly_count"] == 0
    assert sp203["has_operational_deviations"] is True
    assert sp203["baseline_label"] == "SCADA Theoretical Expected Power"

    ev_categories = [e.get("category") for e in (sp203.get("top_evidence") or [])]
    assert "ML_ANOMALY" not in ev_categories
    assert "OPERATIONAL_DEGRADATION" in ev_categories

# ==============================================================================
# TEST 5: Persistent vibration + power deficit + ML anomalies -> risk increases appropriately
# ==============================================================================
def test_case_5_persistent_vibration_power_deficit_ml_anomaly():
    t0 = make_unique_ts(0)
    t1 = make_unique_ts(5)
    t2 = make_unique_ts(10)

    csv_text = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-105,68.0,7.2,38.0,60.0,96.0\n"
        f"{t1},WT-105,69.5,7.5,38.2,58.0,96.0\n"
        f"{t2},WT-105,71.0,7.8,38.5,56.0,96.0\n"
    )

    res = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("severe_wt105.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()

    wt105 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-105")
    assert wt105["latest_risk_level"] == "CRITICAL"
    assert wt105["latest_health_score"] < 40.0
    assert wt105["batch_anomaly_count"] >= 2
    assert wt105["ml_anomaly_count"] >= 2

    diag = wt105.get("diagnostics")
    assert diag is not None
    h_breakdown = diag["health_score_breakdown"]
    assert h_breakdown["vibration_penalty"] < 0
    assert h_breakdown["power_deficit_penalty"] < 0
    assert h_breakdown["ml_anomaly_penalty"] < 0

# ==============================================================================
# TEST 6: Single noisy sensor reading must not automatically create CRITICAL risk
# ==============================================================================
def test_case_6_single_noisy_reading_persistence_check():
    t0 = make_unique_ts(0)
    t1 = make_unique_ts(5)
    t_spike = make_unique_ts(10)

    csv_text = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-101,48.0,2.1,38.0,92.0,96.0\n"
        f"{t1},WT-101,48.2,2.0,38.1,91.8,96.0\n"
        f"{t_spike},WT-101,49.0,4.8,38.0,88.0,96.0\n"
    )

    res = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("noisy_spike.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()

    wt101 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-101")
    assert wt101["latest_risk_level"] != "CRITICAL"
    assert wt101["latest_health_score"] >= 60.0

# ==============================================================================
# TEST 7: Same input data must produce the same Isolation Forest result across repeated analysis
# ==============================================================================
def test_case_7_isolation_forest_determinism():
    features = {
        "temperature": 62.5,
        "vibration": 5.4,
        "current": 39.0,
        "power_output": 65.0,
        "temp_delta": 10.5,
        "vibration_delta": 3.2,
        "power_drop_pct": 32.0,
        "baseline_label": "SCADA Theoretical Expected Power"
    }

    results = [anomaly_service.predict_anomaly(features) for _ in range(15)]

    first_score = results[0]["anomaly_score"]
    first_flag = results[0]["is_ml_anomaly"]
    first_model = results[0]["model_used"]

    for r in results[1:]:
        assert r["anomaly_score"] == first_score
        assert r["is_ml_anomaly"] == first_flag
        assert r["model_used"] == first_model

# ==============================================================================
# TEST 8: Historical anomaly count must not increase after duplicate upload
# ==============================================================================
def test_case_8_historical_anomaly_count_invariant():
    t0 = make_unique_ts(0)
    t1 = make_unique_ts(5)

    csv_text = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-106,68.0,7.1,38.5,61.0,96.0\n"
        f"{t1},WT-106,68.5,7.3,38.8,60.0,96.0\n"
    )

    res1 = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("hist_test.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    wt106_first = next(a for a in data1["assets_analyzed"] if a["asset_code"] == "WT-106")
    hist_count_before = wt106_first["historical_anomaly_count"]
    assert hist_count_before >= 2

    res2 = client.post(
        "/api/sensors/upload-csv",
        files={"file": ("hist_test.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    wt106_second = next(a for a in data2["assets_analyzed"] if a["asset_code"] == "WT-106")
    hist_count_after = wt106_second["historical_anomaly_count"]

    assert hist_count_after == hist_count_before
    assert wt106_second["batch_anomaly_count"] == 0

# ==============================================================================
# SECTION 17: Diagnostic / Debug Endpoints Test
# ==============================================================================
def test_section_17_diagnostics_endpoints():
    res = client.get("/api/assets/WT-101/diagnostics")
    assert res.status_code == 200
    diag = res.json()

    required_fields = [
        "asset_id",
        "total_unique_readings",
        "new_readings",
        "duplicate_readings",
        "ml_anomaly_count",
        "sensor_deviation_count",
        "operational_deviation_count",
        "anomaly_rate",
        "health_score",
        "risk_level",
        "persistence_duration",
        "expected_power",
        "observed_power",
        "power_deficit",
        "health_score_breakdown",
        "risk_score_breakdown"
    ]
    for field in required_fields:
        assert field in diag, f"Field '{field}' missing from asset diagnostics response"

    res_fleet = client.get("/api/diagnostics/fleet")
    assert res_fleet.status_code == 200
    fleet_data = res_fleet.json()
    assert isinstance(fleet_data, list)
    assert len(fleet_data) > 0
    assert "asset_code" in fleet_data[0]
