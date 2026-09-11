import httpx

with open("RenewGuard_Random_Test_Telemetry.csv", "rb") as f:
    content = f.read()

r = httpx.post(
    "http://localhost:8000/api/sensors/upload-csv",
    files={"file": ("RenewGuard_Random_Test_Telemetry.csv", content, "text/csv")},
    timeout=30.0
)
print("STATUS:", r.status_code)
data = r.json()
print("TOTAL ROWS:", data.get("total_rows"))
print("PROCESSED ROWS:", data.get("processed_rows"))
print("DUPLICATES SKIPPED:", data.get("duplicates_skipped"))
print("ANOMALIES FLAGGED:", data.get("anomalies_flagged"))
print("ERRORS:", data.get("errors"))
print("ASSETS ANALYZED COUNT:", len(data.get("assets_analyzed", [])))
for a in data.get("assets_analyzed", []):
    ev = a.get("top_evidence", [])
    ev_str = ev[0]["description"] if ev else "None"
    print(f"  {a['asset_code']}: {a['latest_risk_level']} (Health: {a['latest_health_score']}) - {ev_str}")
