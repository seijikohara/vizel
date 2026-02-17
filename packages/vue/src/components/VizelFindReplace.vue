<script setup lang="ts">
import {
  type Editor,
  getVizelFindReplaceState,
  type VizelFindReplaceState,
  type VizelLocale,
} from "@vizel/core";
import { computed, onBeforeUnmount, ref, watch } from "vue";

export interface VizelFindReplaceProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelFindReplaceProps>();

const emit = defineEmits<{
  close: [];
}>();

const findText = ref("");
const replaceText = ref("");
const caseSensitive = ref(false);
const state = ref<VizelFindReplaceState | null>(null);
const findInputRef = ref<HTMLInputElement | null>(null);

const matchCount = computed(() => state.value?.matches.length ?? 0);
const currentMatch = computed(() =>
  state.value && state.value.activeIndex >= 0 ? state.value.activeIndex + 1 : 0
);
const isReplaceMode = computed(() => state.value?.mode === "replace");
const isOpen = computed(() => state.value?.isOpen ?? false);

function updateState() {
  if (props.editor) {
    state.value = getVizelFindReplaceState(props.editor.state);
  }
}

watch(
  () => props.editor,
  (editor, oldEditor) => {
    if (oldEditor) {
      oldEditor.off("transaction", updateState);
    }
    if (editor) {
      updateState();
      editor.on("transaction", updateState);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  props.editor?.off("transaction", updateState);
});

// Focus input when panel opens
watch(isOpen, (open) => {
  if (open) {
    setTimeout(() => {
      findInputRef.value?.focus();
      findInputRef.value?.select();
    }, 0);
  }
});

function handleFindInputChange(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  findText.value = value;
  props.editor?.commands.find(value);
}

function handleFindNext() {
  props.editor?.commands.findNext();
}

function handleFindPrevious() {
  props.editor?.commands.findPrevious();
}

function handleReplace() {
  if (props.editor) {
    props.editor.commands.replace(replaceText.value);
    props.editor.commands.findNext();
  }
}

function handleReplaceAll() {
  props.editor?.commands.replaceAll(replaceText.value);
}

function handleClose() {
  if (props.editor) {
    props.editor.commands.clearFind();
    props.editor.commands.closeFindReplace();
  }
  findText.value = "";
  replaceText.value = "";
  emit("close");
}

function handleCaseSensitiveChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  caseSensitive.value = checked;
  props.editor?.commands.setFindCaseSensitive(checked);
  if (findText.value) {
    props.editor?.commands.find(findText.value);
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    if (e.shiftKey) {
      handleFindPrevious();
    } else {
      handleFindNext();
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    handleClose();
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    :class="['vizel-find-replace-panel', props.class]"
    role="dialog"
    :aria-label="props.locale?.findReplace.label ?? 'Find and Replace'"
  >
    <div class="vizel-find-replace-row">
      <input
        ref="findInputRef"
        type="text"
        class="vizel-find-replace-input"
        :placeholder="props.locale?.findReplace.findPlaceholder ?? 'Find...'"
        :value="findText"
        @input="handleFindInputChange"
        @keydown="handleKeyDown"
        :aria-label="props.locale?.findReplace.findTextAriaLabel ?? 'Find text'"
      />
      <span class="vizel-find-replace-count" aria-live="polite">
        {{ matchCount > 0 ? `${currentMatch}/${matchCount}` : (props.locale?.findReplace.noResults ?? 'No results') }}
      </span>
      <button
        type="button"
        class="vizel-find-replace-button"
        :disabled="matchCount === 0"
        :aria-label="props.locale?.findReplace.findPreviousAriaLabel ?? 'Find previous'"
        :title="props.locale?.findReplace.findPreviousTitle ?? 'Find previous (Shift+Enter)'"
        @click="handleFindPrevious"
      >
        ↑
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        :disabled="matchCount === 0"
        :aria-label="props.locale?.findReplace.findNextAriaLabel ?? 'Find next'"
        :title="props.locale?.findReplace.findNextTitle ?? 'Find next (Enter)'"
        @click="handleFindNext"
      >
        ↓
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        :aria-label="props.locale?.findReplace.closeAriaLabel ?? 'Close'"
        :title="props.locale?.findReplace.closeTitle ?? 'Close (Escape)'"
        @click="handleClose"
      >
        ✕
      </button>
    </div>

    <div v-if="isReplaceMode" class="vizel-find-replace-row">
      <input
        type="text"
        class="vizel-find-replace-input"
        :placeholder="props.locale?.findReplace.replacePlaceholder ?? 'Replace with...'"
        v-model="replaceText"
        @keydown="handleKeyDown"
        :aria-label="props.locale?.findReplace.replaceTextAriaLabel ?? 'Replace text'"
      />
      <button
        type="button"
        class="vizel-find-replace-button"
        :disabled="matchCount === 0"
        :aria-label="props.locale?.findReplace.replaceAriaLabel ?? 'Replace'"
        :title="props.locale?.findReplace.replaceTitle ?? 'Replace current match'"
        @click="handleReplace"
      >
        {{ props.locale?.findReplace.replaceAriaLabel ?? 'Replace' }}
      </button>
      <button
        type="button"
        class="vizel-find-replace-button vizel-find-replace-button--primary"
        :disabled="matchCount === 0"
        :aria-label="props.locale?.findReplace.replaceAllAriaLabel ?? 'Replace all'"
        :title="props.locale?.findReplace.replaceAllTitle ?? 'Replace all matches'"
        @click="handleReplaceAll"
      >
        {{ props.locale?.findReplace.replaceAllAriaLabel ?? 'All' }}
      </button>
    </div>

    <div class="vizel-find-replace-options">
      <label class="vizel-find-replace-checkbox">
        <input
          type="checkbox"
          :checked="caseSensitive"
          @change="handleCaseSensitiveChange"
        />
        {{ props.locale?.findReplace.caseSensitive ?? 'Case sensitive' }}
      </label>
    </div>
  </div>
</template>
