"use client";

import { Zap, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Verdict } from "@/types/agent";

interface SharedHitProps {
  caseId: string;
  age: string;
  verdict: Verdict;
}

export function SharedHit({ caseId, age, verdict }: SharedHitProps) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
        <div>
          <p className="text-amber-300 font-semibold text-sm">Hivemind hit</p>
          <p className="text-amber-500/80 text-xs">This exact bug was cracked {age}</p>
          <p className="text-amber-100/70 text-xs mt-1">
            Skipped a fresh investigation and reused the solved case from shared memory.
          </p>
        </div>
        {caseId && (
          <Link
            href={`/case/${caseId}`}
            className="ml-auto text-xs text-amber-950 bg-amber-400 hover:bg-amber-300 flex items-center gap-1 rounded-md px-3 py-1.5 font-medium transition-colors"
          >
            Use this fix <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-amber-100/70">
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1">
          {verdict.confidence} confidence
        </span>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1">
          {verdict.evidence.length} evidence points
        </span>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1">
          shared memory match
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Hypothesis</p>
          <p className="text-zinc-200">{verdict.hypothesis}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Conclusion</p>
          <p className="text-zinc-200 leading-relaxed">{verdict.conclusion}</p>
        </div>

        {verdict.evidence.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Evidence</p>
            <ul className="space-y-1">
              {verdict.evidence.map((e, i) => (
                <li key={i} className="text-zinc-400 text-xs flex gap-2">
                  <span className="text-amber-500 flex-shrink-0">[{i + 1}]</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
