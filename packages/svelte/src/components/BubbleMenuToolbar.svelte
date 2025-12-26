<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface BubbleMenuToolbarProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
import { useEditorState } from "../runes/useEditorState.svelte.ts";
import BubbleMenuButton from "./BubbleMenuButton.svelte";
import BubbleMenuColorPicker from "./BubbleMenuColorPicker.svelte";
import BubbleMenuLinkEditor from "./BubbleMenuLinkEditor.svelte";

let { editor, class: className }: BubbleMenuToolbarProps = $props();
let showLinkEditor = $state(false);

// Subscribe to editor state changes to update active states
const editorState = useEditorState(() => editor);

// Create derived values that depend on editorState.current to trigger re-renders
const isBoldActive = $derived.by(() => {
  void editorState.current; // Trigger reactivity
  return editor.isActive("bold");
});
const isItalicActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("italic");
});
const isStrikeActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("strike");
});
const isUnderlineActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("underline");
});
const isCodeActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("code");
});
const isLinkActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("link");
});
</script>

{#if showLinkEditor}
  <BubbleMenuLinkEditor {editor} onclose={() => (showLinkEditor = false)} />
{:else}
  <div class="vizel-bubble-menu-toolbar {className ?? ''}">
    <BubbleMenuButton
      action="bold"
      isActive={isBoldActive}
      title="Bold (Cmd+B)"
      onclick={() => editor.chain().focus().toggleBold().run()}
    >
      <strong>B</strong>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="italic"
      isActive={isItalicActive}
      title="Italic (Cmd+I)"
      onclick={() => editor.chain().focus().toggleItalic().run()}
    >
      <em>I</em>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="strike"
      isActive={isStrikeActive}
      title="Strikethrough"
      onclick={() => editor.chain().focus().toggleStrike().run()}
    >
      <s>S</s>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="underline"
      isActive={isUnderlineActive}
      title="Underline (Cmd+U)"
      onclick={() => editor.chain().focus().toggleUnderline().run()}
    >
      <u>U</u>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="code"
      isActive={isCodeActive}
      title="Code (Cmd+E)"
      onclick={() => editor.chain().focus().toggleCode().run()}
    >
      <code>&lt;/&gt;</code>
    </BubbleMenuButton>
    <BubbleMenuButton
      action="link"
      isActive={isLinkActive}
      title="Link (Cmd+K)"
      onclick={() => (showLinkEditor = true)}
    >
      <span>L</span>
    </BubbleMenuButton>
    <BubbleMenuColorPicker {editor} type="textColor" />
    <BubbleMenuColorPicker {editor} type="highlight" />
  </div>
{/if}
