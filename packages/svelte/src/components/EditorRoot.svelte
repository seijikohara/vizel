<script lang="ts" module>
import type { Editor } from "@vizel/core";
import type { Snippet } from "svelte";

export interface EditorRootProps {
  /** The editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
  /** Children content */
  children: Snippet;
}
</script>

<script lang="ts">
import { setContext } from "svelte";
import { EDITOR_CONTEXT_KEY } from "./EditorContext.ts";

let { editor, class: className, children }: EditorRootProps = $props();

setContext(EDITOR_CONTEXT_KEY, () => editor);
</script>

<div class={className} data-vizel-root>
  {@render children()}
</div>
