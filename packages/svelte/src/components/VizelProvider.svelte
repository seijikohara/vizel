<script lang="ts" module>
import type { Editor } from "@vizel/core";
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
import { VIZEL_CONTEXT_KEY } from "./VizelContext.js";

let { editor, class: className, children }: VizelProviderProps = $props();

setContext(VIZEL_CONTEXT_KEY, () => editor);

// Always emit the `vizel-root` class so consumers get the CSS variable scope
// for free (.vizel-root { --vizel-* }). Matches the React provider behavior.
const rootClass = $derived(className ? `vizel-root ${className}` : "vizel-root");
</script>

<div class={rootClass} data-vizel-root>
  {@render children()}
</div>
