import type { VizelScenarioDefinition } from "../types.ts";

export interface ColorPickerScenarioProps {
  readonly initialMarkdown: string;
}

export const colorPickerScenario: VizelScenarioDefinition<ColorPickerScenarioProps> = {
  featureId: "color-picker",
  description: "Render the colour grid, pick a colour, and dismiss with Escape.",
  run(): Promise<void> {
    return Promise.reject(
      new Error("color-picker scenario pending Phase 3 implementation; see ADR-0012")
    );
  },
};
