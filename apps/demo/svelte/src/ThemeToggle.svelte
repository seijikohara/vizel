<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

const themeState = getVizelTheme();

function toggleTheme() {
  themeState.setTheme(themeState.resolvedTheme === "dark" ? "light" : "dark");
}
</script>

<button
  type="button"
  class="theme-toggle"
  onclick={toggleTheme}
  aria-label={`Switch to ${themeState.resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
>
  {themeState.resolvedTheme === "dark" ? "☀️" : "🌙"}
</button>
