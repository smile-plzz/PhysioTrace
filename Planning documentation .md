# Master Product Requirements Document (PRD): PhysioTrace

**Project Name:** PhysioTrace

**Version:** 2.0 (Execution Master)

**Status:** Approved for Development

**Target Deployment:** Vercel (Next.js / Serverless)

**Document Owner:** Product Development Lead

## 1. Executive Summary & Vision

**PhysioTrace** is a predictive health application that visualizes the "Digital Twin" of a user to simulate medication effects. It solves the problem of abstract medical jargon by converting pharmacokinetic data into intuitive, time-based visualizations (Pharmacokinetic curves, Organ Heatmaps, Vital Sign predictions).

**Mission:** To empower users to see the invisible impact of medication on their unique biology before ingestion.

## 2. Target Audience (Personas)

1. **The Bio-Hacker:** Metric-obsessed, uses wearables, wants to optimize caffeine/nootropic timing.
2. **The Cautious Patient:** Prescribed a new strong medication, anxious about side effects, wants reassurance.
3. **The Caregiver:** Managing meds for an elderly parent, needs to know when the "peak" effect occurs to schedule activities.

## 3. Success Metrics (KPIs)

- **Accuracy Perception:** >80% of users report the "Predicted Peak Time" aligned with their subjective feeling.
- **Engagement:** Average session time > 2 minutes (implies exploring the graphs, not just glancing).
- **Retention:** >30% return rate for second query within 30 days.

## 4. Functional Requirements (FR)

### Module 1: Bio-Initialization (The Digital Twin)

- **FR-1.1:** System must accept user inputs: Age (Int), Gender (Bio-Select), Height (CM/FT), Weight (KG/LBS), Activity Level (Likert Scale 1-5).
- **FR-1.2:** System must validate inputs to prevent impossible values (e.g., age > 120, weight < 20kg).
- **FR-1.3:** System must calculate **BMR** (Mifflin-St Jeor) and **BSA** (Du Bois) immediately upon input to establish the baseline state.
- **FR-1.4 (Storage):** For MVP, store user profile in `localStorage` for privacy and speed. Phase 2 moves to Supabase Auth.

### Module 2: Drug Query & Data Retrieval

- **FR-2.1:** User searches for a drug via text string (fuzzy matching supported).
- **FR-2.2:** System retrieves `DrugData` JSON containing: `halfLife`, `Tmax` (Time to peak), `Bioavailability`, and `ToxicityThresholds`.
- **FR-2.3:** System must display a "Confidence Score" for the data (e.g., "Data based on FDA Label 2023").

### Module 3: The Simulation Engine (Core Logic)

- **FR-3.1 (PK Solver):** Calculate plasma concentration `C(t)` for t=0 to t=24 hours using the First-Order Absorption formula modulated by user weight/metabolism.
- **FR-3.2 (Organ Logic):**
    - If `Drug.metabolism == 'hepatic'`, map Liver Intensity = `C(t)` * `LiverLoadFactor`.
    - If `Drug.excretion == 'renal'`, map Kidney Intensity = `C(t)` delayed by 2 hours.
- **FR-3.3 (Vitals Logic):** Apply specific multipliers. E.g., if drug is 'Stimulant', `HeartRate(t) = BaselineHR + (Concentration(t) * StimulantFactor)`.

### Module 4: The Dashboard (Visualization)

- **FR-4.1:** **Time Slider:** A global control (0h - 24h) that updates all dependent graphs synchronously.
- **FR-4.2:** **Main Graph (PK):** Rendered via **Recharts**. X-Axis=Time, Y-Axis=Concentration.
- **FR-4.3:** **Body Map:** Rendered via **R3F (Three.js)** or layered SVG. Organs change opacity/color based on the specific time tick selected on the slider.

## 5. Technical Architecture & Stack

### 5.1 Frontend (Vercel/Next.js)

