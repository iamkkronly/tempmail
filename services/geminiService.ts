
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, FullMailMessage, InboxAnalysisResult, MailMessage } from '../types';

// Helper to lazy load AI to prevent top-level crashes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEmail = async (email: FullMailMessage): Promise<AIAnalysisResult> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following email for security risks and content summary.
    
    Email From: ${email.from}
    Email Subject: ${email.subject}
    Email Body: ${email.text}
    
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
      summary: 'Analysis failed due to an error. Please check your API key.',
      actionableItems: [],
      phishingScore: 50
    };
  }
};

export const analyzeInbox = async (messages: MailMessage[]): Promise<InboxAnalysisResult> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  // Create a condensed representation of the inbox to save tokens
  const inboxData = messages.slice(0, 20).map(m => ({
    from: m.from,
    subject: m.subject,
    snippet: m.intro || "No preview"
  }));

  const prompt = `
    You are an AI assistant managing a temporary inbox. Analyze these emails:
    ${JSON.stringify(inboxData)}

    Tasks:
    1. Provide a brief 1-sentence overview of the inbox status.
    2. Categorize emails (e.g., 'Verification', 'Social', 'Spam', 'Personal').
    3. Extract any visible codes (OTP, PIN) from subjects/snippets.
    4. Count urgent items.

    Return JSON matching this schema:
    {
       "overview": "string",
       "categories": [{"name": "string", "count": number}],
       "extractedCodes": [{"code": "string", "source": "sender name"}],
       "urgentCount": number
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}') as InboxAnalysisResult;
  } catch (e) {
    console.error("Inbox analysis failed", e);
    return {
      overview: "Could not analyze inbox at this time.",
      categories: [],
      extractedCodes: [],
      urgentCount: 0
    };
  }
};

export const draftReply = async (email: FullMailMessage, tone: string): Promise<string> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const prompt = `
    Draft a ${tone} reply to the following email:
    
    From: ${email.from}
    Subject: ${email.subject}
    Content: ${email.text}
    
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
    return "Error generating reply. Please check your API key.";
  }
};

export const translateEmail = async (text: string, targetLang: string = "English"): Promise<string> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const prompt = `Translate the following text to ${targetLang}. Maintain the original tone and formatting:\n\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Translation failed.";
  } catch (e) {
    console.error(e);
    return "Error translating text.";
  }
};
