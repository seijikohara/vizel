---
paths:
  - "packages/core/**/*.{ts,scss,css}"
---

# `@vizel/core` Package

The core package owns all framework-agnostic code. The framework packages wrap and extend the core, but never duplicate what it defines.

## Single Source of Truth

The core package is the single source of truth for the following:

| Category | Location | Examples |
|----------|----------|----------|
| Types | `core/src/types.ts` | `VizelEditorOptions`, `VizelFeatureOptions` |
| Constants | `core/src/` | `VIZEL_UPLOAD_IMAGE_EVENT`, `VIZEL_TEXT_COLORS` |
| Extensions | `core/src/extensions/` | `VizelSlashCommand`, `VizelImageResize` |
| Utilities | `core/src/utils/` | `resolveVizelFeatures`, `createVizelImageUploader` |
| Styles | `core/src/styles/` | All CSS |

The core package excludes:

- Framework-specific components.
- Framework-specific state primitives (hooks, composables, runes).
- Runtime dependencies on React, Vue, or Svelte.

## Four-Layer Structure

The package organizes source code into four directories with strict dependency direction and explicit DOM-touch rules.

```
packages/core/src/
├── extensions/      # Tiptap extensions only (createVizel*Extension)
├── commands/        # Tiptap chain command wrappers and VizelCommand type
├── builders/        # Pure spec builders (renamed from skeletons/)
├── controllers/     # DOM-owning controller factories
├── utils/           # Pure helpers. No DOM access.
├── _internal/       # Implementation-private symbols, not re-exported
├── styles/          # SCSS
└── index.ts
```

| Layer | Role | DOM access | May depend on |
|-------|------|-----------|---------------|
| `extensions/` | Define Tiptap extensions. | Only inside ProseMirror plugins. | `utils/`, `commands/`, Tiptap |
| `commands/` | Wrap Tiptap chain commands. Define the `VizelCommand` type. | None. | `extensions/`, `utils/` |
| `builders/` | Build framework-neutral specs. | **None.** | `utils/`, types, locale |
| `controllers/` | Own DOM listeners through a `{ mount, unmount }` contract. | Inside `mount()` only. Each `mount()` starts with an SSR guard. | `builders/`, `utils/` |
| `utils/` | Provide pure helpers. | **None.** | Self, types |
| `_internal/` | Hold implementation-private helpers. | Per the surrounding layer's rule. | Per the surrounding layer's rule |

Naming conventions:

- Extension: `createVizelXxxExtension(options)`.
- Command: `createVizelXxxCommand` or `applyVizel<Verb>` chain helper.
- Builder: `buildVizelXxxSpec(input)` returning `VizelXxxSpec`.
- Controller: `createVizelXxxController({...})` returning `{ mount, unmount }`.

`_internal/` carries a README that records the rule that no symbol inside it appears in `packages/core/src/index.ts`. Framework packages must not re-export `_internal/` symbols.

### Builder Layer

Every UI scaffold consumes one of five canonical spec types. New builders produce one of these shapes; do not introduce ad-hoc spec types.

| Spec | Purpose | Examples |
|------|---------|----------|
| `VizelMenuSpec<TData>` | Listbox or menu | slash menu, mention menu, dropdown body |
| `VizelPopoverSpec` | Anchored popover (trigger + body) | block menu wrapper, toolbar dropdown, node selector wrapper, color picker wrapper |
| `VizelFormSpec<TFields>` | Inline input form | link editor, find/replace |
| `VizelCommandSpec` | Actionable item shared across command surfaces | slash item, toolbar action, bubble menu action, block menu item |
| `VizelGridSpec<TCell>` | Two-dimensional cell grid | color picker grid, future emoji picker |

Builder function names follow the pattern `buildVizel<Component>Spec(...)`. Section 2 of the v2.0.0 redesign retires the legacy `*Skeleton` naming and migrates each existing builder to one of the five spec types above.

