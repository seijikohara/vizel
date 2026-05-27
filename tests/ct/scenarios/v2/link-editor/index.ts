import type { VizelScenarioDefinition } from "../types.ts";

export interface LinkEditorScenarioProps {
  readonly initialMarkdown: string;
}

export const linkEditorScenario: VizelScenarioDefinition<LinkEditorScenarioProps> = {
  featureId: "link-editor",
  description: "Open the link editor, submit a URL, remove the link, and dismiss with Escape.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("link-editor scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
