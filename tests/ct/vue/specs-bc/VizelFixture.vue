<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";
import { Vizel } from "@vizel/vue";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    initialContent?: JSONContent;
    showBubbleMenu?: boolean;
  }>(),
  {
    placeholder: "Type something...",
    initialContent: undefined,
    showBubbleMenu: true,
  }
);
</script>

<template>
  <Vizel
    :placeholder="props.placeholder"
    :initial-content="props.initialContent"
    :show-bubble-menu="props.showBubbleMenu"
  />
</template>
