<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";

export interface VizelOutlineProps {
  /** Editor instance. Falls back to context if not provided. */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /**
   * Override for the current document position used to highlight the
   * active heading. Defaults to `editor.state.selection.from`.
   */
  currentPos?: number | null;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import { buildVizelOutlineSpec, vizelEnLocale } from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";
import { getVizelContextSafe } from "./VizelContext.js";
import VizelOutlineItems from "./VizelOutlineItems.svelte";

let {
  editor: editorProp,
  class: className,
  currentPos,
  locale,
}: VizelOutlineProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.current ?? null);

const stateRune = createVizelState(() => editor);

const spec = $derived.by(() => {
  void stateRune.version;
  const e = editor;
  if (!e) return null;
  const resolvedPos = currentPos === undefined ? e.state.selection.from : currentPos;
  return buildVizelOutlineSpec(e, resolvedPos, locale ?? vizelEnLocale);
});
</script>

{#if editor && spec}
  <nav
    class="vizel-outline {className ?? ''}"
    role={spec.root.role}
    aria-label={spec.root["aria-label"]}
    data-vizel-outline=""
  >
    {#if spec.items.length > 0}
      <VizelOutlineItems items={spec.items} {editor} />
    {/if}
  </nav>
{/if}
