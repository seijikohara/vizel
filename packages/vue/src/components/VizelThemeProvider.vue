<script setup lang="ts">
import {
  applyVizelTheme,
  createVizelSystemThemeListener,
  getStoredVizelTheme,
  getVizelSystemTheme,
  resolveVizelTheme,
  storeVizelTheme,
  VIZEL_DEFAULT_THEME,
  VIZEL_DEFAULT_THEME_STORAGE_KEY,
  type VizelResolvedTheme,
  type VizelTheme,
  type VizelThemeProviderOptions,
  type VizelThemeState,
} from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { VizelThemeContextKey } from "./VizelThemeContext";

export interface VizelThemeProviderProps extends VizelThemeProviderOptions {}

const props = withDefaults(defineProps<VizelThemeProviderProps>(), {
  defaultTheme: VIZEL_DEFAULT_THEME,
  storageKey: VIZEL_DEFAULT_THEME_STORAGE_KEY,
  disableTransitionOnChange: false,
});

const theme = ref<VizelTheme>(getStoredVizelTheme(props.storageKey) ?? props.defaultTheme);
const systemTheme = ref<VizelResolvedTheme>(getVizelSystemTheme());

const resolvedTheme = computed(() => resolveVizelTheme(theme.value, systemTheme.value));

function setTheme(newTheme: VizelTheme) {
  theme.value = newTheme;
  storeVizelTheme(props.storageKey, newTheme);
}

const themeState: VizelThemeState = {
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

provide(VizelThemeContextKey, themeState);

let cleanup: (() => void) | null = null;

onMounted(() => {
  // Apply initial theme
  applyVizelTheme(resolvedTheme.value, props.targetSelector, props.disableTransitionOnChange);

  // Listen for system theme changes
  cleanup = createVizelSystemThemeListener((newSystemTheme) => {
    systemTheme.value = newSystemTheme;
  });
});

// Watch for resolved theme changes
watch(resolvedTheme, (newResolvedTheme) => {
  applyVizelTheme(newResolvedTheme, props.targetSelector, props.disableTransitionOnChange);
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
