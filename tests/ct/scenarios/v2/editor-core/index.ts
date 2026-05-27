import type { VizelScenarioDefinition } from "../types.ts";

export interface EditorCoreScenarioProps {
  readonly initialMarkdown: string;
}

export const editorCoreScenario: VizelScenarioDefinition<EditorCoreScenarioProps> = {
  featureId: "editor-core",
  description:
    "Mount the editor, type text, and round-trip Markdown through the framework lifecycle.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("editor-core scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
