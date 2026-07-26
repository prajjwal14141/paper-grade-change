# System Architecture & Technical Deep-Dive: Grade Change Intelligence (AuraControl)

## 1. System Overview
AuraControl is a distributed, Human-in-the-Loop (HITL) predictive intelligence platform designed for Industrial Quality Control Systems (QCS). It predicts >2.5% off-spec Basis Weight deviations during Paper Machine Direction (MD) grade changes and provides mathematically grounded setpoint recommendations to stabilize the machine faster than manual baseline methods.

## 2. High-Level Data Flow
The architecture operates on a continuous, closed-loop telemetry cycle:
`[Industrial Simulator]` ➔ `[Node.js Gateway]` ➔ `[MongoDB Historian]` ➔ `[Python FastAPI Engine]` ➔ `[React Operator Dashboard]` ➔ `[Node.js Gateway]` ➔ `[Simulator Physical Interpolation]`

---

## 3. Core Modules & Internal Mechanics

### A. Industrial IoT Digital Twin (`iot_simulator.py`)
This is not a static data generator; it is a live physics state-machine that mimics a multivariable paper machine.
*   **State Machine Logic:** Cycles infinitely between `NORMAL`, `ANOMALY`, `WAITING`, and `RECOVERY` states.
*   **Physics Engine:** Applies Gaussian noise to all sensor readings to simulate real-world sensor inaccuracies. During an anomaly, it mathematically drifts variables (Steam, Stock Flow, Caliper) away from their targets, dragging the dependent Basis Weight off-spec.
*   **Command Bridge Polling:** Uses a non-blocking `HTTP GET` request (`/api/command`) every 2 seconds to listen for operator feedback without freezing the physical simulation.
*   **Gradual Interpolation:** When AI recommendations are accepted, it uses a `move_towards` function to smoothly interpolate parameters back to safe limits at an accelerated rate (30% recovery per tick vs. 10% manual recovery).

### B. Backend Ingestion & Data Historian (`server.js`)
Built on Express and Mongoose, this serves as the central API gateway and DCS Historian.
*   **Historian Capabilities:** Validates incoming telemetry via `/api/ingest` and stores it in MongoDB Atlas. It serves the last 120 chronological readings to the React UI for live timeline rendering.
*   **Race-Condition Handling:** The `/api/feedback` endpoint acts as a buffer. It securely logs operator decisions to the database and temporarily holds the command in memory until the Python Simulator successfully polls for it, ensuring no UI clicks are lost during network latency.

### C. Machine Learning Intelligence Layer (`engine.py`)
The predictive core running a Pandas and Scikit-learn pipeline via FastAPI.
*   **Rolling Window Analysis:** Pulls the latest 100 historical readings from MongoDB to compute a real-time Pearson Correlation Matrix across 8+ physical parameters.
*   **Hidden Correlation Discovery:** Engineered to dynamically detect environmental factors (e.g., `ambient_humidity`) and flag their impact on paper quality—variables usually ignored by traditional QCS.
*   **Industrial Loop Mapping:** Mathematically maps correlated parameters to their strict PID control loops (Wet End, Dryer Section, Calender) to pinpoint the exact physical location of the anomaly.
*   **Predictive Outputs:** Calculates a 3-minute future state trajectory and generates numerical setpoint offsets (e.g., Steam Pressure: 58.0 PSI) to counteract recipe limit deviations.

### D. Operator Dashboard (React.js)
The human interface, heavily reliant on asynchronous polling and dynamic state rendering.
*   **Live Visualization:** Uses `Recharts` to map the Basis Weight trajectory against dynamic upper and lower (2.5%) limit boundaries.
*   **Dynamic Intelligence Panel:** Parses the FastAPI correlation payload to visually tag parameters to their respective industrial loops, highlighting High Impact constraints in real-time.
*   **Human-in-the-Loop (HITL) Action Panel:** Renders a responsive state machine. It displays the AI rationale and future trajectory, captures Accept/Reject decisions, and dynamically updates its UI state (e.g., displaying "AI Override Implemented" vs. "Manual Intervention Required") while the chart live-updates the physical recovery.

## 4. Constraint Fulfillment
*   **Historical Data:** All predictions are grounded in the MongoDB continuous storage stream.
*   **Parameter Requirements:** Incorporates Stock flow, filler flow, steam pressure, machine speed, moisture, ash, caliper, and recipe limits.
*   **Closed-Loop Accuracy:** The system permanently records operator rejection/acceptance rates to continuously evaluate the quality of the model's suggestions.