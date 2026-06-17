"use client";

import { useState } from "react";
import { Database, Play, Search } from "lucide-react";
import { DEMO_BUG } from "@/lib/demo-loop";

interface BugInputProps {
  onSubmit: (bug: string, isDemo?: boolean) => void;
  onOpenStack: () => void;
  disabled?: boolean;
}

export function BugInput({ onSubmit, onOpenStack, disabled }: BugInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit(value.trim());
    }
  };

  const handleDemo = () => {
    setValue(DEMO_BUG);
    onSubmit(DEMO_BUG, true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste the error message, stack trace, or reproduction notes..."
        disabled={disabled}
        rows={5}
        suppressHydrationWarning
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 resize-none focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">Ctrl/Command + Enter submits</span>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="pressable flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          <Search className="h-4 w-4" />
          Investigate
        </button>

        <button
          type="button"
          onClick={handleDemo}
          disabled={disabled}
          className="pressable flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Sample
        </button>

        <button
          type="button"
          onClick={onOpenStack}
          className="pressable flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
        >
          <Database className="h-3.5 w-3.5" />
          Context
        </button>
      </div>
    </form>
  );
}
