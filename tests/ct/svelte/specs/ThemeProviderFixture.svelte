<script lang="ts">
import { type Theme, ThemeProvider } from "@vizel/svelte";
import ThemeContent from "./ThemeContent.svelte";

interface Props {
  defaultTheme?: Theme;
  storageKey?: string;
}

let { defaultTheme = "system", storageKey = "vizel-theme-test" }: Props = $props();
</script>

<ThemeProvider {defaultTheme} {storageKey}>
  {#snippet children()}
    <ThemeContent />
  {/snippet}
</ThemeProvider>
