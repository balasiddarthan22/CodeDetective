export type MemoryNamespace = "hivemind" | `stack:${string}` | `history:${string}`;

export interface MemoryHit {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}
