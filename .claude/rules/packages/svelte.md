---
paths:
  - "packages/svelte/**/*.{ts,svelte}"
  - "packages/svelte/**/*.svelte.ts"
---

# `@vizel/svelte` Package

`@vizel/svelte` provides Svelte 5 components and runes. The package wraps `@vizel/core` and adds Svelte-specific code only.

See `cross-framework.md` for component, rune, and props parity requirements.

## Svelte 5 Runes

This package uses Svelte 5 runes.

| Rune | Purpose |
|------|---------|
| `$state` | Reactive state |
| `$derived` | Computed values |
| `$effect` | Side effects |
| `$props` | Component props |

### `mount()` Behavior

Svelte 5's `mount()` does NOT update props after mounting. To change props, unmount and remount.

```typescript
// WRONG: props do not update.
component.items = newItems;

// CORRECT: remount with new props.
unmount(component);
component = mount(SlashMenu, {
  target: container,
  props: { items: newItems },
});
```

## Imports

Use the `.js` extension when importing one source file from another within
this package, even though the file on disk is `.ts` or `.svelte.ts`.
`svelte-package` copies the import string verbatim into the compiled
output, so any `.ts` suffix leaks into `dist/` and breaks consumers that
build against the published files (notably the demo apps and Rolldown).

```ts
// CORRECT: matches what dist/ will resolve.
import { VIZEL_THEME_CONTEXT_KEY } from "./VizelThemeContext.js";

// WRONG: leaks ".ts" into dist and breaks downstream builds.
import { VIZEL_THEME_CONTEXT_KEY } from "./VizelThemeContext.ts";
```

This applies to `.svelte` cross-file imports as well — use `.svelte.js`
for runes living in `*.svelte.ts` files.

## Component Structure

```svelte
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  editor: Editor;
  class?: string;
  children?: Snippet;
}

let { editor, class: className, children }: Props = $props();

let isActive = $derived(editor?.isActive("bold") ?? false);
</script>

{#if children}
  {@render children()}
{/if}
```

## Props

- Use `class` for CSS class names.
- Use the `on*` prefix for event callbacks.
- Export the props type alongside the component.

## Runes

### Naming Conventions

Svelte runes use Svelte-idiomatic naming. Do not use the React-style `use*` prefix.

- `create*` for factories that produce reactive state.
- `get*` for context getters.

### `createVizelEditor`

`createVizelEditor` is the primary rune for creating an editor instance.

```typescript
const editor = createVizelEditor({
  initialContent,
  placeholder,
  features: {
    image: { onUpload: uploadFn },
  },
  onUpdate: ({ editor }) => {},
});

// Access the editor through `.current`.
editor.current?.commands.setContent(content);
```

### `createVizelEditorState`

`createVizelEditorState` tracks editor state changes.

```typescript
const updateCount = createVizelEditorState(() => editor.current);
// Read updateCount.current to trigger reactivity.
```

### Rune Conventions

- Place runes in `*.svelte.ts` files.
- Return an object with a `current` getter: `{ get current() { return editor; } }`.
- Use `$effect` for lifecycle management (the Svelte 5 pattern).
- Initialize state with `$state<Editor | null>(null)`.

```typescript
$effect(() => {
  // Setup runs when the component mounts.
  return () => {
    // Cleanup runs when the component unmounts.
  };
});
```

## Context

- `VizelProvider` calls `setContext()`.
- Consumers call `getVizelContext()` for required access or `getVizelContextSafe()` for optional access.

```typescript
import { getVizelContext } from "@vizel/svelte";

const { editor } = getVizelContext();
```

## Event Handling

- Use lowercase DOM events: `onclick`, `oninput`.
- Avoid the Svelte 4 directive syntax (`on:click`).

```svelte
<!-- Svelte 5 -->
<button onclick={handleClick}>Click</button>

<!-- Svelte 4 (do not use) -->
<button on:click={handleClick}>Click</button>
```

## Snippets

Use snippets instead of slots.

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
