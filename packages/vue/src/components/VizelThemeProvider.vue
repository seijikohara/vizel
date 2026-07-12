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

import { VIZEL_THEME_CONTEXT_KEY } from "./VizelThemeContext.ts";

// oxlint-disable-next-line typescript/no-empty-object-type -- gives the shared VizelThemeProviderOptions a component-specific name for defineProps<T>() and public API docs
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

provide(VIZEL_THEME_CONTEXT_KEY, themeState);

const listenerState: { instance: ReturnType<typeof createVizelSystemThemeListener> | null } = {
  instance: null,
};

onMounted(() => {
  // Apply initial theme
  applyVizelTheme(resolvedTheme.value, props.targetSelector, props.disableTransitionOnChange);

  // Listen for system theme changes
  const instance = createVizelSystemThemeListener((newSystemTheme) => {
    systemTheme.value = newSystemTheme;
  });
  listenerState.instance = instance;
  instance.mount();
});

// Re-apply the theme whenever ANY input changes: the resolved theme,
// the target selector, or the transition-disable flag. The previous
// watcher only tracked `resolvedTheme`, so changing `targetSelector` or
// `disableTransitionOnChange` after mount had no effect (drift from the
// React `VizelThemeProvider`, which lists all three as effect deps).
watch(
  [resolvedTheme, () => props.targetSelector, () => props.disableTransitionOnChange],
  ([newResolvedTheme, targetSelector, disableTransitionOnChange]) => {
    applyVizelTheme(newResolvedTheme, targetSelector, disableTransitionOnChange);
  }
);

onBeforeUnmount(() => {
  listenerState.instance?.unmount();
  listenerState.instance = null;
});
</script>

<template>
  <slot />
</template>
