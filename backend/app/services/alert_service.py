import datetime
from sqlalchemy.orm import Session
from app.models import Alert, Asset

class AlertService:
    def process_health_update(
        self,
        db: Session,
        asset_id: int,
        health_score: float,
        risk_level: str,
        evidence: list
    ) -> Alert:
        """
        Manages alerts with de-duplication and persistence filtering (Section 14 & 10).
        Rejects transient single-spike noise; raises persistent or severe alarms.
        """
        active_alert = db.query(Alert).filter(
            Alert.asset_id == asset_id,
            Alert.status.in_(["active", "acknowledged"])
        ).first()

        # If healthy, resolve any existing active alert
        if risk_level == "HEALTHY":
            if active_alert:
                active_alert.status = "resolved"
                db.commit()
                db.refresh(active_alert)
            return None

        if risk_level == "WATCH":
            return active_alert

        # Extract current vibration from evidence if not provided
        current_vib = 0.0
        if evidence:
            for ev in evidence:
                if ev.get("metric") == "Mechanical Vibration":
                    current_vib = ev.get("value", 0.0)
                    break

        is_catastrophic = (current_vib >= 7.0)
        top_reason = evidence[0]["description"] if evidence else "Multivariate anomaly detected"

        if active_alert:
            # Persistent anomaly: increment counter and update message
            active_alert.persistence_count += 1
            if risk_level == "CRITICAL" or (active_alert.persistence_count >= 2 and risk_level in ["CRITICAL", "HIGH RISK"]):
                active_alert.severity = "CRITICAL" if risk_level == "CRITICAL" else "WARNING"
                active_alert.title = f"CRITICAL Anomaly Confirmed ({active_alert.persistence_count} cycles)" if risk_level == "CRITICAL" else f"Persistent {risk_level} Monitored"
            else:
                active_alert.severity = "WARNING"
                active_alert.title = f"{risk_level} Condition Monitored"

            active_alert.message = f"Persistent {risk_level} condition (observed {active_alert.persistence_count} cycles). {top_reason}"
            db.commit()
            db.refresh(active_alert)
            return active_alert

        # For a new anomaly:
        # Require >= 2 cycles before triggering CRITICAL unless catastrophic physical spike (vibration >= 7.0 mm/s)
        if risk_level == "CRITICAL" and not is_catastrophic:
            severity = "WARNING"
            title = "Degradation Detected (Awaiting Persistence Verification)"
        elif risk_level == "CRITICAL":
            severity = "CRITICAL"
            title = "CRITICAL Severe Physical Anomaly"
        else:
            severity = "WARNING"
            title = f"{risk_level} Telemetry Deviation"

        new_alert = Alert(
            asset_id=asset_id,
            severity=severity,
            title=title,
            message=top_reason,
            status="active",
            persistence_count=1,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        return new_alert

    def acknowledge_alert(self, db: Session, alert_id: int) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = "acknowledged"
            alert.acknowledged_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(alert)
        return alert

    def resolve_alert(self, db: Session, alert_id: int) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = "resolved"
            db.commit()
            db.refresh(alert)
        return alert

alert_service = AlertService()
