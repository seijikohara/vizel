import type { VizelScenarioDefinition } from "../types.ts";

export interface SlashMenuScenarioProps {
  readonly initialMarkdown: string;
}

export const slashMenuScenario: VizelScenarioDefinition<SlashMenuScenarioProps> = {
  featureId: "slash-menu",
  description:
    "Open the slash menu, filter results, navigate with the keyboard, and confirm a selection.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("slash-menu scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
