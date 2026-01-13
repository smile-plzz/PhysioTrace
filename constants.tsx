
import { Drug } from './types';

export const DRUG_LIBRARY: Drug[] = [
  // Stimulants
  {
    id: "caffeine",
    name: "Caffeine",
    category: "Stimulant",
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
    id: "methylphenidate",
    name: "Methylphenidate",
    category: "Stimulant",
    description: "CNS stimulant used for ADHD.",
    halfLifeHours: 3.5,
    bioavailability: 0.3,
    timeToPeakHours: 2.0,
    volDistFactor: 2.7,
    toxicityThresholdMgL: 0.04, // approx therapeutic upper bound, actual toxicity higher
    metabolism: "hepatic",
    color: "#f97316",
    defaultDoseMg: 20
  },

  // Analgesics
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    category: "Analgesic",
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
    category: "Analgesic",
    description: "Analgesic and antipyretic.",
    halfLifeHours: 2.5,
    bioavailability: 0.88,
    timeToPeakHours: 1.0,
    volDistFactor: 0.95,
    toxicityThresholdMgL: 150.0,
    metabolism: "hepatic",
    color: "#3b82f6",
    defaultDoseMg: 500
  },
  {
    id: "aspirin",
    name: "Aspirin",
    category: "Analgesic",
    description: "Salicylate used to reduce pain, fever, or inflammation.",
    halfLifeHours: 0.25, // Very short parent half-life
    bioavailability: 0.68,
    timeToPeakHours: 0.5,
    volDistFactor: 0.17,
    toxicityThresholdMgL: 300.0,
    metabolism: "renal",
    color: "#ec4899",
    defaultDoseMg: 325
  },

  // Psychotropics
  {
    id: "sertraline",
    name: "Sertraline",
    category: "Psychotropic",
    description: "SSRI antidepressant.",
    halfLifeHours: 26,
    bioavailability: 0.44,
    timeToPeakHours: 6,
    volDistFactor: 25,
    toxicityThresholdMgL: 0.5,
    metabolism: "hepatic",
    color: "#10b981",
    defaultDoseMg: 50
  },
  {
    id: "alprazolam",
    name: "Alprazolam",
    category: "Psychotropic",
    description: "Benzodiazepine for anxiety disorders.",
    halfLifeHours: 11.2,
    bioavailability: 0.90,
    timeToPeakHours: 1.5,
    volDistFactor: 1.0,
    toxicityThresholdMgL: 0.1,
    metabolism: "hepatic",
    color: "#14b8a6",
    defaultDoseMg: 1
  },

  // Cardiovascular
  {
    id: "atorvastatin",
    name: "Atorvastatin",
    category: "Cardiovascular",
    description: "Statin medication for high cholesterol.",
    halfLifeHours: 14,
    bioavailability: 0.14,
    timeToPeakHours: 1.5,
    volDistFactor: 5.5,
    toxicityThresholdMgL: 0.05, // very low concentrations
    metabolism: "hepatic",
    color: "#f59e0b",
    defaultDoseMg: 20
  },
  {
    id: "metoprolol",
    name: "Metoprolol",
    category: "Cardiovascular",
    description: "Beta-blocker for high blood pressure.",
    halfLifeHours: 3.5,
    bioavailability: 0.50,
    timeToPeakHours: 1.5, // Tartrate
    volDistFactor: 4.2,
    toxicityThresholdMgL: 0.5,
    metabolism: "cardiovascular",
    color: "#6366f1",
    defaultDoseMg: 50
  },

  // Antibiotics
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    category: "Antibiotic",
    description: "Penicillin antibiotic.",
    halfLifeHours: 1.0,
    bioavailability: 0.95,
    timeToPeakHours: 2.0,
    volDistFactor: 0.3,
    toxicityThresholdMgL: 20.0,
    metabolism: "renal",
    color: "#8b5cf6",
    defaultDoseMg: 500
  },
  
  // Supplements
  {
    id: "melatonin",
    name: "Melatonin",
    category: "Supplement",
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
