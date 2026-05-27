import type { VizelScenarioDefinition } from "../types.ts";

export interface OutlineScenarioProps {
  readonly initialMarkdown: string;
}

export const outlineScenario: VizelScenarioDefinition<OutlineScenarioProps> = {
  featureId: "outline",
  description: "Render the document outline and track heading changes as the user edits.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("outline scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
