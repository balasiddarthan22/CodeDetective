"use client";

import { useState } from "react";
import { X, Database, CheckCircle2 } from "lucide-react";
import { getOrCreateDeviceId } from "@/lib/device-id";

interface StackSetupProps {
  onClose: () => void;
}

export function StackSetup({ onClose }: StackSetupProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/memory/stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, stack: value }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(onClose, 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Set up your stack</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Describe your tech stack once. Hermes will use it on every investigation to give you more relevant answers.
        </p>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Next.js 16, React 19, TypeScript, Tailwind CSS 4, Convex, Prisma, PostgreSQL, deployed on Vercel..."
          className="w-full h-28 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/60"
        />

        <button
          onClick={handleSave}
          disabled={!value.trim() || saving || saved}
          className="pressable w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved to Supermemory</>
          ) : saving ? (
            "Saving…"
          ) : (
            "Save stack"
          )}
        </button>
      </div>
    </div>
  );
}
