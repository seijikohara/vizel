<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { detectVizelEmbedProvider } from "@vizel/core";
import { computed, onMounted, onUnmounted, ref } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelLinkEditorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
}

const props = withDefaults(defineProps<VizelLinkEditorProps>(), {
  enableEmbed: false,
});

const emit = defineEmits<{
  close: [];
}>();

const formRef = ref<HTMLFormElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const currentHref = computed(() => props.editor.getAttributes("link").href || "");
const url = ref(currentHref.value);
const asEmbed = ref(false);

// Check if embed extension is available
const canEmbed = computed(() => {
  if (!props.enableEmbed) return false;
  // Check if embed extension is loaded
  const extensionManager = props.editor.extensionManager;
  return extensionManager.extensions.some((ext) => ext.name === "embed");
});

// Check if URL is a known embed provider
const isEmbedProvider = computed(() => {
  if (!url.value.trim()) return false;
  return detectVizelEmbedProvider(url.value.trim()) !== null;
});

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
  const trimmedUrl = url.value.trim();

  if (!trimmedUrl) {
    props.editor.chain().focus().unsetLink().run();
    emit("close");
    return;
  }

  if (asEmbed.value && canEmbed.value) {
    // Remove the link first, then insert embed
    props.editor.chain().focus().unsetLink().setEmbed({ url: trimmedUrl }).run();
  } else {
    props.editor.chain().focus().setLink({ href: trimmedUrl }).run();
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
    <div class="vizel-link-editor-row">
      <input
        ref="inputRef"
        v-model="url"
        type="url"
        placeholder="Enter URL..."
        class="vizel-link-input"
      />
      <button type="submit" class="vizel-link-button" title="Apply">
        <VizelIcon name="check" />
      </button>
      <button
        v-if="currentHref"
        type="button"
        class="vizel-link-button vizel-link-remove"
        title="Remove link"
        @click="handleRemove"
      >
        <VizelIcon name="x" />
      </button>
    </div>
    <div v-if="canEmbed && isEmbedProvider" class="vizel-link-editor-embed-toggle">
      <input
        id="vizel-embed-toggle"
        v-model="asEmbed"
        type="checkbox"
      />
      <label for="vizel-embed-toggle">Embed as rich content</label>
    </div>
  </form>
</template>
