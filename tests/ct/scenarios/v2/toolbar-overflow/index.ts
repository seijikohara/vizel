import type { VizelScenarioDefinition } from "../types.ts";

export interface ToolbarOverflowScenarioProps {
  readonly initialMarkdown: string;
}

export const toolbarOverflowScenario: VizelScenarioDefinition<ToolbarOverflowScenarioProps> = {
  featureId: "toolbar-overflow",
  description: "Collapse toolbar items into the secondary overflow menu when the host shrinks.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("toolbar-overflow scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
