<script lang="ts" module>
import type { ThemeState } from "@vizel/core";

export const THEME_CONTEXT_KEY = Symbol("ThemeContext");
</script>

<script lang="ts">
  import {
    applyTheme,
    createSystemThemeListener,
    DEFAULT_THEME,
    DEFAULT_THEME_STORAGE_KEY,
    getStoredTheme,
    getSystemTheme,
    resolveTheme,
    storeTheme,
    type ResolvedTheme,
    type Theme,
    type ThemeProviderOptions,
  } from "@vizel/core";
  import { onMount, setContext, type Snippet } from "svelte";

  interface Props extends ThemeProviderOptions {
    /** Children to render */
    children: Snippet;
  }

  let {
    children,
    defaultTheme = DEFAULT_THEME,
    storageKey = DEFAULT_THEME_STORAGE_KEY,
    targetSelector,
    disableTransitionOnChange = false,
  }: Props = $props();

  let theme = $state<Theme>(getStoredTheme(storageKey) ?? defaultTheme);
  let systemTheme = $state<ResolvedTheme>(getSystemTheme());

  const resolvedTheme = $derived(resolveTheme(theme, systemTheme));

  function setTheme(newTheme: Theme) {
    theme = newTheme;
    storeTheme(storageKey, newTheme);
  }

  const themeState: ThemeState = {
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

  setContext(THEME_CONTEXT_KEY, themeState);

  // Apply theme when resolved theme changes
  $effect(() => {
    applyTheme(resolvedTheme, targetSelector, disableTransitionOnChange);
  });

  onMount(() => {
    // Listen for system theme changes
    const cleanup = createSystemThemeListener((newSystemTheme) => {
      systemTheme = newSystemTheme;
    });

    return cleanup;
  });
</script>

{@render children()}
