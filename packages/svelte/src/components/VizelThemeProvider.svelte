<script lang="ts" module>
import type { VizelThemeProviderOptions } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelThemeProviderProps extends VizelThemeProviderOptions {
  /** Children to render */
  children: Snippet;
}
</script>

<script lang="ts">
  import {
    applyVizelTheme,
    createVizelSystemThemeListener,
    VIZEL_DEFAULT_THEME,
    VIZEL_DEFAULT_THEME_STORAGE_KEY,
    getStoredVizelTheme,
    getVizelSystemTheme,
    resolveVizelTheme,
    storeVizelTheme,
    type VizelResolvedTheme,
    type VizelTheme,
    type VizelThemeState,
  } from "@vizel/core";
  import { setVizelThemeContext } from "./VizelThemeContext.js";

  let {
    children,
    defaultTheme = VIZEL_DEFAULT_THEME,
    storageKey = VIZEL_DEFAULT_THEME_STORAGE_KEY,
    targetSelector,
    disableTransitionOnChange = false,
  }: VizelThemeProviderProps = $props();

  // Intentionally capture initial values only - theme state should persist
  // regardless of prop changes after mount
  // svelte-ignore state_referenced_locally
  let theme = $state<VizelTheme>(getStoredVizelTheme(storageKey) ?? defaultTheme);
  let systemTheme = $state<VizelResolvedTheme>(getVizelSystemTheme());

  const resolvedTheme = $derived(resolveVizelTheme(theme, systemTheme));

  function setTheme(newTheme: VizelTheme) {
    theme = newTheme;
    storeVizelTheme(storageKey, newTheme);
  }

  const themeState: VizelThemeState = {
    get theme() {
      return theme;
    },
    get resolvedTheme() {
      return resolvedTheme;
    },
    get systemTheme() {
      return systemTheme;
    },
    setTheme,
  };

  setVizelThemeContext(themeState);

  // Apply theme when resolved theme changes
  $effect(() => {
    applyVizelTheme(resolvedTheme, targetSelector, disableTransitionOnChange);
  });

  $effect(() => {
    // Listen for system theme changes
    const controller = createVizelSystemThemeListener((newSystemTheme: VizelResolvedTheme) => {
      systemTheme = newSystemTheme;
    });
    controller.mount();
    return () => controller.unmount();
  });
</script>

{@render children()}