- **Framework:** Next.js 14 (App Router).
- **Language:** TypeScript (Strict Mode).
- **State Management:** `Zustand` (for global Time Slider state and User Profile).
- **Styling:** Tailwind CSS + Shadcn/UI (Radix).
- **3D/Graphics:** `react-three-fiber` (Body) + `recharts` (Data).

### 5.2 Backend & Data

- **API:** Next.js Server Actions (No external API server needed for MVP).
- **Database:** Supabase (PostgreSQL) - Used for Phase 2 user accounts.
- **Static Data:** `data/drugs.json` - A curated list of 50 common drugs for the MVP to ensure high-quality simulation data.

### 5.3 Simulation Algorithms (Reference)

The developer must implement the following in `utils/simulation.ts`:

```
// Core formula for concentration curve
export const calculateConcentration = (
  dose: number,
  time: number,
  halfLife: number,
  weight: number
) => {
  const k = 0.693 / halfLife; // Elimination rate
  const ka = 1.5; // Absorption constant (approx for oral)
  const Vd = weight * 0.7; // Volume of distribution

  // Bateman Function
  return (dose * ka / (Vd * (ka - k))) * (Math.exp(-k * time) - Math.exp(-ka * time));
};

```

## 6. Comprehensive Roadmap

### Phase 1: The MVP (Weeks 1-4)

- **Goal:** A working "Input -> Graph" loop for 10 common drugs.
- **Scope:**
    - No user accounts (Guest mode only).
    - Hardcoded drug database (Ibuprofen, Caffeine, Adderall, Tylenol).
    - Visuals: 2D Line Graph + Basic SVG Body Map (Color change only).
- **Deliverable:** Deployed URL on Vercel.

### Phase 2: Persistence & Expansion (Weeks 5-8)

- **Goal:** User Accounts and Custom Stacks.
- **Scope:**
    - Supabase Auth integration.
    - "Medicine Cabinet" feature (Save your frequent drugs).
    - **3D Body Map Upgrade:** Implement React-Three-Fiber model.
    - **Drug Interaction Check:** Basic warning if Drug A + Drug B selected.

### Phase 3: The Connected Self (Weeks 9-16)

- **Goal:** Real-world validation.
- **Scope:**
    - **Apple HealthKit API:** Read "Resting Heart Rate" to calibrate the baseline.
    - **Genomic Flag:** "I have CYP2D6 mutation" toggle (alters metabolism algorithm).
    - **Export to PDF:** Generate a doctor-friendly report.

## 7. Safety, Compliance & Constraints

### 7.1 Regulatory (Non-Functional Requirement)

- **Disclaimer Mode:** The app **MUST** launch a modal on first load: *"This is a simulation for educational purposes only. Do not alter medication usage without doctor consultation."*
- **Data Privacy:** No PII (Personally Identifiable Information) stored in Phase 1. Phase 2 requires HIPAA-compliant encrypted storage (Supabase handles encryption at rest).

### 7.2 Safety Logic Constraints

- **Pediatric Guardrails:** If `Age < 12`, the app forces a "Pediatric Mode" warning and restricts certain drug visualizations.
- **Toxicity Red Line:** All graphs must have a horizontal dashed red line indicating the `LD50` or toxic threshold for that specific body weight.

## 8. Developer Implementation Guide (Getting Started)

1. **Initialize Project:**`npx create-next-app@latest physiotrace --typescript --tailwind --eslint`
2. **Install Core Libs:**`npm install recharts three @types/three @react-three/fiber lucide-react clsx tailwind-merge`
3. **Scaffold Directory:**
    - `src/components/simulation/` (Graph logic)
    - `src/lib/algorithms.ts` (Math functions)
    - `src/data/drug-db.json` (Static data)

---

### 1. Strategic Analysis & Refinements

Before starting development, we need to tighten the logic in **Module 3 (Simulation Engine)** to ensure the "Accuracy Perception" KPI is met.

A. The Volume of Distribution ($V_d$) Nuance

The PRD suggests a constant for Volume of Distribution: $V_d = weight \times 0.7$.

