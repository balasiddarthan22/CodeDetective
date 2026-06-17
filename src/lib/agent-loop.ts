import type { AgentEvent, InvestigationStep, Verdict } from "@/types/agent";
import {
  streamHermes,
  callHermes,
  HERMES_TOOL_SYSTEM,
  HERMES_PLAN_SYSTEM,
  HERMES_SUMMARIZE_SYSTEM,
} from "./hermes";
import { tinyfishSearch, tinyfishFetch, formatSearchResults } from "./tinyfish";
import {
  NS,
  addMemory,
  checkHivemind,
  getStackContext,
  getHistoryContext,
} from "./supermemory";

const MAX_ROUNDS = 3;

function makeStep(
  caseId: string,
  deviceId: string,
  kind: InvestigationStep["kind"],
  content: string,
  label: InvestigationStep["systemLabel"],
  metadata?: Record<string, unknown>
): InvestigationStep {
  return {
    id: crypto.randomUUID(),
    caseId,
    kind,
    content,
    systemLabel: label,
    metadata,
    createdAt: Date.now(),
  };
}

function parseHermesJSON(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function* agentLoop(
  caseId: string,
  deviceId: string,
  bugDescription: string
): AsyncGenerator<AgentEvent> {
  // Step 0: Check hivemind
  yield { type: "step", step: makeStep(caseId, deviceId, "plan", "Checking hivemind for previous matches…", "Supermemory") };

  const hivemindHit = await checkHivemind(bugDescription);
  if (hivemindHit) {
    yield {
      type: "shared_hit",
      caseId: hivemindHit.caseId,
      age: hivemindHit.age,
      preview: hivemindHit.preview,
      verdict: hivemindHit.verdict as Verdict,
    };
    yield { type: "done", caseId };
    return;
  }

  yield { type: "step", step: makeStep(caseId, deviceId, "plan", "No hivemind match found. Starting fresh investigation.", "Supermemory") };

  // Load memory context
  const [stackCtx, historyCtx] = await Promise.all([
    getStackContext(deviceId),
    getHistoryContext(deviceId, bugDescription),
  ]);

  if (stackCtx) {
    yield { type: "step", step: makeStep(caseId, deviceId, "plan", `Stack context loaded: ${stackCtx.slice(0, 120)}…`, "Supermemory") };
  }

  // Build system prompt with memory context
  const memorySection = [
    stackCtx && `USER STACK:\n${stackCtx}`,
    historyCtx && `PAST BUGS:\n${historyCtx}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const toolSystem = memorySection
    ? `${HERMES_TOOL_SYSTEM}\n\n${memorySection}`
    : HERMES_TOOL_SYSTEM;

  // Step 1: Plan
  let planText = "";
  yield { type: "stream_chunk", text: "", stepKind: "plan", systemLabel: "Hermes" };

  for await (const chunk of streamHermes(
    HERMES_PLAN_SYSTEM + (stackCtx ? `\n\nUser stack: ${stackCtx}` : ""),
    bugDescription
  )) {
    planText += chunk;
    yield { type: "stream_chunk", text: chunk, stepKind: "plan", systemLabel: "Hermes" };
  }

  yield { type: "step", step: makeStep(caseId, deviceId, "plan", planText, "Hermes") };

  // Investigation loop
  const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  const evidenceSummaries: string[] = [];
  let verdict: Verdict | null = null;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const userMsg = round === 0
      ? `Bug: ${bugDescription}\n\nPlan: ${planText}\n\nWhat should I search for first?`
      : `Previous evidence summaries:\n${evidenceSummaries.join("\n")}\n\nWhat should I do next? Search more, fetch another URL, or conclude?`;

    conversationHistory.push({ role: "user", content: userMsg });

    const hermesResponse = await callHermes(
      toolSystem,
      conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n\n"),
      true  // JSON mode — force structured tool dispatch
    );

    conversationHistory.push({ role: "assistant", content: hermesResponse });

    const parsed = parseHermesJSON(hermesResponse);
    if (!parsed) {
      // Hermes returned plain text despite JSON mode — show it and ask again with explicit reminder
      yield { type: "step", step: makeStep(caseId, deviceId, "reasoning", hermesResponse.slice(0, 500), "Hermes") };
      conversationHistory.push({
        role: "user",
        content: "You must respond with valid JSON only. Use one of the three formats from the system prompt (search/fetch/conclude).",
      });
      continue;
    }

    const reasoning = (parsed.reasoning as string) ?? "";
    const action = parsed.action as Record<string, string>;

    if (reasoning) {
      yield { type: "step", step: makeStep(caseId, deviceId, "reasoning", reasoning, "Hermes") };
    }

    if (action?.tool === "search") {
      const query = action.query ?? "";
      yield { type: "step", step: makeStep(caseId, deviceId, "search_query", `Searching: "${query}"`, "TinyFish Search", { query }) };

      const results = await tinyfishSearch(query);
      const formatted = formatSearchResults(results.slice(0, 3));
      yield { type: "step", step: makeStep(caseId, deviceId, "search_result", formatted, "TinyFish Search", { results }) };

      conversationHistory.push({ role: "user", content: `Search results:\n${formatted}\n\nPick the best URL to fetch, or search again, or conclude.` });

    } else if (action?.tool === "fetch") {
      const url = action.url ?? "";
      yield { type: "step", step: makeStep(caseId, deviceId, "fetch_url", `Fetching: ${url}`, "TinyFish Fetch", { url }) };

      const pages = await tinyfishFetch([url]);
      const pageContent = pages[0]?.content ?? "";

      if (!pageContent) {
        yield { type: "step", step: makeStep(caseId, deviceId, "fetch_result", `Could not fetch ${url} — skipping.`, "TinyFish Fetch") };
        conversationHistory.push({ role: "user", content: `Failed to fetch ${url}. Try a different URL or conclude based on existing evidence.` });
        continue;
      }

      yield { type: "step", step: makeStep(caseId, deviceId, "fetch_result", `Fetched ${url} (${pageContent.length} chars)`, "TinyFish Fetch") };

      // Summarize fetched content
      const summary = await callHermes(HERMES_SUMMARIZE_SYSTEM, pageContent);
      evidenceSummaries.push(`From ${url}:\n${summary}`);
      yield { type: "step", step: makeStep(caseId, deviceId, "reasoning", `Evidence: ${summary}`, "Hermes", { url, summary }) };

      conversationHistory.push({ role: "user", content: `Page summary:\n${summary}\n\nSearch for more evidence, fetch another URL, or conclude.` });

    } else if (action?.tool === "conclude") {
      const v = parsed.verdict as Verdict | undefined;
      if (v) {
        verdict = v;
        yield { type: "step", step: makeStep(caseId, deviceId, "conclusion", v.conclusion, "Hermes", { verdict: v }) };
        break;
      }
    }
  }

  // Fallback if no verdict from loop
  if (!verdict) {
    const fallback = await callHermes(
      toolSystem,
      `Based on this investigation, provide your best verdict as JSON:\nBug: ${bugDescription}\nEvidence: ${evidenceSummaries.join("\n")}`,
      true
    );
    const parsed = parseHermesJSON(fallback);
    verdict = (parsed?.verdict as Verdict) ?? {
      hypothesis: "Unable to determine root cause",
      evidence: evidenceSummaries.length ? evidenceSummaries : ["Insufficient evidence gathered"],
      sourcesChecked: [],
      conclusion: "Investigation incomplete. Try providing more context about your environment.",
      confidence: "low",
    };
    yield { type: "step", step: makeStep(caseId, deviceId, "conclusion", verdict.conclusion, "Hermes", { verdict }) };
  }

  // Write to hivemind for any completed investigation (not just high confidence)
  const caseSummary = `BUG: ${bugDescription}\n\nCONCLUSION: ${verdict.conclusion}\n\nHYPOTHESIS: ${verdict.hypothesis}`;
  await addMemory(caseSummary, NS.shared(), {
    caseId,
    createdAt: Date.now(),
    verdict,
  });
  await addMemory(caseSummary, NS.dynamic(deviceId), { caseId, verdict });

  yield { type: "done", caseId };
}
