<script lang="ts">
import type { Editor } from "@vizel/core";
import type { Snippet } from "svelte";
import { setContext } from "svelte";
import { EDITOR_CONTEXT_KEY } from "./EditorContext.ts";

interface Props {
  editor: Editor | null;
  class?: string;
  children: Snippet;
}

let { editor, class: className, children }: Props = $props();

setContext(EDITOR_CONTEXT_KEY, () => editor);
</script>

<div class={className} data-vizel-root>
  {@render children()}
</div>
