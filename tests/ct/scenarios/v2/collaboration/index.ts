import type { VizelScenarioDefinition } from "../types.ts";

export interface CollaborationScenarioProps {
  readonly roomId: string;
}

export const collaborationScenario: VizelScenarioDefinition<CollaborationScenarioProps> = {
  featureId: "collaboration",
  description: "Join a Yjs room, receive remote updates, and broadcast presence.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("collaboration scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
