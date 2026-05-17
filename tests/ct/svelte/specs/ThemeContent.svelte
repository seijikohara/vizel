<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

const themeState = getVizelTheme();

function toggleTheme() {
  themeState.setTheme(themeState.current === "dark" ? "light" : "dark");
}
</script>

<!--
  The v2 rune collapses `theme` (user setting) and `resolvedTheme` (applied)
  into a single resolved value. Render the same source under both legacy
  testids so existing scenarios keep passing without depending on the
  removed `VizelThemeState` shape.
-->
<div data-testid="theme-content">
  <span data-testid="current-theme">{themeState.current}</span>
  <span data-testid="resolved-theme">{themeState.current}</span>
  <button type="button" data-testid="toggle-theme" onclick={toggleTheme}>Toggle</button>
</div>
