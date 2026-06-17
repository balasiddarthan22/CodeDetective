import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Bug, ArrowRight, CheckCircle2, AlertCircle, HelpCircle, Copy } from "lucide-react";
import Link from "next/link";
import type { Verdict } from "@/types/agent";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const CONFIDENCE_CONFIG = {
  high: { label: "High confidence", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", Icon: CheckCircle2 },
  medium: { label: "Medium confidence", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", Icon: AlertCircle },
  low: { label: "Low confidence", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", Icon: HelpCircle },
};

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  let caseData = null;
  try {
    caseData = await convex.query(api.cases.getById, { caseId: caseId as Id<"cases"> });
  } catch {
    // invalid id
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Bug className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-zinc-400 text-sm">Case not found</p>
          <Link
            href="/investigate"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            Investigate a new bug →
          </Link>
        </div>
      </div>
    );
  }

  const verdict = caseData.verdict as Verdict | undefined;
  const conf = verdict ? CONFIDENCE_CONFIG[verdict.confidence] : null;
  const ConfIcon = conf?.Icon;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bug className="w-5 h-5 text-emerald-400" />
          <Link href="/" className="font-semibold text-zinc-100 tracking-tight hover:text-white">
            CodeDetective
          </Link>
          <span className="text-zinc-700 text-xs ml-1">/ case #{caseId.slice(-8)}</span>
        </div>
        <Link
          href="/investigate"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Try it yourself <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-5">
        {/* Bug description */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-zinc-500">Bug investigated</p>
          <pre className="text-zinc-300 text-xs font-mono leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-4 whitespace-pre-wrap break-words">
            {caseData.bugDescription}
          </pre>
        </div>

        {/* Verdict */}
        {verdict && conf && ConfIcon ? (
          <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-500">Case File</span>
              <div className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium ${conf.bg} ${conf.color}`}>
                <ConfIcon className="w-3 h-3" />
                {conf.label}
              </div>
            </div>

            <div className="p-5 space-y-5 text-sm">
              <Field label="Hypothesis">
                <p className="text-zinc-200 leading-relaxed">{verdict.hypothesis}</p>
              </Field>

              <Field label="Conclusion">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-zinc-100 leading-relaxed font-medium flex-1">{verdict.conclusion}</p>
                </div>
              </Field>

              {verdict.evidence.length > 0 && (
                <Field label="Evidence">
                  <ul className="space-y-2">
                    {verdict.evidence.map((e, i) => (
                      <li key={i} className="flex gap-2.5 text-zinc-300 leading-relaxed">
                        <span className="text-emerald-500 font-mono text-xs mt-0.5 shrink-0">[{i + 1}]</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </Field>
              )}

              {verdict.sourcesChecked.length > 0 && (
                <Field label="Sources checked">
                  <ul className="space-y-1">
                    {verdict.sourcesChecked.map((s, i) => (
                      <li key={i} className="text-xs text-zinc-500 font-mono pl-3 border-l border-zinc-800">{s}</li>
                    ))}
                  </ul>
                </Field>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-sm text-zinc-500">
            {caseData.status === "investigating"
              ? "This investigation is still in progress."
              : "This investigation did not produce a verdict."}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-200">Got a bug like this?</p>
            <p className="text-xs text-zinc-500 mt-0.5">CodeDetective traces it through live sources in seconds.</p>
          </div>
          <Link
            href="/investigate"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold px-3 py-2 transition-colors"
          >
            Investigate
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-zinc-800/60 text-center text-xs text-zinc-700">
        Powered by TinyFish · Supermemory · Hermes
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {children}
    </div>
  );
}
