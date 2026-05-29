<script setup lang="ts">
import { shallowEqualObject, useVizelEditorState } from "@vizel/vue";

// Read character and word counts via the v2 selector composable.
//
// `useVizelEditorState` reads the editor from the surrounding
// `VizelProvider` and re-evaluates the selector only when the selector
// slice changes (`shallowEqualObject`). The selector receives a
// snapshot with the editor instance plus the most recent transaction;
// the count fields fall back to zero when Tiptap has not finished
// mounting. See ADR-0009 for the first-party reactivity primitive
// that backs the composable.
const stats = useVizelEditorState(
  ({ editor }) => ({
    characters: editor?.storage.characterCount?.characters() ?? 0,
    words: editor?.storage.characterCount?.words() ?? 0,
  }),
  { equalityFn: shallowEqualObject }
);
</script>

<template>
  <span class="status-item">{{ stats.characters }} characters</span>
  <span class="status-divider">·</span>
  <span class="status-item">{{ stats.words }} words</span>
</template>
