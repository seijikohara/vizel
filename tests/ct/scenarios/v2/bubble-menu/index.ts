import type { VizelScenarioDefinition } from "../types.ts";

/**
 * Framework-neutral scenario for the `bubble-menu` feature.
 *
 * Phase 3a/3b/3c fill the assertions. This Phase 1.5 stub lets the
 * manifest-driven parity check verify that every feature has a
 * scenario folder.
 */
export interface BubbleMenuScenarioProps {
  readonly initialMarkdown: string;
}

export const bubbleMenuScenario: VizelScenarioDefinition<BubbleMenuScenarioProps> = {
  featureId: "bubble-menu",
  description: "Render the bubble menu, track selection, and respond to keyboard dismiss.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("bubble-menu scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
