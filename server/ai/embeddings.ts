import { ai, EMBEDDING_MODEL } from "./gemini.ts";

/**
 * Generates an embedding vector for text using Gemini embedding model.
 * Falls back to an empty vector if API is unavailable.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!ai || !text || text.trim().length === 0) {
    return [];
  }

  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: text.slice(0, 1000) }],
        },
      ],
    });

    const embResponse = response as any;
    if (embResponse.embeddings?.[0]?.values) {
      return embResponse.embeddings[0].values;
    }
    if (embResponse.embedding?.values) {
      return embResponse.embedding.values;
    }
    return [];
  } catch (err) {
    console.warn(`[AI: embedText] Embedding generation skipped/failed: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Calculates cosine similarity between two float vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
