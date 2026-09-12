"""
RenewGuard AI - Wind Turbine Telemetry Simulator
Generates normal baseline telemetry and simulated degradation sequences for wind assets (Spec §8).
Clearly operates in Simulation Mode.
"""
import time
import requests
import random
from datetime import datetime, timezone

API_URL = "http://127.0.0.1:8000/api/sensors/readings"

def generate_wind_reading(asset_code="WT-004", degrading=False, step=0):
    if not degrading:
        # Baseline normal conditions (Spec §8 table):
        # Temp ~48-49°C, Vibration ~2.0-2.2 mm/s, Power ~90-92 kW
        temp = round(48.5 + random.uniform(-0.6, 0.6), 1)
        vib = round(2.1 + random.uniform(-0.15, 0.15), 2)
        curr = round(38.0 + random.uniform(-1.0, 1.0), 1)
        power = round(91.2 + random.uniform(-1.5, 1.5), 1)
    else:
        # Degrading trajectory (Spec §8 table):
        # 10:00 48 2.1 91
        # 10:05 52 2.8 88
        # 10:10 57 3.9 82
        # 10:15 63 5.6 74
        # 10:20 69 7.2 65
        profiles = [
            (52.0, 2.8, 37.2, 88.0),
            (57.0, 3.9, 36.5, 82.0),
            (63.0, 5.6, 35.8, 74.0),
            (69.0, 7.2, 35.0, 65.0)
        ]
        chosen = profiles[min(step, len(profiles) - 1)]
        temp = round(chosen[0] + random.uniform(-0.3, 0.3), 1)
        vib = round(chosen[1] + random.uniform(-0.1, 0.1), 2)
        curr = round(chosen[2] + random.uniform(-0.5, 0.5), 1)
        power = round(chosen[3] + random.uniform(-1.0, 1.0), 1)

    return {
        "asset_code": asset_code,
        "temperature": temp,
        "vibration": vib,
        "current": curr,
        "power_output": power,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def run_stream(asset_code="WT-004", interval_sec=5, degrade_after=3):
    print(f"[*] Starting Wind Telemetry Stream for {asset_code} (Simulation Mode)")
    print(f"[*] Will introduce gradual mechanical degradation after {degrade_after} readings...")

    count = 0
    degrade_step = 0
    while True:
        count += 1
        is_degrading = count > degrade_after
        if is_degrading:
            degrade_step += 1

        payload = generate_wind_reading(asset_code, degrading=is_degrading, step=degrade_step)
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
    run_stream()
