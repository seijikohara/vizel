import type { VizelScenarioDefinition } from "../types.ts";

export interface ProviderScenarioProps {
  readonly initialMarkdown: string;
}

export const providerScenario: VizelScenarioDefinition<ProviderScenarioProps> = {
  featureId: "provider",
  description: "Expose editor, locale, theme, and icons through the framework context.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("provider scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
