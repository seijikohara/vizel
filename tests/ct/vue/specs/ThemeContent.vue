<script setup lang="ts">
import { useVizelTheme } from "@vizel/vue";

const themeState = useVizelTheme();

function toggleTheme() {
  themeState.setTheme(themeState.resolvedTheme === "dark" ? "light" : "dark");
}
</script>

<template>
  <div data-testid="theme-content">
    <span data-testid="current-theme">{{ themeState.theme }}</span>
    <span data-testid="resolved-theme">{{ themeState.resolvedTheme }}</span>
    <button type="button" data-testid="toggle-theme" @click="toggleTheme">Toggle</button>
  </div>
</template>
