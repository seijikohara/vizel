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

  // The v2 hook collapses `theme` (user setting) and `resolvedTheme` (applied)
  // into a single resolved value. Render the same source under both legacy
  // testids so existing scenarios keep passing without depending on the
  // removed `VizelThemeState` shape.
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