Component composition (target state):

| Component | Spec composition |
|-----------|-----------------|
| `VizelSlashMenu` | `VizelMenuSpec<VizelCommandSpec>` |
| `VizelMentionMenu` | `VizelMenuSpec<VizelMentionItemView>` |
| `VizelBubbleMenu` | `readonly VizelCommandSpec[]` |
| `VizelToolbarDropdown` | `VizelPopoverSpec` + `VizelMenuSpec<VizelCommandSpec>` |
| `VizelNodeSelector` | `VizelPopoverSpec` + `VizelMenuSpec<VizelNodeTypeOption>` |
| `VizelBlockMenu` | `VizelPopoverSpec` + `VizelMenuSpec<VizelCommandSpec>` + optional submenu |
| `VizelLinkEditor` | `VizelFormSpec<{ url, text, embed }>` |
| `VizelFindReplace` | `VizelFormSpec<{ find, replace }>` |
| `VizelColorPicker` | `VizelPopoverSpec` + `VizelGridSpec<VizelColorCell>` |

## Extension Development

### Creating Extensions

- Use individual `@tiptap/extension-*` packages. Do not depend on `@tiptap/starter-kit`.
- Configure extensions through `createVizelExtensions()`.
- Export each extension to support advanced consumer usage.

```typescript
import Heading from "@tiptap/extension-heading";

Heading.configure({
  levels: [1, 2, 3],
});
```

### Extension Catalog

| Category | Location | Description |
|----------|----------|-------------|
| Base | `extensions/base.ts` | Core text editing (heading, bold, italic, etc.) |
| SlashCommand | `extensions/slash-command.ts` | Slash command menu |
| Table | `extensions/table.ts` | Table editing with row and column controls |
| Link | `extensions/link.ts` | Link with autolink and paste support |
| Image | `extensions/image.ts` | Image upload and resize |
| CodeBlock | `extensions/code-block-lowlight.ts` | Syntax-highlighted code blocks |
| CharacterCount | `extensions/character-count.ts` | Character and word counting |
| TextColor | `extensions/text-color.ts` | Text color and highlight |
| TaskList | `extensions/task-list.ts` | Checkbox task lists |
| DragHandle | `extensions/drag-handle.ts` | Block drag handle and keyboard reordering |
| Markdown | `extensions/markdown.ts` | Markdown import and export |
| Mathematics | `extensions/mathematics.ts` | LaTeX math with KaTeX |
| Embed | `extensions/embed.ts` | URL embedding (oEmbed/OGP) |
| Details | `extensions/details.ts` | Collapsible content blocks |
| Diagram | `extensions/diagram.ts` | Mermaid and GraphViz diagrams |
| WikiLink | `extensions/wiki-link.ts` | Wiki-style internal links |
| Comment | `extensions/comment.ts` | Text annotations and comments |
| MultiBlockSelection | `extensions/multi-block-selection.ts` | Always-on multi-block range selection with block-aware Backspace / Delete / Tab / Shift+Tab |
| BlockClipboard | `extensions/block-clipboard.ts` | Always-on block-aware copy / cut / paste; writes `application/x-vizel-blocks` (lossless JSON) plus `text/html` / `text/markdown` / `text/plain` mirrors and accepts the same payloads on paste |

The following extensions are part of the always-on core and are NOT
gated by `VizelFeatureOptions`: Markdown, Link, CodeBlock,
MultiBlockSelection, BlockClipboard. To configure
them, use the corresponding top-level options on `VizelEditorOptions`
(e.g. the Markdown flavor lives at `flavor`, not under `features`).

## Feature Categories

`VizelFeatureOptions` groups every opt-in into three categories that
answer different consumer questions. Adding a new feature requires
placing it in one of these three categories.

