import type { VizelScenarioDefinition } from "../types.ts";

export interface PortalScenarioProps {
  readonly target?: string;
}

export const portalScenario: VizelScenarioDefinition<PortalScenarioProps> = {
  featureId: "portal",
  description: "Render children into a detached DOM root and tear down cleanly on unmount.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("portal scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
