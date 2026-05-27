import type { VizelScenarioDefinition } from "../types.ts";

export interface FindReplaceScenarioProps {
  readonly initialMarkdown: string;
}

export const findReplaceScenario: VizelScenarioDefinition<FindReplaceScenarioProps> = {
  featureId: "find-replace",
  description:
    "Open the find-replace panel, find a term, replace one match, and replace all matches.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("find-replace scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
