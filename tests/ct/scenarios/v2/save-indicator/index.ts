import type { VizelScenarioDefinition } from "../types.ts";

export interface SaveIndicatorScenarioProps {
  readonly initialMarkdown: string;
}

export const saveIndicatorScenario: VizelScenarioDefinition<SaveIndicatorScenarioProps> = {
  featureId: "save-indicator",
  description: "Reflect auto-save status transitions in the save indicator's live region.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("save-indicator scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
