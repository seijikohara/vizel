<script lang="ts">
import { type Theme, VizelThemeProvider } from "@vizel/svelte";
import ThemeContent from "./ThemeContent.svelte";

interface Props {
  defaultTheme?: Theme;
  storageKey?: string;
}

let { defaultTheme = "system", storageKey = "vizel-theme-test" }: Props = $props();
</script>

<VizelThemeProvider {defaultTheme} {storageKey}>
  {#snippet children()}
    <ThemeContent />
  {/snippet}
</VizelThemeProvider>