- **Critique:** This assumes the drug distributes evenly in body water (approx 0.7 L/kg). However, lipophilic drugs (fat-soluble) or highly protein-bound drugs have vastly different $V_d$.
- **Solution:** Move `volumeDistributionFactor` into the `drugs.json` schema rather than hardcoding it in the algorithm. This allows you to tweak specific drugs (e.g., Caffeine vs. Ibuprofen) without changing the code.

**B. Performance vs. Visualization (R3F)**

- **Risk:** **FR-4.3** requires the 3D body map to update opacity based on the time slider. If you trigger a full React re-render of a complex 3D mesh every millisecond the slider moves, the app will lag.
- **Solution:** Use **transient updates** via `react-three-fiber` (interacting directly with the DOM/WebGL layer) rather than React state for the animation loop, or throttle the slider updates to 30fps.

---

### 2. Data Schema Design (The Backbone)

Since the MVP relies on `drugs.json`, structuring this correctly is critical. Here is the recommended TypeScript interface to satisfy **FR-2.2** and **FR-3.2**.

TypeScript

# 

`// src/types/drug.ts

export type OrganTarget = 'hepatic' | 'renal' | 'cardiovascular' | 'neurological';

export interface DrugData {
  id: string;
  name: string;
  description: string;
  halfLifeHours: number;      // t1/2
  bioavailability: number;    // F (0.0 - 1.0)
  timeToPeakHours: number;    // Tmax
  volDistFactor: number;      // Vd factor (replacing the hardcoded 0.7)
  toxicityThreshold: number;  // mg/L
  metabolism: OrganTarget;    // Where the load is heaviest
  colorHex: string;           // For the graph line
}`

---

### 3. The Simulation Algorithm (Refined)

I have refined the algorithm from **FR-5.3** to use strict typing and handle the edge cases mentioned in the PRD.

[Image of pharmacokinetic time concentration curve](https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQSdbVymwu8H9nEqyqkR48YfeJ_8UKp3_kIuVI_WY-28TaTwQEOzmLMkbyX0nWK2FH18D4vTC2AE7gbzUz3bTXqxIMG8KOQo6G-e7gYiZsN5soYtK8)

Shutterstock

Explore

Key Formula Concept:

We are calculating $C_t$ (Concentration at time $t$).

$$C_t = \frac{D \cdot k_a}{V_d \cdot (k_a - k_{el})} \cdot (e^{-k_{el} \cdot t} - e^{-k_a \cdot t})$$

**Implementation:**

TypeScript

# 

`// src/lib/simulation.ts

import { DrugData } from '@/types/drug';

interface SimulationParams {
  drug: DrugData;
  doseMg: number;     // User input dose
  weightKg: number;   // User weight
  timeHours: number;  // Current time point (t)
}

export const calculateConcentration = ({
  drug,
  doseMg,
  weightKg,
  timeHours
}: SimulationParams): number => {
  if (timeHours < 0) return 0;

  // 1. Elimination Rate Constant (k or kel)
  // k = ln(2) / half-life
  const k_el = 0.693 / drug.halfLifeHours;

  // 2. Absorption Constant (ka)
  // We approximate ka based on Tmax if not provided, but 1.5 is a safe MVP default for oral meds
  const k_a = 1.5; 

  // 3. Volume of Distribution (Vd)
  // Adjusted by the drug's specific distribution factor (e.g., 0.7 for water-soluble)
  const Vd = weightKg * drug.volDistFactor;

  // 4. Bioavailable Dose (F * D)
  const effectiveDose = doseMg * drug.bioavailability;

  // 5. Bateman Function (First-order absorption, one-compartment model)
  const preFactor = (effectiveDose * k_a) / (Vd * (k_a - k_el));
  const decayCurve = Math.exp(-k_el * timeHours);
  const absorptionCurve = Math.exp(-k_a * timeHours);

  const concentration = preFactor * (decayCurve - absorptionCurve);

  // Return 0 if practically eliminated to prevent tiny floating point numbers
  return concentration > 0.001 ? concentration : 0;
};`

