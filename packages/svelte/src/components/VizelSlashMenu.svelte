<script lang="ts" module>
import type { Editor, VizelCommand, VizelCommandSpec, VizelLocale } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelSlashMenuRef {
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

export interface VizelSlashMenuProps {
  /** Commands surfaced in the menu (filtered by `query` internally). */
  commands: readonly VizelCommand[];
  /** Editor the commands evaluate `canRun` / `isActive` against. */
  editor: Editor;
  /** Locale supplying command `label` / `description` strings. */
  locale: VizelLocale;
  /** Current query string. */
  query: string;
  /** Custom class name */
  class?: string;
  /** Selection handler invoked with the chosen command's id. */
  onselect?: (id: string) => void;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom group order */
  groupOrder?: string[];
  /** Custom item renderer */
  renderItem?: Snippet<[{ item: VizelCommandSpec; isSelected: boolean; onclick: () => void }]>;
  /** Custom empty state renderer */
  renderEmpty?: Snippet;
  /**
   * Mutable ref object the component populates with imperative handles
   * (notably `onKeyDown`). Pass an object; this component assigns to its
   * fields so callers can drive keyboard navigation from outside.
   *
   * Instance-script exports are not reachable through `mount()` in Svelte 5,
   * so this ref-prop pattern is the way to expose imperative handles.
   */
  ref?: VizelSlashMenuRef;
}
</script>

<script lang="ts">
import { buildVizelSlashMenuSpecFromCommands, getNextVizelSlashMenuGroupIndex } from "@vizel/core";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";
import { tick } from "svelte";

import VizelSlashMenuEmpty from "./VizelSlashMenuEmpty.svelte";
import VizelSlashMenuItem from "./VizelSlashMenuItem.svelte";

let {
  commands,
  editor,
  locale,
  query,
  class: className,
  onselect,
  showGroups = true,
  groupOrder,
  renderItem,
  renderEmpty,
  ref,
}: VizelSlashMenuProps = $props();

let selectedIndex = $state(0);
let itemRefs: (HTMLElement | null)[] = $state([]);

const spec = $derived(
  buildVizelSlashMenuSpecFromCommands(commands, {
    editor,
    locale,
    query,
    selectedIndex,
    showGroups,
    ...(groupOrder && { groupOrder }),
  })
);

const flatItemCount = $derived(
  spec.sections.reduce((sum, section) => sum + section.items.length, 0)
);

// Clean up itemRefs when items decrease
$effect(() => {
  if (itemRefs.length > flatItemCount) {
    itemRefs.length = flatItemCount;
  }
});

// Reset selection when the query changes
$effect(() => {
  query;
  selectedIndex = 0;
});

// Scroll selected item into view when selection changes
$effect(() => {
  const index = selectedIndex;
  void tick().then(() => {
    const selectedElement = itemRefs[index];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
});

function selectItem(index: number) {
  const slot = spec.sections.flatMap((section) => section.items).find((s) => s.index === index);
  if (slot) {
    onselect?.(slot.data.id);
  }
}

function onKeyDown(event: KeyboardEvent): boolean {
  // The combobox resolver returns `null` for unknown keys *and* for
  // `flatItemCount === 0`, so the empty-menu case falls through and lets
  // Tiptap consume the key. `groupNext` (Tab) carries the slash-only group
  // jump; `close` (Escape) is reported unhandled because the menu has no own
  // close path — Tiptap dismisses it.
  const action = buildVizelComboboxKeySpec({
    key: event.key,
    currentIndex: selectedIndex,
    length: flatItemCount,
  });
  if (action === null) return false;
  switch (action.type) {
    case "navigate":
      selectedIndex = action.index;
      return true;
    case "select":
      selectItem(action.index);
      return true;
    case "groupNext":
      event.preventDefault();
      selectedIndex = getNextVizelSlashMenuGroupIndex(spec, selectedIndex);
      return true;
    default:
      return false;
  }
}

// Expose the keyboard handler through the optional ref prop so suggestion
// renderers can invoke it without relying on `mount()` instance exports
// (which only surface `<script module>` exports). The ref is a stable
// object passed by the renderer; reading it once at setup is intentional.
// svelte-ignore state_referenced_locally
if (ref) {
  // svelte-ignore state_referenced_locally
  ref.onKeyDown = onKeyDown;
}
</script>

<!-- svelte-ignore a11y_aria_activedescendant_has_tabindex -->
<div
  class="vizel-slash-menu {className ?? ''}"
  data-vizel-slash-menu
  role={spec.root.role}
  aria-label={spec.root["aria-label"]}
  aria-activedescendant={spec.root["aria-activedescendant"]}
>
  {#if spec.sections.length === 0}
    {#if renderEmpty}
      {@render renderEmpty()}
    {:else}
      <VizelSlashMenuEmpty />
    {/if}
  {:else}
    {#each spec.sections as section (section.key)}
      {#if section.header}
        <!-- Section with header -->
        <div class="vizel-slash-menu-group" data-vizel-slash-menu-group>
          <div class="vizel-slash-menu-group-header">{section.header.label}</div>
          {#each section.items as slot (slot.key)}
            <div bind:this={itemRefs[slot.index]}>
              {#if renderItem}
                {@render renderItem({
                  item: slot.data,
                  isSelected: slot.attrs["aria-selected"] === true,
                  onclick: () => selectItem(slot.index),
                })}
              {:else}
                <VizelSlashMenuItem
                  id={slot.attrs.id}
                  item={slot.data}
                  isSelected={slot.attrs["aria-selected"] === true}
                  onclick={() => selectItem(slot.index)}
                />
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- Items without section header -->
        {#each section.items as slot (slot.key)}
          <div bind:this={itemRefs[slot.index]}>
            {#if renderItem}
              {@render renderItem({
                item: slot.data,
                isSelected: slot.attrs["aria-selected"] === true,
                onclick: () => selectItem(slot.index),
              })}
            {:else}
              <VizelSlashMenuItem
                item={slot.data}
                isSelected={slot.attrs["aria-selected"] === true}
                onclick={() => selectItem(slot.index)}
              />
            {/if}
          </div>
        {/each}
      {/if}
    {/each}
  {/if}
</div>
