import type { VizelScenarioDefinition } from "../types.ts";

export interface ThemeScenarioProps {
  readonly defaultTheme?: "light" | "dark" | "system";
}

export const themeScenario: VizelScenarioDefinition<ThemeScenarioProps> = {
  featureId: "theme",
  description: "Resolve light and dark themes and respect the system preference fallback.",
  run(): Promise<void> {
    return Promise.reject(new Error("theme scenario pending Phase 3 implementation; see ADR-0012"));
  },
};