---

### 4. Implementation Roadmap: The First Sprint

Based on **Phase 1 (Weeks 1-4)**, here is how we break down the tasks:

| **Step** | **Component** | **Task Detail** |
| --- | --- | --- |
| **1** | **Scaffold** | Setup Next.js 14, install Shadcn/UI, set up Zustand store for `UserProfile` and `TimeSlider`. |
| **2** | **Core Logic** | Create `drugs.json` with 3 dummy drugs. Implement the `calculateConcentration` function. Write a Jest test to verify the math outputs a curve (starts at 0, goes up, goes down). |
| **3** | **Input UI** | Build the "Bio-Initialization" form. Save data to `localStorage` on submit. |
| **4** | **Vis 1 (2D)** | Implement Recharts. Map the `calculateConcentration` function over an array of `[0, 0.5, ... 24]` hours to generate the line chart data. |
| **5** | **Vis 2 (Body)** | **MVP Shortcut:** Instead of full 3D for Week 1, use an SVG map of the body. Bind the opacity of the `<path id="liver">` to the current concentration value. |
| **6** | **Compliance** | Add the `Dialog` component from Shadcn for the "Medical Disclaimer" modal on app mount. |

---

### 5. Technical Architecture Visual

This is how the data flows in your **Vercel / Serverless** environment:

1. **Client (Browser):** User inputs Bio-Metrics $\rightarrow$ stored in `Zustand/LocalStorage`.
2. **Action:** User selects "Caffeine" $\rightarrow$ Queries `drugs.json` (Static Import).
3. **Computation:** `simulation.ts` runs entirely client-side (Zero latency).
4. **Render:**
    - **Recharts** receives an array of 48 data points (30-min intervals).
    - **R3F/SVG** receives a single reactive value (Current Concentration) based on Slider position.

---

### 

### 1. Product Description

*Context: This text bridges the gap between the "Bio-Hacker" persona and the technical implementation. It sells the vision.*

---

# PhysioTrace: The Digital Twin Pharmacokinetic Simulator

**PhysioTrace** is a predictive health engine that visualizes the invisible. By creating a "Digital Twin" of your biology, it simulates exactly how medications and supplements travel through your body, metabolize in your organs, and influence your vital signs over time.

We move beyond abstract dosage instructions ("Take 1 tablet every 4 hours") to reveal the biological reality: **Simulate before you ingest.**

### ⚡ Core Capabilities

- **The Pharmacokinetic Engine:** Powered by the Bateman Function, our algorithm calculates real-time plasma concentration levels based on your unique height, weight, age, and metabolic rate.
- **4D Organ Visualization:** Watch your liver and kidneys process compounds in real-time. As the concentration curve rises, see the metabolic load shift from absorption (Gut) to metabolization (Liver) and excretion (Kidneys).
- **Safety Guardrails:** Every simulation overlays your personal Toxicity Threshold. See exactly when a "double dose" crosses from therapeutic to toxic.
- **Bio-Hacker Optimization:** Trying to time your caffeine peak for a workout? Or ensure your Melatonin hits $T_{max}$ exactly at bedtime? PhysioTrace aligns your schedule with your biology.

### 🏗 Tech Stack

- **Core:** Next.js 14 (Serverless), TypeScript, Zustand.
- **Vis:** Recharts (PK Curves) + React-Three-Fiber (Organ Digital Twin).
- **Science:** First-order absorption kinetics, calibrated against FDA label data ($T_{max}$, $t_{1/2}$, $V_d$).

---

### 2. Static Data: `drugs.json`

I have compiled the pharmacokinetic constants for the 5 requested drugs.

- **Note on Logic:** `volDistFactor` (Volume of Distribution) determines how "diluted" the drug gets. Lower numbers (Ibuprofen) mean it stays in the blood; higher numbers (Adderall) mean it soaks into tissues/fat.
- **Note on Toxicity:** `toxicityThresholdMgL` is the plasma concentration (Y-Axis value) where side effects typically become dangerous.

