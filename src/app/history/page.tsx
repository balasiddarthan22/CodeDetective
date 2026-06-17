"use client";

import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device-id";
import Link from "next/link";
import { Bug, ChevronRight, Clock, AlertCircle, Zap } from "lucide-react";

interface CaseRow {
  _id: string;
  title: string;
  bugDescription: string;
  status: string;
  createdAt: number;
  concludedAt?: number;
  verdict?: {
    hypothesis: string;
    conclusion: string;
    confidence: "high" | "medium" | "low";
  };
  sharedHitCaseId?: string;
}

const confidenceColor = {
  high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-red-400 bg-red-400/10 border-red-400/20",
};

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HistoryPage() {
  const convex = useConvex();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    convex
      .query(api.cases.listByDevice, { deviceId })
      .then((rows) => {
        setCases(rows as CaseRow[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [convex]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bug className="w-5 h-5 text-emerald-400" />
          <Link href="/investigate" className="font-semibold text-zinc-100 tracking-tight hover:text-white">
            CodeDetective
          </Link>
          <span className="text-zinc-700 text-xs ml-1">/ History</span>
        </div>
        <Link
          href="/investigate"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← New investigation
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-zinc-100 font-semibold text-lg">Past investigations</h1>
          {!loading && (
            <span className="text-xs text-zinc-600">{cases.length} case{cases.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && cases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">No investigations yet.</p>
            <Link
              href="/investigate"
              className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Start your first one →
            </Link>
          </div>
        )}

        {!loading && cases.length > 0 && (
          <div className="space-y-2">
            {cases.map((c) => (
              <Link
                key={c._id}
                href={`/case/${c._id}`}
                className="group flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60 hover:border-zinc-700 px-4 py-4 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-mono leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {c.title}
                  </p>

                  {c.verdict && (
                    <p className="mt-1.5 text-xs text-zinc-500 line-clamp-1">
                      {c.verdict.conclusion}
                    </p>
                  )}

                  {c.sharedHitCaseId && !c.verdict && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-500/80">
                      <Zap className="w-3 h-3" />
                      Hivemind hit
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs text-zinc-600">{timeAgo(c.createdAt)}</span>

                    {c.verdict?.confidence && (
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${confidenceColor[c.verdict.confidence]}`}>
                        {c.verdict.confidence}
                      </span>
                    )}

                    {c.status === "investigating" && (
                      <span className="text-xs px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-400/10 border-emerald-400/20 font-medium">
                        in progress
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 mt-0.5 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
