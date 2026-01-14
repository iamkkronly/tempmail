import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, FullMailMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEmail = async (email: FullMailMessage): Promise<AIAnalysisResult> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following email for security risks and content summary.
    
    Email From: ${email.from}
    Email Subject: ${email.subject}
    Email Body: ${email.textBody || email.body}
    
    Provide the output in strict JSON format matching the following schema:
    {
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "summary": "A concise 2-sentence summary of the email content.",
      "actionableItems": ["List of extracted actions the user needs to take, if any"],
      "phishingScore": number (0 to 100, where 100 is definite phishing)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            summary: { type: Type.STRING },
            actionableItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            phishingScore: { type: Type.INTEGER },
          },
          required: ["riskLevel", "summary", "actionableItems", "phishingScore"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      riskLevel: 'MEDIUM',
      summary: 'Analysis failed due to an error.',
      actionableItems: [],
      phishingScore: 50
    };
  }
};

export const draftReply = async (email: FullMailMessage, tone: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Draft a ${tone} reply to the following email:
    
    From: ${email.from}
    Subject: ${email.subject}
    Content: ${email.textBody}
    
    The reply should be concise and professional (unless specified otherwise).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Could not generate reply.";
  } catch (e) {
    console.error(e);
    return "Error generating reply.";
  }
};