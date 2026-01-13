
# PhysioTrace v2: AI-Powered Pharmacokinetic Simulator

## Overview

PhysioTrace v2 is a sophisticated web-based application that serves as a predictive pharmacokinetic (PK) simulation engine. It allows users to visualize the metabolic impact of medications and supplements on a personalized digital twin. By leveraging real-time bio-metric calibration and the power of the Google Gemini API, PhysioTrace provides deep insights into how different compounds are absorbed, distributed, metabolized, and eliminated by the body over time.

This tool is designed for educational and informational purposes, offering a dynamic way to explore the complex interplay between pharmacology and individual physiology.

---

## Core Features

- **Personalized Digital Twin:** Calibrate the simulation based on key bio-metrics like age, weight, and metabolic activity level to see how individual differences affect drug processing.

- **AI-Powered Compound Database:** Seamlessly search for common drugs and supplements. The Google Gemini API fetches and interprets complex pharmacological data to generate accurate PK parameters for new compounds on the fly.

- **Systemic Impact Visualization:** A dynamic radar chart shows the real-time load on various organ systems (hepatic, renal, neurological, etc.), providing an at-a-glance view of the drug's systemic impact compared to a normal baseline.

- **Comparative Analytics Suite:**
  - **Pharmacokinetic Curve:** A detailed graph plotting the plasma concentration of a drug over a 24-hour cycle, complete with toxicity thresholds and an interactive time-zoom brush.
  - **Metabolic Impact Analysis:** A comparative graph that visualizes how different levels of physical activity (from sedentary to hyper-metabolic) can alter a drug's clearance rate and duration of action.

- **Real-time AI Clinical Suggestions:** An integrated AI-powered panel analyzes the live simulation data to provide concise, context-aware clinical observations, noting when a drug is in its absorption phase, at peak concentration, or approaching sub-therapeutic levels.

- **Dynamic Dosing Protocol:** Build a custom timeline of doses for multiple compounds and instantly see how they interact and contribute to the overall plasma concentration.

---

## How to Use PhysioTrace

1.  **Select a Compound:** Start by choosing a pre-loaded compound from the list on the left-hand panel, or use the AI-powered search bar to find a new one.

2.  **Build Your Protocol:**
    - Use the "Protocol Stack" to manage doses.
    - Click **"Add Dose"** to schedule a new dose of the currently selected drug at the current simulation time.
    - Adjust the milligram amount or delete doses directly from the list.

3.  **Calibrate the Digital Twin:**
    - In the "Simulation Controls" panel at the bottom right, adjust the global time slider to scrub through the 24-hour simulation.
    - Input custom values for patient **Weight** and **Metabolic Activity** to see how the simulation changes in real time.

4.  **Analyze the Data:**
    - **Systemic Impact:** Observe the radar chart to see which organ systems are most affected at any given time.
    - **Drug Info Panel:** View FDA data, including indications and adverse reactions for the selected compound.
    - **Analytics Graphs:**
        - Toggle between the **"Pharmacokinetics"** and **"Activity Impact"** tabs to view different analyses.
        - Hover your mouse over the graphs to activate a synchronized crosshair, allowing you to inspect data points across all visualizations for a specific moment in time.
        - On the Pharmacokinetics graph, use the brush tool at the bottom to click and drag to zoom into a specific time range.

5.  **Leverage AI Insights:**
    - Look at the **"AI Clinical Snapshot"** panel on the left for real-time observations about the simulation state.
    - Click the refresh button to query the AI for a new insight at any time.

---

## Technology Stack

-   **Frontend:** React, TypeScript
-   **Styling:** Tailwind CSS
-   **Data Visualization:** Recharts
-   **AI & Data Fetching:** Google Gemini API
-   **API Data Source:** OpenFDA

---

## File Structure Overview

-   `App.tsx`: The main application component that manages state and orchestrates the UI.
-   `index.tsx`: The entry point for the React application.
-   `index.html`: The main HTML file, including CDN links for dependencies.
-   `components/`: Contains all reusable React components (graphs, panels, etc.).
-   `services/gemini.ts`: Handles all interactions with the Google Gemini API for drug searching and clinical suggestions, as well as the OpenFDA API.
-   `lib/simulation.ts`: Contains the core pharmacokinetic calculation logic (the Bateman function).
-   `constants.tsx`: Stores initial drug data and other static configuration values.
-   `types.ts`: Defines all TypeScript types and interfaces used throughout the application.
