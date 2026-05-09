import Anthropic from "@anthropic-ai/sdk";

// No singleton — re-read process.env on every call to avoid stale captures
// across cold/warm Lambda boots after env-var changes on Vercel.
export function getClaude(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it in Vercel → Environment Variables."
    );
  }
  return new Anthropic({ apiKey });
}

export type Recommendation = {
  title: string;
  body: string;
  type: "tip" | "warning" | "praise";
};