JSON

# 

`[
  {
    "id": "caffeine_standard",
    "name": "Caffeine",
    "description": "Central nervous system stimulant. Blocks adenosine receptors to reduce drowsiness.",
    "halfLifeHours": 5.0,
    "bioavailability": 0.99,
    "timeToPeakHours": 0.75,
    "volDistFactor": 0.7,
    "toxicityThresholdMgL": 80.0,
    "metabolism": "hepatic",
    "colorHex": "#a16207"
  },
  {
    "id": "ibuprofen_200",
    "name": "Ibuprofen",
    "description": "NSAID used for treating pain, fever, and inflammation.",
    "halfLifeHours": 2.0,
    "bioavailability": 0.85,
    "timeToPeakHours": 1.5,
    "volDistFactor": 0.15,
    "toxicityThresholdMgL": 100.0,
    "metabolism": "renal",
    "colorHex": "#ef4444"
  },
  {
    "id": "paracetamol_500",
    "name": "Paracetamol (Acetaminophen)",
    "description": "Analgesic and antipyretic. heavily metabolized by the liver.",
    "halfLifeHours": 2.5,
    "bioavailability": 0.88,
    "timeToPeakHours": 0.8,
    "volDistFactor": 0.95,
    "toxicityThresholdMgL": 150.0,
    "metabolism": "hepatic",
    "colorHex": "#3b82f6"
  },
  {
    "id": "adderall_ir",
    "name": "Adderall (Amphetamine Salts)",
    "description": "CNS stimulant affecting dopamine and norepinephrine systems.",
    "halfLifeHours": 10.0,
    "bioavailability": 0.75,
    "timeToPeakHours": 3.0,
    "volDistFactor": 4.0,
    "toxicityThresholdMgL": 0.2,
    "metabolism": "hepatic",
    "colorHex": "#f97316"
  },
  {
    "id": "melatonin_ir",
    "name": "Melatonin",
    "description": "Hormone that regulates the sleep–wake cycle.",
    "halfLifeHours": 0.75,
    "bioavailability": 0.15,
    "timeToPeakHours": 0.5,
    "volDistFactor": 1.2,
    "toxicityThresholdMgL": 1000.0,
    "metabolism": "hepatic",
    "colorHex": "#8b5cf6"
  }
]`

### 3. Implementation Guide for `simulation.ts`

When you implement the `calculateConcentration` function I provided earlier, ensure you map the data correctly.

- **Visual Scaling:** Adderall's concentrations (0.05 - 0.1 mg/L) are tiny compared to Ibuprofen (20 - 40 mg/L).
- **Recommendation:** When rendering the graph, **don't use a fixed Y-axis 0-100**. Use `Recharts`' `<YAxis domain={['auto', 'auto']} />` or normalize the data to "Percent of Peak" for the visual curve, while showing the raw numbers in the tooltip.

### Master Product Requirements Document (PRD)

---

Project: PhysioTrace

Version: 2.1 (Execution Master)

Status: Ready for Development

Target Deployment: Vercel (Next.js 14 Serverless)

---

## 1. Executive Summary

PhysioTrace is a predictive health simulation engine. It creates a "Digital Twin" of the user's metabolism to visualize how medications travel through the body, organ by organ. It translates abstract pharmacokinetic data (Half-life, $T_{max}$) into intuitive, time-based visualizations to help users understand the "invisible" impact of what they ingest.

**Core Value Proposition:** "See the curve before you swallow the pill."

## 2. User Personas

1. **The Bio-Hacker:** Optimizing caffeine for workouts or melatonin for sleep; cares about peak times ($T_{max}$).
2. **The Cautious Patient:** Anxious about new medication side effects; needs visual reassurance of when the drug leaves their system.
3. **The Caregiver:** Managing meds for others; needs to know when efficacy wears off.

