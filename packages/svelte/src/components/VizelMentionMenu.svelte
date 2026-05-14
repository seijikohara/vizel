<script lang="ts" module>
import type { VizelMentionItem } from "@vizel/core";

export interface VizelMentionMenuRef {
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

export interface VizelMentionMenuProps {
  items: VizelMentionItem[];
  class?: string;
  onselect?: (item: VizelMentionItem) => void;
  /**
   * Mutable ref object the component populates with imperative handles
   * (notably `onKeyDown`). Pass an object; this component assigns to its
   * fields so callers can drive keyboard navigation from outside.
   *
   * Instance-script exports are not reachable through `mount()` in Svelte 5,
   * so this ref-prop pattern is the way to expose imperative handles.
   */
  ref?: VizelMentionMenuRef;
}
</script>

<script lang="ts">
import { resolveVizelListNavigation } from "@vizel/core";
import { tick } from "svelte";

let {
  items,
  class: className,
  onselect,
  ref,
}: VizelMentionMenuProps = $props();

let selectedIndex = $state(0);
let itemRefs: (HTMLElement | null)[] = $state([]);

$effect(() => {
  if (itemRefs.length > items.length) {
    itemRefs.length = items.length;
  }
});

// Reset selection when items change
$effect(() => {
  // Access items to track changes
  void items.length;
  selectedIndex = 0;
});

function scrollToSelected() {
  tick().then(() => {
    const el = itemRefs[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function selectItem(index: number) {
  const item = items[index];
  if (item) {
    onselect?.(item);
  }
}

function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === "Enter") {
    selectItem(selectedIndex);
    return true;
  }
  const next = resolveVizelListNavigation(event.key, selectedIndex, items.length);
  if (next === null) return false;
  selectedIndex = next;
  scrollToSelected();
  return true;
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
  class="vizel-mention-menu {className ?? ''}"
  data-vizel-mention-menu
  role="listbox"
  aria-label="Mentions"
  aria-activedescendant={items[selectedIndex]?.id ? `vizel-mention-${items[selectedIndex]?.id}` : undefined}
>
  {#if items.length === 0}
    <div class="vizel-mention-menu-empty">No results</div>
  {:else}
    {#each items as item, index (item.id)}
      <div
        id="vizel-mention-{item.id}"
        bind:this={itemRefs[index]}
        class="vizel-mention-menu-item {index === selectedIndex ? 'is-selected' : ''}"
        role="option"
        aria-selected={index === selectedIndex}
        onclick={() => selectItem(index)}
        onkeydown={(e) => { if (e.key === "Enter") selectItem(index); }}
        tabindex={-1}
      >
        <div class="vizel-mention-menu-item-avatar">
          {#if item.avatar}
            <img src={item.avatar} alt={item.label} />
          {:else}
            {item.label.charAt(0).toUpperCase()}
          {/if}
        </div>
        <div class="vizel-mention-menu-item-content">
          <div class="vizel-mention-menu-item-label">{item.label}</div>
          {#if item.description}
            <div class="vizel-mention-menu-item-description">{item.description}</div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>
