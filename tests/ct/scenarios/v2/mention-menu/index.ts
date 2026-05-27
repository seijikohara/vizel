import type { VizelScenarioDefinition } from "../types.ts";

export interface MentionMenuScenarioProps {
  readonly initialMarkdown: string;
}

export const mentionMenuScenario: VizelScenarioDefinition<MentionMenuScenarioProps> = {
  featureId: "mention-menu",
  description: "Trigger the mention menu, filter candidates, and navigate with the keyboard.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("mention-menu scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
