<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { ref } from "vue";
import BubbleMenuButton from "./BubbleMenuButton.vue";
import BubbleMenuLinkEditor from "./BubbleMenuLinkEditor.vue";

const props = defineProps<{
  editor: Editor;
  class?: string;
}>();

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
      :is-active="props.editor.isActive('bold')"
      title="Bold (Cmd+B)"
      @click="props.editor.chain().focus().toggleBold().run()"
    >
      <strong>B</strong>
    </BubbleMenuButton>
    <BubbleMenuButton
      :is-active="props.editor.isActive('italic')"
      title="Italic (Cmd+I)"
      @click="props.editor.chain().focus().toggleItalic().run()"
    >
      <em>I</em>
    </BubbleMenuButton>
    <BubbleMenuButton
      :is-active="props.editor.isActive('strike')"
      title="Strikethrough"
      @click="props.editor.chain().focus().toggleStrike().run()"
    >
      <s>S</s>
    </BubbleMenuButton>
    <BubbleMenuButton
      :is-active="props.editor.isActive('code')"
      title="Code (Cmd+E)"
      @click="props.editor.chain().focus().toggleCode().run()"
    >
      <code>&lt;/&gt;</code>
    </BubbleMenuButton>
    <BubbleMenuButton
      :is-active="props.editor.isActive('link')"
      title="Link (Cmd+K)"
      @click="showLinkEditor = true"
    >
      <span>L</span>
    </BubbleMenuButton>
  </div>
</template>
