<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
  editor: Editor;
  class?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const currentHref = computed(() => props.editor.getAttributes("link").href || "");
const url = ref(currentHref.value);

onMounted(() => {
  inputRef.value?.focus();
});

function handleSubmit(e: Event) {
  e.preventDefault();
  if (url.value.trim()) {
    props.editor.chain().focus().setLink({ href: url.value.trim() }).run();
  } else {
    props.editor.chain().focus().unsetLink().run();
  }
  emit("close");
}

function handleRemove() {
  props.editor.chain().focus().unsetLink().run();
  emit("close");
}
</script>

<template>
  <form
    :class="['vizel-link-editor', $props.class]"
    @submit="handleSubmit"
  >
    <input
      ref="inputRef"
      v-model="url"
      type="url"
      placeholder="Enter URL..."
      class="vizel-link-input"
    />
    <button type="submit" class="vizel-link-button" title="Apply">
      OK
    </button>
    <button
      v-if="currentHref"
      type="button"
      class="vizel-link-button vizel-link-remove"
      title="Remove link"
      @click="handleRemove"
    >
      X
    </button>
  </form>
</template>
