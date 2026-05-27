import type { VizelScenarioDefinition } from "../types.ts";

export interface ToolbarScenarioProps {
  readonly initialMarkdown: string;
}

export const toolbarScenario: VizelScenarioDefinition<ToolbarScenarioProps> = {
  featureId: "toolbar",
  description: "Render the toolbar and invoke formatting and block actions.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("toolbar scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
