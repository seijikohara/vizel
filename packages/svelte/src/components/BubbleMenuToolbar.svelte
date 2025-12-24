<script lang="ts">
import type { Editor } from "@vizel/core";
import BubbleMenuButton from "./BubbleMenuButton.svelte";
import BubbleMenuLinkEditor from "./BubbleMenuLinkEditor.svelte";

interface Props {
  editor: Editor;
  class?: string;
}

let { editor, class: className }: Props = $props();
let showLinkEditor = $state(false);
</script>

{#if showLinkEditor}
  <BubbleMenuLinkEditor {editor} onclose={() => (showLinkEditor = false)} />
{:else}
  <div class="vizel-bubble-menu-toolbar {className ?? ''}">
    <BubbleMenuButton
      isActive={editor.isActive("bold")}
      title="Bold (Cmd+B)"
      onclick={() => editor.chain().focus().toggleBold().run()}
    >
      <strong>B</strong>
    </BubbleMenuButton>
    <BubbleMenuButton
      isActive={editor.isActive("italic")}
      title="Italic (Cmd+I)"
      onclick={() => editor.chain().focus().toggleItalic().run()}
    >
      <em>I</em>
    </BubbleMenuButton>
    <BubbleMenuButton
      isActive={editor.isActive("strike")}
      title="Strikethrough"
      onclick={() => editor.chain().focus().toggleStrike().run()}
    >
      <s>S</s>
    </BubbleMenuButton>
    <BubbleMenuButton
      isActive={editor.isActive("code")}
      title="Code (Cmd+E)"
      onclick={() => editor.chain().focus().toggleCode().run()}
    >
      <code>&lt;/&gt;</code>
    </BubbleMenuButton>
    <BubbleMenuButton
      isActive={editor.isActive("link")}
      title="Link (Cmd+K)"
      onclick={() => (showLinkEditor = true)}
    >
      <span>L</span>
    </BubbleMenuButton>
  </div>
{/if}
