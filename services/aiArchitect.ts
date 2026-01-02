
/**
 * 🔒 STABLE MODULE: AI Architect Service
 * STATUS: FROZEN
 * VERSION: 1.2.0 - BYOK Native Integration
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
  
  // 🔒 BYOK: Initialize client right before use to capture the latest key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
