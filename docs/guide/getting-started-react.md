# Getting Started — React

`@vizel/react` ships React 19 components and hooks. Installing the package is enough to render Vizel — `@vizel/core` and `@vizel/headless` come along as transitive dependencies.

This page covers the minimal setup. For a v1 codebase, read the [v1 to v2 migration guide](/guide/migration-v1-to-v2) first.

## Installation

```bash
pnpm add @vizel/react
# or
npm install @vizel/react
# or
yarn add @vizel/react
```

::: info Peer requirements
- React 19 and React DOM 19.
- Any ESM-compatible bundler. The package is tested against Vite 8, Next.js 15, and esbuild.
- Optional features (`lowlight`, `katex`, `mermaid`, `yjs`, `y-websocket`) install on demand when you enable the matching feature.
:::

## CSS

Import the stylesheet once at the application entry point:

```ts
import "@vizel/react/styles.css";
```

The subpath resolves to `@vizel/core/styles.css` ([ADR-0008](/adr/ADR-0008-css-belongs-in-core)). The bundle ships under exactly two selectors — `:root, [data-vizel-theme="light"]` and `[data-vizel-theme="dark"]` — plus the `prefers-color-scheme: dark` fallback.

## Minimal editor

The `Vizel` component renders the editor, bubble menu, and slash menu in a single mount:

```tsx
import { Vizel } from "@vizel/react";
import "@vizel/react/styles.css";

export function App() {
  return (
    <Vizel
      initialMarkdown="# Hello, Vizel"
      placeholder="Type '/' for commands..."
      onUpdate={({ editor }) => {
        // The transaction has committed when this runs;
        // `getMarkdown()` reflects the latest editor state.
        console.log(editor.getMarkdown());
      }}
    />
  );
}
```

## Hook-driven editor

`useVizelEditor` returns `Editor | null` directly. The editor stays `null` during the first render and until the async initialiser resolves.

```tsx
import { useVizelEditor, VizelEditor, VizelBubbleMenu } from "@vizel/react";
import "@vizel/react/styles.css";

export function Editor() {
  // The hook is the value. No `{ current }` destructure.
  const editor = useVizelEditor({
    placeholder: "Type '/' for commands...",
    features: {
      content: { mathematics: true, diagram: true },
      interaction: { typography: true },
    },
  });

  return (
    <div className="editor-container">
      <VizelEditor editor={editor} />
      {editor && <VizelBubbleMenu editor={editor} />}
    </div>
  );
}
```

## Reading editor state

`useVizelEditorState(selector, { equalityFn? })` subscribes to a slice of the editor state. The hook reads the editor from the surrounding `VizelProvider`; pass no editor argument. React re-renders only when the slice changes.

```tsx
import {
  shallowEqualObject,
  useVizelEditor,
  useVizelEditorState,
  VizelEditor,
  VizelProvider,
} from "@vizel/react";

function StatusBar() {
  // Selector observes character / word counts; equalityFn suppresses
  // re-renders when both numbers stay the same.
  const stats = useVizelEditorState(
    (editor) => ({
      characters: editor?.storage.characterCount?.characters() ?? 0,
      words: editor?.storage.characterCount?.words() ?? 0,
    }),
    { equalityFn: shallowEqualObject },
  );

  return (
    <div className="status-bar">
      <span>{stats.characters} characters</span>
      <span>{stats.words} words</span>
    </div>
  );
}

export function App() {
  const editor = useVizelEditor();
  return (
    <VizelProvider editor={editor}>
      <VizelEditor editor={editor} />
      <StatusBar />
    </VizelProvider>
  );
}
```

## Two-way Markdown

`useVizelMarkdown` returns a debounced `{ markdown, setMarkdown, isPending }` triple. Drive the editor from external state without bypassing Tiptap's transaction system:

```tsx
import { useVizelEditor, useVizelMarkdown, VizelEditor } from "@vizel/react";

export function SplitView() {
  const editor = useVizelEditor({ initialMarkdown: "# Hello" });
  const { markdown, setMarkdown, isPending } = useVizelMarkdown(editor);

  return (
    <div className="split">
      <VizelEditor editor={editor} />
      <textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} />
      {isPending && <span aria-live="polite">Syncing...</span>}
    </div>
  );
}
```

## Theming

Wrap the application in `VizelThemeProvider` to enable the dark / light / system toggle. `useVizelTheme()` exposes the resolved theme and the dedicated `resetToSystem()` method:

```tsx
import { useVizelTheme, VizelThemeProvider } from "@vizel/react";

function ThemeToggle() {
  // `theme` is VizelResolvedTheme ("light" | "dark") — never "system".
  const { theme, setTheme, resetToSystem } = useVizelTheme();
  return (
    <fieldset>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={resetToSystem}>System (currently {theme})</button>
    </fieldset>
  );
}

export function App() {
  return (
    <VizelThemeProvider defaultTheme="system" storageKey="vizel-theme">
      <Editor />
      <ThemeToggle />
    </VizelThemeProvider>
  );
}
```

## Next steps

- [Editor](/guide/editor) — options, features, lifecycle, auto-save.
- [Theming](/guide/theming) — CSS variables and host-theme integration.
- [SSR](/guide/ssr) — server rendering and static HTML generation.
- [Migration v1 to v2](/guide/migration-v1-to-v2) — every breaking change in one place.
