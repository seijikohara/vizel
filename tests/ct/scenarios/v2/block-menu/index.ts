import type { VizelScenarioDefinition } from "../types.ts";

/**
 * Framework-neutral scenario for the `block-menu` feature.
 *
 * Phase 3a/3b/3c fill the assertions. This Phase 1.5 stub lets the
 * manifest-driven parity check verify that every feature has a
 * scenario folder.
 */
export interface BlockMenuScenarioProps {
  readonly initialMarkdown: string;
}

export const blockMenuScenario: VizelScenarioDefinition<BlockMenuScenarioProps> = {
  featureId: "block-menu",
  description: "Surface block-level actions through the drag-handle menu.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("block-menu scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
