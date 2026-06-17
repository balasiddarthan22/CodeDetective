import type { MemoryHit } from "@/types/memory";
import { timeAgo } from "./utils";

const BASE = "https://api.supermemory.ai/v3";
const MAX_MEMORY_CONTEXT = 2000;
const SHARED_THRESHOLD = parseFloat(
  process.env.NEXT_PUBLIC_SUPERMEMORY_SHARED_THRESHOLD ?? "0.70"
);

function headers() {
  return {
    Authorization: `Bearer ${process.env.SUPERMEMORY_API_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

export const NS = {
  static: (deviceId: string) => `stack:${deviceId}`,
  dynamic: (deviceId: string) => `history:${deviceId}`,
  shared: () => "hivemind",
} as const;

export async function addMemory(
  content: string,
  containerTag: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${BASE}/documents`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ content, containerTag, metadata }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Supermemory add failed: ${res.status}`);
    return "";
  }
  return body.id ?? "";
}

export async function searchMemory(
  query: string,
  containerTag: string,
  limit = 3
): Promise<MemoryHit[]> {
  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, containerTag, limit }),
  });
  if (!res.ok) {
    console.error(`Supermemory search failed: ${res.status}`);
    return [];
  }
  const data = await res.json();
  const raw: Array<Record<string, unknown>> = data.results ?? data.memories ?? [];
  const results: MemoryHit[] = raw.map((r) => ({
    id: (r.id ?? r.documentId ?? "") as string,
    content: (r.content ?? r.document ?? r.text ?? "") as string,
    score: ((r.score ?? r.similarity ?? r.relevance ?? 1) as number),
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
  }));
  return results;
}

export async function getStackContext(deviceId: string): Promise<string> {
  const hits = await searchMemory("tech stack programming languages frameworks", NS.static(deviceId), 1);
  if (!hits.length) return "";
  return hits[0].content.slice(0, MAX_MEMORY_CONTEXT);
}

export async function getHistoryContext(deviceId: string, bug: string): Promise<string> {
  const hits = await searchMemory(bug, NS.dynamic(deviceId), 2);
  if (!hits.length) return "";
  return hits
    .map((h) => h.content)
    .join("\n---\n")
    .slice(0, MAX_MEMORY_CONTEXT);
}

export interface HivemindHit {
  caseId: string;
  age: string;
  preview: string;
  verdict: unknown;
  score: number;
}

export async function checkHivemind(bug: string): Promise<HivemindHit | null> {
  const hits = await searchMemory(bug, NS.shared(), 1);
  if (!hits.length) return null;
  const hit = hits[0];
  if (hit.score < SHARED_THRESHOLD) return null;
  const meta = hit.metadata ?? {};
  const createdAt = meta.createdAt as number | undefined;
  const age = createdAt ? timeAgo(createdAt) : "recently";
  return {
    caseId: (meta.caseId as string) ?? "",
    age,
    preview: hit.content.slice(0, 200),
    verdict: meta.verdict ?? null,
    score: hit.score,
  };
}
