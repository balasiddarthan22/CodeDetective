"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { FeedItem } from "./FeedItem";
import type { InvestigationStep, StepKind, SystemLabel } from "@/types/agent";

interface StreamingState {
  text: string;
  stepKind: StepKind;
  systemLabel: SystemLabel;
}

interface LiveFeedProps {
  steps: InvestigationStep[];
  streaming: StreamingState | null;
  isActive?: boolean;
}

export function LiveFeed({ steps, streaming, isActive }: LiveFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const total = steps.length + (streaming ? 1 : 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps.length, streaming?.text]);

  if (steps.length === 0 && !streaming) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
        Waiting for investigation to start…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <FeedItem key={step.id} step={step} index={i + 1} />
      ))}

      {streaming && (
        <FeedItem
          step={{
            id: "streaming",
            caseId: "",
            kind: streaming.stepKind,
            content: streaming.text,
            systemLabel: streaming.systemLabel,
            createdAt: Date.now(),
          }}
          index={total}
          isStreaming
          streamText={streaming.text}
        />
      )}

      {isActive && (
        <div className="flex items-center gap-2 px-1 py-1">
          <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
          <span className="text-xs text-zinc-500">Step {total + 1}</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
