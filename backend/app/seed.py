import datetime
import random
from app.database import SessionLocal, engine, Base
from app.models import User, Site, Asset, SensorReading, HealthPrediction, Alert, MaintenanceTask, EconomicConfig
from app.services.auth_service import hash_password
from app.services.anomaly_service import anomaly_service
from app.services.health_service import health_service
from app.services.impact_service import impact_service

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping initial seeding.")
        db.close()
        return

    print("Seeding RenewGuard AI database...")

    # 1. Users
    operator_user = User(
        name="Sarah Operator",
        email="operator@renewguard.io",
        password_hash=hash_password("password123"),
        role="operator"
    )
    technician_user = User(
        name="Alex Technician",
        email="technician@renewguard.io",
        password_hash=hash_password("password123"),
        role="technician"
    )
    db.add_all([operator_user, technician_user])
    db.commit()
    db.refresh(operator_user)
    db.refresh(technician_user)

    # 2. Sites
    site_wind = Site(name="GreenWind Energy Farm", location_name="Tehachapi Pass, CA", site_type="wind")
    site_solar = Site(name="Solaria Desert Array", location_name="Mojave Desert, CA", site_type="solar")
    db.add_all([site_wind, site_solar])
    db.commit()
    db.refresh(site_wind)
    db.refresh(site_solar)

    # 3. Economic configs
    db.add(EconomicConfig(site_id=site_wind.id, energy_price=0.12, currency="$"))
    db.add(EconomicConfig(site_id=site_solar.id, energy_price=0.10, currency="$"))
    db.commit()

    # 4. Assets
    wind_codes = ["WT-001", "WT-002", "WT-003", "WT-004", "WT-005", "WT-006"]
    solar_codes = ["SP-001", "SP-002", "SP-003", "SP-004"]

    assets = []
    for code in wind_codes:
        a = Asset(
            asset_code=code,
            site_id=site_wind.id,
            asset_type="wind_turbine",
            rated_capacity=100.0,
            status="HEALTHY"
        )
        db.add(a)
        assets.append(a)

    for code in solar_codes:
        a = Asset(
            asset_code=code,
            site_id=site_solar.id,
            asset_type="solar_inverter",
            rated_capacity=100.0,
            status="HEALTHY"
        )
        db.add(a)
        assets.append(a)

    db.commit()
    for a in assets:
        db.refresh(a)

    # 5. Populate historical telemetry for each asset
    now = datetime.datetime.utcnow()
    print("Generating historical sensor time-series...")

    for asset in assets:
        is_wind = asset.asset_type == "wind_turbine"
        # Generate 20 baseline points over past 100 minutes
        recent_dicts = []
        for i in range(20, 0, -1):
            ts = now - datetime.timedelta(minutes=i * 5)
            if is_wind:
                temp = round(random.normalvariate(48.2, 0.8), 2)
                vib = round(random.normalvariate(2.1, 0.15), 2)
                curr = round(random.normalvariate(38.0, 1.2), 2)
                power = round(random.normalvariate(91.5, 2.0), 2)
                soiling = None
            else:
                temp = round(random.normalvariate(44.8, 1.0), 2)
                vib = round(random.normalvariate(0.35, 0.05), 2)
                curr = round(random.normalvariate(41.8, 1.5), 2)
                power = round(random.normalvariate(94.2, 2.5), 2)
                soiling = round(random.uniform(2.0, 5.0), 1)

            reading = SensorReading(
                asset_id=asset.id,
                timestamp=ts,
                temperature=temp,
                vibration=vib,
                current=curr,
                power_output=power,
                soiling=soiling
            )
            db.add(reading)
            recent_dicts.append({
                "temperature": temp,
                "vibration": vib,
                "current": curr,
                "power_output": power,
                "timestamp": ts
            })

        db.commit()

        # Compute initial baseline health prediction
        features = anomaly_service.extract_features(recent_dicts[-1], recent_dicts[:-1], asset.rated_capacity)
        anomaly_res = anomaly_service.predict_anomaly(features)
        health_score, risk_level, evidence, action = health_service.calculate_health_and_risk(features, anomaly_res)

        pred = HealthPrediction(
            asset_id=asset.id,
            timestamp=now,
            anomaly_score=anomaly_res["anomaly_score"],
            health_score=health_score,
            risk_level=risk_level,
            explanation=evidence
        )
        db.add(pred)
        asset.status = risk_level

    # Let's seed one preexisting WATCH asset: WT-002 with minor thermal variance
    wt2 = next(a for a in assets if a.asset_code == "WT-002")
    wt2.status = "WATCH"
    alert_wt2 = Alert(
        asset_id=wt2.id,
        severity="WARNING",
        title="WATCH: Operating Temperature Elevated",
        message="Operating temperature +6.8°C above 24h baseline. Minor cooling efficiency drop.",
        status="active",
        persistence_count=2,
        created_at=now - datetime.timedelta(hours=2)
    )
    db.add(alert_wt2)

    # Seed an open inspection task assigned to Alex Technician
    task_wt2 = MaintenanceTask(
        asset_id=wt2.id,
        assigned_to=technician_user.id,
        priority="MEDIUM",
        status="in_progress",
        notes="Inspect cooling vents and thermal radiator on WT-002 during afternoon shift.",
        created_at=now - datetime.timedelta(hours=1)
    )
    db.add(task_wt2)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
