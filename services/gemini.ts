
// Fix: Correct import for OrganTarget
import { GoogleGenAI, Type } from "@google/genai";
import { Drug, OrganTarget, UserProfile, FdaDrugInfo } from "../types";

// Always use a named parameter and obtain the API key exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This function remains AI-powered because PK parameters are not available in free public APIs.
export const searchNewDrug = async (query: string): Promise<Drug | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the user query "${query}", find the drug or supplement. Provide its pharmacological data. If it's not a recognized drug/supplement, set isFound to false. For toxicity, provide a general therapeutic plasma level threshold, not an overdose level. For metabolism, pick one: hepatic, renal, cardiovascular, neurological, gastric.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFound: { type: Type.BOOLEAN, description: 'Was a drug found?' },
            drugData: {
              type: Type.OBJECT,
              description: 'Pharmacological data of the drug.',
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                halfLifeHours: { type: Type.NUMBER },
                bioavailability: { type: Type.NUMBER, description: 'A value between 0 and 1' },
                timeToPeakHours: { type: Type.NUMBER },
                volDistFactor: { type: Type.NUMBER, description: 'Volume of distribution factor (L/kg)' },
                toxicityThresholdMgL: { type: Type.NUMBER },
                metabolism: { type: Type.STRING, description: "Metabolism pathway. Must be one of: hepatic, renal, cardiovascular, neurological, gastric." },
                defaultDoseMg: { type: Type.NUMBER },
              }
            }
          }
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      console.error("Received empty response from Gemini for searchNewDrug");
      return null;
    }
    const parsed = JSON.parse(jsonStr);

    if (parsed.isFound && parsed.drugData) {
      const drugData = parsed.drugData;
      const newDrug: Drug = {
        id: drugData.name.toLowerCase().replace(/\s/g, '-'),
        name: drugData.name,
        description: drugData.description,
        halfLifeHours: drugData.halfLifeHours,
        bioavailability: drugData.bioavailability,
        timeToPeakHours: drugData.timeToPeakHours,
        volDistFactor: drugData.volDistFactor,
        toxicityThresholdMgL: drugData.toxicityThresholdMgL,
        metabolism: drugData.metabolism as OrganTarget,
        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        defaultDoseMg: drugData.defaultDoseMg,
      };
      return newDrug;
    }
    return null;
  } catch (error) {
    console.error("Error searching for new drug:", error);
    return null;
  }
};

// This function now fetches data from the live OpenFDA API.
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

export const getClinicalSuggestion = async (
  drugName: string,
  concentration: number,
  toxicityThreshold: number,
  timeToPeak: number,
  currentTime: number
): Promise<string> => {
  try {
    const context = `
      Drug: ${drugName}
      Current Time: T+${currentTime.toFixed(1)} hours
      Current Plasma Concentration: ${concentration.toFixed(2)} mg/L
      Toxicity Threshold: ${toxicityThreshold.toFixed(2)} mg/L
      Time to Peak Concentration (Tmax): ${timeToPeak} hours
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following pharmacokinetic data. Provide a single, concise clinical observation or suggestion for a simulation. Do not give medical advice. Focus on the drug's current state in the body (e.g., absorption phase, peak, elimination phase, approaching toxicity, sub-therapeutic). Keep it under 25 words. ${context}`,
    });

    return response.text?.trim() || "Could not generate a suggestion at this time.";
  } catch (error) {
    console.error("Error getting clinical suggestion:", error);
    return "Suggestion feature unavailable.";
  }
};
