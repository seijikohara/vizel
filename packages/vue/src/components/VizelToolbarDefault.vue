<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { computed, ref } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";
import VizelIcon from "./VizelIcon.vue";
import VizelLinkEditor from "./VizelLinkEditor.vue";
import VizelNodeSelector from "./VizelNodeSelector.vue";
import VizelToolbarButton from "./VizelToolbarButton.vue";
import VizelToolbarColorPicker from "./VizelToolbarColorPicker.vue";

export interface VizelToolbarDefaultProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
}

const props = defineProps<VizelToolbarDefaultProps>();

// Subscribe to editor state changes to update active states
const editorStateVersion = useVizelState(() => props.editor);

// Create computed properties that depend on editorStateVersion to trigger re-renders
const isBoldActive = computed(() => {
  void editorStateVersion.value; // Trigger reactivity
  return props.editor.isActive("bold");
});
const isItalicActive = computed(() => {
  void editorStateVersion.value;
  return props.editor.isActive("italic");
});
const isStrikeActive = computed(() => {
  void editorStateVersion.value;
  return props.editor.isActive("strike");
});
const isUnderlineActive = computed(() => {
  void editorStateVersion.value;
  return props.editor.isActive("underline");
});
const isCodeActive = computed(() => {
  void editorStateVersion.value;
  return props.editor.isActive("code");
});
const isLinkActive = computed(() => {
  void editorStateVersion.value;
  return props.editor.isActive("link");
});

const showLinkEditor = ref(false);
</script>

<template>
  <VizelLinkEditor
    v-if="showLinkEditor"
    :editor="props.editor"
    :enable-embed="props.enableEmbed"
    @close="showLinkEditor = false"
  />
  <div v-else :class="['vizel-bubble-menu-toolbar', $props.class]">
    <VizelNodeSelector :editor="props.editor" />
    <VizelToolbarButton
      action="bold"
      :is-active="isBoldActive"
      title="Bold (Cmd+B)"
      @click="props.editor.chain().focus().toggleBold().run()"
    >
      <VizelIcon name="bold" />
    </VizelToolbarButton>
    <VizelToolbarButton
      action="italic"
      :is-active="isItalicActive"
      title="Italic (Cmd+I)"
      @click="props.editor.chain().focus().toggleItalic().run()"
    >
      <VizelIcon name="italic" />
    </VizelToolbarButton>
    <VizelToolbarButton
      action="strike"
      :is-active="isStrikeActive"
      title="Strikethrough"
      @click="props.editor.chain().focus().toggleStrike().run()"
    >
      <VizelIcon name="strikethrough" />
    </VizelToolbarButton>
    <VizelToolbarButton
      action="underline"
      :is-active="isUnderlineActive"
      title="Underline (Cmd+U)"
      @click="props.editor.chain().focus().toggleUnderline().run()"
    >
      <VizelIcon name="underline" />
    </VizelToolbarButton>
    <VizelToolbarButton
      action="code"
      :is-active="isCodeActive"
      title="Code (Cmd+E)"
      @click="props.editor.chain().focus().toggleCode().run()"
    >
      <VizelIcon name="code" />
    </VizelToolbarButton>
    <VizelToolbarButton
      action="link"
      :is-active="isLinkActive"
      title="Link (Cmd+K)"
      @click="showLinkEditor = true"
    >
      <VizelIcon name="link" />
    </VizelToolbarButton>
    <VizelToolbarColorPicker :editor="props.editor" type="textColor" />
    <VizelToolbarColorPicker :editor="props.editor" type="highlight" />
  </div>
</template>
