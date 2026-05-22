<script setup lang="ts">
import { useVizelThemeSafe } from "@vizel/vue";
import { computed, ref } from "vue";

const THEME_STORAGE_KEY = "vizel-theme";

type ThemeMode = "light" | "dark" | "system";

function readStoredThemeMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

const props = defineProps<{
  /** Triggered when the user picks "system" so the provider remounts. */
  onResetToSystem?: () => void;
}>();

const themeApi = useVizelThemeSafe();
const resolvedTheme = computed(() => themeApi?.theme.value);
const storedMode = ref<ThemeMode>(readStoredThemeMode());

function pickLight(): void {
  themeApi?.setTheme("light");
  storedMode.value = "light";
}

function pickDark(): void {
  themeApi?.setTheme("dark");
  storedMode.value = "dark";
}

function pickSystem(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }
  storedMode.value = "system";
  props.onResetToSystem?.();
}
</script>

<template>
  <fieldset class="theme-toggle-group" aria-label="Theme">
    <button
      type="button"
      class="theme-toggle-option"
      :data-active="storedMode === 'light'"
      aria-label="Light mode"
      title="Light"
      @click="pickLight"
    >
      ☀
    </button>
    <button
      type="button"
      class="theme-toggle-option"
      :data-active="storedMode === 'dark'"
      aria-label="Dark mode"
      title="Dark"
      @click="pickDark"
    >
      ☾
    </button>
    <button
      type="button"
      class="theme-toggle-option"
      :data-active="storedMode === 'system'"
      :aria-label="`System (currently ${resolvedTheme ?? 'light'})`"
      title="System"
      @click="pickSystem"
    >
      ⎙
    </button>
  </fieldset>
</template>
