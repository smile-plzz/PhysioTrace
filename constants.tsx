
import { Drug } from './types';

export const INITIAL_DRUGS: Drug[] = [
  {
    id: "caffeine",
    name: "Caffeine",
    description: "CNS stimulant. Blocks adenosine receptors.",
    halfLifeHours: 5.0,
    bioavailability: 0.99,
    timeToPeakHours: 0.75,
    volDistFactor: 0.7,
    toxicityThresholdMgL: 60.0,
    metabolism: "neurological",
    color: "#d97706",
    defaultDoseMg: 100
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    description: "NSAID used for pain and inflammation.",
    halfLifeHours: 2.0,
    bioavailability: 0.85,
    timeToPeakHours: 1.5,
    volDistFactor: 0.15,
    toxicityThresholdMgL: 80.0,
    metabolism: "gastric",
    color: "#ef4444",
    defaultDoseMg: 400
  },
  {
    id: "paracetamol",
    name: "Acetaminophen",
    description: "Analgesic and antipyretic.",
    halfLifeHours: 2.5,
    bioavailability: 0.88,
    timeToPeakHours: 1.0,
    volDistFactor: 0.95,
    toxicityThresholdMgL: 120.0,
    metabolism: "hepatic",
    color: "#3b82f6",
    defaultDoseMg: 500
  },
    {
    id: "sertraline",
    name: "Sertraline",
    description: "SSRI antidepressant.",
    halfLifeHours: 26,
    bioavailability: 0.44,
    timeToPeakHours: 6,
    volDistFactor: 25,
    toxicityThresholdMgL: 1.0,
    metabolism: "hepatic",
    color: "#10b981",
    defaultDoseMg: 50
  },
  {
    id: "atorvastatin",
    name: "Atorvastatin",
    description: "Statin medication for high cholesterol.",
    halfLifeHours: 14,
    bioavailability: 0.14,
    timeToPeakHours: 1.5,
    volDistFactor: 5.5,
    toxicityThresholdMgL: 2.0,
    metabolism: "hepatic",
    color: "#f59e0b",
    defaultDoseMg: 20
  },
  {
    id: "melatonin",
    name: "Melatonin",
    description: "Hormone regulating sleep-wake cycles.",
    halfLifeHours: 0.8,
    bioavailability: 0.15,
    timeToPeakHours: 0.5,
    volDistFactor: 1.2,
    toxicityThresholdMgL: 500.0,
    metabolism: "neurological",
    color: "#8b5cf6",
    defaultDoseMg: 3
  }
];

export const ACTIVITY_MULTIPLIERS = {
  1: 0.8, // Sedentary
  2: 0.9,
  3: 1.0, // Normal
  4: 1.2,
  5: 1.5  // Highly Active (faster clearance)
};
