import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || "";
export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2-preview";

export interface CallGeminiJsonOptions<T> {
  promptName: string;
  system: string;
  input: string;
  zodSchema: z.ZodType<T>;
  fallback: T;
  temperature?: number;
}

/**
 * Robust server-side Gemini JSON caller with timeout, retry, validation, and safe fallback.
 */
export async function callGeminiJson<T>({
  promptName,
  system,
  input,
  zodSchema,
  fallback,
  temperature = 0.2,
}: CallGeminiJsonOptions<T>): Promise<T> {
  const startTime = Date.now();

  if (!ai || !apiKey) {
    console.warn(`[AI: ${promptName}] GEMINI_API_KEY is not configured. Returning fallback.`);
    return fallback;
  }

  const attemptCall = async (): Promise<T> => {
    // 20-second timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out after 20s")), 20000)
    );

    const callPromise = (async () => {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: input }],
          },
        ],
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          temperature,
        },
      });

      const rawText = response.text || "{}";
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return zodSchema.parse(parsed);
    })();

    return await Promise.race([callPromise, timeoutPromise]);
  };

  try {
    const result = await attemptCall();
    console.log(`[AI: ${promptName}] Success in ${Date.now() - startTime}ms`);
    return result;
  } catch (firstErr) {
    console.warn(`[AI: ${promptName}] Attempt 1 failed: ${(firstErr as Error).message}. Retrying once...`);
    try {
      const retryResult = await attemptCall();
      console.log(`[AI: ${promptName}] Retry success in ${Date.now() - startTime}ms`);
      return retryResult;
    } catch (retryErr) {
      console.error(`[AI: ${promptName}] Attempt 2 failed: ${(retryErr as Error).message}. Returning fallback.`);
      return fallback;
    }
  }
}
