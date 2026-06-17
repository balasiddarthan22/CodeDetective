import type { AgentEvent } from "@/types/agent";

export function encodeEvent(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function encodeHeartbeat(): string {
  return ": ping\n\n";
}

export function parseEvent(raw: string): AgentEvent | null {
  const line = raw.startsWith("data: ") ? raw.slice(6) : raw;
  try {
    return JSON.parse(line) as AgentEvent;
  } catch {
    return null;
  }
}
