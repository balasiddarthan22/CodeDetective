"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BugInput } from "@/components/investigate/BugInput";
import { LiveFeed } from "@/components/investigate/LiveFeed";
import { CaseFile } from "@/components/investigate/CaseFile";
import { SharedHit } from "@/components/investigate/SharedHit";
import { StackSetup } from "@/components/investigate/StackSetup";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { parseEvent } from "@/lib/sse";
import { DEMO_BUG } from "@/lib/demo-loop";
import type { AgentEvent, InvestigationStep, Verdict, StepKind, SystemLabel } from "@/types/agent";
import { Bug, History } from "lucide-react";
import Link from "next/link";

type UIPhase = "idle" | "investigating" | "concluded" | "hit";

function InvestigateContent() {
  const searchParams = useSearchParams();
  const autoDemo = searchParams.get("demo") === "true";

  const [phase, setPhase] = useState<UIPhase>("idle");
  const [steps, setSteps] = useState<InvestigationStep[]>([]);
  const [streaming, setStreaming] = useState<{ text: string; stepKind: StepKind; systemLabel: SystemLabel } | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [sharedHit, setSharedHit] = useState<{ caseId: string; age: string; verdict: Verdict } | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [showStack, setShowStack] = useState(false);
  const [demoRunCount, setDemoRunCount] = useState(0);

  const esRef = useRef<EventSource | null>(null);
  const streamBufferRef = useRef<string>("");

  const runInvestigation = useCallback(async (bug: string, isDemo = false) => {
    if (phase === "investigating") return;

    // Reset state
    setPhase("investigating");
    setSteps([]);
    setStreaming(null);
    setVerdict(null);
    setSharedHit(null);
    streamBufferRef.current = "";

    const deviceId = getOrCreateDeviceId();
    const isSecondDemoRun = isDemo && demoRunCount > 0;
    if (isDemo) setDemoRunCount((c) => c + 1);

    const res = await fetch("/api/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bugDescription: bug,
        deviceId,
        demo: isDemo,
        demoSecondRun: isSecondDemoRun,
      }),
    });

    if (!res.ok || !res.body) {
      setPhase("idle");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim() || line.startsWith(":")) continue;
        const event = parseEvent(line.replace(/^data: /, ""));
        if (!event) continue;
        handleEvent(event);
      }
    }
  }, [phase, demoRunCount]);

  function handleEvent(event: AgentEvent) {
    switch (event.type) {
      case "case_created":
        setCaseId(event.caseId);
        break;

      case "stream_chunk":
        streamBufferRef.current += event.text;
        setStreaming({
          text: streamBufferRef.current,
          stepKind: event.stepKind,
          systemLabel: event.systemLabel,
        });
        break;

      case "step":
        streamBufferRef.current = "";
        setStreaming(null);
        setSteps((prev) => {
          const exists = prev.find((s) => s.id === event.step.id);
          return exists ? prev : [...prev, event.step];
        });
        if (event.step.kind === "conclusion" && event.step.metadata?.verdict) {
          setVerdict(event.step.metadata.verdict as Verdict);
        }
        break;

      case "shared_hit":
        setSharedHit({ caseId: event.caseId, age: event.age, verdict: event.verdict });
        setPhase("hit");
        break;

      case "done":
        // Don't override "hit" phase — shared hit should stay visible
        setPhase((prev) => prev === "hit" ? "hit" : "concluded");
        setStreaming(null);
        break;

      case "error":
        console.error("Agent error:", event.message);
        setPhase("idle");
        break;
    }
  }

  // Extract verdict from steps when done
  useEffect(() => {
    if (phase === "concluded" && !verdict) {
      const conclusionStep = steps.findLast((s) => s.kind === "conclusion");
      if (conclusionStep?.metadata?.verdict) {
        setVerdict(conclusionStep.metadata.verdict as Verdict);
      }
    }
  }, [phase, steps, verdict]);

  // Reset to idle on mount so stale state never blocks the input
  useEffect(() => {
    setPhase("idle");
    setSteps([]);
    setVerdict(null);
    setCaseId(null);
  }, []);

  const isActive = phase === "investigating";

  return (
    <div className="min-h-screen bg-zinc-950">
      {showStack && <StackSetup onClose={() => setShowStack(false)} />}

      {/* Header */}
      <header className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bug className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-zinc-100 tracking-tight">CodeDetective</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Link>
          <span className="text-xs text-zinc-700">Hermes · TinyFish · Supermemory</span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Input — shown when idle, investigating, or concluded-without-verdict */}
        {(phase === "idle" || phase === "investigating" || (phase === "concluded" && !verdict)) && (
          <section>
            <BugInput
              onSubmit={runInvestigation}
              onOpenStack={() => setShowStack(true)}
              disabled={isActive}
            />
          </section>
        )}

        {/* Live feed */}
        {(steps.length > 0 || streaming || isActive) && phase !== "hit" && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
              <span className="text-xs font-medium text-zinc-500">
                {isActive ? "Investigating" : "Investigation trail"}
              </span>
            </div>
            <LiveFeed steps={steps} streaming={streaming} isActive={isActive} />
          </section>
        )}

        {/* Shared hivemind hit */}
        {phase === "hit" && sharedHit && (
          <section>
            <SharedHit
              caseId={sharedHit.caseId}
              age={sharedHit.age}
              verdict={sharedHit.verdict}
            />
            <button
              onClick={() => { setPhase("idle"); setSharedHit(null); setSteps([]); }}
              className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
            >
              Investigate anyway →
            </button>
          </section>
        )}

        {/* Case file reveal */}
        {phase === "concluded" && verdict && caseId && (
          <section>
            <CaseFile caseId={caseId} verdict={verdict} />
            <button
              onClick={() => { setPhase("idle"); setSteps([]); setVerdict(null); setCaseId(null); }}
              className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
            >
              ← New investigation
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default function InvestigatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <InvestigateContent />
    </Suspense>
  );
}
