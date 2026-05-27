import type { VizelScenarioDefinition } from "../types.ts";

export interface CommentScenarioProps {
  readonly initialMarkdown: string;
}

export const commentScenario: VizelScenarioDefinition<CommentScenarioProps> = {
  featureId: "comment",
  description: "Create a comment thread, list replies, and resolve the thread.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("comment scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
