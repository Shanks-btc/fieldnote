import type { Brief } from "@/lib/validation/brief";

/**
 * Provider-agnostic LLM interface. NOT IMPLEMENTED (Phase 7).
 * The LLM never invents scores or cultural connections: it parses briefs and
 * phrases explanations from data it is handed.
 */
export interface LlmAdapter {
  /** Turn free-form brief fields into structured creative requirements. */
  parseBrief(brief: Brief): Promise<ParsedBrief>;
  /** Write one evidence-grounded paragraph per recommendation. */
  explain(input: ExplainInput): Promise<string>;
}

export interface ParsedBrief {
  moods: string[];
  genres: string[];
  tempo: "slow" | "mid" | "fast" | "unspecified";
  searchTerms: string[];
}

export interface ExplainInput {
  brief: Brief;
  artistName: string;
  /** Only these facts may be cited. */
  facts: { tasteTags: string[]; sharedEntities: string[]; geographicOverlap: string | null; trend: string };
}
