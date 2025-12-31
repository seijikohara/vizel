<script lang="ts">
import { getTheme } from "@vizel/svelte";

const themeState = getTheme();

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
