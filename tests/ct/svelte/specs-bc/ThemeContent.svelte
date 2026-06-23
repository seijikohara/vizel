<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

const themeState = getVizelTheme();

function toggleTheme() {
  themeState.setTheme(themeState.current === "dark" ? "light" : "dark");
}
</script>

<!--
  The rune exposes a single resolved theme value rather than separate
  `theme` (user setting) and `resolvedTheme` (applied) fields. Render
  that one source under both testids so a scenario can assert either
  without depending on a split-state shape.
-->
<div data-testid="theme-content">
  <span data-testid="current-theme">{themeState.current}</span>
  <span data-testid="resolved-theme">{themeState.current}</span>
  <button type="button" data-testid="toggle-theme" onclick={toggleTheme}>Toggle</button>
</div>
