<script setup lang="ts">
import { useVizelTheme } from "@vizel/vue";

const { theme, setTheme } = useVizelTheme();

function toggleTheme() {
  setTheme(theme.value === "dark" ? "light" : "dark");
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
  >
    {{ theme === "dark" ? "☀️" : "🌙" }}
  </button>
</template>
