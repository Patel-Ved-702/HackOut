import io
import csv
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

with open("RenewGuard_Random_Test_Telemetry.csv", "rb") as f:
    content = f.read()

# First, inspect why 5 rows could be considered duplicate in the CSV itself:
with open("RenewGuard_Random_Test_Telemetry.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    seen_keys = set()
    dup_keys_in_csv = []
    for idx, row in enumerate(reader, start=1):
        key = (row["asset_id"], row["timestamp"])
        if key in seen_keys:
            dup_keys_in_csv.append((idx, key))
        else:
            seen_keys.add(key)

print(f"Total rows read from CSV file: {len(seen_keys) + len(dup_keys_in_csv)}")
print(f"Duplicate (asset_id, timestamp) in CSV file itself: {len(dup_keys_in_csv)}: {dup_keys_in_csv}")

response = client.post(
    "/api/sensors/upload-csv",
    files={"file": ("RenewGuard_Random_Test_Telemetry.csv", content, "text/csv")}
)

print(f"\nAPI Response Code: {response.status_code}")
data = response.json()
print("API Response Summary:")
print("  Total Rows:", data.get("total_rows"))
print("  Processed Rows:", data.get("processed_rows"))
print("  Duplicates Skipped:", data.get("duplicates_skipped"))
print("  Anomalies Flagged:", data.get("anomalies_flagged"))
print("  Errors:", data.get("errors"))
print(f"  Assets Analyzed ({len(data.get('assets_analyzed', []))} assets):")
for a in data.get("assets_analyzed", []):
    ev = a.get("top_evidence", [])
    ev_str = ev[0]["description"] if ev else "None"
    print(f"    * {a['asset_code']}: {a['latest_risk_level']} (Health: {a['latest_health_score']}) -> {ev_str}")

# Now inspect dashboard summary after upload:
dash = client.get("/api/dashboard/summary").json()
print("\nDashboard Summary After Upload:")
print(f"  Total Registered: {dash.get('total_registered_assets')}")
print(f"  Active Reporting: {dash.get('active_reporting_assets')} ({dash.get('reporting_asset_codes')})")
print(f"  Healthy: {dash.get('healthy_count')} | Watch: {dash.get('watch_count')} | High Risk: {dash.get('high_risk_count')} | Critical: {dash.get('critical_count')}")
print(f"  Critical Assets Ranked:")
for item in dash.get("critical_assets", []):
    print(f"    * #{item['rank']} {item['asset_code']} ({item['risk_level']}) - Priority: {item['priority_score']} - Loss: ${item['estimated_revenue_loss_daily']}/day")

# Impact of WT-006:
wt6_impact = client.get("/api/impact/6").json()
print("\nWT-006 Latest Impact:")
print(f"  Expected: {wt6_impact.get('expected_output_kw')} kW")
print(f"  Observed: {wt6_impact.get('observed_output_kw')} kW")
print(f"  Deficit: {wt6_impact.get('generation_loss_kw')} kW ({wt6_impact.get('deficit_pct')}%)")
print(f"  Daily Revenue Loss: ${wt6_impact.get('estimated_daily_revenue_loss')}/day (at ${wt6_impact.get('energy_price')}/kWh)")
