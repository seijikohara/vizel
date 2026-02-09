<script lang="ts" module>
import type { Editor } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelToolbarProps {
  /** Editor instance. Falls back to context if not provided. */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /** Whether to show the default toolbar (default: true). Set to false when using custom children. */
  showDefaultToolbar?: boolean;
  /** Custom toolbar content */
  children?: Snippet<[{ editor: Editor }]>;
}
</script>

<script lang="ts">
import { getVizelContextSafe } from "./VizelContext.js";
import VizelToolbarDefault from "./VizelToolbarDefault.svelte";

let {
  editor: editorProp,
  class: className,
  showDefaultToolbar = true,
  children,
}: VizelToolbarProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.() ?? null);
</script>

{#if editor}
  <div class="vizel-toolbar {className ?? ''}" role="toolbar" aria-label="Formatting">
    {#if children}
      {@render children({ editor })}
    {:else if showDefaultToolbar}
      <VizelToolbarDefault {editor} />
    {/if}
  </div>
{/if}
