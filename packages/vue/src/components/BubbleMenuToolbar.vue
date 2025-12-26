<script setup lang="ts">
import type { Editor } from "@vizel/core";
import { computed, ref } from "vue";
import { useEditorState } from "../composables/useEditorState.ts";
import BubbleMenuButton from "./BubbleMenuButton.vue";
import BubbleMenuColorPicker from "./BubbleMenuColorPicker.vue";
import BubbleMenuLinkEditor from "./BubbleMenuLinkEditor.vue";

export interface BubbleMenuToolbarProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
}

const props = defineProps<BubbleMenuToolbarProps>();

// Subscribe to editor state changes to update active states
const editorStateVersion = useEditorState(() => props.editor);

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
  <BubbleMenuLinkEditor
    v-if="showLinkEditor"
    :editor="props.editor"
    @close="showLinkEditor = false"
  />
  <div v-else :class="['vizel-bubble-menu-toolbar', $props.class]">
    <BubbleMenuButton
      action="bold"
      :is-active="isBoldActive"
      title="Bold (Cmd+B)"
      @click="props.editor.chain().focus().toggleBold().run()"
    >
      <strong>B</strong>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="italic"
      :is-active="isItalicActive"
      title="Italic (Cmd+I)"
      @click="props.editor.chain().focus().toggleItalic().run()"
    >
      <em>I</em>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="strike"
      :is-active="isStrikeActive"
      title="Strikethrough"
      @click="props.editor.chain().focus().toggleStrike().run()"
    >
      <s>S</s>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="underline"
      :is-active="isUnderlineActive"
      title="Underline (Cmd+U)"
      @click="props.editor.chain().focus().toggleUnderline().run()"
    >
      <u>U</u>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="code"
      :is-active="isCodeActive"
      title="Code (Cmd+E)"
      @click="props.editor.chain().focus().toggleCode().run()"
    >
      <code>&lt;/&gt;</code>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="link"
      :is-active="isLinkActive"
      title="Link (Cmd+K)"
      @click="showLinkEditor = true"
    >
      <span>L</span>
    </BubbleMenuButton>
    <BubbleMenuColorPicker :editor="props.editor" type="textColor" />
    <BubbleMenuColorPicker :editor="props.editor" type="highlight" />
  </div>
</template>
