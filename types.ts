
export type OrganTarget = 'hepatic' | 'renal' | 'cardiovascular' | 'neurological' | 'gastric';

export interface Drug {
  id: string;
  name: string;
  description: string;
  halfLifeHours: number;
  bioavailability: number;
  timeToPeakHours: number;
  volDistFactor: number;
  toxicityThresholdMgL: number;
  metabolism: OrganTarget;
  color: string;
  defaultDoseMg: number;
}

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: 1 | 2 | 3 | 4 | 5;
}

export interface Dose {
  id: string;
  drugId: string;
  timestamp: number; // Hours from simulation start
  amountMg: number;
}

export interface SimulationResult {
  time: number;
  concentration: number;
  isToxic: boolean;
  organLoads: Record<OrganTarget, number>;
}

export interface FdaDrugInfo {
  brandName: string;
  genericName: string;
  manufacturer: string;
  description: string;
  indications: string;
  reactions: string;
}