---

## 3. Functional Requirements (FR)

### Module 1: Bio-Initialization (Input Layer)

- **FR-1.1:** User inputs biological metrics: Age, Gender, Height (cm), Weight (kg).
- **FR-1.2:** System calculates **Basal Metabolic Rate (BMR)** using the *Mifflin-St Jeor* equation.
- **FR-1.3:** System calculates **Body Surface Area (BSA)** using the *Du Bois* formula.
- **FR-1.4:** Data persistence: Inputs are stored in `localStorage` (Client-side only for MVP) to persist across sessions without a backend database.

### Module 2: The Simulation Engine (Logic Layer)

- **FR-2.1:** System runs the **Bateman Function** (First-order absorption, one-compartment model) to generate a concentration curve $C(t)$ for 0–24 hours.
- **FR-2.2:** The algorithm must adjust dynamically based on:
    - **User Weight:** Affects Volume of Distribution ($V_d$).
    - **Drug Properties:** Half-life ($t_{1/2}$), Bioavailability ($F$), and Absorption Rate ($k_a$).
- **FR-2.3:** **Toxicity Check:** If Peak Concentration ($C_{max}$) > `toxicityThreshold` defined in `drugs.json`, the UI must trigger a "High Load" warning.

### Module 3: Visualization (Presentation Layer)

- **FR-3.1:** **Pharmacokinetic Graph (2D):** A Line Chart (Recharts) showing Plasma Concentration vs. Time.
    - *Interactive:* Hovering over the chart updates the "Current Time" state.
- **FR-3.2:** **Organ Heatmap (Visual):** An SVG or 3D Model of the body.
    - **Liver:** Opacity increases based on plasma concentration (Hepatic load).
    - **Kidneys:** Opacity increases with a 2-hour delay (Renal excretion phase).
- **FR-3.3:** **Global Time Slider:** A generic slider (0–24h) that controls the "Active Time" state, synchronizing the Graph and the Body Map.

---

## 4. Data Architecture

### 4.1 Static Database (`drugs.json`)

We avoid a complex backend for Phase 1 by using a strictly typed JSON file.

TypeScript

# 

`// Schema Definition
export interface DrugData {
  id: string;               // Unique slug (e.g., "caffeine_200")
  name: string;             // Display name
  halfLifeHours: number;    // Elimination half-life
  bioavailability: number;  // 0.0 to 1.0 (Fraction absorbed)
  timeToPeakHours: number;  // Tmax (Time to reach Cmax)
  volDistFactor: number;    // L/kg (Low = blood bound, High = tissue bound)
  toxicityThreshold: number;// mg/L (Plasma concentration warning level)
  metabolism: 'hepatic' | 'renal'; // Target organ for visual highlighting
  colorHex: string;         // Graph line color
}`

### 4.2 The Algorithm (Bateman Function)

The core math to be implemented in `src/lib/simulation.ts`:

$$C(t) = \frac{D \cdot F \cdot k_a}{V_d \cdot (k_a - k_{el})} \cdot (e^{-k_{el} \cdot t} - e^{-k_a \cdot t})$$

Where:

- $D$ = Dose (mg)
- $V_d$ = User Weight (kg) $\times$ Drug `volDistFactor`
- $k_{el}$ = 1$0.693 / \text{HalfLife}$
- $k_a$ = Estimated as $2.5 / T_{max}$ (Approximation for oral absorption)

---

## 5. Technical Stack & Directory Structure

Framework: Next.js 14 (App Router)

Language: TypeScript2

State: Zustand (Global store for UserConfig and SimulationTime)

Styling: Tailwind CSS + Shadcn/UI

Viz: Recharts (Graphs) + Lucide React (Icons)

### Recommended Scaffold

Plaintext

# 

