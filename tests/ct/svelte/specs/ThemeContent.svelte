<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

const themeState = getVizelTheme();

function toggleTheme() {
  themeState.setTheme(themeState.resolvedTheme === "dark" ? "light" : "dark");
}
</script>

<div data-testid="theme-content">
  <span data-testid="current-theme">{themeState.theme}</span>
  <span data-testid="resolved-theme">{themeState.resolvedTheme}</span>
  <button type="button" data-testid="toggle-theme" onclick={toggleTheme}>Toggle</button>
</div>
