<script setup lang="ts">
import type { Editor } from "@vizel/core";
import { computed, onMounted, onUnmounted, ref } from "vue";

export interface BubbleMenuLinkEditorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
}

const props = defineProps<BubbleMenuLinkEditorProps>();

const emit = defineEmits<{
  close: [];
}>();

const formRef = ref<HTMLFormElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const currentHref = computed(() => props.editor.getAttributes("link").href || "");
const url = ref(currentHref.value);

// Handle click outside to close
function handleClickOutside(event: MouseEvent) {
  if (formRef.value && !formRef.value.contains(event.target as Node)) {
    emit("close");
  }
}

// Handle Escape key to close
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    emit("close");
  }
}

onMounted(() => {
  inputRef.value?.focus();

  // Use setTimeout to avoid immediate trigger from the click that opened the editor
  setTimeout(() => {
    document.addEventListener("mousedown", handleClickOutside);
  }, 0);
  // Use capture phase so this handler runs before BubbleMenu's handler
  document.addEventListener("keydown", handleKeyDown, true);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("keydown", handleKeyDown, true);
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
    ref="formRef"
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
