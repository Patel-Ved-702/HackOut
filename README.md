# RenewGuard AI ⚡
### AI-Powered Predictive Maintenance for Solar & Wind Assets
*Built for HackOut'26 — Grounded Operational Intelligence (Zero Hallucination)*

---

## 🌟 Overview
**RenewGuard AI** continuously monitors renewable-energy assets, detects early abnormal behavior before catastrophic failure, computes transparent health/risk scores, ranks maintenance urgency, and estimates generation/revenue loss from inaction based on configurable tariffs.

Unlike black-box or hallucinating prototypes:
* **Grounded ML (Isolation Forest + Feature Engineering):** Detects multivariate anomalies from rolling baselines ($\Delta\text{temperature}$, $\Delta\text{vibration}$, $\text{power drop \%}$).
* **No Fabricated Diagnoses or False Accuracies:** Produces verifiable sensor evidence rather than guessing unverifiable internal component faults.
* **Configurable Economic Calculations:** Power baselines and tariffs are dynamic operator inputs, not hardcoded universal claims.
* **Continuous Operations Workflow:** Connects IoT telemetry to operators, automated priority queues, and mobile-friendly technician work-order completion.

---

## 🏛 System Architecture
```
[IoT Telemetry / Simulator] 
           │ (POST /api/sensors/readings)
           ▼
 [FastAPI Gateway + Pydantic Validation]
           │
 ┌─────────┴─────────┐
 ▼                   ▼
[SQL Database]  [Rolling History + Feature Engineering]
                     │
                     ▼
          [Isolation Forest Model]
                     │
                     ▼
     [Deterministic Health & Risk Engine] (0-100 Score + Observable Evidence)
                     │
     [Configurable Impact Estimator] (Deficit kW × Dynamic Tariff)
                     │
     [Maintenance Priority Engine] (Risk + Persistence + Capacity)
                     │
     [De-duplicated Alert Engine] (Rejects single noisy spikes)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
 [Fleet Operator Dashboard] [Technician Field Workspace]
 - Fleet Health Overview    - Mobile-friendly task tickets
 - Multi-series Sensor Graphs- Start Inspection
 - Live Degradation Demo    - Record remediation outcome
```

---

## 🚀 Quickstart Guide

### Option 1: Run Locally (Fastest)

#### 1. Backend & ML Setup
```powershell
# Navigate to workspace
cd c:\me\hackout

# Activate Python virtual environment
.\.venv\Scripts\activate

# Install dependencies (already cached in .venv)
pip install -r backend\requirements.txt

# (Optional) Retrain Isolation Forest model artifact
python ml\train.py

# Seed database with users, sites, assets, and 24h baseline readings
$env:PYTHONPATH = "backend"
python backend\app\seed.py

# Run FastAPI Server (serves both API & built React frontend on port 8000)
python backend\app\main.py
```
Visit: **`http://localhost:8000`** in your browser.

#### 2. Frontend Development Server (Optional)
If modifying React source files with hot module reloading:
```powershell
# Using the local node runtime
$env:PATH = "c:\me\hackout\.tools\node;" + $env:PATH
cd frontend
npm run dev
```
Visit: **`http://localhost:5173`** (proxies API calls automatically to port 8000).

---

## 👥 Demo Credentials
| Role | Email | Password |
|---|---|---|
| **Plant Operator** | `operator@renewguard.io` | `password123` |
| **Field Technician** | `technician@renewguard.io` | `password123` |

*(Note: You can instantly switch between Operator and Technician views via the role toggle in the top-right navbar!)*

---

## 🎬 3-Minute Hackathon Demo Script (Spec §18)

1. **Fleet Overview:** Open `http://localhost:8000`. Show the Fleet Dashboard displaying healthy counts, baseline generation, and asset `WT-004` (Wind Turbine 4) at nominal health ($100/100$).
2. **Inspect Baseline Asset:** Click `WT-004` in the Asset Monitor. Show nominal time-series telemetry ($48.2^\circ\text{C}$ temp, $2.1\text{ mm/s}$ vibration, $91.5\text{ kW}$ power).
3. **Trigger Live Degradation:** On the top demo banner, click **"Simulate Degradation"**.
4. **Live Anomaly Detection:** Watch telemetry update live:
   * Temperature rises to $69^\circ\text{C}$.
   * Vibration spikes to $7.4\text{ mm/s}$.
   * Power drops to $64.8\text{ kW}$.
   * Isolation Forest flags anomalous pattern; health drops to **CRITICAL** ($< 25/100$).
5. **Explainability:** View the **Root Evidence Card**:
   * *Mechanical Vibration severe deviation ($7.4\text{ mm/s}$ vs baseline $2.1\text{ mm/s}$)*
   * *Severe thermal rise ($69.2^\circ\text{C}$ vs baseline $48.2^\circ\text{C}$)*
   * *Power output deficit ($27.2\text{ kW}$ below expected capacity)*
6. **Configurable Financial Impact:** Adjust the **Power Tariff Slider** ($0.04 to $0.40/kWh) to show projected daily revenue losses computed dynamically.
7. **Priority Queue Escalation:** Open **Maintenance Priority**. Observe `WT-004` has automatically surged to **#1 in the queue** due to risk severity and revenue loss.
8. **Work Order Dispatch:** Click **"Dispatch Work Order"** on `WT-004`.
9. **Technician Workflow:** Switch to **Technician Workspace** (or log in as `technician@renewguard.io`).
   * Click **"Start On-Site Inspection"**.
   * Enter remediation notes: *"Inspected bearing housing, replaced degraded lubricant, cleaned thermal intake vents."*
   * Click **"Submit Outcome & Close Work Order"**.
10. **Closed Loop:** Telemetry returns to nominal baseline, health score restores to $100\%$, and work-order resolution is saved to the permanent audit log.

---

## 🧪 Automated Testing
Run the comprehensive test suite verifying the API boundary, Isolation Forest inference, tariff calculations, and data quality rejection:
```powershell
$env:PYTHONPATH = "backend"
.\.venv\Scripts\pytest.exe backend\tests\test_pipeline.py -v
```

---

## 🛡️ Anti-Hallucination Compliance (Spec §22)
* **Zero Fabricated Diagnostics:** Reports multivariate anomalies based on observable sensor deltas; does not fabricate unprovable sub-component diagnoses without sensor ground truth.
* **Data Quality Guards:** Rejects physically invalid telemetry (negative temperature/vibration); flags `DATA STALE` rather than claiming healthy state.
* **Persistent Noise Rejection:** Rejects single sensor reading spikes from raising false alarms.
* **Configurable Economics:** Explicitly treats electricity tariffs as adjustable operator parameters, avoiding hardcoded claims.
