// Minimal Gemini REST client (no SDK). The key comes from GEMINI_API_KEY
// and is only ever sent in the request header, never logged or returned.
// Fast model first; if it's busy or down, fall back to the next one.
const PRIMARY = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
// Busy (429/503) gets one retry on the fast model before falling back.
const MODELS = [PRIMARY, PRIMARY, "gemini-flash-latest"];
const URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export class GeminiError extends Error {}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function geminiGenerate(body: Record<string, unknown>, timeoutMs = 25000): Promise<GeminiContent> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("AI is not switched on yet (no GEMINI_API_KEY).");
  let lastStatus = 0;
  for (const model of MODELS) {
    let res: Response;
    try {
      res = await fetch(`${URL_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      lastStatus = 504;
      continue; // timed out: try the next model
    }
    if (res.ok) {
      const data = await res.json();
      const content = data?.candidates?.[0]?.content;
      if (!content?.parts) throw new GeminiError("The AI returned an empty answer. Try again.");
      return { role: "model", parts: content.parts };
    }
    lastStatus = res.status;
    if (res.status === 429 || res.status === 503) await new Promise((r) => setTimeout(r, 1500));
    if (res.status !== 429 && res.status < 500 && res.status !== 404) break;
  }
  throw new GeminiError(
    lastStatus === 429 ? "The AI is busy right now. Try again in a minute." : lastStatus === 504 ? "The AI took too long to answer. Try again." : `AI request failed (${lastStatus}).`,
  );
}

// Same as geminiGenerate, but a timeout becomes a friendly GeminiError.
async function geminiGenerateSafe(body: Record<string, unknown>): Promise<GeminiContent> {
  try {
    return await geminiGenerate(body);
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    throw new GeminiError("The AI took too long to answer. Try again.");
  }
}

// One-shot call that must answer with JSON.
export async function geminiJSON<T>(prompt: string, extraParts: GeminiPart[] = []): Promise<T> {
  const content = await geminiGenerateSafe({
    contents: [{ role: "user", parts: [{ text: prompt }, ...extraParts] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });
  const text = content.parts.map((p) => ("text" in p ? p.text : "")).join("");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiError("The AI answer couldn't be read. Try again.");
  }
}
