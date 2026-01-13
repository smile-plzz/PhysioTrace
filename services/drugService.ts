
import { FdaDrugInfo, ClinicalStatus, Drug, SimulationResult } from "../types";

// Fetches data from the live OpenFDA API (No AI needed)
export const getFdaDetails = async (drugName: string): Promise<FdaDrugInfo | null> => {
    // Use the first word of the drug name for a more reliable search
    const query = drugName.split(' ')[0];
    const fdaApiUrl = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:"${query}" OR openfda.generic_name:"${query}")&limit=1`;
    try {
        const response = await fetch(fdaApiUrl);
        if (!response.ok) {
            console.error("FDA API request failed:", response.statusText);
            return null;
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const openfda = result.openfda || {};
            
            const cleanText = (textArray: string[] | undefined, maxLength = 70) => {
                if (!textArray || textArray.length === 0) return 'Data not available.';
                const fullText = textArray.join(' ');
                // Remove citations like [12.3]
                const cleanedText = fullText.replace(/\[\s*\d+(\.\d+)?\s*\]/g, '');
                const words = cleanedText.split(' ');
                if (words.length > maxLength) {
                    return words.slice(0, maxLength).join(' ') + '...';
                }
                return cleanedText;
            };
            
            return {
                brandName: openfda.brand_name?.[0] || 'N/A',
                genericName: openfda.generic_name?.[0] || 'N/A',
                manufacturer: openfda.manufacturer_name?.[0] || 'N/A',
                description: cleanText(result.description),
                indications: cleanText(result.indications_and_usage),
                reactions: cleanText(result.adverse_reactions),
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching data from OpenFDA:", error);
        return null;
    }
};

/**
 * Deterministically analyzes the simulation state to provide "smart" clinical feedback
 * without relying on LLMs.
 */
export const analyzeClinicalStatus = (
    concentration: number,
    prevConcentration: number,
    toxicityThreshold: number,
    time: number
): ClinicalStatus => {
    // 1. Toxicity Check
    if (concentration > toxicityThreshold) {
        return {
            message: "CRITICAL: Plasma concentration exceeds therapeutic safety threshold. Toxicity risk detected.",
            type: "danger",
            phase: concentration > prevConcentration ? "Absorption" : "Elimination"
        };
    }

    if (concentration > toxicityThreshold * 0.8) {
         return {
            message: "WARNING: Approaching upper limit of therapeutic window. Monitor closely.",
            type: "warning",
            phase: concentration > prevConcentration ? "Absorption" : "Elimination"
        };
    }

    // 2. Clearance Check
    if (concentration < 0.1 && time > 2) {
        return {
            message: "Drug effectively cleared from system. Concentration negligible.",
            type: "success",
            phase: "Cleared"
        };
    }

    // 3. Phase Analysis via Slope
    const slope = concentration - prevConcentration;
    
    // Threshold for considering it "flat" (Peak)
    const PEAK_THRESHOLD = 0.05 * concentration; 

    if (Math.abs(slope) < 0.001 && concentration > 0.5) {
        return {
            message: "Peak plasma concentration (Cmax) reached. Bioavailability maximized.",
            type: "neutral",
            phase: "Peak"
        };
    }

    if (slope > 0) {
        return {
            message: "Absorption phase active. Plasma concentration rising.",
            type: "neutral",
            phase: "Absorption"
        };
    } else {
        return {
             message: "Elimination phase active. Metabolic clearance proceeding.",
             type: "neutral",
             phase: "Elimination"
        };
    }
};
