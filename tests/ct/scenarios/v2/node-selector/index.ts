import type { VizelScenarioDefinition } from "../types.ts";

export interface NodeSelectorScenarioProps {
  readonly initialMarkdown: string;
}

export const nodeSelectorScenario: VizelScenarioDefinition<NodeSelectorScenarioProps> = {
  featureId: "node-selector",
  description: "Open the node selector and switch the current block's node type.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("node-selector scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
