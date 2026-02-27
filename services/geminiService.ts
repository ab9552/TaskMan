
import { GoogleGenAI, Type } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getDecommissionAdvice(prompt: string) {
  try {
    // Using gemini-3-pro-preview for complex reasoning tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert AWS Solutions Architect specializing in cloud migrations and decommission activities. 
        Your goal is to help a team meet their Feb 26 decommission deadline for 'AWS 1.0'. 
        Provide concise, actionable, and technical advice. Use markdown for formatting.`,
      },
    });
    // Access response.text property directly.
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to connect to the AI assistant. Please check your network or API configuration.";
  }
}

export async function generateChecklist(projectName: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a detailed decommission checklist for the project: ${projectName}. Include categories like Compute, Storage, and Networking.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING },
            },
            required: ["title", "category", "priority"]
          }
        }
      }
    });
    // Trim text before parsing according to guidelines.
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr || '[]');
  } catch (error) {
    console.error("Checklist Generation Error:", error);
    return [];
  }
}
