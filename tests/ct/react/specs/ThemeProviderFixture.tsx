import { type Theme, useVizelTheme, VizelThemeProvider } from "@vizel/react";

interface ThemeProviderFixtureProps {
  defaultTheme?: Theme;
  storageKey?: string;
}

function ThemeContent() {
  const { theme, resolvedTheme, setTheme } = useVizelTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div data-testid="theme-content">
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
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
