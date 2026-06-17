"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Search, FileText, Database, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestigationStep, SystemLabel } from "@/types/agent";

const LABEL_CONFIG: Record<SystemLabel, { color: string; bg: string; icon: React.ElementType }> = {
  Supermemory: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Database },
  Hermes: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: Brain },
  "TinyFish Search": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Search },
  "TinyFish Fetch": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: FileText },
};

interface FeedItemProps {
  step: InvestigationStep;
  index?: number;
  isStreaming?: boolean;
  streamText?: string;
}

export function FeedItem({ step, index, isStreaming, streamText }: FeedItemProps) {
  const cfg = LABEL_CONFIG[step.systemLabel];
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const displayText = isStreaming ? streamText ?? "" : step.content;
  const isLong = displayText.length > 200;
  const shouldTruncate = isLong && !expanded && !isStreaming;

  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [streamText, isStreaming]);

  return (
    <div className={cn("rounded-lg border p-3 transition-all", cfg.bg)}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">
          {isStreaming ? (
            <Loader2 className={cn("w-4 h-4 animate-spin", cfg.color)} />
          ) : (
            <CheckCircle className={cn("w-4 h-4", cfg.color)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {index !== undefined && (
              <span className="text-[10px] text-zinc-600 font-mono w-4 shrink-0">{index}</span>
            )}
            <Icon className={cn("w-3 h-3", cfg.color)} />
            <span className={cn("text-xs font-medium", cfg.color)}>
              {step.systemLabel}
            </span>
          </div>

          <div ref={contentRef} className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
            {shouldTruncate ? displayText.slice(0, 200) + "…" : displayText}
            {isStreaming && (
              <span className={cn("inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse", cfg.color.replace("text-", "bg-"))} />
            )}
          </div>

          {isLong && !isStreaming && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className={cn("mt-1.5 text-xs hover:underline", cfg.color)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