`src/
├── app/
│   ├── layout.tsx        # Main layout with Navbar
│   └── page.tsx          # Dashboard (Split view: Inputs | Graph | Body)
├── components/
│   ├── bio/              # Forms for Age/Weight/Height
│   ├── simulation/       # PKGraph.tsx, TimeSlider.tsx
│   └── visuals/          # BodyMap.tsx (SVG/Canvas)
├── lib/
│   ├── simulation.ts     # The Bateman Function logic
│   └── store.ts          # Zustand state definition
└── data/
    └── drugs.json        # The static database`

---

## 6. Roadmap

### Phase 1: MVP (Weeks 1-2)

- **Goal:** Working "Input $\to$ Graph" loop.
- **Scope:**
    - Hardcoded `drugs.json` (5 drugs).
    - Local Storage for user profile.
    - 2D Line Graph + Basic SVG Body Map (color intensity changes).
- **Deliverable:** Vercel URL.

### Phase 2: "The Medicine Cabinet" (Weeks 3-5)

- **Goal:** Multi-drug management.
- **Scope:**
    - "Add to Stack" feature (Simulate Caffeine + Theanine together).
    - Supabase integration for saving user stacks.
    - 3D Body Map (React Three Fiber) replacing the SVG.

### Phase 3: Real-World Calibration (Weeks 6+)

- **Goal:** Accuracy validation.
- **Scope:**
    - Apple HealthKit integration (Import weight/heart rate).
    - PDF Export for doctor consultations.

---

## 7. Safety & Compliance (Non-Functional)

1. **Disclaimer Modal:** On first load, user must acknowledge: *"This tool is for educational simulation only. It is not medical advice."*
2. **Pediatric Lock:** If `Age < 12`, display a warning banner on all graphs.
3. **Privacy:** Phase 1 stores **zero** data on servers. All PII (weight/age) lives in the user's browser `localStorage`.

---

---

### 1. Validation Protocol (`VALIDATION.md`)

*Place this in your root directory. It is your "Medical Logic Shield" against inaccuracy.*

Markdown

# 

`# PhysioTrace Safety & Validation Protocol
****Version:**** 1.0
****Status:**** Active
****Owner:**** Engineering Lead

## 1. Objective
This document defines the testing standards required to verify that the PhysioTrace "Digital Twin" simulation matches known clinical pharmacokinetic data. All algorithmic changes to `src/lib/simulation.ts` must pass the benchmarks below.

## 2. Safety Guardrails (Logic Gates)
The application must enforce the following constraints to prevent harmful misinformation.

| Scenario | Trigger Condition | System Response |
| :--- | :--- | :--- |
| ****Pediatric Safety**** | `User.age < 12` | ****Strict Lock:**** Display "Pediatric Mode" banner. Mask toxicity thresholds. Show simplified visualizations only. |
| ****Toxicity Alert**** | $C*_{max} > \text{Drug.toxicityThreshold}$ | ****Visual Alarm:**** Graph curve turns RED. Warning modal appears: "Simulated dose exceeds safe limits." |
| ****Impossible Biometrics**** | `Weight < 20kg` OR `Weight > 300kg` | ****Input Validation:**** Form rejects submission. Tooltip: "Please enter a medically valid weight." |
| ****Zero Time Calculation**** | `Time < 0` | ****Math Safety:**** Return `0` concentration (prevents negative math errors). |

## 3. Algorithm Calibration (Truth Table)
We validate the ****Bateman Function**** against standard clinical textbook values for a "Standard 70kg Male."

### Benchmark A: Caffeine (Rapid Absorption)
* ****Scenario:**** 70kg Male, 200mg Dose (Oral).
* ****Clinical Standard:**** Peak ($T_*{max}$) at ~45 mins. Peak Concentration ($C*_{max}$) ~3-5 mg/L.
* ****Acceptance Criteria:****
    * Simulated $T_*{max}$ must be between ****30 - 60 mins****.
    * Simulated $C*_{max}$ must be between ****3.0 - 6.0 mg/L****.

### Benchmark B: Ibuprofen (NSAID)
* ****Scenario:**** 70kg Male, 400mg Dose.
* ****Clinical Standard:**** Peak ($T_*{max}$) at ~1.5 - 2.0 hours.
* ****Acceptance Criteria:****    * Simulated $T*_{max}$ must be between ****1.2 - 2.2 hours****.
    * Curve must show < 10% concentration remaining after 12 hours.

### Benchmark C: Adderall IR (Amphetamine Salts)
* ****Scenario:**** 70kg Male, 20mg Dose.
* ****Clinical Standard:**** Long elimination half-life (~10 hours).
* ****Acceptance Criteria:****
    * Concentration at Hour 10 must be approx. 50% of $C_*{max}$.

## 4. Edge Case Testing Strategy
Run the test suite `npm test simulation` to cover these extremes:
1.  ****The "Massive Volume" User:**** 150kg user (Should show significantly **lower** peak concentration due to higher $V*_d$).
2.  ****The "Tiny" User:**** 45kg user (Should show significantly *higher* peak concentration).
3.  ****The "Mega Dose":**** 5000mg input (Must trigger Toxicity Red Line immediately).*`

