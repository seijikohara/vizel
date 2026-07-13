<script setup lang="ts">
import {
  buildVizelFindReplaceSpec,
  type Editor,
  getVizelFindReplaceState,
  resolveVizelFindReplaceLabels,
  type VizelFindReplaceState,
  type VizelLocale,
} from "@vizel/core";
import { createVizelFocusTrapController } from "@vizel/headless";
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from "vue";

import { useVizelContextSafe } from "./VizelContext.ts";

export interface VizelFindReplaceProps {
  /**
   * The Tiptap editor instance.
   *
   * Optional — when omitted, the component resolves the editor from
   * the surrounding `<VizelProvider>` / `<Vizel>` context.
   */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelFindReplaceProps>();
const contextEditor = useVizelContextSafe();
const editorRef = computed<Editor | null>(() => props.editor ?? contextEditor?.value ?? null);

const emit = defineEmits<{
  close: [];
}>();

const findText = ref("");
const replaceText = ref("");
const caseSensitive = ref(false);
const state = ref<VizelFindReplaceState | null>(null);
const panelRef = useTemplateRef<HTMLDivElement>("panelRef");

// The focus trap focuses the find input on open (replacing the former
// `findInputRef.focus()`) and wraps Tab inside the panel. It returns no
// focus on unmount because `handleClose` focuses `editor.view.dom`
// directly.
const focusTrap = createVizelFocusTrapController({ returnFocusOnUnmount: false });

const labels = computed(() => resolveVizelFindReplaceLabels(props.locale?.findReplace));
const view = computed(() => buildVizelFindReplaceSpec(state.value, labels.value.noResults));
const isOpen = computed(() => view.value.isOpen);

function updateState() {
  if (editorRef.value) {
    state.value = getVizelFindReplaceState(editorRef.value.state);
  }
}

watch(
  () => editorRef.value,
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
  editorRef.value?.off("transaction", updateState);
  focusTrap.unmount();
});

// Mount the focus trap when the panel opens and unmount it when it
// closes. `nextTick` defers the mount until the panel renders so the trap
// can find the panel element and its inputs.
watch(isOpen, (open) => {
  if (open) {
    void nextTick(() => {
      if (panelRef.value) focusTrap.mount(panelRef.value);
    });
  } else {
    focusTrap.unmount();
  }
});

function handleFindInputChange(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  findText.value = value;
  editorRef.value?.commands.find(value);
}

function handleFindNext() {
  editorRef.value?.commands.findNext();
}

function handleFindPrevious() {
  editorRef.value?.commands.findPrevious();
}

function handleReplace() {
  if (editorRef.value) {
    editorRef.value.commands.replace(replaceText.value);
    editorRef.value.commands.findNext();
  }
}

function handleReplaceAll() {
  editorRef.value?.commands.replaceAll(replaceText.value);
}

function handleClose() {
  if (editorRef.value) {
    editorRef.value.commands.clearFind();
    editorRef.value.commands.closeFindReplace();
  }
  findText.value = "";
  replaceText.value = "";
  editorRef.value?.view.dom.focus();
  emit("close");
}

function handleCaseSensitiveChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  caseSensitive.value = checked;
  editorRef.value?.commands.setFindCaseSensitive(checked);
  if (findText.value) {
    editorRef.value?.commands.find(findText.value);
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
    ref="panelRef"
    :class="['vizel-find-replace-panel', props.class]"
    role="dialog"
    :aria-label="labels.label"
  >
    <div class="vizel-find-replace-row">
      <input
        type="text"
        class="vizel-find-replace-input"
        :placeholder="labels.findPlaceholder"
        :value="findText"
        @input="handleFindInputChange"
        @keydown="handleKeyDown"
        :aria-label="labels.findTextAriaLabel"
      />
      <span class="vizel-find-replace-count" aria-live="polite">
        {{ view.matchCountDisplay }}
      </span>
      <button
        type="button"
        class="vizel-find-replace-button"
        :disabled="view.isDisabled"
        :aria-label="labels.findPreviousAriaLabel"
        :title="labels.findPreviousTitle"
        @click="handleFindPrevious"
      >
        ↑
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        :disabled="view.isDisabled"
        :aria-label="labels.findNextAriaLabel"
        :title="labels.findNextTitle"
        @click="handleFindNext"
      >
        ↓
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        :aria-label="labels.closeAriaLabel"
        :title="labels.closeTitle"
        @click="handleClose"
      >
        ✕
      </button>
    </div>

    <div v-if="view.isReplaceMode" class="vizel-find-replace-row">
      <input
        type="text"
        class="vizel-find-replace-input"
        :placeholder="labels.replacePlaceholder"
        v-model="replaceText"
        @keydown="handleKeyDown"
        :aria-label="labels.replaceTextAriaLabel"
      />
      <button
        type="button"
        class="vizel-find-replace-button"
        :disabled="view.isDisabled"
        :aria-label="labels.replaceAriaLabel"
        :title="labels.replaceTitle"
        @click="handleReplace"
      >
        {{ labels.replaceAriaLabel }}
      </button>
      <button
        type="button"
        class="vizel-find-replace-button vizel-find-replace-button--primary"
        :disabled="view.isDisabled"
        :aria-label="labels.replaceAllAriaLabel"
        :title="labels.replaceAllTitle"
        @click="handleReplaceAll"
      >
        {{ labels.replaceAllAriaLabel }}
      </button>
    </div>

    <div class="vizel-find-replace-options">
      <label class="vizel-find-replace-checkbox">
        <input type="checkbox" :checked="caseSensitive" @change="handleCaseSensitiveChange" />
        {{ labels.caseSensitive }}
      </label>
    </div>
  </div>
</template>
