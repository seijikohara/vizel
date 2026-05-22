# Server-Side Rendering

Vizel renders into a contenteditable element in the browser, so the
**editor** itself is client-only. Every surrounding API, however, is
designed to be callable from Node, edge runtimes, and the browser so
that you can mix server and client code without crashing at import
time.

## What is safe on the server

| Layer | Server-callable | DOM access |
|-------|-----------------|------------|
| `utils/` | Yes | Never at module scope |
| `builders/` | Yes | Never |
| `commands/` | Yes | Never |
| `markdown/` | Yes | Never |
| `controllers/` | Factory yes; `mount()` no | Inside `mount()` only |
| `extensions/` | Factory yes; ProseMirror plugin no | Inside ProseMirror plugins only |
| `createVizelEditorInstance` | **No** — throws `VizelError("SSR_NOT_SUPPORTED")` | Throws before reaching the DOM |

`pnpm check:ssr` enforces these rules. It walks the core source tree
and fails on any top-level `document` or `window` reference outside an
allowlisted file.

## Factory guard

Calling `createVizelEditorInstance` (or `useVizelEditor` /
`createVizelEditor` inside a server-rendered branch) now throws a
typed error:

```ts
import { VizelError } from "@vizel/core";

try {
  createVizelEditorInstance(options);
} catch (err) {
  if (err instanceof VizelError && err.code === "SSR_NOT_SUPPORTED") {
    // Move the construction into a client-only lifecycle hook
  }
}
```

Move the call into the framework's client-only hook:

| Framework | Client-only hook |
|-----------|------------------|
| React | `useEffect` (or `useVizelEditor`, which already defers) |
| Vue | `onMounted` (or `useVizelEditor`, which already defers) |
| Svelte | `onMount` (or `createVizelEditor`, which already defers) |

## Static HTML rendering

Use `generateVizelStaticHtml(markdown, options?)` when you need
server-rendered Markdown output for:

- Preview thumbnails in lists or feeds
- Search-index payloads
- RSS / Atom feeds
- Email summaries

The helper runs on Node behind a lazy `linkedom` shim — install
`linkedom` as a peer dependency to enable it.

```ts
import { generateVizelStaticHtml } from "@vizel/core";

const html = await generateVizelStaticHtml("# Hello\n\nWorld", {
  flavor: "gfm",
});
```

Diagram and `mermaid` fenced code blocks survive as
`<code class="language-mermaid">` so the client-side renderer can
hydrate them on the next paint. When `linkedom` is missing the helper
throws `VizelError("SSR_DOM_SHIM_MISSING")` with the install command
in the error context.

## Theme-flash mitigation

Render the synchronous theme bootstrap script into the server-rendered
`<head>` to eliminate the dark-mode flash on first paint:

```ts
import { vizelThemeInitScript } from "@vizel/core";

const script = vizelThemeInitScript({
  storageKey: "vizel-theme",
  defaultTheme: "system",
});

// Embed `script` inside <head> via your framework's idiomatic raw-script API
```

The script body is built from typed options — never from
consumer-supplied raw markup — so it carries no XSS surface.

## Try this if you want to ...

- ... configure the editor's Markdown pipeline → [Markdown](/guide/markdown)
- ... synchronize the theme across server and client → [Theming](/guide/theming)
- ... persist editor state → [Auto-Save](/guide/auto-save)
