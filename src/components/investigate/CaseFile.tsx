"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, Copy, Check } from "lucide-react";
import { ShareButton } from "./ShareButton";
import type { Verdict } from "@/types/agent";

interface CaseFileProps {
  caseId: string;
  verdict: Verdict;
}

const CONFIDENCE_CONFIG = {
  high: { label: "High confidence", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", Icon: CheckCircle2 },
  medium: { label: "Medium confidence", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", Icon: AlertCircle },
  low: { label: "Low confidence", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", Icon: HelpCircle },
};

export function CaseFile({ caseId, verdict }: CaseFileProps) {
  const conf = CONFIDENCE_CONFIG[verdict.confidence];
  const ConfIcon = conf.Icon;
  const [copied, setCopied] = useState(false);

  const handleCopyFix = async () => {
    await navigator.clipboard.writeText(verdict.conclusion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Case File</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600 text-xs font-mono">{caseId.slice(-8)}</span>
        </div>
        <div className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium ${conf.bg} ${conf.color}`}>
          <ConfIcon className="w-3 h-3" />
          {conf.label}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <Section label="Hypothesis">
          <p className="text-zinc-200 text-sm leading-relaxed">{verdict.hypothesis}</p>
        </Section>

        <Section label="Evidence">
          <ul className="space-y-2">
            {verdict.evidence.map((e, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="text-emerald-500 font-mono text-xs mt-0.5 flex-shrink-0">[{i + 1}]</span>
                <span className="text-zinc-300 leading-relaxed">{e}</span>
              </li>
            ))}
          </ul>
        </Section>

        {verdict.sourcesChecked.length > 0 && (
          <Section label="Sources checked">
            <ul className="space-y-1">
              {verdict.sourcesChecked.map((s, i) => (
                <li key={i} className="text-xs text-zinc-500 font-mono truncate pl-3 border-l border-zinc-800">
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section label="Conclusion">
          <div className="flex items-start justify-between gap-3">
            <p className="text-zinc-100 text-sm leading-relaxed font-medium flex-1">{verdict.conclusion}</p>
            <button
              onClick={handleCopyFix}
              className="shrink-0 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mt-0.5"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy fix"}
            </button>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <ShareButton caseId={caseId} errorTitle={verdict.hypothesis} />
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {children}
    </div>
  );
}
