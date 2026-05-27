import type { VizelScenarioDefinition } from "../types.ts";

export interface VersionHistoryScenarioProps {
  readonly initialMarkdown: string;
}

export const versionHistoryScenario: VizelScenarioDefinition<VersionHistoryScenarioProps> = {
  featureId: "version-history",
  description: "Snapshot Markdown revisions and restore an earlier version.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("version-history scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