| Category | Consumer question | Examples |
|----------|--------------------|----------|
| `content` | What can the document contain? | `image`, `table`, `mathematics`, `diagram`, `embed`, `callout`, `details`, `textColor`, `highlight`, `underline`, `superscript`, `subscript`, `taskList`, `wikiLink`, `tableOfContents` |
| `interaction` | How does the user edit? | `slashMenu`, `dragHandle`, `mention`, `characterCount`, `typography`, `placeholder`, `historyDepth`, `visualHierarchy` |
| `collaboration` | Who edits together? | `comments`, `provider`, `versionHistory`, `presence` |

### Categorization rule

When adding a new feature, ask: *what is the user's main motivation to
turn this on?* That motivation determines the category. `mention` lives
under `interaction` because users turn it on for the completion
experience, not for the inline node it produces. `comments` lives under
`collaboration` because the annotation flow only matters when other
collaborators can read it.

### Dependency validation

`createVizelEditorInstance` validates feature dependencies at
construction time and throws `VizelError("INVALID_CONFIG", ...)` when a
required dependency is missing. The current rules:

- `features.collaboration.comments` requires `features.collaboration.provider`.
- `features.collaboration.presence` requires `features.collaboration.provider`.

Add new dependency rules to `packages/core/src/utils/editorFactory.ts`
alongside the existing checks. Each rule must throw a typed
`VizelError` with a stable `code` (`INVALID_CONFIG`) and a `context`
carrying the offending feature name.

### Curated defaults

`vizelDefaultFeatures()` returns a curated feature object that enables
every safe opt-in (everything except `mention`, `provider`, `comments`,
`versionHistory`, `presence` — features that need consumer-supplied
configuration to function). Use it when you want the Notion-like
surface without enumerating each toggle.

## Command Layer

A single `VizelCommand` represents one user action everywhere it
appears. The same logical command (e.g. "format/bold") shows up in
the toolbar, the bubble menu, and the keyboard shortcut table without
being defined more than once. Surface-specific builders consume a
`readonly VizelCommand[]` and project each entry into the matching
Section 2 spec for a specific editor and locale.

### Surfaces and builders

| Surface | Builder | Output |
|---------|---------|--------|
| Slash menu | `buildVizelSlashMenuSpecFromCommands` | `VizelMenuSpec<VizelCommandSpec>` |
| Toolbar | `buildVizelToolbarSpec` | `readonly VizelCommandSpec[]` |
| Bubble menu | `buildVizelBubbleMenuSpec` | `readonly VizelCommandSpec[]` |
| Block menu | `buildVizelBlockMenuSpecFromCommands` | `readonly VizelCommandSpec[]` |
| Keyboard shortcut | `createVizelCommandShortcutsExtension` | `Extension` |

Each builder filters by the corresponding `command.surfaces.*` entry,
applies surface-specific tuning (priority sort, `showWhen` predicate),
and derives one `VizelCommandSpec` per command via
`deriveVizelCommandSpec(command, editor, locale)`. The framework
components consume the resulting specs without seeing a
`VizelCommand`.

### Built-in registries

`vizelFormatCommands`, `vizelBlockCommands`, and
`vizelInsertCommands` ship in `packages/core/src/commands/registry/`.
A command lives in exactly one registry, chosen by what the command
*does*:

- **`vizelFormatCommands`** — toggles a mark (bold, italic, strike,
  underline, code, superscript, subscript). Marks surface on the
  toolbar / bubble menu only; they do not appear in the slash menu.
- **`vizelBlockCommands`** — changes the current block's node type
  (headings, lists, quote, code block, divider, details, callout).
  Block commands surface on the slash menu plus an optional shortcut.
- **`vizelInsertCommands`** — inserts a new node into the document
  (table, image, embed, math, diagram, table of contents). Insert
  commands surface on the slash menu only.

`vizelDefaultCommands` is the concatenation of the three registries.
`vizelCommandsFromNodeTypes(nodeTypes)` derives a parallel
`VizelCommand[]` from `VizelNodeTypeOption[]` so adding a node type
registers it across the block menu and slash menu in one entry.

