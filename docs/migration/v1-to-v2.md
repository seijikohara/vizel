# Migration Guide: v1 to v2

Vizel 2.0 consolidates every interface change from the 1.x line into a
single release. The redesign favors a coherent API surface over backward
compatibility — every shim has been removed and no codemods ship.
Upgrade once, then enjoy a stable surface through the 2.x cycle.

This guide lists each breaking change with the v1 form, the v2 form,
and the rationale. Apply the changes in order; later sections assume
earlier ones have already been resolved.

---

## At a glance

| Change | v1 | v2 |
|--------|----|----|
| Feature options | Flat object | Three-tier `content` / `interaction` / `collaboration` |
| Markdown options | `flavor` only | `markdown.flavor` + `markdown.encoding` |
| Spec naming | `*Skeleton` | `*Spec` |
| Markdown library | `@tiptap/markdown` (marked) | `tiptap-markdown` (markdown-it) |
| Error reporting | mixed `console.warn`, `onError` callbacks | unified `VizelError` + `emitVizelError` |
| Deprecated fields | `error.originalError`, `VizelSlashMenuRendererOptions` | removed |
| CSS imports | Single `styles.css` | Three subpath exports |
| Default features | hand-rolled toggles | `vizelDefaultFeatures()` curation |
| SSR | Silent `ReferenceError` from inside Tiptap | Typed `VizelError("SSR_NOT_SUPPORTED")` |
| Static HTML render | Not supported | `generateVizelStaticHtml(markdown)` |

---

## 1. Feature options are now three-tier

`VizelFeatureOptions` no longer holds every feature at the top level.
Toggles are grouped by the consumer question they answer:

| Category | Question | Examples |
|----------|----------|----------|
| `content` | What can the document contain? | `image`, `table`, `mathematics`, `diagram`, `embed`, `callout`, `details`, `textColor`, `highlight`, `underline`, `superscript`, `subscript`, `taskList`, `wikiLink`, `tableOfContents` |
| `interaction` | How does the user edit? | `slashMenu`, `dragHandle`, `mention`, `characterCount`, `typography`, `placeholder`, `historyDepth`, `visualHierarchy` |
| `collaboration` | Who edits together? | `comments`, `provider`, `versionHistory`, `presence` |

### Before

```ts
useVizelEditor({
  features: {
    image: true,
    slashMenu: true,
    mention: { items: lookup },
    comments: true,
    provider: yProvider,
  },
});
```

### After

```ts
useVizelEditor({
  features: {
    content: { image: true },
    interaction: { slashMenu: true, mention: { items: lookup } },
    collaboration: { comments: true, provider: yProvider },
  },
});
```

The factory now also validates feature dependencies and throws
`VizelError("INVALID_CONFIG")` when, for example,
`collaboration.comments` is enabled without `collaboration.provider`.

---

## 2. Markdown options moved under `markdown`

The top-level `flavor` field and ad-hoc encoding flags are gone.
Pass a single `markdown` object that selects the flavor and per-node
encoding strategy.

### Before

```ts
useVizelEditor({
  flavor: vizelGfmFlavor,
});
```

### After

```ts
useVizelEditor({
  markdown: {
    flavor: vizelGfmFlavor,
    encoding: {
      embed: "metadata-comment",
      mention: "metadata-comment",
      wikiLink: "default",
    },
  },
});
```

The available encoding values for each lossy node are documented in
[Guide: Markdown](/guide/markdown). `"default"` produces portable
Markdown; `"metadata-comment"` is lossless.

---

## 3. `tiptap-markdown` replaces `@tiptap/markdown`

The Markdown pipeline now runs on `tiptap-markdown` (a markdown-it
base) instead of the marked-based `@tiptap/markdown` from v1. Custom
extensions that register Markdown hooks must update their signatures:

### Before

```ts
// v1 used marked-style helpers
parseMarkdown(token, helpers) { /* ... */ }
renderMarkdown(node, helpers) { /* ... */ }
```

### After

```ts
addStorage() {
  return {
    markdown: {
      parse: { setup(md) { /* markdown-it plugins */ } },
      serialize(state, node, parent, index) {
        // prosemirror-markdown MarkdownSerializerState API
      },
    },
  };
}
```

The legacy hook shape is no longer recognized at runtime and silently
drops your extension's Markdown support. Remove every reference to
`parseMarkdown` / `renderMarkdown` and adopt the `tiptap-markdown` API.

---

## 4. `*Skeleton` types renamed to `*Spec`

Every UI scaffold type previously named `*Skeleton` is now `*Spec`. The
shape is unchanged.

| v1 | v2 |
|----|----|
| `VizelSlashMenuSkeleton` | `VizelMenuSpec<VizelCommandSpec>` |
| `VizelMentionMenuSkeleton` | `VizelMenuSpec<VizelMentionItemView>` |
| `VizelBlockMenuSkeleton` | `VizelBlockMenuSpec` |
| `VizelLinkEditorSkeleton` | `VizelFormSpec<{ url, text, embed }>` |
| `VizelFindReplaceSkeleton` | `VizelFormSpec<{ find, replace }>` |
| `VizelColorPickerSkeleton` | `VizelPopoverSpec` + `VizelGridSpec<VizelColorCell>` |

