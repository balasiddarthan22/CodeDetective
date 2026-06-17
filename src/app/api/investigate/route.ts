import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { agentLoop } from "@/lib/agent-loop";
import { demoLoop } from "@/lib/demo-loop";
import { encodeEvent, encodeHeartbeat } from "@/lib/sse";
import { timeAgo } from "@/lib/utils";
import type { InvestigationStep, Verdict } from "@/types/agent";

export const runtime = "nodejs";
export const maxDuration = 300;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function normalizeBug(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 200);
}

function isSimilarBug(a: string, b: string): boolean {
  const na = normalizeBug(a);
  const nb = normalizeBug(b);
  if (na === nb) return true;
  // Check if the first 100 chars match (same error, different stack trace)
  if (na.slice(0, 100) === nb.slice(0, 100)) return true;
  // Check if one contains the other (substring match on first 150 chars)
  const short = na.slice(0, 150);
  return nb.includes(short) || na.includes(nb.slice(0, 150));
}

export async function POST(req: NextRequest) {
  const { bugDescription, deviceId, demo, demoSecondRun } = await req.json();

  if (!bugDescription || !deviceId) {
    return new Response(JSON.stringify({ error: "Missing bugDescription or deviceId" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // client disconnected
        }
      };

      const heartbeat = setInterval(() => enqueue(encodeHeartbeat()), 20_000);
      let controllerClosed = false;
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        clearInterval(heartbeat);
        controller.close();
      };

      try {
        // Check Convex sharedCases before creating a new case
        if (!demo) {
          const sharedCases = await convex.query(api.memory.findSimilar, { bugDescription });
          const match = (sharedCases as Array<{
            _id: string; originalCaseId: string; bugDescription: string;
            verdict: Verdict; createdAt: number;
          }>).find((c) => isSimilarBug(c.bugDescription, bugDescription));

          if (match) {
            const tempId = crypto.randomUUID();
            const age = timeAgo(match.createdAt);
            enqueue(encodeEvent({ type: "case_created", caseId: tempId }));
            enqueue(encodeEvent({
              type: "shared_hit",
              caseId: match.originalCaseId,
              age,
              preview: match.verdict.conclusion.slice(0, 180),
              verdict: match.verdict,
            }));
            enqueue(encodeEvent({ type: "done", caseId: tempId }));
            close();
            return;
          }
        }

        // Create case in Convex
        const caseId = await convex.mutation(api.cases.create, {
          deviceId,
          bugDescription,
        });

        enqueue(encodeEvent({ type: "case_created", caseId: caseId as string }));

        // Choose loop: demo or real
        const loop = demo
          ? demoLoop(caseId as string, demoSecondRun ?? false)
          : agentLoop(caseId as string, deviceId, bugDescription);

        let finalVerdict: Verdict | null = null;
        let isSharedHit = false;

        for await (const event of loop) {
          enqueue(encodeEvent(event));

          if (event.type === "step") {
            const s = event.step as InvestigationStep;
            await convex.mutation(api.steps.add, {
              caseId: caseId as Id<"cases">,
              deviceId,
              kind: s.kind,
              content: s.content,
              systemLabel: s.systemLabel,
              metadata: s.metadata,
            });

            if (s.kind === "plan" && s.systemLabel === "Hermes") {
              await convex.mutation(api.cases.updateStatus, {
                caseId: caseId as Id<"cases">,
                status: "investigating",
              });
            }

            if (s.kind === "conclusion") {
              finalVerdict = s.metadata?.verdict as Verdict ?? null;
            }
          }

          if (event.type === "shared_hit") {
            isSharedHit = true;
            await convex.mutation(api.cases.setSharedHit, {
              caseId: caseId as Id<"cases">,
              sharedHitCaseId: event.caseId,
              sharedHitAge: event.age,
            });
          }

          if (event.type === "done" && !isSharedHit && finalVerdict) {
            await convex.mutation(api.cases.updateStatus, {
              caseId: caseId as Id<"cases">,
              status: "concluded",
              verdict: finalVerdict,
            });
            // Write to sharedCases for any completed investigation
            await convex.mutation(api.memory.addSharedCase, {
              originalCaseId: caseId as Id<"cases">,
              bugDescription,
              verdict: finalVerdict,
            });
          } else if (event.type === "done" && !isSharedHit) {
            await convex.mutation(api.cases.updateStatus, {
              caseId: caseId as Id<"cases">,
              status: "concluded",
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        enqueue(encodeEvent({ type: "error", message }));
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
