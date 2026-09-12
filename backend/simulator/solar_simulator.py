"""
RenewGuard AI - Solar Inverter & Array Telemetry Simulator
Generates normal baseline telemetry and soiling/inverter degradation sequences (Spec §8).
Clearly operates in Simulation Mode.
"""
import time
import requests
import random
from datetime import datetime, timezone

API_URL = "http://127.0.0.1:8000/api/sensors/readings"

def generate_solar_reading(asset_code="SP-001", degrading=False, step=0):
    if not degrading:
        temp = round(44.5 + random.uniform(-0.8, 0.8), 1)
        vib = round(0.35 + random.uniform(-0.05, 0.05), 2)
        curr = round(41.8 + random.uniform(-1.0, 1.0), 1)
        power = round(94.5 + random.uniform(-1.5, 1.5), 1)
        soiling = round(2.5 + random.uniform(-0.3, 0.3), 1)
    else:
        # Inverter overheating + dust soiling degradation
        profiles = [
            (48.0, 0.45, 39.5, 88.0, 8.5),
            (53.0, 0.60, 36.0, 81.0, 14.0),
            (59.0, 0.85, 33.2, 72.0, 22.5),
            (66.0, 1.20, 29.0, 61.0, 32.0)
        ]
        chosen = profiles[min(step, len(profiles) - 1)]
        temp = round(chosen[0] + random.uniform(-0.5, 0.5), 1)
        vib = round(chosen[1] + random.uniform(-0.05, 0.05), 2)
        curr = round(chosen[2] + random.uniform(-0.8, 0.8), 1)
        power = round(chosen[3] + random.uniform(-1.0, 1.0), 1)
        soiling = round(chosen[4] + random.uniform(-0.5, 0.5), 1)

    return {
        "asset_code": asset_code,
        "temperature": temp,
        "vibration": vib,
        "current": curr,
        "power_output": power,
        "soiling": soiling,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def run_solar_stream(asset_code="SP-001", interval_sec=5, degrade_after=3):
    print(f"[*] Starting Solar Telemetry Stream for {asset_code} (Simulation Mode)")
    count = 0
    degrade_step = 0
    while True:
        count += 1
        is_degrading = count > degrade_after
        if is_degrading:
            degrade_step += 1

        payload = generate_solar_reading(asset_code, degrading=is_degrading, step=degrade_step)
        try:
            res = requests.post(API_URL, json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                print(f"[{count}] {payload['timestamp'][:19]} | T: {payload['temperature']}°C | Vib: {payload['vibration']} mm/s | P: {payload['power_output']} kW -> Health: {data['health_score']} ({data['risk_level']})")
            else:
                print(f"[{count}] API error {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[{count}] Failed to connect to API: {e}")

        time.sleep(interval_sec)

if __name__ == "__main__":
    run_solar_stream()
