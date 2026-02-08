import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
// In a real app, you might want to lazily initialize or handle the missing key more gracefully in UI
let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI", e);
}

export const sendMessageToGemini = async (
  message: string,
  imageBase64?: string
): Promise<string> => {
  if (!ai) {
    return "Error: API Key not configured.";
  }

  try {
    let contents: any;

    if (imageBase64) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            text: message || "Analyze this image.",
          },
        ],
      };
    } else {
      contents = message;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using the powerful model as requested
      contents: contents,
      config: {
        systemInstruction: "You are an expert Linux system administrator assistant. Provide concise, accurate commands. If a command is dangerous, warn the user prominently.",
      }
    });

    return response.text || "No response text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the AI service.";
  }
};
