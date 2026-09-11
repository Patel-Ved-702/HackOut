from typing import Dict, Any, List, Tuple

class HealthService:
    def calculate_health_and_risk(
        self,
        features: Dict[str, float],
        anomaly_result: Dict[str, Any],
        quality_issue: str = None
    ) -> Tuple[float, str, List[Dict[str, Any]], str]:
        """
        Calculates health score (0-100), risk status, transparent evidence list, and recommended action.
        """
        if quality_issue == "DATA_STALE":
            return 50.0, "DATA_STALE", [{
                "metric": "Data Freshness",
                "severity": "WARNING",
                "description": "Sensor telemetry is stale (no recent timestamps).",
                "value": 0.0,
                "baseline": 0.0,
                "delta_pct": 0.0
            }], "Verify IoT gateway telemetry connectivity."

        if quality_issue == "STARTUP_OFFLINE":
            return 90.0, "STARTUP", [{
                "metric": "Operating Mode",
                "severity": "INFO",
                "description": "Asset in zero-generation standby / inverter startup state (solar irradiance = 0 W/m², current = 0 A). Awaiting grid synchronization.",
                "value": 0.0,
                "baseline": 0.0,
                "delta_pct": 0.0
            }], "Asset in normal standby/startup mode. No maintenance intervention required."

        if quality_issue == "INSUFFICIENT_HISTORY":
            return 90.0, "HEALTHY", [{
                "metric": "Telemetry History",
                "severity": "INFO",
                "description": "Insufficient history for reliable anomaly assessment; accumulating baseline.",
                "value": 0.0,
                "baseline": 0.0,
                "delta_pct": 0.0
            }], "Allow system to collect sufficient baseline telemetry."

        anomaly_score = anomaly_result.get("anomaly_score", 0.0)
        is_ml_anom = anomaly_result.get("is_ml_anomaly", False) or (anomaly_score >= 0.60)

        # Progressive gradual health scoring: Healthy (100-80) -> Watch (79-60) -> High Risk (59-30) -> Critical (29-8)
        # Prevents artificial cliff drops to 0/100 when an asset is still generating power under degradation.
        evidence = []
        health_score = 100.0

        # Track transparent penalties without double counting
        vib_penalty = 0.0
        temp_penalty = 0.0
        power_penalty = 0.0
        ml_penalty = 0.0
        soiling_penalty = 0.0

        # 1. Vibration factor (bearing, rotor imbalance, mechanical wear - SENSOR DEVIATION)
        vib_delta = features.get("vibration_delta", 0.0)
        base_vib = features.get("baseline_vib", 2.8)
        current_vib = features.get("vibration", base_vib + vib_delta)
        vib_pct = (vib_delta / max(base_vib, 0.1)) * 100.0
        if vib_delta > 3.5:
            vib_penalty = 24.0
            evidence.append({
                "metric": "Mechanical Vibration",
                "category": "SENSOR_DEVIATION",
                "severity": "CRITICAL",
                "description": f"Severe bearing vibration ({current_vib:.1f} mm/s vs baseline {base_vib:.1f} mm/s, +{vib_pct:.0f}%)",
                "value": round(current_vib, 2),
                "baseline": round(base_vib, 2),
                "delta_pct": round(vib_pct, 1)
            })
        elif vib_delta > 1.8:
            vib_penalty = 16.0
            evidence.append({
                "metric": "Mechanical Vibration",
                "category": "SENSOR_DEVIATION",
                "severity": "WARNING",
                "description": f"Elevated mechanical vibration ({current_vib:.1f} mm/s vs {base_vib:.1f} mm/s, +{vib_pct:.0f}%)",
                "value": round(current_vib, 2),
                "baseline": round(base_vib, 2),
                "delta_pct": round(vib_pct, 1)
            })
        elif vib_delta > 0.8:
            vib_penalty = 8.0
            evidence.append({
                "metric": "Mechanical Vibration",
                "category": "SENSOR_DEVIATION",
                "severity": "WARNING",
                "description": f"Minor vibration drift above baseline ({current_vib:.1f} mm/s vs {base_vib:.1f} mm/s)",
                "value": round(current_vib, 2),
                "baseline": round(base_vib, 2),
                "delta_pct": round(vib_pct, 1)
            })
        health_score -= vib_penalty

        # 2. Temperature factor (thermal dissipation, lubrication friction - SENSOR DEVIATION)
        temp_delta = features.get("temp_delta", 0.0)
        base_temp = features.get("baseline_temp", 52.0)
        current_temp = features.get("temperature", base_temp + temp_delta)
        temp_pct = (temp_delta / max(base_temp, 1.0)) * 100.0
        if temp_delta > 14.0:
            temp_penalty = 22.0
            evidence.append({
                "metric": "Operating Temperature",
                "category": "SENSOR_DEVIATION",
                "severity": "CRITICAL",
                "description": f"Severe thermal rise ({current_temp:.1f}°C vs baseline {base_temp:.1f}°C, +{temp_pct:.0f}%)",
                "value": round(current_temp, 1),
                "baseline": round(base_temp, 1),
                "delta_pct": round(temp_pct, 1)
            })
        elif temp_delta > 7.0:
            temp_penalty = 14.0
            evidence.append({
                "metric": "Operating Temperature",
                "category": "SENSOR_DEVIATION",
                "severity": "WARNING",
                "description": f"Temperature elevated ({current_temp:.1f}°C vs baseline {base_temp:.1f}°C, +{temp_pct:.0f}%)",
                "value": round(current_temp, 1),
                "baseline": round(base_temp, 1),
                "delta_pct": round(temp_pct, 1)
            })
        elif temp_delta > 3.5:
            temp_penalty = 6.0
            evidence.append({
                "metric": "Operating Temperature",
                "category": "SENSOR_DEVIATION",
                "severity": "WARNING",
                "description": f"Mild thermal elevation ({current_temp:.1f}°C vs {base_temp:.1f}°C)",
                "value": round(current_temp, 1),
                "baseline": round(base_temp, 1),
                "delta_pct": round(temp_pct, 1)
            })
        health_score -= temp_penalty

        # 3. Power deficit factor (expected vs observed active power - OPERATIONAL DEGRADATION)
        power_drop = features.get("power_drop_pct", 0.0)
        exp_p = features.get("expected_power", 96.0)
        actual_p = features.get("power_output", exp_p * (1.0 - power_drop / 100.0))
        if power_drop > 28.0:
            power_penalty = 20.0
            evidence.append({
                "metric": "Power Output Deficit",
                "category": "OPERATIONAL_DEGRADATION",
                "severity": "CRITICAL",
                "description": f"Power output down {power_drop:.1f}% ({actual_p:.1f} kW vs expected {exp_p:.1f} kW)",
                "value": round(actual_p, 1),
                "baseline": round(exp_p, 1),
                "baseline_source": features.get("baseline_source", "configured_baseline"),
                "delta_pct": -round(power_drop, 1)
            })
        elif power_drop > 14.0:
            power_penalty = 12.0
            evidence.append({
                "metric": "Power Output Deficit",
                "category": "OPERATIONAL_DEGRADATION",
                "severity": "WARNING",
                "description": f"Power output deficit of {power_drop:.1f}% below expected capacity",
                "value": round(actual_p, 1),
                "baseline": round(exp_p, 1),
                "baseline_source": features.get("baseline_source", "configured_baseline"),
                "delta_pct": -round(power_drop, 1)
            })
        elif power_drop > 10.0:
            power_penalty = 8.0
            evidence.append({
                "metric": "Power Output Deficit",
                "category": "OPERATIONAL_DEGRADATION",
                "severity": "WARNING",
                "description": f"Moderate generation shortfall ({power_drop:.1f}% below expected {exp_p:.1f} kW)",
                "value": round(actual_p, 1),
                "baseline": round(exp_p, 1),
                "baseline_source": features.get("baseline_source", "configured_baseline"),
                "delta_pct": -round(power_drop, 1)
            })
        elif power_drop > 6.0:
            power_penalty = 4.0
            evidence.append({
                "metric": "Power Output Deficit",
                "category": "OPERATIONAL_DEGRADATION",
                "severity": "INFO",
                "description": f"Minor generation shortfall ({power_drop:.1f}% below expected {exp_p:.1f} kW)",
                "value": round(actual_p, 1),
                "baseline": round(exp_p, 1),
                "baseline_source": features.get("baseline_source", "configured_baseline"),
                "delta_pct": -round(power_drop, 1)
            })
        health_score -= power_penalty

        # 4. ML Anomaly Score impact (multivariate pattern deviation - ML ANOMALY)
        # Strictly applies ONLY when the ML Isolation Forest explicitly flagged an anomaly
        if is_ml_anom:
            if anomaly_score > 0.60:
                ml_penalty = 16.0
                evidence.append({
                    "metric": "ML Isolation Forest Anomaly",
                    "category": "ML_ANOMALY",
                    "severity": "CRITICAL",
                    "description": f"High multivariate anomaly score ({anomaly_score:.2f}) across coupled sensor vectors",
                    "value": round(anomaly_score, 2),
                    "baseline": 0.20,
                    "delta_pct": round((anomaly_score - 0.20) * 100.0, 1)
                })
            else:
                ml_penalty = 8.0
                evidence.append({
                    "metric": "ML Isolation Forest Anomaly",
                    "category": "ML_ANOMALY",
                    "severity": "WARNING",
                    "description": f"Multivariate anomaly score ({anomaly_score:.2f}) from expected baseline",
                    "value": round(anomaly_score, 2),
                    "baseline": 0.20,
                    "delta_pct": round((anomaly_score - 0.20) * 100.0, 1)
                })
            health_score -= ml_penalty

        # 5. Solar panel soiling factor (dust accumulation, surface shading - OPERATIONAL DEGRADATION)
        soiling = features.get("panel_soiling")
        if soiling is not None and soiling > 6.5:
            if soiling > 15.0:
                soiling_penalty = 22.0
                evidence.append({
                    "metric": "Panel Soiling",
                    "category": "OPERATIONAL_DEGRADATION",
                    "severity": "CRITICAL",
                    "description": f"Severe panel soiling ({soiling:.1f}%) significantly impairing photovoltaic conversion",
                    "value": round(soiling, 1),
                    "baseline": 2.0,
                    "delta_pct": round(((soiling - 2.0) / 2.0) * 100.0, 1)
                })
            elif soiling > 10.0:
                soiling_penalty = 16.0
                evidence.append({
                    "metric": "Panel Soiling",
                    "category": "OPERATIONAL_DEGRADATION",
                    "severity": "WARNING",
                    "description": f"Elevated panel soiling ({soiling:.1f}%) reducing solar string yield",
                    "value": round(soiling, 1),
                    "baseline": 2.0,
                    "delta_pct": round(((soiling - 2.0) / 2.0) * 100.0, 1)
                })
            else:
                soiling_penalty = 10.0
                evidence.append({
                    "metric": "Panel Soiling",
                    "category": "OPERATIONAL_DEGRADATION",
                    "severity": "WARNING",
                    "description": f"Moderate surface soiling ({soiling:.1f}%) detected",
                    "value": round(soiling, 1),
                    "baseline": 2.0,
                    "delta_pct": round(((soiling - 2.0) / 2.0) * 100.0, 1)
                })
            health_score -= soiling_penalty

        # Clamp health score: producing assets clamp to min 10.0 so 0/100 is reserved for complete shutdown/trip
        min_clamp = 10.0 if features.get("power_output", 0.0) > 0 else 0.0
        final_health = max(min_clamp, min(100.0, round(health_score, 1)))

        # Determine risk level using centralized logic (Section 12)
        risk_level, recommended_action = self.calculate_risk_level(final_health, evidence)

        if not evidence:
            evidence.append({
                "metric": "Overall Telemetry",
                "category": "DATA_QUALITY",
                "severity": "NORMAL",
                "description": "All sensor values within nominal statistical baselines.",
                "value": final_health,
                "baseline": 100.0,
                "delta_pct": 0.0
            })
        else:
            sev_rank = {"CRITICAL": 0, "WARNING": 1, "INFO": 2, "NORMAL": 3}
            evidence.sort(key=lambda e: (sev_rank.get(e.get("severity", "NORMAL"), 9), -abs(e.get("delta_pct", 0.0))))

        return final_health, risk_level, evidence, recommended_action

    def calculate_risk_level(self, health_score: float, evidence: List[Dict[str, Any]]) -> Tuple[str, str]:
        """
        Centralized Authoritative Risk Classification (Section 12 of Audit Plan).
        Returns (risk_level, recommended_action).
        """
        crit_count = sum(1 for e in evidence if e.get("severity") == "CRITICAL")
        has_warning_or_ml = any(
            (e.get("category") == "ML_ANOMALY") or (e.get("severity") in ["WARNING", "CRITICAL"])
            for e in (evidence or []) if e.get("category") != "DATA_QUALITY"
        )

        if health_score < 35.0 or (crit_count >= 2 and health_score < 50.0):
            return "CRITICAL", "Significant degradation detected. Immediate technician dispatch recommended."
        elif health_score < 60.0 or crit_count >= 1:
            return "HIGH RISK", "Abnormal behaviour detected; schedule preventive inspection within 48h."
        elif health_score < 80.0 or has_warning_or_ml:
            return "WATCH", "Minor variance detected. Retain in watch queue for trending."
        else:
            return "HEALTHY", "Nominal operation. Continue routine automated telemetry monitoring."

    def calculate_health_breakdown(self, features: Dict[str, float], anomaly_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provides deterministic, explainable mathematical audit breakdown of health score (Section 11 & 17).
        """
        anomaly_score = anomaly_result.get("anomaly_score", 0.0)
        is_ml_anom = anomaly_result.get("is_ml_anomaly", False) or (anomaly_score >= 0.60)

        vib_delta = features.get("vibration_delta", 0.0)
        base_vib = features.get("baseline_vib", 2.8)
        current_vib = features.get("vibration", base_vib + vib_delta)
        vib_penalty = 24.0 if vib_delta > 3.5 else (16.0 if vib_delta > 1.8 else (8.0 if vib_delta > 0.8 else 0.0))

        temp_delta = features.get("temp_delta", 0.0)
        temp_penalty = 22.0 if temp_delta > 14.0 else (14.0 if temp_delta > 7.0 else (6.0 if temp_delta > 3.5 else 0.0))

        power_drop = features.get("power_drop_pct", 0.0)
        power_penalty = 20.0 if power_drop > 28.0 else (12.0 if power_drop > 14.0 else (8.0 if power_drop > 10.0 else (4.0 if power_drop > 6.0 else 0.0)))

        ml_penalty = (16.0 if anomaly_score > 0.60 else 8.0) if is_ml_anom else 0.0

        soiling = features.get("panel_soiling")
        soiling_penalty = (22.0 if soiling > 15.0 else (16.0 if soiling > 10.0 else 10.0)) if (soiling is not None and soiling > 6.5) else 0.0

        raw_health = 100.0 - vib_penalty - temp_penalty - power_penalty - ml_penalty - soiling_penalty
        min_clamp = 10.0 if features.get("power_output", 0.0) > 0 else 0.0
        final_health = max(min_clamp, min(100.0, round(raw_health, 1)))

        return {
            "base_health": 100.0,
            "vibration_penalty": -vib_penalty,
            "thermal_penalty": -temp_penalty,
            "power_deficit_penalty": -power_penalty,
            "ml_anomaly_penalty": -ml_penalty,
            "soiling_penalty": -soiling_penalty,
            "final_health": final_health
        }

health_service = HealthService()
