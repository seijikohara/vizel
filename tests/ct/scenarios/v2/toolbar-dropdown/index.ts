import type { VizelScenarioDefinition } from "../types.ts";

export interface ToolbarDropdownScenarioProps {
  readonly initialMarkdown: string;
}

export const toolbarDropdownScenario: VizelScenarioDefinition<ToolbarDropdownScenarioProps> = {
  featureId: "toolbar-dropdown",
  description: "Open a toolbar dropdown, navigate with the keyboard, and dismiss with Escape.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("toolbar-dropdown scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
