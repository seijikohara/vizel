import type { VizelScenarioDefinition } from "../types.ts";

/**
 * Framework-neutral scenario for the `auto-save` feature.
 *
 * Phase 3a/3b/3c fill the assertions. This Phase 1.5 stub lets the
 * manifest-driven parity check verify that every feature has a
 * scenario folder.
 */
export interface AutoSaveScenarioProps {
  readonly initialMarkdown: string;
}

export const autoSaveScenario: VizelScenarioDefinition<AutoSaveScenarioProps> = {
  featureId: "auto-save",
  description: "Debounce, persist, and restore Markdown through the configured backend.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("auto-save scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
