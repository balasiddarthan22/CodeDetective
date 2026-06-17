export type SystemLabel = "Supermemory" | "Hermes" | "TinyFish Search" | "TinyFish Fetch";

export type StepKind =
  | "plan"
  | "search_query"
  | "search_result"
  | "reasoning"
  | "fetch_url"
  | "fetch_result"
  | "conclusion";

export interface InvestigationStep {
  id: string;
  caseId: string;
  kind: StepKind;
  content: string;
  systemLabel: SystemLabel;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface Verdict {
  hypothesis: string;
  evidence: string[];
  sourcesChecked: string[];
  conclusion: string;
  confidence: "high" | "medium" | "low";
}

export type AgentEvent =
  | { type: "case_created"; caseId: string }
  | { type: "shared_hit"; caseId: string; age: string; preview: string; verdict: Verdict }
  | { type: "stream_chunk"; text: string; stepKind: StepKind; systemLabel: SystemLabel }
  | { type: "step"; step: InvestigationStep }
  | { type: "done"; caseId: string }
  | { type: "error"; message: string };
