import { useVizelTheme, type VizelTheme, VizelThemeProvider } from "@vizel/react";

interface ThemeProviderFixtureProps {
  defaultTheme?: VizelTheme;
  storageKey?: string;
}

function ThemeContent() {
  const { theme, setTheme } = useVizelTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // The hook exposes a single resolved theme value rather than separate
  // `theme` (user setting) and `resolvedTheme` (applied) fields. Render
  // that one source under both testids so a scenario can assert either
  // without depending on a split-state shape.
  return (
    <div data-testid="theme-content">
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{theme}</span>
      <button type="button" data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

export function ThemeProviderFixture({
  defaultTheme = "system",
  storageKey = "vizel-theme-test",
}: ThemeProviderFixtureProps) {
  return (
    <VizelThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
      <ThemeContent />
    </VizelThemeProvider>
  );
}
