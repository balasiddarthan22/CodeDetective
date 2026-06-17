import Link from "next/link";
import { ArrowRight, Bug, ClipboardList, History, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Trace the failure",
    text: "Searches current references and records the reasoning trail.",
  },
  {
    icon: ClipboardList,
    title: "Produce a case file",
    text: "Returns the hypothesis, evidence, sources checked, and final fix.",
  },
  {
    icon: History,
    title: "Reuse resolved cases",
    text: "Keeps previous investigations available when the same error appears again.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-100">
            <Bug className="h-5 w-5 text-emerald-400" />
            CodeDetective
          </Link>
          <Link
            href="/investigate"
            className="pressable inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            Open workspace
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-5xl content-center gap-12 px-6 py-12 lg:grid-cols-[1fr_380px] lg:items-center">
        <section className="space-y-7">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Debug evidence workspace
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
              Turn a runtime error into a readable case file.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-400">
              Paste the failure, let CodeDetective inspect relevant sources, then review the trail before applying the fix.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/investigate"
              className="pressable inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
            >
              Start investigation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/history"
              className="pressable inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              View history
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="font-mono text-xs font-medium text-zinc-500">Case preview</span>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
              ready
            </span>
          </div>
          <div className="space-y-4 font-mono text-xs leading-6">
            <div>
              <p className="text-zinc-500">input</p>
              <p className="mt-1 rounded border border-zinc-800 bg-zinc-950 p-3 text-zinc-300">
                Hydration failed because the initial UI does not match what was rendered on the server.
              </p>
            </div>
            <div>
              <p className="text-zinc-500">output</p>
              <div className="mt-1 space-y-2 rounded border border-zinc-800 bg-zinc-950 p-3 text-zinc-300">
                <p><span className="text-emerald-400">hypothesis</span>: client-only value rendered during SSR</p>
                <p><span className="text-emerald-400">evidence</span>: docs + matching report</p>
                <p><span className="text-emerald-400">fix</span>: move the value behind a mounted state or disable SSR for that component</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:col-span-2 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <step.icon className="mb-3 h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-medium text-zinc-100">{step.title}</h2>
              <p className="mt-1.5 text-xs leading-5 text-zinc-500">{step.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
