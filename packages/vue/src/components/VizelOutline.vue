<script setup lang="ts">
import { buildVizelOutlineSpec, type Editor, type VizelLocale, vizelEnLocale } from "@vizel/core";
import { computed } from "vue";

import { useVizelState } from "../composables/useVizelState.ts";
import { useVizelContextSafe } from "./VizelContext.ts";
import VizelOutlineItems from "./VizelOutlineItems.vue";

export interface VizelOutlineProps {
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /**
   * Override for the current document position used to highlight the
   * active heading. Defaults to `editor.state.selection.from`.
   */
  currentPos?: number | null;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelOutlineProps>();

const contextEditor = useVizelContextSafe();
const resolvedEditor = computed<Editor | null>(() => props.editor ?? contextEditor?.value ?? null);

const updateCount = useVizelState(() => resolvedEditor.value);

const resolvedLocale = computed(() => props.locale ?? vizelEnLocale);
const spec = computed(() => {
  void updateCount.value;
  const e = resolvedEditor.value;
  if (!e) return null;
  const resolvedPos = props.currentPos === undefined ? e.state.selection.from : props.currentPos;
  return buildVizelOutlineSpec(e, resolvedPos, resolvedLocale.value);
});
</script>

<template>
  <nav
    v-if="resolvedEditor && spec"
    :class="['vizel-outline', $props.class]"
    :role="spec.root.role"
    :aria-label="spec.root['aria-label']"
    data-vizel-outline=""
  >
    <VizelOutlineItems v-if="spec.items.length > 0" :items="spec.items" :editor="resolvedEditor" />
  </nav>
</template>
