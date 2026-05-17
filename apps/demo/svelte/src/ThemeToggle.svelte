<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

const themeState = getVizelTheme();

function toggleTheme() {
  themeState.setTheme(themeState.current === "dark" ? "light" : "dark");
}
</script>

<button
  type="button"
  class="theme-toggle"
  onclick={toggleTheme}
  aria-label={`Switch to ${themeState.current === 'dark' ? 'light' : 'dark'} mode`}
>
  {themeState.current === "dark" ? "☀️" : "🌙"}
</button>
