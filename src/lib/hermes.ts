import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://codedetective.app",
    "X-Title": "CodeDetective",
  },
});

const MODEL = process.env.HERMES_MODEL ?? "nousresearch/hermes-4-70b";

export async function* streamHermes(
  system: string,
  user: string
): AsyncGenerator<string> {
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    stream: true,
    temperature: 0.3,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

export async function callHermes(system: string, user: string, jsonMode = false): Promise<string> {
  const response = await Promise.race([
    client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Hermes timeout")), 45_000)
    ),
  ]);
  return response.choices[0]?.message?.content ?? "";
}

export const HERMES_TOOL_SYSTEM = `You are a debugging agent. Analyze the bug and decide what to do next.

Always respond with valid JSON in one of these formats:

Search:
{"reasoning": "...", "action": {"tool": "search", "query": "..."}}

Fetch:
{"reasoning": "...", "action": {"tool": "fetch", "url": "..."}}

Conclude (when you have enough evidence):
{"reasoning": "...", "action": {"tool": "conclude"}, "verdict": {"hypothesis": "...", "evidence": ["...", "..."], "sourcesChecked": ["url1", "url2"], "conclusion": "...", "confidence": "high|medium|low"}}

Rules:
- Keep reasoning under 200 words
- Search queries should be specific and technical
- Only conclude when confidence is high and you have 2+ pieces of evidence
- Evidence items should be concrete facts from sources, not summaries`;

export const HERMES_PLAN_SYSTEM = `You are a debugging expert. Analyze this bug and produce a brief investigation plan.

Describe: what kind of bug this is, most likely root causes, what to search for first.
Be specific, technical, and concise. Under 150 words. Plain text, no JSON.`;

export const HERMES_SUMMARIZE_SYSTEM = `You are a debugging agent. Summarize the key evidence from this fetched page in under 100 words.
Focus only on: root cause explanations, confirmed fixes, version-specific behavior.
Plain text only.`;
