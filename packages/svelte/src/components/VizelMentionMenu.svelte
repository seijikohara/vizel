<script lang="ts" module>
import type { VizelLocale, VizelMentionItem } from "@vizel/core";
import type { Snippet } from "svelte";

export interface VizelMentionMenuRef {
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

export interface VizelMentionMenuProps {
  /** Mention items to display */
  items: VizelMentionItem[];
  /** Custom class name */
  class?: string;
  /**
   * Callback fired when a consumer selects a mention item. Required for
   * parity with React's `onSelect` and Vue's `@select` — the menu has no
   * meaningful behavior without it.
   */
  onselect: (item: VizelMentionItem) => void;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
  /**
   * Custom item renderer. Mirrors `VizelSlashMenu.renderItem` — the
   * container, keyboard navigation, ARIA, and click handling stay owned
   * by VizelMentionMenu; the snippet only paints the per-item content.
   */
  renderItem?: Snippet<[{ item: VizelMentionItem; isSelected: boolean; onclick: () => void }]>;
  /** Custom empty-state renderer. Mirrors `VizelSlashMenu.renderEmpty`. */
  renderEmpty?: Snippet;
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
import { buildVizelMentionMenuSpec } from "@vizel/core";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";
import { tick } from "svelte";

let {
  items,
  class: className,
  onselect,
  locale,
  renderItem,
  renderEmpty,
  ref,
}: VizelMentionMenuProps = $props();

let selectedIndex = $state(0);
let itemRefs: (HTMLElement | null)[] = $state([]);

const spec = $derived(buildVizelMentionMenuSpec(items, selectedIndex, locale));
const slots = $derived(spec.sections.flatMap((section) => section.items));

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
  void tick().then(() => {
    const el = itemRefs[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function selectItem(index: number) {
  const item = items[index];
  if (item) {
    onselect(item);
  }
}

function onKeyDown(event: KeyboardEvent): boolean {
  // The mention menu is flat: it handles `navigate` and `select` only.
  // `groupNext` (Tab) and `close` (Escape) fall through as unhandled —
  // mention has no groups and no own close path — so Tiptap consumes those
  // keys, matching the menu's pre-adoption behaviour.
  const action = buildVizelComboboxKeySpec({ key: event.key, currentIndex: selectedIndex, length: items.length });
  if (action === null) return false;
  switch (action.type) {
    case "navigate":
      selectedIndex = action.index;
      scrollToSelected();
      return true;
    case "select":
      selectItem(action.index);
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
  class="vizel-mention-menu {className ?? ''}"
  data-vizel-mention-menu
  role={spec.root.role}
  aria-label={spec.root["aria-label"]}
  aria-activedescendant={spec.root["aria-activedescendant"]}
>
  {#if spec.sections.length === 0}
    {#if renderEmpty}
      {@render renderEmpty()}
    {:else}
      <div class="vizel-mention-menu-empty">{locale?.mentionMenu?.noResults ?? "No results"}</div>
    {/if}
  {:else}
    {#each slots as slot (slot.key)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        id={slot.attrs.id}
        bind:this={itemRefs[slot.index]}
        class="vizel-mention-menu-item {slot.data.isSelected ? 'is-selected' : ''}"
        role={slot.attrs.role}
        aria-selected={slot.attrs["aria-selected"]}
        onclick={() => selectItem(slot.index)}
        onkeydown={(e) => { if (e.key === "Enter") selectItem(slot.index); }}
        tabindex={slot.attrs.tabIndex}
      >
        {#if renderItem}
          {@render renderItem({
            item: slot.data.item,
            isSelected: slot.data.isSelected,
            onclick: () => selectItem(slot.index),
          })}
        {:else}
          <div class="vizel-mention-menu-item-avatar">
            {#if slot.data.item.avatar}
              <img src={slot.data.item.avatar} alt={slot.data.item.label} />
            {:else}
              {slot.data.item.label.charAt(0).toUpperCase()}
            {/if}
          </div>
          <div class="vizel-mention-menu-item-content">
            <div class="vizel-mention-menu-item-label">{slot.data.item.label}</div>
            {#if slot.data.item.description}
              <div class="vizel-mention-menu-item-description">{slot.data.item.description}</div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
