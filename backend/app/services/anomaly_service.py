import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "isolation_forest.joblib")

class AnomalyService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"Warning: Could not load ML model from {MODEL_PATH}: {e}")
                self.model = None

    def check_data_quality(
        self,
        current_reading: Dict[str, Any],
        recent_readings: List[Dict[str, Any]],
        is_batch_upload: bool = False
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates telemetry sanity, detects missing/corrupt values, and stale data.
        Returns (is_valid, error_code).
        """
        # 1. Missing or negative fields check
        required_fields = ["temperature", "vibration", "current", "power_output"]
        for field in required_fields:
            val = current_reading.get(field)
            if val is None or not isinstance(val, (int, float)):
                return False, f"MISSING_OR_INVALID_{field.upper()}"
            if field == "vibration" and val < 0:
                return False, "PHYSICALLY_IMPOSSIBLE_VIBRATION"
            if field == "temperature" and val < -50:
                return False, "PHYSICALLY_IMPOSSIBLE_TEMPERATURE"

        # 2. Stale data check (only for live real-time sensor streams, not for historical CSV dataset uploads)
        if not is_batch_upload:
            ts = current_reading.get("timestamp")
            if ts and isinstance(ts, datetime):
                now = datetime.now(timezone.utc) if ts.tzinfo else datetime.utcnow()
                if (now - ts) > timedelta(hours=6):
                    return True, "STALE_DATA"

        # 3. Startup / Inactive / Zero-Irradiance Standby check
        # Handles solar at night/startup or offline assets with zero generation, avoiding false failure alarms
        power_val = current_reading.get("power_output", 0.0) or 0.0
        current_val = current_reading.get("current", 0.0) or 0.0
        irrad_val = current_reading.get("solar_irradiance", None)
        temp_val = current_reading.get("temperature", 0.0) or 0.0

        if power_val == 0.0 and current_val == 0.0:
            if irrad_val is not None and irrad_val == 0.0:
                return True, "STARTUP_OFFLINE"
            if temp_val == 0.0:
                return True, "STARTUP_OFFLINE"

        # 4. Insufficient history check
        if len(recent_readings) < 1 and not is_batch_upload:
            return True, "INSUFFICIENT_HISTORY"

        return True, None

    def extract_features(
        self,
        current_reading: Dict[str, Any],
        recent_readings: List[Dict[str, Any]],
        rated_capacity: float,
        asset_type: Optional[str] = None
    ) -> Dict[str, float]:
        """
        Deterministic rolling feature engineering based on Section 6 of spec.
        """
        if not recent_readings:
            temps = [current_reading["temperature"]]
            vibs = [current_reading["vibration"]]
            currents = [current_reading["current"]]
            powers = [current_reading["power_output"]]
        else:
            temps = [r["temperature"] for r in recent_readings] + [current_reading["temperature"]]
            vibs = [r["vibration"] for r in recent_readings] + [current_reading["vibration"]]
            currents = [r["current"] for r in recent_readings] + [current_reading["current"]]
            powers = [r["power_output"] for r in recent_readings] + [current_reading["power_output"]]

        rolling_temp_mean = float(np.mean(temps[-10:]))
        rolling_vibration_mean = float(np.mean(vibs[-10:]))
        rolling_current_mean = float(np.mean(currents[-10:]))

        # Baselines: anchored to healthy commissioned baselines to prevent contamination from degraded telemetry
        is_solar = (asset_type == "solar_inverter") or any("SP" in str(current_reading.get(k, "")) for k in ["asset_id", "asset_code", "asset_type"])
        healthy_temps = [t for t in temps if t <= 58.0]
        healthy_vibs = [v for v in vibs if v <= 3.5]
        min_healthy_curr = 15.0 if is_solar else 30.0
        healthy_currents = [c for c in currents if c >= min_healthy_curr]

        baseline_temp = float(np.mean(healthy_temps[:10])) if healthy_temps else (38.0 if is_solar else (52.0 if rated_capacity >= 50 else 40.0))
        baseline_vib = float(np.mean(healthy_vibs[:10])) if healthy_vibs else (0.8 if is_solar else (2.8 if rated_capacity >= 50 else 0.1))
        baseline_curr = float(np.mean(healthy_currents[:10])) if healthy_currents else (28.0 if is_solar else (38.0 if rated_capacity >= 50 else 180.0))

        if current_reading.get("expected_power") is not None and current_reading["expected_power"] > 0:
            expected_power = float(current_reading["expected_power"])
            baseline_source = "telemetry_expected_power"
            baseline_label = "SCADA Theoretical Expected Power"
        else:
            expected_power = max(rated_capacity * 0.90, 1.0)
            baseline_source = "estimated_expected_output"
            baseline_label = "Estimated Expected Output (~90% Rated)"
        actual_power = current_reading["power_output"]

        temp_delta = current_reading["temperature"] - baseline_temp
        vibration_delta = current_reading["vibration"] - baseline_vib
        current_deviation = abs(current_reading["current"] - baseline_curr)
        power_drop_pct = max(0.0, (expected_power - actual_power) / expected_power) * 100.0
        output_efficiency = max(0.0, min(1.0, actual_power / expected_power))

        return {
            "temperature": current_reading["temperature"],
            "vibration": current_reading["vibration"],
            "current": current_reading["current"],
            "power_output": current_reading["power_output"],
            "baseline_temp": baseline_temp,
            "baseline_vib": baseline_vib,
            "expected_power": expected_power,
            "baseline_source": baseline_source,
            "baseline_label": baseline_label,
            "temp_delta": temp_delta,
            "vibration_delta": vibration_delta,
            "current_deviation": current_deviation,
            "rolling_temp_mean": rolling_temp_mean,
            "rolling_vibration_mean": rolling_vibration_mean,
            "power_drop_pct": power_drop_pct,
            "output_efficiency": output_efficiency,
            "panel_soiling": float(current_reading.get("panel_soiling") or current_reading.get("soiling") or 0.0),
        }

    def predict_anomaly(self, feature_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs Isolation Forest if available, otherwise statistical multivariant distance.
        Returns anomaly_score (0.0 normal to 1.0 highly anomalous), is_ml_anomaly, and model metadata.
        Inference is strictly deterministic using fixed weights/random_state.
        """
        if self.model is None:
            self._load_model()

        feature_vector = np.array([[
            feature_dict["temperature"],
            feature_dict["vibration"],
            feature_dict["current"],
            feature_dict["power_output"],
            feature_dict["temp_delta"],
            feature_dict["vibration_delta"],
            feature_dict["power_drop_pct"]
        ]])

        if self.model is not None:
            try:
                # decision_function gives negative for outliers, positive for inliers
                raw_score = float(self.model.decision_function(feature_vector)[0])
                # Normalize raw score roughly from [-0.5, 0.5] into [1.0, 0.0]
                # Lower raw_score = more anomalous => higher anomaly_score
                normalized_anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
                # Explicit ML outlier classification: normalized_anomaly_score >= 0.55 (raw_score <= -0.05)
                is_ml_anomaly = bool(normalized_anomaly_score >= 0.55)
                return {
                    "anomaly_score": round(normalized_anomaly_score, 3),
                    "raw_score": round(raw_score, 4),
                    "is_ml_anomaly": is_ml_anomaly,
                    "model_used": "IsolationForest",
                    "status": "success"
                }
            except Exception as e:
                print(f"Inference error: {e}")

        # Statistical fallback: normalized distance based on expected standard deviations
        temp_z = max(0.0, feature_dict["temp_delta"] / 5.0)
        vib_z = max(0.0, feature_dict["vibration_delta"] / 1.0)
        power_z = max(0.0, feature_dict["power_drop_pct"] / 15.0)

        composite_distance = (0.35 * temp_z + 0.45 * vib_z + 0.20 * power_z)
        normalized_score = float(np.clip(composite_distance / 3.0, 0.0, 1.0))
        is_ml_anomaly = bool(normalized_score >= 0.55)

        return {
            "anomaly_score": round(normalized_score, 3),
            "raw_score": round(1.0 - normalized_score, 4),
            "is_ml_anomaly": is_ml_anomaly,
            "model_used": "StatisticalBaseline",
            "status": "fallback"
        }

anomaly_service = AnomalyService()