---

### 2. Repository README (`README.md`)

*Place this in the root directory. It explains "How to Drive" the codebase.*

Markdown

# 

`# PhysioTrace: Pharmacokinetic Digital Twin

![Status](https://img.shields.io/badge/Status-MVP_Development-blue) ![License](https://img.shields.io/badge/License-MIT-green)

PhysioTrace is a predictive health application that visualizes the "Digital Twin" of a user to simulate medication effects. It converts abstract medical data ($t*_{1/2}$, $T_*{max}$) into intuitive, time-based visualizations.

****Mission:**** To empower users to see the invisible impact of medication on their unique biology before ingestion.

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js 18+
* npm or yarn

### 2. Installation
```bash
git clone https://github.com/your-username/physiotrace.git
cd physiotrace
npm install`

### 3. Run Development Server

Bash

# 

`npm run dev`

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000&authuser=1) to see the app.

---

## 🧠 The Math Explainer (For Developers)

The core of this app is the **Simulation Engine** located in `src/lib/simulation.ts`. It uses a pharmacokinetic formula called the **Bateman Function**.

The Concept:

Imagine pouring water into a bucket that has a hole in the bottom.

- **Input:** Water pouring in = **Absorption** ($k_a$).
- **Output:** Water leaking out = **Elimination** ($k_{el}$ or $k$).
- **Result:** The water level at any specific second = **Plasma Concentration** ($C_t$).

The Formula:

$$ C(t) = \frac{D \cdot F \cdot k_a}{V_d \cdot (k_a - k_{el})} \cdot (e^{-k_{el} \cdot t} - e^{-k_a \cdot t}) $$

- **$D$ (Dose):** How much drug was taken (mg).
- **$V_d$ (Volume of Distribution):** How big the "bucket" is (based on user weight).
- **$k_a$ & $k_{el}$:** Speed constants derived from the drug's properties in `drugs.json`.

⚠️ Developer Warning:

Do not manually tweak the math constants in simulation.ts to make the graph "look better." Only adjust the input data in drugs.json based on clinical literature.

---

## 📂 Architecture

Plaintext

# 

`src/
├── app/                  # Next.js App Router
│   └── page.tsx          # Main Dashboard (Input + Graph + Body)
├── components/
│   ├── bio/              # User Input Forms (Weight/Age)
│   ├── simulation/       # Recharts Logic (The Graph)
│   └── visuals/          # The "Digital Twin" (Body Map SVG/R3F)
├── data/
│   └── drugs.json        # Static Database (The Source of Truth)
├── lib/
│   ├── simulation.ts     # The Bateman Function Algorithm
│   └── store.ts          # Zustand State (Global User/Time State)
└── types/                # TypeScript Interfaces`

## 🧪 Testing

Run the validation suite to ensure the simulated biology remains accurate:

Bash

`npm test`

Refer to `VALIDATION.md` for the specific clinical benchmarks.