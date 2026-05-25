<script setup lang="ts">
import {
  applyVizelLinkEdit,
  buildVizelLinkEditorSpec,
  type Editor,
  resolveVizelLinkEditorLabels,
  type VizelLocale,
} from "@vizel/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useVizelContextSafe } from "./VizelContext.ts";
import VizelIcon from "./VizelIcon.vue";

export interface VizelLinkEditorProps {
  /**
   * The editor instance.
   *
   * Optional — when omitted, the component resolves the editor from
   * the surrounding `<VizelProvider>` / `<Vizel>` context.
   */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = withDefaults(defineProps<VizelLinkEditorProps>(), {
  enableEmbed: false,
});

const contextEditor = useVizelContextSafe();
const editorRef = computed<Editor | null>(() => props.editor ?? contextEditor?.value ?? null);

const emit = defineEmits<{
  close: [];
}>();

const formRef = ref<HTMLFormElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const labels = computed(() => resolveVizelLinkEditorLabels(props.locale));
const initialState = computed(() =>
  editorRef.value ? buildVizelLinkEditorSpec(editorRef.value, "", props.enableEmbed) : null
);
const url = ref(initialState.value?.initialUrl ?? "");
const openInNewTab = ref(initialState.value?.initialOpenInNewTab ?? false);
const asEmbed = ref(false);

const viewState = computed(() =>
  editorRef.value ? buildVizelLinkEditorSpec(editorRef.value, url.value, props.enableEmbed) : null
);

function handleClickOutside(event: MouseEvent) {
  if (!(event.target instanceof Node)) return;
  if (formRef.value && !formRef.value.contains(event.target)) {
    emit("close");
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    emit("close");
  }
}

onMounted(() => {
  inputRef.value?.focus();

  void nextTick(() => {
    document.addEventListener("mousedown", handleClickOutside);
  });
  document.addEventListener("keydown", handleKeyDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("keydown", handleKeyDown, true);
});

function handleSubmit(e: Event) {
  e.preventDefault();
  const editor = editorRef.value;
  const view = viewState.value;
  if (!(editor && view)) return;
  applyVizelLinkEdit(
    editor,
    { url: url.value, openInNewTab: openInNewTab.value, asEmbed: asEmbed.value },
    view.canEmbed
  );
  emit("close");
}

function handleRemove() {
  const editor = editorRef.value;
  if (!editor) return;
  editor.chain().focus().unsetLink().run();
  emit("close");
}

function handleVisit() {
  const trimmedUrl = url.value.trim();
  if (trimmedUrl) {
    window.open(trimmedUrl, "_blank", "noopener,noreferrer");
  }
}
</script>

<template>
  <form
    v-if="viewState"
    ref="formRef"
    :class="['vizel-link-editor', $props.class]"
    @submit="handleSubmit"
  >
    <div class="vizel-link-editor-row">
      <input
        ref="inputRef"
        v-model="url"
        type="url"
        :placeholder="labels.urlPlaceholder"
        class="vizel-link-input"
        :aria-label="labels.urlAriaLabel"
      />
      <button
        type="submit"
        class="vizel-link-button"
        :title="labels.apply"
        :aria-label="labels.applyAriaLabel"
      >
        <VizelIcon name="check" />
      </button>
      <button
        v-if="viewState.showRemoveButton"
        type="button"
        class="vizel-link-button vizel-link-remove"
        :title="labels.removeLink"
        :aria-label="labels.removeLinkAriaLabel"
        @click="handleRemove"
      >
        <VizelIcon name="x" />
      </button>
    </div>
    <div class="vizel-link-editor-options">
      <label class="vizel-link-newtab-toggle">
        <input
          v-model="openInNewTab"
          type="checkbox"
        />
        <span>{{ labels.openInNewTab }}</span>
      </label>
      <button
        v-if="viewState.showVisitButton"
        type="button"
        class="vizel-link-visit"
        :title="labels.visitTitle"
        @click="handleVisit"
      >
        <VizelIcon name="externalLink" />
        <span>{{ labels.visit }}</span>
      </button>
    </div>
    <div v-if="viewState.showEmbedToggle" class="vizel-link-editor-embed-toggle">
      <input
        id="vizel-embed-toggle"
        v-model="asEmbed"
        type="checkbox"
      />
      <label for="vizel-embed-toggle">{{ labels.embedAsRichContent }}</label>
    </div>
  </form>
</template>
