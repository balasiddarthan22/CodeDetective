import type { AgentEvent, InvestigationStep, Verdict } from "@/types/agent";

export const DEMO_BUG = `Error: Hydration failed because the initial UI does not match what was rendered on the server.
Warning: Expected server HTML to contain a matching <div> in <div>.
    at div
    at App (webpack-internal:///./src/app/layout.tsx:25:5)
    at Suspense
    at Layout (./src/app/layout.tsx)`;

const DEMO_VERDICT: Verdict = {
  hypothesis: "Browser-only API accessed during SSR in layout tree",
  evidence: [
    "Next.js docs confirm: any browser global (localStorage, window) during SSR causes hydration mismatch",
    "Stack Overflow accepted answer: localStorage access in app router layout triggers this exact error",
  ],
  sourcesChecked: [
    "stackoverflow.com/questions/75362801",
    "nextjs.org/docs/messages/react-hydration-error",
  ],
  conclusion:
    "Wrap the offending component with dynamic(() => import('./Component'), { ssr: false }) or replace useLayoutEffect with useEffect. If using Convex, ensure useQuery hooks are only called inside client components marked 'use client'.",
  confidence: "high",
};

function step(
  caseId: string,
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

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function* streamText(
  text: string,
  caseId: string,
  kind: InvestigationStep["kind"],
  label: InvestigationStep["systemLabel"]
): AsyncGenerator<AgentEvent> {
  const words = text.split(" ");
  let buffer = "";
  for (const word of words) {
    buffer += (buffer ? " " : "") + word;
    yield { type: "stream_chunk", text: word + " ", stepKind: kind, systemLabel: label };
    await delay(30 + Math.random() * 40);
  }
  yield { type: "step", step: step(caseId, kind, buffer, label) };
}

export async function* demoLoop(
  caseId: string,
  isSecondRun = false
): AsyncGenerator<AgentEvent> {
  if (isSecondRun) {
    await delay(400);
    yield {
      type: "shared_hit",
      caseId,
      age: "just now",
      preview: DEMO_VERDICT.conclusion.slice(0, 180),
      verdict: DEMO_VERDICT,
    };
    yield { type: "done", caseId };
    return;
  }

  // Step 1: Hivemind check
  await delay(500);
  yield { type: "step", step: step(caseId, "plan", "Checking hivemind for previous matches…", "Supermemory") };
  await delay(800);
  yield { type: "step", step: step(caseId, "plan", "No match found. Starting fresh investigation.", "Supermemory") };
  await delay(400);
  yield { type: "step", step: step(caseId, "plan", "Stack context loaded: Next.js 16, React 19, Tailwind CSS 4, Convex", "Supermemory") };

  // Step 2: Hermes plan
  await delay(600);
  const planText =
    "This is a classic Next.js hydration mismatch. The server renders one HTML structure and the client React tree produces something different — React throws on reconciliation. Most common causes in Next.js 16 with React 19: (1) a component reads browser-only globals like localStorage or window during SSR, (2) a date or random value differs between server and client render, (3) a CSS-in-JS library adds elements conditionally. Given your stack uses Convex — real-time subscriptions can sometimes cause initial state mismatches. I'll search for the most common confirmed root causes.";

  for await (const event of streamText(planText, caseId, "plan", "Hermes")) {
    yield event;
  }

  // Step 3: TinyFish Search
  await delay(400);
  yield { type: "step", step: step(caseId, "search_query", 'Searching: "Next.js hydration failed initial UI does not match server rendered React 19"', "TinyFish Search") };
  await delay(1200);

  const searchResults = `[1] Hydration mismatch with useLayoutEffect in Next.js 13+ app router
URL: github.com/vercel/next.js/issues/42292
The issue occurs because useLayoutEffect runs only on the client, causing a mismatch with the server-rendered HTML…

[2] Next.js hydration error | Next.js docs
URL: nextjs.org/docs/messages/react-hydration-error
This error means the initial state of the client app does not match what was rendered on the server…

[3] Next.js 13 app router hydration error with localStorage
URL: stackoverflow.com/questions/75362801
Wrapping the component in dynamic() with ssr: false fixed it for me…`;

  yield { type: "step", step: step(caseId, "search_result", searchResults, "TinyFish Search") };

  // Step 4: Hermes picks URL
  await delay(500);
  yield { type: "step", step: step(caseId, "reasoning", "The Stack Overflow thread looks most actionable — it references dynamic() with ssr: false which is the standard fix pattern. Fetching full content.", "Hermes") };

  // Step 5: TinyFish Fetch
  await delay(300);
  yield { type: "step", step: step(caseId, "fetch_url", "Fetching: stackoverflow.com/questions/75362801", "TinyFish Fetch", { url: "stackoverflow.com/questions/75362801" }) };
  await delay(1400);
  yield { type: "step", step: step(caseId, "fetch_result", "Fetched stackoverflow.com/questions/75362801 (4821 chars)", "TinyFish Fetch") };

  // Step 6: Hermes summarizes evidence
  await delay(600);
  const evidenceText =
    "Evidence: The accepted answer confirms localStorage access during SSR is the #1 cause in Next.js 13+ app router. Fix: wrap any component accessing browser globals in dynamic(() => import('./Component'), { ssr: false }). Secondary cause: useLayoutEffect in a server component — replace with useEffect. 4 confirmed upvotes on the ssr:false solution.";

  for await (const event of streamText(evidenceText, caseId, "reasoning", "Hermes")) {
    yield event;
  }

  // Step 7: Verdict — stream text, then emit final step with full verdict in metadata
  await delay(500);
  const verdictText =
    "Root cause confirmed: a component in your layout tree is accessing a browser-only API (most likely localStorage, window, or using useLayoutEffect) during server-side rendering. React 19 is stricter about hydration mismatches than React 18.";

  for await (const event of streamText(verdictText, caseId, "conclusion", "Hermes")) {
    yield event;
  }

  // Emit a final conclusion step carrying the full verdict so the page can build the CaseFile
  yield {
    type: "step",
    step: step(caseId, "conclusion", verdictText, "Hermes", { verdict: DEMO_VERDICT }),
  };

  await delay(300);
  yield { type: "done", caseId };
}