### Locale integration

`VizelCommand.label` and `VizelCommand.description` are thunks that
receive a `VizelLocale` and return a string. Surface builders pass the
current locale; consumers override individual strings by passing a
customized `VizelLocale` to the editor.

### Shortcut OS branching

`VizelShortcut` carries both `mac` and `other` strings (Tiptap keymap
notation, where `Mod` resolves to `Cmd` on macOS and `Ctrl`
elsewhere). `createVizelCommandShortcutsExtension` selects the right
string via `isVizelMacPlatform()` and binds the result to
`command.run(editor)`. When the two strings differ, document the
reason in a comment on the command definition.

## Markdown Pipeline

The Markdown extension is part of the always-on core (Section 8) — it
loads without an opt-in flag, and consumer Markdown output is governed
by the `markdown` option on `VizelEditorOptions`:

```ts
useVizelEditor({
  markdown: {
    flavor: vizelGfmFlavor,
    encoding: {
      mention: "metadata-comment",
    },
  },
});
```

### Library and library swap

Vizel uses `tiptap-markdown` (markdown-it base). The marked-based
`@tiptap/markdown` is no longer a dependency. Extensions register
parser hooks through `addStorage().markdown.parse.setup(md)` and
serialize hooks through `addStorage().markdown.serialize(state, node,
parent, index)` using `prosemirror-markdown`'s `MarkdownSerializerState`
API. Never reintroduce the legacy `parseMarkdown(token, helpers)` /
`renderMarkdown(node, helpers)` shape — it does not exist on the
current library.

### `VizelMarkdownFlavor` as plugin type

A flavor is a `{ name, markdownItPlugins?, nodeSerializers?,
markSerializers?, config? }` object. The five built-ins are
`vizelCommonMarkFlavor`, `vizelGfmFlavor`, `vizelObsidianFlavor`,
`vizelDocusaurusFlavor`, and `vizelPandocFlavor`. Compose them with
`composeVizelMarkdownFlavors(flavors, name?)` — later flavors override
earlier ones in `nodeSerializers` / `markSerializers` and shallow-merge
`config`.

### Parse tolerantly, serialize strictly

The parser registers markdown-it plugins from every built-in flavor
plus the user's selected flavor, so input remains tolerant across
formats (every callout shape, every wiki-link shape, etc. is
recognized). The serializer uses only the selected flavor's hooks, so
output follows that flavor strictly. When a node has no
representation under the chosen flavor, the extension emits
`VizelError("MARKDOWN_LOSSY")` via `emitVizelError(err, options.onError)`.

### Encoding modes for lossy nodes

The `markdown.encoding` field selects per-node encoding for nodes
without a canonical Markdown representation:

| Node | `"default"` | `"metadata-comment"` |
|------|-------------|---------------------|
| `embed` | `[Title](url)` | `[Title](url)<!-- vizel:embed type="..." id="..." -->` |
| `mention` | `@username` | `@username <!-- vizel:mention id="..." -->` |
| `wikiLink` | flavor-dependent (`[[page]]` for Obsidian; `[page](page)` elsewhere) | flavor-dependent + comment |

`"default"` is portable; `"metadata-comment"` is lossless.

### Round-trip helper

Flavor authors validate their custom flavors with
`assertMarkdownRoundtrip(flavor, samples)`. The helper parses each
sample, re-serializes it, and throws `VizelError("MARKDOWN_LOSSY")`
when the output differs from the input after whitespace
normalization. Use it from a test runner; do not import it in
production code.

## SSR Safety

Vizel is rendered into a contenteditable element in the browser, so
the editor itself is client-only. The surrounding APIs are designed
to remain callable on Node, edge runtimes, and the browser so that
consumers can mix server and client without crashing at import time.

### Layer-by-layer rules

