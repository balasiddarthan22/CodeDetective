"use client";

import { useState } from "react";
import { Copy, Twitter, Check } from "lucide-react";

interface ShareButtonProps {
  caseId: string;
  errorTitle: string;
}

export function ShareButton({ caseId, errorTitle }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/case/${caseId}` : `/case/${caseId}`;

  const xText = `Just debugged: ${errorTitle.slice(0, 80)}\n\nCodeDetective traced it through live sources in seconds.\nCase file: ${url}\n\nBuilt with @TinyFishAI + Supermemory + Hermes`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`, "_blank");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy case link"}
      </button>
      <button
        onClick={handleX}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors"
      >
        <Twitter className="w-3.5 h-3.5" />
        Post to X
      </button>
    </div>
  );
}
