<script setup lang="ts">
import { useTheme } from "@vizel/vue";

const themeState = useTheme();

function toggleTheme() {
  themeState.setTheme(themeState.resolvedTheme === "dark" ? "light" : "dark");
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="`Switch to ${themeState.resolvedTheme === 'dark' ? 'light' : 'dark'} mode`"
  >
    {{ themeState.resolvedTheme === "dark" ? "☀️" : "🌙" }}
  </button>
</template>
