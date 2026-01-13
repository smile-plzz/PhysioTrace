
import { Drug, UserProfile, Dose, SimulationResult, OrganTarget } from '../types';
import { ACTIVITY_MULTIPLIERS } from '../constants';

/**
 * Calculates drug concentration at a specific time point using the Bateman function.
 * Accounts for first-order absorption and elimination.
 */
export const calculatePointConcentration = (
  timeHours: number,
  dose: Dose,
  drug: Drug,
  user: UserProfile
): number => {
  const t = timeHours - dose.timestamp;
  if (t < 0) return 0;

  // Metabolic adjustment
  const activityMod = ACTIVITY_MULTIPLIERS[user.activityLevel];
  const ageMod = user.age > 65 ? 0.7 : 1.0;
  
  // Rate constants
  const k_el = (0.693 / drug.halfLifeHours) * activityMod * ageMod;
  const k_a = 2.5 / drug.timeToPeakHours; // Approximation of absorption rate constant
  
  // Volume of Distribution
  const Vd = user.weight * drug.volDistFactor;
  const effectiveDose = dose.amountMg * drug.bioavailability;

  // Bateman Function - handle case where k_a is very close to k_el
  if (Math.abs(k_a - k_el) < 1e-9) {
    const concentration = (effectiveDose * k_a * t * Math.exp(-k_a * t)) / Vd;
    return Math.max(0, concentration);
  }

  const preFactor = (effectiveDose * k_a) / (Vd * (k_a - k_el));
  const absorption = Math.exp(-k_el * t);
  const elimination = Math.exp(-k_a * t);

  const concentration = preFactor * (absorption - elimination);
  return Math.max(0, concentration);
};

export const runFullSimulation = (
  timeRange: number[],
  activeDoses: Dose[],
  allDrugs: Drug[],
  user: UserProfile
): SimulationResult[] => {
  return timeRange.map(t => {
    let totalConc = 0;
    const drugContributions: Record<string, number> = {};
    
    activeDoses.forEach(dose => {
      const drug = allDrugs.find(d => d.id === dose.drugId);
      if (drug) {
        const conc = calculatePointConcentration(t, dose, drug, user);
        totalConc += conc;
        if (!drugContributions[drug.id]) {
          drugContributions[drug.id] = 0;
        }
        drugContributions[drug.id] += conc;
      }
    });

    const mainDrugId = Object.keys(drugContributions).reduce((a, b) => drugContributions[a] > drugContributions[b] ? a : b, '');
    const mainDrug = allDrugs.find(d => d.id === mainDrugId) || null;

    const organLoads: Record<OrganTarget, number> = {
      hepatic: 0,
      renal: 0,
      cardiovascular: 0,
      neurological: 0,
      gastric: 0
    };

    // Calculate generic organ loads based on total concentration
    if (mainDrug) {
      const intensity = totalConc / mainDrug.toxicityThresholdMgL;
      organLoads[mainDrug.metabolism] = Math.min(intensity * 100, 100);
      
      // Secondary loads
      organLoads.renal = Math.min(intensity * 40, 60); 
      organLoads.hepatic = Math.max(organLoads.hepatic, Math.min(intensity * 50, 70));
      organLoads.cardiovascular = mainDrug.metabolism === 'neurological' ? Math.min(intensity * 30, 50) : Math.min(intensity * 15, 30);
    }

    return {
      time: t,
      concentration: totalConc,
      isToxic: mainDrug ? totalConc > mainDrug.toxicityThresholdMgL : false,
      organLoads
    };
  });
};
