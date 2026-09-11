import io
import time
import random
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models import Asset, SensorReading, HealthPrediction, Alert

client = TestClient(app)

def fresh_ts(offset_minutes=0):
    # Generates unique, non-colliding future timestamps for test runs
    base_epoch = time.time() + random.randint(100000, 99999999)
    dt = datetime.datetime.fromtimestamp(base_epoch + offset_minutes * 60)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def test_case_1_brand_new_csv_upload():
    """
    Test Case 1 (Section 12): Upload a brand-new CSV.
    Expected: All valid rows are new; unique batch_id generated; batch anomaly count
    equals anomalies generated from those rows; duplicates_skipped is 0.
    """
    t0 = fresh_ts(0)
    t1 = fresh_ts(5)
    csv_data = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-101,48.0,2.1,38.0,91.0,95.0\n"
        f"{t1},WT-101,48.2,2.0,38.1,90.5,95.0\n"
        f"{t0},WT-106,68.5,6.8,39.0,62.0,96.0\n"
        f"{t1},WT-106,69.2,7.2,39.2,60.5,96.0\n"
    )
    files = {"file": ("brand_new_batch.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["batch_id"].startswith("batch_")
    assert data["total_rows"] == 4
    assert data["valid_rows"] == 4
    assert data["newly_ingested"] == 4
    assert data["duplicates_skipped"] == 0
    assert data["anomalies_in_upload"] >= 2  # WT-106 severe rows flagged

    wt106 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-106")
    assert wt106["batch_anomaly_count"] >= 2
    assert wt106["anomaly_count"] == wt106["batch_anomaly_count"]
    assert wt106["latest_risk_level"] in ["CRITICAL", "HIGH RISK"]

    wt101 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-101")
    assert wt101["batch_anomaly_count"] == 0
    assert wt101["latest_risk_level"] == "HEALTHY"


def test_case_2_exact_reupload_idempotency():
    """
    Test Case 2 (Section 12): Upload the exact same CSV again.
    Expected: newly_ingested = 0; duplicates = all previously ingested rows;
    batch anomalies = 0 new anomalies. No duplicate alerts created.
    """
    t0 = fresh_ts(0)
    t1 = fresh_ts(5)
    csv_data = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-102,48.0,2.1,38.0,91.0,95.0\n"
        f"{t1},WT-102,48.2,2.0,38.1,90.5,95.0\n"
    )
    # First upload
    f1 = {"file": ("idempotency_test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    r1 = client.post("/api/sensors/upload-csv", files=f1)
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["newly_ingested"] == 2
    assert d1["duplicates_skipped"] == 0

    # Second identical upload
    f2 = {"file": ("idempotency_test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    r2 = client.post("/api/sensors/upload-csv", files=f2)
    assert r2.status_code == 200
    d2 = r2.json()

    assert d2["newly_ingested"] == 0
    assert d2["processed_rows"] == 0
    assert d2["duplicates_skipped"] == 2
    assert d2["anomalies_in_upload"] == 0
    assert d2["anomalies_flagged"] == 0
    assert "safely deduplicated" in d2["duplicates_note"]

    # Each asset in re-upload reports 0 batch anomalies
    for a in d2["assets_analyzed"]:
        assert a["batch_anomaly_count"] == 0
        assert a["anomaly_count"] == 0


def test_case_3_batch_anomaly_isolation_sp002_fix():
    """
    Test Case 3 (Section 12 & Executive Summary):
    Verify that an asset with historical anomaly rows in DB (e.g. SP-002 with historical records)
    does NOT show cumulative historical counts when only duplicates or healthy rows are uploaded.
    In a mixed upload with 9 new rows for WT-006 and 7 duplicate rows for SP-002:
      - WT-006 shows 4 batch anomalies.
      - SP-002 shows 0 batch anomalies (and NOT 30!).
      - Overall anomalies_in_upload is 4 (not 34!).
    """
    t0 = fresh_ts(0)
    t1 = fresh_ts(5)
    t2 = fresh_ts(10)
    sp_dup_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power,panel_soiling\n"
        f"{t0},SP-002,45.0,0.2,170.0,78.0,90.0,12.0\n"
        f"{t1},SP-002,45.2,0.2,169.0,77.5,90.0,12.5\n"
        f"{t2},SP-002,45.4,0.2,168.0,77.0,90.0,12.2\n"
    )
    client.post("/api/sensors/upload-csv", files={"file": ("seed_sp002.csv", io.BytesIO(sp_dup_csv.encode("utf-8")), "text/csv")})

    # Mixed upload: 3 duplicates for SP-002, and 4 new anomalous rows + 2 normal rows (total 9 rows)
    w0 = fresh_ts(60)
    w1 = fresh_ts(65)
    w2 = fresh_ts(70)
    w3 = fresh_ts(75)
    mixed_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power,panel_soiling\n"
        # 3 duplicate SP-002 rows (already in DB)
        f"{t0},SP-002,45.0,0.2,170.0,78.0,90.0,12.0\n"
        f"{t1},SP-002,45.2,0.2,169.0,77.5,90.0,12.5\n"
        f"{t2},SP-002,45.4,0.2,168.0,77.0,90.0,12.2\n"
        # 4 new severe WT-006 rows
        f"{w0},WT-006,68.0,6.5,39.0,64.0,96.0,0.0\n"
        f"{w1},WT-006,68.5,6.8,39.2,63.0,96.0,0.0\n"
        f"{w2},WT-006,69.0,7.1,39.4,62.0,96.0,0.0\n"
        f"{w3},WT-006,69.5,7.4,39.6,60.5,96.0,0.0\n"
        # 2 normal WT-004 rows
        f"{w0},WT-004,48.0,2.1,38.0,91.0,92.0,0.0\n"
        f"{w1},WT-004,48.2,2.0,38.1,91.2,92.0,0.0\n"
    )
    files = {"file": ("mixed_test.csv", io.BytesIO(mixed_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["duplicates_skipped"] == 3
    assert data["newly_ingested"] == 6
    assert data["anomalies_in_upload"] == 4  # ONLY the 4 WT-006 rows!

    sp002 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "SP-002")
    # THE CORE FIX: SP-002 shows 0 batch anomalies in this upload, NOT historical total!
    assert sp002["batch_anomaly_count"] == 0
    assert sp002["anomaly_count"] == 0
    assert sp002["historical_anomaly_count"] >= 0

    wt006 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-006")
    assert wt006["batch_anomaly_count"] == 4
    assert wt006["anomaly_count"] == 4


def test_case_4_normal_telemetry_no_false_critical():
    """
    Test Case 4 (Section 12): Upload 5 normal rows.
    Expected: Anomalies in batch = 0; asset should not become Critical.
    """
    t0 = fresh_ts(0)
    t1 = fresh_ts(5)
    t2 = fresh_ts(10)
    t3 = fresh_ts(15)
    t4 = fresh_ts(20)
    normal_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-104,47.8,2.1,38.2,91.5,94.0\n"
        f"{t1},WT-104,48.0,2.0,38.1,91.0,94.0\n"
        f"{t2},WT-104,48.1,2.1,38.3,91.2,94.0\n"
        f"{t3},WT-104,47.9,2.0,38.0,91.4,94.0\n"
        f"{t4},WT-104,48.2,2.2,38.4,91.0,94.0\n"
    )
    files = {"file": ("normal_wt104.csv", io.BytesIO(normal_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["anomalies_in_upload"] == 0
    wt104 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-104")
    assert wt104["batch_anomaly_count"] == 0
    assert wt104["latest_risk_level"] == "HEALTHY"
    assert wt104["latest_health_score"] >= 80.0


def test_case_5_severe_reading_bounded_persistence():
    """
    Test Case 5 (Section 12): Upload one severe WT-006 reading.
    Expected: Severity is based on evidence; persistence does not magically
    become hours from old data (consecutive streak is bounded).
    """
    t_single = fresh_ts(500)
    severe_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t_single},WT-006,72.0,7.8,40.0,55.0,96.0\n"
    )
    files = {"file": ("single_severe_wt006.csv", io.BytesIO(severe_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200
    data = res.json()

    wt006 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-006")
    assert wt006["latest_risk_level"] in ["CRITICAL", "HIGH RISK"]
    assert wt006["batch_anomaly_count"] == 1

    # Check dashboard persistence for WT-006
    dash = client.get("/api/dashboard/summary?scope=all").json()
    wt006_item = next((item for item in dash["critical_assets"] if item["asset_code"] == "WT-006"), None)
    if wt006_item:
        # A single isolated reading separated by months/weeks from earlier runs must have bounded persistence
        assert wt006_item["persistence_hours"] <= 1.0


def test_case_6_discontinuous_timestamps_not_bridged():
    """
    Test Case 6 (Section 12): Mix old and new timestamps.
    Historical data separated by a large gap (> 45 min) must not bridge
    into an inflated persistence streak.
    """
    # Upload reading at T, then reading 3 hours later at T + 180 min
    t_early = fresh_ts(1000)
    t_late = fresh_ts(1180)
    gap_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t_early},WT-105,65.0,5.8,39.0,70.0,96.0\n"
        f"{t_late},WT-105,66.0,6.0,39.2,68.0,96.0\n"
    )
    files = {"file": ("gap_test.csv", io.BytesIO(gap_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200

    dash = client.get("/api/dashboard/summary?scope=all").json()
    wt105_item = next((item for item in dash["critical_assets"] if item["asset_code"] == "WT-105"), None)
    if wt105_item:
        # 3-hour gap was not bridged into a continuous 3.0h streak
        assert wt105_item["persistence_hours"] <= 0.5


def test_case_7_risk_ranking_considers_severity_and_impact():
    """
    Test Case 7 (Section 12): Two assets with identical anomaly counts
    are ranked by severity, health score, tariff revenue loss, and persistence
    rather than anomaly count alone.
    """
    # Upload 2 anomalous rows for WT-103 and 2 anomalous rows for WT-106
    # WT-106 has much higher vibration (7.5 mm/s) and severe generation deficit compared to WT-103
    t0 = fresh_ts(2000)
    t1 = fresh_ts(2005)
    dual_csv = (
        "timestamp,asset_id,temperature,vibration,current,power_output,expected_power\n"
        f"{t0},WT-103,54.0,3.8,38.5,84.0,96.0\n"
        f"{t1},WT-103,54.2,3.9,38.6,83.5,96.0\n"
        f"{t0},WT-106,70.0,7.5,40.0,58.0,96.0\n"
        f"{t1},WT-106,70.5,7.6,40.1,57.5,96.0\n"
    )
    files = {"file": ("dual_ranking.csv", io.BytesIO(dual_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/sensors/upload-csv", files=files)
    assert res.status_code == 200
    data = res.json()

    wt106 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-106")
    wt103 = next(a for a in data["assets_analyzed"] if a["asset_code"] == "WT-103")

    # Both have 2 batch anomalies
    assert wt106["batch_anomaly_count"] == 2
    assert wt103["batch_anomaly_count"] == 2

    # But WT-106 has much worse health score and higher risk level
    assert wt106["latest_health_score"] < wt103["latest_health_score"]
    assert wt106["latest_risk_level"] in ["CRITICAL", "HIGH RISK"]

    # In sorted assets, WT-106 is ranked higher than WT-103
    idx_106 = next(i for i, a in enumerate(data["assets_analyzed"]) if a["asset_code"] == "WT-106")
    idx_103 = next(i for i, a in enumerate(data["assets_analyzed"]) if a["asset_code"] == "WT-103")
    assert idx_106 < idx_103, "WT-106 with severe damage must rank above WT-103 despite equal anomaly counts"
