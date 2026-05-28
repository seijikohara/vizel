# Getting Started — Svelte

`@vizel/svelte` ships Svelte 5 components and runes. Installing the package is enough to render Vizel — `@vizel/core` and `@vizel/headless` come along as transitive dependencies.

This page covers the minimal setup. For a v1 codebase, read the [v1 to v2 migration guide](/guide/migration-v1-to-v2) first.

## Installation

```bash
pnpm add @vizel/svelte
# or
npm install @vizel/svelte
# or
yarn add @vizel/svelte
```

::: info Peer requirements
- Svelte 5 or newer. The package uses runes (`$state.raw`, `$derived`, `$effect`, `$bindable`) throughout.
- Any ESM-compatible bundler. The package is tested against Vite 8 and SvelteKit.
- Optional features (`lowlight`, `katex`, `mermaid`, `yjs`, `y-websocket`) install on demand when you enable the matching feature.
:::

## CSS

Import the stylesheet once at the application entry point:

```ts
import "@vizel/svelte/styles.css";
```

The subpath resolves to `@vizel/core/styles.css` ([ADR-0008](/adr/ADR-0008-css-belongs-in-core)). The bundle ships under exactly two selectors — `:root, [data-vizel-theme="light"]` and `[data-vizel-theme="dark"]` — plus the `prefers-color-scheme: dark` fallback.

## Minimal editor

The `Vizel` component renders the editor, bubble menu, and slash menu in a single mount. `bind:markdown` provides two-way binding through Svelte 5's `$bindable()`:

```svelte
<script lang="ts">
import { Vizel } from "@vizel/svelte";
import "@vizel/svelte/styles.css";

let markdown = $state("# Hello, Vizel");
</script>

<Vizel bind:markdown placeholder="Type '/' for commands..." />
```

## Rune-driven editor

`createVizelEditor` returns `{ readonly current: Editor | null }`. Read `.current` inside `$derived`, `$effect`, or templates so the read registers as a reactive dependency. The first-party reactivity primitive uses `$state.raw` plus `createSubscriber` from `svelte/reactivity` ([ADR-0009](/adr/ADR-0009-first-party-editor-reactivity)).

```svelte
<script lang="ts">
import {
  createVizelEditor,
  VizelBubbleMenu,
  VizelEditor,
} from "@vizel/svelte";
import "@vizel/svelte/styles.css";

const editor = createVizelEditor({
  placeholder: "Type '/' for commands...",
  features: {
    content: { mathematics: true, diagram: true },
    interaction: { typography: true },
  },
});
</script>

<div class="editor-container">
  <VizelEditor editor={editor.current} />
  {#if editor.current}
    <VizelBubbleMenu editor={editor.current} />
  {/if}
</div>
```

## Reading editor state

`createVizelEditorState(() => editor)` returns `{ readonly current: VizelEditorState }`. The rune hooks `editor.on('transaction')` once and registers the dependency through Svelte 5's compiler-driven tracking, so only the template expressions that read `.current` re-evaluate.

```svelte
<script lang="ts">
import {
  createVizelEditor,
  createVizelEditorState,
  VizelEditor,
} from "@vizel/svelte";

const editor = createVizelEditor();

// Pass a getter that resolves the editor. The rune subscribes to
// transactions and exposes the latest VizelEditorState through `.current`.
const state = createVizelEditorState(() => editor.current);
</script>

<VizelEditor editor={editor.current} />
<div class="status-bar">
  <span>{state.current.characterCount} characters</span>
  <span>{state.current.wordCount} words</span>
</div>
```

::: info Selector contract per framework
React (`useVizelEditorState(selector, { equalityFn? }): T`) and Vue (`useVizelEditorState(selector, { equalityFn? }): ComputedRef<T>`) ship a selector argument because their reactivity primitives recompute on every transaction. Svelte 5 tracks reads through the compiler, so the rune collapses to the getter form. [ADR-0009](/adr/ADR-0009-first-party-editor-reactivity) records the per-framework primitive.
:::

## Two-way Markdown with `bind:markdown`

The top-level `Vizel` component declares `markdown` as `$bindable()`. Pair it with a `$state` rune and consume both ends of the binding:

```svelte
<script lang="ts">
import { Vizel } from "@vizel/svelte";

let markdown = $state("# Hello");
</script>

<div class="split">
  <Vizel bind:markdown />
  <textarea bind:value={markdown}></textarea>
</div>
```

## Theming

Wrap the application in `VizelThemeProvider`. `getVizelTheme()` exposes the resolved theme through a `current` getter plus a dedicated `resetToSystem()` method:

```svelte
<!-- ThemeToggle.svelte -->
<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

// `theme.current` is the resolved value ("light" | "dark").
const theme = getVizelTheme();
</script>

<fieldset>
  <button onclick={() => theme.setTheme("light")}>Light</button>
  <button onclick={() => theme.setTheme("dark")}>Dark</button>
  <button onclick={theme.resetToSystem}>System (currently {theme.current})</button>
</fieldset>
```

```svelte
<!-- App.svelte -->
<script lang="ts">
import { VizelThemeProvider } from "@vizel/svelte";
import Editor from "./Editor.svelte";
import ThemeToggle from "./ThemeToggle.svelte";
</script>

<VizelThemeProvider defaultTheme="system" storageKey="vizel-theme">
  <Editor />
  <ThemeToggle />
</VizelThemeProvider>
```

## Event prop casing

Svelte 5 uses lowercase DOM-attribute names for event props ([ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api)). React and Vue keep camelCase; Svelte does not:

```svelte
<!-- Svelte: lowercase. -->
<VizelLinkEditor onclose={handleClose} />
<VizelColorPicker onchange={handleChange} />
<VizelSlashMenu onselect={handleSelect} />
```

## Next steps

- [Editor](/guide/editor) — options, features, lifecycle, auto-save.
- [Theming](/guide/theming) — CSS variables and host-theme integration.
- [SSR](/guide/ssr) — server rendering and static HTML generation.
- [Migration v1 to v2](/guide/migration-v1-to-v2) — every breaking change in one place.
