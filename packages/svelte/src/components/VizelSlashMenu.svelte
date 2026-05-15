<script lang="ts" module>
import type { VizelSlashCommandItem } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelSlashMenuRef {
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

export interface VizelSlashMenuProps {
  /** The list of slash command items */
  items: VizelSlashCommandItem[];
  /** Custom class name */
  class?: string;
  /** Selection handler invoked when an item is chosen */
  onselect?: (item: VizelSlashCommandItem) => void;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom group order */
  groupOrder?: string[];
  /** Custom item renderer */
  renderItem?: Snippet<[{ item: VizelSlashCommandItem; isSelected: boolean; onclick: () => void }]>;
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
import { buildVizelSlashMenuSkeleton, getNextVizelSlashMenuGroupIndex } from "@vizel/core";
import { tick } from "svelte";
import VizelSlashMenuItem from "./VizelSlashMenuItem.svelte";
import VizelSlashMenuEmpty from "./VizelSlashMenuEmpty.svelte";

let {
  items,
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
  buildVizelSlashMenuSkeleton(items, selectedIndex, {
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

// Reset selection when items change
$effect(() => {
  items;
  selectedIndex = 0;
});

// Scroll selected item into view when selection changes
$effect(() => {
  const index = selectedIndex;
  tick().then(() => {
    const selectedElement = itemRefs[index];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
});

function selectItem(index: number) {
  const slot = spec.sections.flatMap((section) => section.items).find((s) => s.index === index);
  if (slot) {
    onselect?.(slot.data.item);
  }
}

function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "ArrowUp") {
    selectedIndex = (selectedIndex + flatItemCount - 1) % flatItemCount;
    return true;
  }
  if (event.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % flatItemCount;
    return true;
  }
  if (event.key === "Enter") {
    selectItem(selectedIndex);
    return true;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    selectedIndex = getNextVizelSlashMenuGroupIndex(spec, selectedIndex);
    return true;
  }
  return false;
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

<div
  class="vizel-slash-menu {className ?? ''}"
  data-vizel-slash-menu
  role={spec.root.role}
  aria-label={spec.root["aria-label"]}
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
                  item: slot.data.item,
                  isSelected: slot.data.isSelected,
                  onclick: () => selectItem(slot.index),
                })}
              {:else}
                <VizelSlashMenuItem
                  item={slot.data.item}
                  isSelected={slot.data.isSelected}
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
                item: slot.data.item,
                isSelected: slot.data.isSelected,
                onclick: () => selectItem(slot.index),
              })}
            {:else}
              <VizelSlashMenuItem
                item={slot.data.item}
                isSelected={slot.data.isSelected}
                onclick={() => selectItem(slot.index)}
              />
            {/if}
          </div>
        {/each}
      {/if}
    {/each}
  {/if}
</div>
