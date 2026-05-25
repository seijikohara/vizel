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

## Server-rendered HTML

Vizel does not ship its own opinionated server-HTML helper. The
editor's CSS / extension surface is tuned for the live editing pane,
so any "approximate static preview" diverges from the editing view as
the extension catalog grows — keeping a separate renderer in sync is
ongoing maintenance work that belongs in the consumer's own pipeline.

When you need server-rendered HTML for SEO, search-index payloads,
RSS / Atom feeds, or email summaries, parse Markdown into Tiptap JSON
on the server and render it through Tiptap's own helper:

```ts
import { generateHTML } from "@tiptap/html";
import { createVizelExtensions, parseVizelMarkdown } from "@vizel/core";

const extensions = createVizelExtensions();
const json = parseVizelMarkdown(markdown, { extensions });
const html = generateHTML(json, extensions);
```

`generateHTML` is pure (no DOM access), so it runs anywhere Node /
edge runtimes execute. Pair it with `@vizel/core/styles.css` if you
want the editor's visual styling on the server-rendered page, or
provide your own stylesheet against the Vizel CSS variables.

`mermaid` and `graphviz` fenced code blocks survive the round-trip as
`<pre><code class="language-mermaid">…</code></pre>`, ready for a
client-side hydrator to replace them with rendered diagrams on the
next paint.

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
- ... persist editor state → [Editor: Auto-save](/guide/editor#auto-save)
