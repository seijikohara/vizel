<script setup lang="ts">
import {
  applyTheme,
  createSystemThemeListener,
  DEFAULT_THEME,
  DEFAULT_THEME_STORAGE_KEY,
  getStoredTheme,
  getSystemTheme,
  type ResolvedTheme,
  resolveTheme,
  storeTheme,
  type Theme,
  type ThemeProviderOptions,
  type ThemeState,
} from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { ThemeContextKey } from "./ThemeContext";

export interface ThemeProviderProps extends ThemeProviderOptions {}

const props = withDefaults(defineProps<ThemeProviderProps>(), {
  defaultTheme: DEFAULT_THEME,
  storageKey: DEFAULT_THEME_STORAGE_KEY,
  disableTransitionOnChange: false,
});

const theme = ref<Theme>(getStoredTheme(props.storageKey) ?? props.defaultTheme);
const systemTheme = ref<ResolvedTheme>(getSystemTheme());

const resolvedTheme = computed(() => resolveTheme(theme.value, systemTheme.value));

function setTheme(newTheme: Theme) {
  theme.value = newTheme;
  storeTheme(props.storageKey, newTheme);
}

const themeState: ThemeState = {
  get theme() {
    return theme.value;
  },
  get resolvedTheme() {
    return resolvedTheme.value;
  },
  get systemTheme() {
    return systemTheme.value;
  },
  setTheme,
};

provide(ThemeContextKey, themeState);

let cleanup: (() => void) | null = null;

onMounted(() => {
  // Apply initial theme
  applyTheme(resolvedTheme.value, props.targetSelector, props.disableTransitionOnChange);

  // Listen for system theme changes
  cleanup = createSystemThemeListener((newSystemTheme) => {
    systemTheme.value = newSystemTheme;
  });
});

// Watch for resolved theme changes
watch(resolvedTheme, (newResolvedTheme) => {
  applyTheme(newResolvedTheme, props.targetSelector, props.disableTransitionOnChange);
});

onBeforeUnmount(() => {
  if (cleanup) {
    cleanup();
  }
});
</script>

<template>
  <slot />
</template>
