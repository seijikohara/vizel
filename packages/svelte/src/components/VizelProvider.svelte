<script lang="ts" module>
import type { Editor } from "@tiptap/core";
import type { Snippet } from "svelte";

export interface VizelProviderProps {
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
import { VIZEL_CONTEXT_KEY } from "./VizelContext.ts";

let { editor, class: className, children }: VizelProviderProps = $props();

setContext(VIZEL_CONTEXT_KEY, () => editor);
</script>

<div class={className} data-vizel-root>
  {@render children()}
</div>
