<script setup lang="ts">
import {
  applyVizelLinkEdit,
  buildVizelLinkEditorSpec,
  type Editor,
  resolveVizelLinkEditorLabels,
  type VizelLocale,
} from "@vizel/core";
import { createVizelDismissable, createVizelFocusTrapController } from "@vizel/headless";
import { computed, ref, useTemplateRef, watch } from "vue";
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

const formRef = useTemplateRef<HTMLFormElement>("formRef");

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

// Pointer-outside and Escape dismissal route through `createVizelDismissable`
// (ADR-0003, ADR-0007). `captureEscape: true` runs the Escape handler in the
// capture phase and calls `stopImmediatePropagation()` so the editor's
// bubble-phase keymap does not also fire — without that the bubble-phase
// keymap resets the selection, closes the popover, and drops focus from the
// input. `deferPointerHandler: true` installs the pointer-outside handler on
// the next tick so the pointerdown that opens the link editor does not
// register as an outside click.
const dismissable = createVizelDismissable({
  onPointerOutside: () => emit("close"),
  onEscape: () => emit("close"),
  captureEscape: true,
  deferPointerHandler: true,
});

// The focus trap moves focus to the URL input on open (replacing the
// former `inputRef.focus()`), keeps Tab cycling inside the form, and
// returns focus to the bubble-menu trigger on unmount. It ignores Escape
// so the dismissable stays the sole owner of the close gesture.
const focusTrap = createVizelFocusTrapController();

// A single watch owns the controller lifecycle (ADR-0004 Vue idiom). The
// `onCleanup` parameter unmounts the controllers before each re-run and on
// scope disposal, so the cleanup runs even inside a detached `effectScope()`
// — unlike a separate `onBeforeUnmount` hook. `immediate: true` covers the
// first mount; `flush: "post"` defers the mount until the form is in the DOM.
watch(
  [viewState, formRef],
  ([view, form], _old, onCleanup) => {
    if (!(view && form)) return;
    dismissable.mount(form);
    focusTrap.mount(form);
    onCleanup(() => {
      dismissable.unmount();
      focusTrap.unmount();
    });
  },
  { immediate: true, flush: "post" }
);

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
      <!--
        Wrap the input in the label so the click target is the same as
        an `for`/`id` pair without needing a globally-unique DOM id.
        Two link editors on one page used to share
        `id="vizel-embed-toggle"`, triggering the wrong checkbox under
        WCAG 4.1.1.
      -->
      <label class="vizel-link-editor-embed-toggle-label">
        <input v-model="asEmbed" type="checkbox" />
        <span>{{ labels.embedAsRichContent }}</span>
      </label>
    </div>
  </form>
</template>
