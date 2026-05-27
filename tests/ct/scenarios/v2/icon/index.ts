import type { VizelScenarioDefinition } from "../types.ts";

export interface IconScenarioProps {
  readonly name: string;
}

export const iconScenario: VizelScenarioDefinition<IconScenarioProps> = {
  featureId: "icon",
  description: "Render an icon from the default registry and from a custom registry override.",
  run(): Promise<void> {
    return Promise.reject(new Error("icon scenario pending Phase 3 implementation; see ADR-0012"));
  },
};
