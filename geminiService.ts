
import { GoogleGenAI, Type } from "@google/genai";
import { DISEASE_DATABASE } from "./constants";
import { DiseaseStage } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzePlantImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1],
              },
            },
            {
              text: `Analyze this Kangkung (Water Spinach) leaf for Cercospora Leaf Spot.
              Classify it into one of these categories: H0 (Healthy), E1 (Early), E2 (Mid), E3 (Severe), or N0 (Invalid/Poor quality).
              
              Return the results in strict JSON format with these fields:
              - stage: (H0, E1, E2, E3, or N0)
              - confidence: (0 to 1)
              - lesionCount: (number)
              - avgLesionSize: (number in mm)
              - explanation: (short summary)
              - detectedSymptoms: (list of specific visual cues you see in this EXACT image, e.g., "Distinct purple borders", "Small circular spots", "Yellow halos")
              - visualEvidenceRegions: (description of where the most prominent lesions are, e.g., "center-left", "along leaf edges")
              `
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stage: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            lesionCount: { type: Type.NUMBER },
            avgLesionSize: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            detectedSymptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            visualEvidenceRegions: { type: Type.STRING }
          },
          required: ["stage", "confidence", "lesionCount", "avgLesionSize", "explanation", "detectedSymptoms", "visualEvidenceRegions"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
};
