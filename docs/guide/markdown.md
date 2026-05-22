# Markdown

Markdown is the source of truth in Vizel. The editor renders a
Tiptap-backed visual surface, but every save and load round-trips
through Markdown so the document remains portable.

## Always-on Markdown pipeline

The Markdown extension is part of the always-on core: it loads
without an opt-in flag. Configure it through the top-level
`markdown` option on `VizelEditorOptions`.

::: code-group

```tsx [React]
import { useVizelEditor, vizelGfmFlavor } from "@vizel/react";

const editor = useVizelEditor({
  markdown: {
    flavor: vizelGfmFlavor,
    encoding: {
      embed: "metadata-comment",
      mention: "metadata-comment",
    },
  },
});
```

```vue [Vue]
<script setup lang="ts">
import { useVizelEditor, vizelGfmFlavor } from "@vizel/vue";

const editor = useVizelEditor({
  markdown: {
    flavor: vizelGfmFlavor,
    encoding: { embed: "metadata-comment", mention: "metadata-comment" },
  },
});
</script>
```

```svelte [Svelte]
<script lang="ts">
import { createVizelEditor, vizelGfmFlavor } from "@vizel/svelte";

const editor = createVizelEditor({
  markdown: {
    flavor: vizelGfmFlavor,
    encoding: { embed: "metadata-comment", mention: "metadata-comment" },
  },
});
</script>
```

:::

## Flavors

A `VizelMarkdownFlavor` is a plugin object that selects the parser /
serializer behavior. Vizel ships five built-ins:

| Flavor | Use when |
|--------|----------|
| `vizelCommonMarkFlavor` | Strict CommonMark output |
| `vizelGfmFlavor` | GitHub-flavored Markdown (tables, task lists, strikethrough) |
| `vizelObsidianFlavor` | Obsidian-compatible (`[[wiki-links]]`, callouts) |
| `vizelDocusaurusFlavor` | Docusaurus-compatible (`:::admonition`) |
| `vizelPandocFlavor` | Pandoc-compatible (footnotes, definition lists) |

Compose them with `composeVizelMarkdownFlavors([a, b])` — later flavors
override earlier ones in `nodeSerializers` / `markSerializers` and
shallow-merge `config`.

The pipeline is intentionally asymmetric:

- **Parse tolerantly.** Every built-in flavor's markdown-it plugins
  load on parse, so input remains tolerant across formats.
- **Serialize strictly.** Only the selected flavor's serializer hooks
  run, so output follows that flavor strictly.

## Encoding modes for lossy nodes

Some Vizel nodes (`embed`, `mention`, `wikiLink`) have no canonical
Markdown representation. The `markdown.encoding` field selects per-node
behavior:

| Node | `"default"` | `"metadata-comment"` |
|------|-------------|----------------------|
| `embed` | `[Title](url)` | `[Title](url)<!-- vizel:embed type="..." id="..." -->` |
| `mention` | `@username` | `@username <!-- vizel:mention id="..." -->` |
| `wikiLink` | flavor-dependent (`[[page]]` for Obsidian; `[page](page)` elsewhere) | flavor-dependent + comment |

Pick `"default"` for portable output that any Markdown reader handles.
Pick `"metadata-comment"` for round-trip fidelity — the trailing HTML
comment carries the original node attributes so Vizel can rebuild the
exact node on re-import.

When a node has no representation under the selected flavor, the
extension emits `VizelError("MARKDOWN_LOSSY")` (severity `warning`)
through `options.onError` so consumers can prompt the user before
saving.

## Round-trip validation for custom flavors

When you author a custom flavor, exercise it through
`assertMarkdownRoundtrip(flavor, samples)` from your test runner. The
helper parses each sample, re-serializes it, and throws
`VizelError("MARKDOWN_LOSSY")` when the output differs from the input
after whitespace normalization.

## Reading and writing Markdown at runtime

The Tiptap editor exposes `getMarkdown()` and a `setContent()` command
that accepts a Markdown string when the active flavor recognizes it.

```ts
// Read
const md = editor.getMarkdown();

// Write
editor.commands.setContent(markdownString);
```

## Try this if you want to ...

- ... pre-render Markdown on the server → [SSR](/guide/ssr)
- ... validate a round-trip → see `assertMarkdownRoundtrip` in [API Reference](/api/)
- ... wire your own slash menu items → [Configuration](/guide/configuration)
- ... persist edits automatically → [Auto-Save](/guide/auto-save)
