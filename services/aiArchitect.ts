
/**
 * 🔒 STABLE MODULE: AI Architect Service
 * STATUS: FROZEN (STRICT BYOK ENFORCED)
 * VERSION: 1.4.0
 */
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BrockType } from '../types';
import { AppConfigService } from '../constants';

const designSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    designs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                position: {
                  type: Type.OBJECT,
                  properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } }
                },
                rotation: {
                  type: Type.OBJECT,
                  properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } }
                }
              }
            }
          }
        }
      }
    }
  }
};

export interface GeneratedDesign {
  name: string;
  description: string;
  blocks: {
    type: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  }[];
}

export const generateDesigns = async (userPrompt: string): Promise<GeneratedDesign[]> => {
  const config = AppConfigService.get().aiArchitect;
  
  // 🛡️ SECURITY LAYER: STRICT BYOK (Bring Your Own Key)
  // We have intentionally REMOVED the fallback to process.env.API_KEY.
  // This ensures that even if a key is injected by the hosting environment, 
  // the code will IGNORE it, preventing any usage of the owner's billing.
  const userKey = localStorage.getItem('corkbrick_user_gemini_key');

  if (!userKey) {
    throw new Error("NO_API_KEY");
  }
  
  const ai = new GoogleGenAI({ apiKey: userKey });
  
  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: userPrompt,
      config: {
        systemInstruction: config.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: designSchema,
        temperature: config.temperature,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
    return data.designs || [];
  } catch (error) {
    console.error("AI Architect Error:", error);
    throw error;
  }
};
