<script setup lang="ts">
import { type Theme, ThemeProvider } from "@vizel/vue";
import ThemeContent from "./ThemeContent.vue";

const props = withDefaults(
  defineProps<{
    defaultTheme?: Theme;
    storageKey?: string;
  }>(),
  {
    defaultTheme: "system",
    storageKey: "vizel-theme-test",
  }
);
</script>

<template>
  <ThemeProvider :defaultTheme="props.defaultTheme" :storageKey="props.storageKey">
    <ThemeContent />
  </ThemeProvider>
</template>