The corresponding builder functions follow the
`buildVizel<Component>Spec(...)` naming. The legacy `Skeleton`
aliases have been removed; update your imports.

---

## 5. Unified error reporting through `VizelError`

Vizel no longer mixes `console.warn`, ad-hoc `Error`, and per-feature
callback hooks. Every error in the editor flows through a single
typed model.

| Category | Delivery | Examples |
|----------|----------|----------|
| Developer mistake (boundary) | `throw new VizelError(...)` | `INVALID_CONFIG`, `MISSING_CONTEXT`, `SSR_NOT_SUPPORTED` |
| Runtime error (recoverable) | `emitVizelError(err, options.onError)` | `UPLOAD_FAILED`, `EMBED_LOAD_FAILED` |
| Warning (advisory) | `emitVizelError(err, options.onError)` with `severity: "warning"` | `MARKDOWN_LOSSY` |

### Before

```ts
useVizelEditor({
  features: { image: { onUploadError: (err) => log(err) } },
});
```

### After

```ts
useVizelEditor({
  onError: (err) => {
    // err is a VizelError with a stable `code` field
    log(err.code, err.context, err.cause);
  },
});
```

Inside `@vizel/core` itself, `console.warn` and `console.error` are
banned; the only sanctioned `console.error` lives inside
`emitVizelError`'s fallback when the consumer supplies no callback.

---

## 6. Deprecated fields removed

The following `@deprecated` shims from the 1.x line are gone in v2:

- `VizelError.originalError` — use the standard
  [`Error.cause`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
  property.
- `VizelSlashMenuRendererOptions` (alias to the canonical renderer
  options type) — import the canonical type directly.

The replacements have been available since v1.x, so existing
deprecation-clean call sites need no change.

---

## 7. CSS subpath exports

`@vizel/core` now exposes three CSS entries so consumers can opt out of
the token catalog if they own theming. The framework packages forward
the same patterns through their own subpath exports.

| Pattern | Import | When to use |
|---------|--------|-------------|
| Full | `@vizel/core/styles.css` | Default — Vizel ships its own tokens |
| Variables only | `@vizel/core/styles/variables.css` | Consumer supplies their own component CSS |
| Components only | `@vizel/core/styles/components.css` | Consumer maps another design system to Vizel tokens |

The default Vizel import surface remains
`@vizel/<framework>/styles.css`, which still bundles tokens plus
components for the zero-config path.

---

## 8. `vizelDefaultFeatures()` curation

Every safe opt-in (everything except `mention`, `provider`, `comments`,
`versionHistory`, and `presence` — features that need consumer-supplied
configuration to function) is enabled by `vizelDefaultFeatures()`.

### Before

```ts
useVizelEditor({
  features: {
    image: true,
    table: true,
    mathematics: true,
    diagram: true,
    embed: true,
    callout: true,
    /* ...long enumeration... */
  },
});
```

### After

```ts
import { vizelDefaultFeatures } from "@vizel/core";

useVizelEditor({
  features: vizelDefaultFeatures(),
});
```

You can still merge consumer-supplied options on top of the curated
defaults using the three-tier object.

---

## 9. SSR throws a typed error

Constructing the editor on the server now throws
`VizelError("SSR_NOT_SUPPORTED")` instead of letting Tiptap explode
with `ReferenceError: document is not defined`. Move
`createVizelEditorInstance` and `useVizelEditor` / `createVizelEditor`
calls into a client-only lifecycle hook (`useEffect`, `onMounted`,
`onMount`).

### Static HTML rendering

When you need server-rendered Markdown output (preview thumbnails,
search indexing, RSS feeds), call the new
`generateVizelStaticHtml(markdown, options?)` helper. It runs on Node
behind a lazy `linkedom` shim and produces the same HTML the live
editor would write on the client. See
[Guide: Static HTML rendering](/guide/ssr) for details.

---

## 10. Removed and renamed exports

The following symbols are gone from the public API:

| v1 export | Replacement |
|-----------|-------------|
| `parseMarkdown` (low-level helper) | `editor.commands.setContent(md)` |
| `renderMarkdown` (low-level helper) | `editor.getMarkdown()` |
| `@vizel/core/dist/...` deep imports | Public exports listed in [API Reference](/api/) |
| `VizelTheme.applyTheme` (deprecated) | `applyVizelTheme(resolvedTheme)` |

---

## Need help?

Open an issue at
[github.com/seijikohara/vizel/issues](https://github.com/seijikohara/vizel/issues)
with the v1 snippet, the v2 form you have tried, and the error or
behavior you observe. Attach the resolved `VizelError` if one is
thrown — its `code`, `context`, and `cause` give a much faster
diagnosis than a raw stack trace.
