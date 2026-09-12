# RenewGuard AI - Predictive Maintenance System

## 1. Project Overview
**RenewGuard AI** is a full-stack, AI-driven predictive maintenance platform designed specifically for the renewable energy sector (Wind Turbines and Solar Power Inverters). 

The primary goal of this project is to minimize unexpected equipment downtime and reduce maintenance costs by analyzing real-time sensor data, predicting when an asset is likely to fail, and generating actionable maintenance alerts before catastrophic failure occurs.

## 2. The Problem & Our Solution
### The Problem
Renewable energy assets operate in harsh environments. When a wind turbine or solar inverter fails unexpectedly, it results in massive revenue loss, expensive emergency repairs, and grid instability. Traditional maintenance relies on fixed schedules (preventative) or fixing things after they break (reactive), both of which are highly inefficient.

### The Solution
RenewGuard AI implements **Predictive Maintenance**. We ingest live or historical telemetry data from assets and run it through a Machine Learning pipeline (Isolation Forest algorithms and statistical baseline modeling). The system identifies microscopic anomalies in vibration, temperature, and power efficiency, flagging degrading equipment days or weeks before it breaks.

## 3. Core Functionalities
- **Real-Time Telemetry Processing:** Ingests live data streams from sensors attached to assets.
- **ML Anomaly Detection:** Uses an `Isolation Forest` model to detect outliers and multi-variable deviations (e.g., normal temperature but high vibration and power drop).
- **Health Scoring Engine:** Calculates a dynamic Health Score (0-100) for every asset based on recent anomalies and sensor drift.
- **Economic Impact Assessment:** Calculates the estimated revenue lost per hour if the degraded asset is not fixed.
- **Automated Alerting & Priority Queue:** Generates actionable tickets for technicians (Critical, High Risk, Watch) sorted by financial impact.
- **CSV Data Ingestion:** Allows engineers to upload batches of historical CSV data to run retroactive anomaly detection.
- **Super Admin Dashboard:** A centralized control panel to manage registered technicians, users, and oversee the global health of the entire grid.

## 4. Key Parameters & Sensor Data
The ML engine and backend API expect specific telemetry columns to run accurate health predictions. 

**Core Required Parameters:**
*   `asset_code`: Unique identifier (e.g., WT-101 for Wind, SP-201 for Solar).
*   `timestamp`: ISO8601 time of the reading.
*   `temperature` (°C): Core temperature of the generator or inverter.
*   `vibration` (mm/s): RMS vibration of moving parts (crucial for wind turbines).
*   `current` (Amps): Phase current output.
*   `power_output` (kW): Actual active power being generated.

**Secondary/Contextual Parameters:**
*   `voltage` (Volts): Phase voltage.
*   `expected_power` (kW): The theoretical power it *should* be generating based on weather.
*   `wind_speed` (m/s): Contextual weather data for turbines.
*   `solar_irradiance` (W/m²): Contextual weather data for solar panels.
*   `humidity` (%): Environmental metric.
*   `soiling`: Dust/dirt accumulation percentage on solar panels.

## 5. Technical Stack
**Frontend (User Interface):**
*   **React + TypeScript** (built with Vite for speed)
*   **Tailwind CSS** for modern, responsive, and dynamic styling.
*   **Recharts** for visualizing telemetry graphs and anomalies over time.
*   **React Router** for seamless Single Page Application (SPA) navigation.

**Backend (API & ML Pipeline):**
*   **Python + FastAPI:** High-performance asynchronous API server.
*   **SQLAlchemy + SQLite/PostgreSQL:** Relational database management.
*   **Scikit-Learn (joblib):** Powers the Machine Learning models (Isolation Forest).
*   **Pandas & NumPy:** For data extraction, feature engineering, and statistical math.
*   **JWT (JSON Web Tokens):** For secure user authentication and role-based access.

## 6. Machine Learning & Feature Engineering
Rather than just looking at raw numbers, the backend calculates "Features" to feed the ML model:
1.  **temp_delta:** The difference between current temperature and a healthy baseline.
2.  **vibration_delta:** Spikes in mechanical vibration.
3.  **power_drop_pct:** Percentage of power lost compared to the expected theoretical output.
4.  **output_efficiency:** The ratio of actual vs. expected power.

The system calculates a **Z-Score** distance. If the ML model classifies the reading as an outlier (score > 0.55), it triggers a maintenance alert, calculates the financial priority, and immediately updates the frontend dashboard.

## 7. Core Functions & Workflows Breakdown

The system is built around several core functionalities that power the user experience. Here is a breakdown of the primary actions users can perform:

### 1. Authentication & Roles
*   **Login & Register:** Users authenticate via JWT tokens. The system issues a secure token used for all subsequent API requests.
*   **Role Management:** Users are assigned roles (`technician`, `admin`, `superadmin`). Technicians can view and update tasks, admins can create tasks, and superadmins can manage all users and global data.

### 2. Alerts & Maintenance Task Workflow
When the AI detects an anomaly, it generates an **Alert**. The system provides a seamless workflow to handle these alerts:
*   **Acknowledge Alert:** When an engineer spots a new alert on the Dashboard, they can click **Acknowledge**. This marks the alert as seen, preventing duplicate notifications and signaling to the team that the issue is being investigated.
*   **Create Task (From Alert):** If the alert requires physical repair, the engineer clicks **Create Task**. This automatically drafts a new Maintenance Task linked to the specific asset, pre-filling the diagnostic notes with the AI's findings (e.g., "Severe bearing vibration"), and redirects the user to the Maintenance operations board.
*   **Update Task Status:** Technicians can view their assigned tasks on the board and update the status (`pending`, `in_progress`, `completed`). When completed, the asset's health score typically normalizes.
*   **Priority Queue:** All active tasks and alerts are dynamically sorted based on the estimated revenue loss (e.g., $3,000/hr at risk), ensuring technicians always work on the most financially critical repairs first.

### 3. Telemetry & AI Processing
*   **Upload CSV (Batch Ingestion):** Users can upload a CSV file containing historical sensor data. The backend instantly parses the file, calculates rolling features, and runs it through the ML pipeline to retroactively identify anomalies and update asset health scores.
*   **Real-time Anomaly Detection:** The system continuously evaluates incoming sensor data against expected baselines, generating an `Anomaly Score` and logging critical events as `Alerts`.

### 4. Dashboard & Analytics
*   **Global Dashboard Summary:** Aggregates data across the entire fleet to display total active alerts, average fleet health, total estimated revenue at risk, and total resolved tasks.
*   **Asset Details View:** Provides a deep dive into a specific asset (e.g., WT-101), showing a historical line chart of its health score, power output efficiency, and temperature deviations.

### 5. Super Admin Controls
*   **Web Data Summary:** Super Admins have access to a bird's-eye view of all system data, including the total number of registered users, active assets, and pending maintenance tasks.
*   **User Management:** Allows Super Admins to view all registered users and theoretically manage their roles or access levels across the entire application.