| Layer | Server-callable | DOM access |
|-------|----------------|-----------|
| `utils/` | Yes | Never at module scope |
| `builders/` | Yes | Never |
| `commands/` | Yes | Never |
| `markdown/` | Yes | Never |
| `controllers/` | Factory yes; `mount()` no | Inside `mount()` only, with an SSR guard |
| `extensions/` | Factory yes; ProseMirror plugin no | Inside ProseMirror plugins only |
| `utils/editorFactory.ts` | No — throws `VizelError("SSR_NOT_SUPPORTED")` | (Throws before reaching the DOM) |

`pnpm check:ssr` runs `scripts/check-ssr-safety.ts`, which walks
`utils/`, `builders/`, `commands/`, `markdown/`, plus `types.ts` and
`index.ts`, and fails when it finds a `document.` or `window.`
reference at the module's top scope. References inside function
bodies are allowed because they execute lazily — the SSR-time import
graph stays clean. Run it before opening a PR; CI gates merges on a
green run.

### Factory guard

`createVizelEditorInstance` opens with `typeof document === "undefined"`
and throws `VizelError("SSR_NOT_SUPPORTED")` when the check passes.
Consumers that accidentally try to construct an editor in a server
function get a typed error pointing at the right lifecycle hook
(`useEffect`, `onMounted`, `onMount`) rather than a cryptic
`document is not defined` ReferenceError from deep inside Tiptap.

### Theme-flash mitigation

`vizelThemeInitScript(options?)` returns a self-contained IIFE that
reads `localStorage[storageKey]` (default `"vizel-theme"`), falls
back to the supplied `defaultTheme` (`"system"` resolves via
`matchMedia`), and writes `data-vizel-theme` on
`document.documentElement` synchronously. The script body is built
from typed options — never from consumer-supplied raw markup — so it
carries no XSS surface. Embed the return value inline in the
server-rendered `<head>` via the framework's idiomatic raw-script
mechanism to eliminate the dark-mode flash on first paint.

## Dependencies

### Allowed

- `@tiptap/core`, `@tiptap/pm`, `@tiptap/suggestion`.
- Individual `@tiptap/extension-*` packages.

### Prohibited

- Framework runtimes (React, Vue, Svelte).
- `@tiptap/starter-kit` (use individual extensions instead).
- Runtime-only dependencies that consumers must install separately.

### Adding a Dependency With Post-Install Scripts

pnpm 10+ refuses to run post-install / install scripts unless the
package is explicitly approved. When a new dependency triggers an
`ERR_PNPM_IGNORED_BUILDS` warning at install time, add it to the
`allowBuilds` block of `pnpm-workspace.yaml` (at the repo root). Skipping
this leaves the build scripts silently ignored — native binaries and
git-hook installers will not run, and CI commands that exit on the
warning will fail.

```yaml
# pnpm-workspace.yaml
allowBuilds:
  "@parcel/watcher": true
  esbuild: true
  lefthook: true
  leveldown: true
```

## Build Configuration

The core package uses Vite. Externalize all `@tiptap/*` packages and emit ES modules.

```typescript
external: [
  "@tiptap/core",
  /^@tiptap\/extension-/,
  "@tiptap/pm",
  "@tiptap/suggestion",
],
```

## Public API

`index.ts` exports the public API:

- All extensions.
- All public types (use the `type` modifier).
- Utility functions.

Order exports alphabetically.

### Naming Conventions

| Pattern | Example |
|---------|---------|
| Options type | `VizelExtensionsOptions`, `VizelImageOptions` |
| Factory function | `createVizelExtensions()`, `createLinkExtension()` |
| Extension class | `SlashCommand`, `ImageResize` |

## CSS Styles

CSS lives in `src/styles/`.

- Use BEM-like class names (`.vizel-*`).
- Scope styles to Vizel components.
- Use CSS custom properties for theming.
- Document non-trivial style dependencies in comments.
