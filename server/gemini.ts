import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key-for-init',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface GeminiCallParams {
  prompt: string;
  model?: 'gemini-3.7-flash' | 'gemini-3.1-flash-lite';
  config?: any;
  enableSearchGrounding?: boolean;
  maxRetries?: number;
}

/**
 * Robust wrapper for Gemini generateContent with:
 * 1. Automatic exponential backoff + jitter for 503 (High Demand) & 429 (Rate limit)
 * 2. Model fallback from gemini-3.7-flash -> gemini-3.1-flash-lite
 * 3. Search tool fallback (if googleSearch triggers 429 quota, fallback to ungrounded synthesis)
 */
export async function callGeminiSafe(params: GeminiCallParams): Promise<{ text: string; response?: GenerateContentResponse; grounded: boolean }> {
  const primaryModel = params.model || 'gemini-3.7-flash';
  const modelsToTry = [primaryModel, 'gemini-3.1-flash-lite'];
  const maxRetries = params.maxRetries ?? 2;
  const ai = getGeminiClient();

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const config: any = { ...(params.config || {}) };
        
        if (params.enableSearchGrounding && attempt === 0) {
          config.tools = [{ googleSearch: {} }];
        } else if (params.enableSearchGrounding && attempt > 0) {
          // On retry, try without search grounding tool to bypass tool-specific 429 quota
          delete config.tools;
        }

        const response = await ai.models.generateContent({
          model: currentModel,
          contents: params.prompt,
          config,
        });

        const text = response.text || '';
        return {
          text,
          response,
          grounded: !!(response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length)
        };
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const is429 = errMessage.includes('429') || errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('quota');
        const is503 = errMessage.includes('503') || errMessage.includes('UNAVAILABLE') || errMessage.includes('high demand');

        if (is429 || is503) {
          // If search grounding hit quota on first attempt, retry immediately without tools
          if (params.enableSearchGrounding && attempt === 0) {
            continue;
          }
          // Otherwise exponential backoff with jitter
          const delay = Math.min(2500, 500 * Math.pow(1.5, attempt) + Math.random() * 200);
          await new Promise(res => setTimeout(res, delay));
        } else {
          // If other error, break to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error('Gemini API call failed after retries and model fallback.');
}

/**
 * Safely parse JSON from Gemini response, stripping markdown backticks
 */
export function parseGeminiJson<T = any>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== 'string') return fallback;

  try {
    let clean = rawText.trim();
    // Remove markdown code block fences (```json ... ``` or ``` ...)
    clean = clean.replace(/^```(?:json)?\s*/i, '');
    clean = clean.replace(/\s*```$/i, '');
    clean = clean.trim();

    // Extract first valid JSON object or array if extra conversational text exists
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = clean.lastIndexOf('}');
      if (lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      const lastBracket = clean.lastIndexOf(']');
      if (lastBracket > firstBracket) {
        clean = clean.substring(firstBracket, lastBracket + 1);
      }
    }

    return JSON.parse(clean) as T;
  } catch (err) {
    return fallback;
  }
}
