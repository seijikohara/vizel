import type { VizelScenarioDefinition } from "../types.ts";

export interface EmbedViewScenarioProps {
  readonly initialMarkdown: string;
}

export const embedViewScenario: VizelScenarioDefinition<EmbedViewScenarioProps> = {
  featureId: "embed-view",
  description: "Render embedded images and diagrams inside the editor's node view layer.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("embed-view scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
