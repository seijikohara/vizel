<script setup lang="ts">
import { useVizelTheme } from "@vizel/vue";

// Destructure here so the template can read `theme` as a top-level ref binding
// (Vue auto-unwraps refs accessed by name in templates, but NOT when accessed
// as a property of an enclosing object).
const { theme, setTheme } = useVizelTheme();

function toggleTheme() {
  setTheme(theme.value === "dark" ? "light" : "dark");
}
</script>

<template>
  <div data-testid="theme-content">
    <span data-testid="current-theme">{{ theme }}</span>
    <span data-testid="resolved-theme">{{ theme }}</span>
    <button type="button" data-testid="toggle-theme" @click="toggleTheme">Toggle</button>
  </div>
</template>
