<script setup lang="ts">
import {
  applyVizelLinkEdit,
  buildVizelLinkEditorSpec,
  type Editor,
  resolveVizelLinkEditorLabels,
  type VizelLocale,
} from "@vizel/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelLinkEditorProps {
  /** The editor instance */
  editor: Editor;
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

const emit = defineEmits<{
  close: [];
}>();

const formRef = ref<HTMLFormElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const labels = computed(() => resolveVizelLinkEditorLabels(props.locale));
const initialState = buildVizelLinkEditorSpec(props.editor, "", props.enableEmbed);
const url = ref(initialState.initialUrl);
const openInNewTab = ref(initialState.initialOpenInNewTab);
const asEmbed = ref(false);

const viewState = computed(() =>
  buildVizelLinkEditorSpec(props.editor, url.value, props.enableEmbed)
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
  applyVizelLinkEdit(
    props.editor,
    { url: url.value, openInNewTab: openInNewTab.value, asEmbed: asEmbed.value },
    viewState.value.canEmbed
  );
  emit("close");
}

function handleRemove() {
  props.editor.chain().focus().unsetLink().run();
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
