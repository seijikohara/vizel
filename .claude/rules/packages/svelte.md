---
paths: packages/svelte/**/*.{ts,svelte}
---

# @vizel/svelte Package Guidelines

See `cross-framework.md` for component/rune equivalence requirements.

## Package Purpose

Svelte 5 components and runes for Vizel editor.
This package only contains Svelte-specific wrappers around `@vizel/core`.

## Svelte 5 Runes

This package uses Svelte 5 runes syntax:

| Rune | Purpose |
|------|---------|
| `$state` | Reactive state |
| `$derived` | Computed values |
| `$effect` | Side effects |
| `$props` | Component props |

### Important: Svelte 5 mount() Behavior

Svelte 5's `mount()` function does NOT support updating props after mount.
To update component props, unmount and remount with new props:

```typescript
// WRONG - props won't update
component.items = newItems;

// CORRECT - remount with new props
unmount(component);
component = mount(SlashMenu, {
  target: container,
  props: { items: newItems },
});
```

## Component Development

### Svelte 5 Component Structure

```svelte
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  editor: Editor;
  class?: string;
  children?: Snippet;
}

let { editor, class: className, children }: Props = $props();

// Component logic with runes
let isActive = $derived(editor?.isActive("bold") ?? false);
</script>

<!-- Template -->
{#if children}
  {@render children()}
{/if}
```

### Props Naming

- Use `class` for CSS class names
- Use `on*` prefix for event callbacks
- Export props types with component name

## Runes

### useVizelEditor

Primary rune for creating editor instances.

```typescript
const editor = useVizelEditor({
  initialContent,
  placeholder,
  features: {
    image: { onUpload: uploadFn },
  },
  onUpdate: ({ editor }) => {},
});

// Access editor with .current
editor.current?.commands.setContent(content);
```

### Rune Conventions

- File extension: `.svelte.ts`
- Return object with getter: `{ get current() { return editor; } }`
- Use `onMount` for DOM-dependent initialization
- Use `onDestroy` for cleanup
- Initialize state with `$state<Editor | null>(null)`

## Context

### EditorContext

- Use `setContext()` in EditorRoot
- Use `getContext()` in child components
- Use Symbol or string keys

```typescript
import { setContext, getContext } from "svelte";

// Set context
setContext("editor", editor);

// Get context
const editor = getContext<Editor>("editor");
```

## Event Handling

- Use `onclick` (lowercase) for DOM events
- Use `oncommand` for custom events
- Avoid using `on:` directive (Svelte 4 syntax)

```svelte
<!-- Svelte 5 -->
<button onclick={handleClick}>Click</button>

<!-- NOT Svelte 4 -->
<button on:click={handleClick}>Click</button>
```

## Snippets (Svelte 5)

Use Snippets instead of slots:

```svelte
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  children?: Snippet;
  header?: Snippet<[{ title: string }]>;
}

let { children, header }: Props = $props();
</script>

{#if header}
  {@render header({ title: "Hello" })}
{/if}

{#if children}
  {@render children()}
{/if}
```
