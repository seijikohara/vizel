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
import { type VizelContextAccessor, setVizelContext } from "./VizelContext.js";

let { editor, class: className, children }: VizelProviderProps = $props();

// Provide a reactive accessor whose `current` getter reads the latest
// `editor` prop. Consumers in reactive contexts (`$derived`, `$effect`,
// templates) re-evaluate whenever the editor changes — same shape as a
// `$state` rune surface, idiomatic for Svelte 5.
const accessor: VizelContextAccessor = {
  get current() {
    return editor;
  },
};
setVizelContext(accessor);

// Always emit the `vizel-root` class so consumers get the CSS variable scope
// for free (.vizel-root { --vizel-* }). Matches the React provider behavior.
const rootClass = $derived(className ? `vizel-root ${className}` : "vizel-root");
</script>

<div class={rootClass} data-vizel-root>
  {@render children()}
</div>
