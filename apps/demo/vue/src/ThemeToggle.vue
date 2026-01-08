<script setup lang="ts">
import { useVizelTheme } from "@vizel/vue";

const themeState = useVizelTheme();

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
