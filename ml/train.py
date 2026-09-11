import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

def generate_normal_baseline_data(n_samples=2500):
    """
    Generates realistic normal operating baseline telemetry for training Isolation Forest.
    Features: [temperature, vibration, current, power_output, temp_delta, vibration_delta, power_drop_pct]
    """
    np.random.seed(42)

    # Normal wind turbine telemetry (approx 55% of dataset)
    n_wind = int(n_samples * 0.55)
    wind_temp = np.random.uniform(42.0, 54.0, n_wind)
    wind_vib = np.random.uniform(1.8, 2.6, n_wind)
    wind_curr = np.random.uniform(32.0, 44.0, n_wind)
    wind_power = np.random.uniform(85.0, 115.0, n_wind)
    wind_temp_delta = np.random.normal(0.0, 1.2, n_wind)
    wind_vib_delta = np.random.normal(0.0, 0.25, n_wind)
    wind_power_drop = np.clip(np.random.normal(2.0, 2.0, n_wind), 0.0, 8.0)

    # Normal solar inverter telemetry (approx 45% of dataset)
    n_solar = n_samples - n_wind
    solar_temp = np.random.uniform(32.0, 50.0, n_solar)
    solar_vib = np.random.uniform(0.1, 1.0, n_solar)
    solar_curr = np.random.uniform(22.0, 55.0, n_solar)
    solar_power = np.random.uniform(80.0, 130.0, n_solar)
    solar_temp_delta = np.random.normal(0.0, 1.2, n_solar)
    solar_vib_delta = np.random.normal(0.0, 0.15, n_solar)
    solar_power_drop = np.clip(np.random.normal(2.0, 2.0, n_solar), 0.0, 8.0)

    # Combine
    X_wind = np.column_stack([wind_temp, wind_vib, wind_curr, wind_power, wind_temp_delta, wind_vib_delta, wind_power_drop])
    X_solar = np.column_stack([solar_temp, solar_vib, solar_curr, solar_power, solar_temp_delta, solar_vib_delta, solar_power_drop])
    X = np.vstack([X_wind, X_solar])
    np.random.shuffle(X)
    return X

def train_isolation_forest():
    print("Generating baseline training data...")
    X = generate_normal_baseline_data(3000)

    print("Fitting Isolation Forest model...")
    iso_forest = IsolationForest(
        n_estimators=120,
        contamination=0.03,
        max_samples=256,
        random_state=42
    )
    iso_forest.fit(X)

    output_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "isolation_forest.joblib")

    joblib.dump(iso_forest, model_path)
    print(f"Model successfully saved to: {model_path}")
    return model_path

if __name__ == "__main__":
    train_isolation_forest()
