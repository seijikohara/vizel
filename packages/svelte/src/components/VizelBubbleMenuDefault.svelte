<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface VizelBubbleMenuDefaultProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
}
</script>

<script lang="ts">
import { formatVizelTooltip } from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";
import VizelBubbleMenuButton from "./VizelBubbleMenuButton.svelte";
import VizelBubbleMenuColorPicker from "./VizelBubbleMenuColorPicker.svelte";
import VizelBubbleMenuDivider from "./VizelBubbleMenuDivider.svelte";
import VizelLinkEditor from "./VizelLinkEditor.svelte";
import VizelIcon from "./VizelIcon.svelte";
import VizelNodeSelector from "./VizelNodeSelector.svelte";

let { editor, class: className, enableEmbed }: VizelBubbleMenuDefaultProps = $props();
let showLinkEditor = $state(false);

// Subscribe to editor state changes to update active states
const editorState = createVizelState(() => editor);

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
const isSuperscriptActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("superscript");
});
const isSubscriptActive = $derived.by(() => {
  void editorState.current;
  return editor.isActive("subscript");
});

const hasSuperscript = $derived(editor.extensionManager.extensions.some((ext) => ext.name === "superscript"));
const hasSubscript = $derived(editor.extensionManager.extensions.some((ext) => ext.name === "subscript"));
</script>

{#if showLinkEditor}
  <VizelLinkEditor {editor} {...(enableEmbed ? { enableEmbed } : {})} onclose={() => (showLinkEditor = false)} />
{:else}
  <div class="vizel-bubble-menu-toolbar {className ?? ''}">
    <VizelNodeSelector {editor} />
    <VizelBubbleMenuDivider />
    <VizelBubbleMenuButton
      action="bold"
      isActive={isBoldActive}
      title={formatVizelTooltip("Bold", "Mod+B")}
      onclick={() => editor.chain().focus().toggleBold().run()}
    >
      <VizelIcon name="bold" />
    </VizelBubbleMenuButton>
    <VizelBubbleMenuButton
      action="italic"
      isActive={isItalicActive}
      title={formatVizelTooltip("Italic", "Mod+I")}
      onclick={() => editor.chain().focus().toggleItalic().run()}
    >
      <VizelIcon name="italic" />
    </VizelBubbleMenuButton>
    <VizelBubbleMenuButton
      action="strike"
      isActive={isStrikeActive}
      title={formatVizelTooltip("Strikethrough", "Mod+Shift+S")}
      onclick={() => editor.chain().focus().toggleStrike().run()}
    >
      <VizelIcon name="strikethrough" />
    </VizelBubbleMenuButton>
    <VizelBubbleMenuButton
      action="underline"
      isActive={isUnderlineActive}
      title={formatVizelTooltip("Underline", "Mod+U")}
      onclick={() => editor.chain().focus().toggleUnderline().run()}
    >
      <VizelIcon name="underline" />
    </VizelBubbleMenuButton>
    <VizelBubbleMenuButton
      action="code"
      isActive={isCodeActive}
      title={formatVizelTooltip("Code", "Mod+E")}
      onclick={() => editor.chain().focus().toggleCode().run()}
    >
      <VizelIcon name="code" />
    </VizelBubbleMenuButton>
    {#if hasSuperscript}
      <VizelBubbleMenuButton
        action="superscript"
        isActive={isSuperscriptActive}
        title="Superscript (Cmd+.)"
        onclick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <VizelIcon name="superscript" />
      </VizelBubbleMenuButton>
    {/if}
    {#if hasSubscript}
      <VizelBubbleMenuButton
        action="subscript"
        isActive={isSubscriptActive}
        title="Subscript (Cmd+,)"
        onclick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <VizelIcon name="subscript" />
      </VizelBubbleMenuButton>
    {/if}
    <VizelBubbleMenuDivider />
    <VizelBubbleMenuButton
      action="link"
      isActive={isLinkActive}
      title={formatVizelTooltip("Link", "Mod+K")}
      onclick={() => (showLinkEditor = true)}
    >
      <VizelIcon name="link" />
    </VizelBubbleMenuButton>
    <VizelBubbleMenuDivider />
    <VizelBubbleMenuColorPicker {editor} type="textColor" />
    <VizelBubbleMenuColorPicker {editor} type="highlight" />
  </div>
{/if}
