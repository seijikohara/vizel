---
title: Vizel v2.0.0 Ideal Interface Design
date: 2026-05-16
status: draft
authors:
  - seijikohara
---

# Vizel v2.0.0 Ideal Interface Design

## Summary

This document specifies the architectural and API redesign that ships as
Vizel v2.0.0. The redesign pursues three binding principles: `@vizel/core`
stays framework-agnostic and acts as a facade over Tiptap; framework
packages stay thin adapters that bind lifecycle and convert types; UI
components ship as Core skeletons rendered by each framework.

v2.0.0 is not yet published on npm. The redesign therefore accepts
unbounded breaking changes and consolidates every change into a single
release. The release favors consistency over backward compatibility, and
favors framework-idiomatic API shapes over forced cross-framework symmetry
in places where a forced shape would mislead users of the host framework.

## Goals

- Establish a four-layer Core (`extensions/`, `builders/`, `controllers/`,
  `utils/`) with strict dependency direction and SSR-safe boundaries.
- Centralize all UI scaffolding (menus, popovers, forms, commands, grids)
  in five spec types that framework components render directly.
- Move every DOM side effect into controller factories that expose a
  `{ mount, unmount }` contract.
- Unify slash menu items, toolbar actions, bubble menu actions, block menu
  actions, and keyboard shortcuts under a single `VizelCommand` type that
  declares its surfaces.
- Promote Markdown flavor support to a plugin system so users can extend
  Vizel with their own flavors.
- Guarantee Markdown round-trip losslessness for every supported flavor.
- Cover Server-Side Rendering (SSR) in three explicit modes: static view,
  progressive enhancement, and client-only mount.
- Treat Vizel as theme-neutral; the library writes only `[data-vizel-theme]`
  and never touches host environment selectors.
- Maintain complete parity across React, Vue, and Svelte for every public
  surface except the small idiom-exception catalog.
- Eliminate the dual-import pattern: a single framework package install
  suffices, and `@vizel/core` is invisible to typical users.
- Replace silent `console.warn` calls with `VizelError` instances carrying
  a typed error code.

## Non-goals

- Backward compatibility with the unreleased v1.4.0 npm artifacts. v2.0.0
  is the first published v2 release; no codemod or shim is provided.
- Official integration packages for any specific host UI library
  (shadcn/ui, Material UI, Chakra UI, etc.). Documentation describes
  abstract integration patterns and lets users wire their own mapping.
- A built-in collaborative editing provider. Vizel exposes provider hooks;
  applications supply their own Yjs / Liveblocks / etc. provider.
- Internationalization of documentation. The v2.0.0 documentation ships in
  English only.

## Product identity

Vizel is a block-based visual Markdown editor built on Tiptap. The product:

- Edits content as Tiptap nodes (block-level structure) but treats
  Markdown as the source of truth on save and load. Tiptap's internal
  HTML is an editing-time representation, not a persisted format.
- Targets a Notion-like authoring experience: slash menu, drag handle,
  mentions, block menu, embeds, find-and-replace, version history,
  comments, collaboration.
- Ships React, Vue, and Svelte adapters around a shared Tiptap
  configuration.

## Core principles (binding)

1. **`@vizel/core` is framework-agnostic.** A facade over Tiptap. It
   never imports React, Vue, or Svelte runtimes or types.
2. **Framework packages are thin adapters.** `@vizel/react`,
   `@vizel/vue`, and `@vizel/svelte` only bind the editor to the
   framework lifecycle and convert framework-idiomatic props, refs, and
   snippets to and from the Core spec or controller shape.
3. **UI components ship as Core skeletons + framework renderers.** Every
   menu, popover, form, command, and grid declares its DOM scaffolding
   as a typed spec in `packages/core/src/builders/`. The framework
   component maps the spec to its native template syntax.

---

## 1. Core layering

The Core package adopts a four-directory structure with strict
dependency direction and explicit DOM-touch rules.

```
packages/core/src/
├── extensions/      # Tiptap extensions only (createVizel*Extension)
├── commands/        # Tiptap chain command wrappers + VizelCommand type
├── builders/        # Pure spec builders (renamed from skeletons/)
├── controllers/     # DOM-owning controller factories
├── utils/           # Pure helpers. No DOM access.
├── styles/          # SCSS
├── types.ts         # Public types
├── errors.ts        # VizelError, VizelErrorCode
├── locale.ts        # Locale data
└── index.ts
```

Layer responsibilities:

| Layer | Role | DOM access | May depend on |
|-------|------|-----------|---------------|
| `extensions/` | Define Tiptap extensions | Only inside ProseMirror plugins | `utils/`, `commands/`, Tiptap |
| `commands/` | Wrap Tiptap chain commands; define `VizelCommand` type | None | `extensions/`, `utils/` |
| `builders/` | Build framework-neutral specs | **None** | `utils/`, `types`, `locale` |
| `controllers/` | Own DOM listeners through `{ mount, unmount }` | Only inside `mount()`, with SSR guard | `builders/`, `utils/`, `errors` |
| `utils/` | Pure helpers | **None** | Self, `types`, `errors` |

Naming conventions:

- Extension: `createVizelXxxExtension(options)`
- Command: `createVizelXxxCommand` or `applyVizel<Verb>` chain helper
- Builder: `buildVizelXxxSpec(input) → VizelXxxSpec`
- Controller: `createVizelXxxController({...}) → { mount, unmount }`

The `_internal/` subdirectory holds symbols that the Core package uses
internally but that must not appear in the public API.

`.claude/` updates: rewrite `.claude/rules/packages/core.md` to define
the four layers; add a "4-Layer Structure" note to
`.claude/rules/architecture.md` under Core Concept 1.

---

## 2. Builder type normalization

Every UI component derives from one of five typed spec shapes. The five
shapes cover all current and planned UI surfaces.

### Five spec types

| Spec type | Purpose |
|-----------|---------|
| `VizelMenuSpec<TData>` | Listbox or menu (slash menu, mention menu, dropdown body) |
| `VizelPopoverSpec` | Anchored popover with trigger + body (block menu, toolbar dropdown, node selector) |
| `VizelFormSpec<TFields>` | Input form (link editor, find/replace) |
| `VizelCommandSpec` | Actionable item shared by slash, toolbar, bubble menu, block menu |
| `VizelGridSpec<TCell>` | Two-dimensional grid (color picker, future emoji picker) |

`VizelMenuSpec<TData>` carries root container ARIA, sections (optionally
headed), and per-item attributes (`role`, `id`, `aria-selected`,
`aria-haspopup`, `aria-expanded`, `tabIndex`).

`VizelPopoverSpec` carries trigger metadata (`id`, `aria-haspopup`,
`aria-expanded`, `aria-controls`) and body metadata (`id`, `role`,
`aria-labelledby`), plus an `isOpen` flag.

`VizelFormSpec<TFields>` parameterizes over a record of
`VizelFormFieldSpec<TValue>` instances. Each field carries `attrs`,
`value`, and an optional `errorMessage`.

`VizelCommandSpec` carries `id`, locale-rendered `label` /
`description`, `icon`, `shortcut`, `group`, `keywords`, `isEnabled`, and
`isActive`. The spec is the runtime-evaluated projection of a
`VizelCommand` against a specific editor instance.

`VizelGridSpec<TCell>` carries root metadata, a row-major two-dimensional
array of cell specs, and a focused position.

### UI component composition

| Component | Spec composition |
|-----------|-----------------|
| `VizelSlashMenu` | `VizelMenuSpec<VizelCommandSpec>` |
| `VizelMentionMenu` | `VizelMenuSpec<VizelMentionItemView>` |
| `VizelBubbleMenu` | `readonly VizelCommandSpec[]` |
| `VizelToolbar` | `readonly VizelCommandSpec[]` |
| `VizelToolbarDropdown` | `VizelPopoverSpec` + `VizelMenuSpec<VizelCommandSpec>` |
| `VizelNodeSelector` | `VizelPopoverSpec` + `VizelMenuSpec<VizelNodeTypeOption>` |
| `VizelBlockMenu` | `VizelPopoverSpec` + `VizelMenuSpec<VizelCommandSpec>` + optional submenu |
| `VizelLinkEditor` | `VizelFormSpec<{ url, text, embed }>` |
| `VizelFindReplace` | `VizelFormSpec<{ find, replace }>` + match-counter state |
| `VizelColorPicker` | `VizelPopoverSpec` + `VizelGridSpec<VizelColorCellSpec>` |
| `VizelOutline` | dedicated `VizelOutlineSpec` (heading hierarchy navigation) |
| `VizelMinimap` | dedicated `VizelMinimapSpec` (document-wide canvas reduction) |

### Builder naming

All builders follow `buildVizel<Component>Spec(...) → VizelXxxSpec`.
Examples:

```ts
buildVizelSlashMenuSpec(commands, query, selectedIndex, locale);
buildVizelLinkEditorSpec(state, locale);
buildVizelBlockMenuSpec(actions, turnIntoOptions, locale);
buildVizelOutlineSpec(editor, currentNodePos, locale);
buildVizelMinimapSpec(editor, scrollTop, viewportHeight, documentHeight);
```

`.claude/` updates: add a "Builder Layer" section to
`.claude/rules/packages/core.md` listing the five spec types and
naming convention; rename every "Skeleton" reference in
`.claude/rules/cross-framework.md` to "Builder/Spec".

---

## 3. Controller type normalization

All DOM side effects move into controller factories that expose a
`{ mount, unmount }` contract. Framework components must never call
`document.addEventListener` directly.

### Contract

```ts
type VizelController = {
  readonly mount: (...args: never[]) => void;
  readonly unmount: () => void;
};
```

- The `create...` factory has no side effects and runs safely during SSR.
- The first statement of `mount()` reads
  `if (typeof document === "undefined") return;` as an SSR guard.
- `unmount()` is idempotent.

### Controller catalog

| Controller | Role | Source of existing logic |
|-----------|------|-------------------------|
| `createVizelDismissibleController` | Outside-click + Escape dismissal | `interactions/dismissibleController.ts` |
| `createVizelListboxController` | 1D keyboard navigation + selection | new (wraps `resolveVizelListNavigation`) |
| `createVizelGridController` | 2D grid keyboard navigation | new |
| `createVizelPopoverController` | Trigger + body positioning + outside-click | new (consolidates per-framework code) |
| `createVizelPortalController` | Portal mount / unmount | `utils/portal.ts` |
| `createVizelSuggestionContainerController` | Tiptap suggestion popup container | `utils/suggestionContainer.ts` |
| `createVizelEditorTransactionStore` | Editor transaction subscription | existing |
| `createVizelEditorSubscription` | Single editor event subscription | existing |
| `createVizelRelativeTimeTicker` | Save indicator time tick | `utils/relativeTime.ts` |
| `createVizelSystemThemeListener` | `prefers-color-scheme` change subscription | `theme.ts` |

Pure functions stay in `utils/`. `resolveVizelListNavigation` and
`resolveVizelGridNavigation` move to `utils/keyboard-navigation.ts` and
serve the listbox and grid controllers internally.

### Framework usage template

Each framework component mounts a controller in its lifecycle hook and
unmounts it on teardown. The template repeats across React `useEffect`,
Vue `onMounted` / `onBeforeUnmount`, and Svelte `$effect`.

`.claude/` updates: add a "Controller Layer" section to
`.claude/rules/packages/core.md`; declare in
`.claude/rules/cross-framework.md` that framework components must not
call `document.addEventListener` or `window.addEventListener` directly;
add per-framework templates to `.claude/rules/packages/{react,vue,svelte}.md`.

---

## 4. Return type symmetry — Option B (idiom-respecting)

The hook, composable, and rune return types follow each framework's
idiom rather than a forced shared shape. The argument types, callback
signatures, props, events, and underlying builder/controller layers
remain symmetric.

### Return type table

| API | React | Vue | Svelte |
|-----|-------|-----|--------|
| `useVizelEditor` / `createVizelEditor` | `Editor \| null` | `ShallowRef<Editor \| null>` | `{ readonly current: Editor \| null }` |
| `useVizelState` / `createVizelState` | `number` | `ComputedRef<number>` | `{ readonly version: number }` |
| `useVizelMarkdown` / `createVizelMarkdown` | `{ markdown: string; flush: () => void }` | `{ markdown: Readonly<ShallowRef<string>>; flush: () => void }` | `{ readonly current: string; flush: () => void }` |
| `useVizelTheme` / `createVizelTheme` | `{ theme: VizelTheme; setTheme: (next: "light" \| "dark") => void }` | `{ theme: ComputedRef<VizelTheme>; setTheme: (next: "light" \| "dark") => void }` | `{ readonly current: VizelTheme; setTheme: (next: "light" \| "dark") => void }` |
| `useVizelAutoSave` | `{ status: VizelSaveStatus; lastSaved: Date \| null }` snapshot | `{ status: ComputedRef<VizelSaveStatus>; lastSaved: ComputedRef<Date \| null> }` | `{ readonly status: VizelSaveStatus; readonly lastSaved: Date \| null }` |
| `useVizelContext` / `getVizelContext` | `Editor \| null` | `ShallowRef<Editor \| null>` | `{ readonly current: Editor \| null }` |
| Suggestion menu imperative ref | `RefObject<{ onKeyDown: (e: KeyboardEvent) => boolean }>` | `Ref<{ onKeyDown: (e: KeyboardEvent) => boolean } \| null>` | `{ onKeyDown: (e: KeyboardEvent) => boolean } \| null` (mutable prop) |

Each hook, composable, and rune disposes of its internal resources
during the framework's teardown lifecycle (`useEffect` cleanup,
`onBeforeUnmount`, Svelte effect teardown). Consumers do not call a
`destroy` method on the return value.

### Rationale

Forcing every framework into a `{ current }` accessor would impose Svelte
runes' idiom on React and Vue users without delivering the cross-framework
benefit it promises: the reactivity APIs (`useEffect`, `watch`, `$effect`)
still differ across frameworks, so "same code runs everywhere" never
materializes beyond a single line of dot-access.

Vue users encounter Vue's standard destructure caveat: `const { value } =
ref` loses reactivity. This caveat applies regardless of the shape Vizel
returns.

`.claude/` updates: document this decision in the new "Return Type Table"
section of `.claude/rules/cross-framework.md`; reference it from
`.claude/rules/packages/vue.md` for the destructure caveat.

---

## 5. Cross-framework parity

Vizel maintains complete API parity across React, Vue, and Svelte except
where a framework's native idiom demands otherwise. Idiom exceptions are
enumerated; drift outside the enumeration is a defect.

### Parity categories

#### Category A — strict parity (no idiom exception)

| Target | Examples |
|--------|----------|
| Function name stems | `XxxEditor`, `XxxState`, `XxxMarkdown` |
| Argument types | `VizelEditorOptions`, `VizelAutoSaveOptions` |
| Callback signatures | `onUpdate(editor: Editor)`, `onError(err: VizelError)` |
| Component prop names and shapes | `editor`, `editable`, `placeholder`, `locale`, `theme` |
| Event payload shapes | `onUpdate` arguments, `onError` arguments |
| Builder specs | All five spec types |
| Controller factories | All ten controllers |
| Error codes | `VizelErrorCode` literal union |
| Locale type | `VizelLocale` |
| CSS variable names | All `--vizel-*` tokens |
| ARIA roles and HTML attributes | All values inside specs |

#### Category B — idiom exceptions (catalog)

| Target | React | Vue | Svelte | Justification |
|--------|-------|-----|--------|---------------|
| Function prefix | `useFoo` | `useFoo` | `createFoo` | Svelte 5 rune convention |
| Context getter prefix | `useVizelContext` | `useVizelContext` | `getVizelContext` | Svelte context API convention |
| Hook return type | bare value | `Ref` / `ShallowRef` / `ComputedRef` | `{ readonly current }` | See Section 4 |
| Class prop name | `className` | `class` | `class` | Each framework's HTML attribute convention |
| Children / slot | `children: ReactNode` | `<slot />` / `default` slot | `Snippet` | Each framework's children convention |
| Imperative ref | `forwardRef` + `useImperativeHandle` | `defineExpose` + template ref | mutable ref prop | Each framework's ref convention |
| Event handler prop | `onUpdate` | `onUpdate` | `onUpdate` | All frameworks unify on the `on*` callback prop |

### Parity tables maintained in cross-framework.md

`.claude/rules/cross-framework.md` carries six tables as the single
source of truth:

1. Identifier Parity Table — every hook, composable, and rune
2. Component Parity Table — every component across the three frameworks
3. Props Parity Table — every prop signature
4. Return Type Table — Section 4 outcomes
5. Event Payload Table — `onUpdate(editor)`, `onError(err)`, etc.
6. Idiom Exception Catalog — Category B above

### Subagent reinforcement

`.claude/agents/cross-framework-reviewer.md` gains four checks:

- Identifier parity: function name stems match across `index.ts` exports
- Props parity: per-component prop types match by name and shape
- Event payload parity: callback argument types match
- Idiom exception whitelist: any difference outside Category B becomes a
  defect

### Demo and docs alignment

The cross-framework parity discipline propagates to demos
(Section 16) and documentation (Section 15), where each FW receives
equivalent treatment in side-by-side examples.

---

## 6. Public API surface unification

A consumer installs one of `@vizel/react`, `@vizel/vue`, or
`@vizel/svelte` and imports everything they need from that package. The
consumer never imports from `@vizel/core` for typical use.

### Three-layer enforcement

#### Layer 1 — `export * from "@vizel/core"`

Each framework `src/index.ts` mirrors every Core public symbol:

```ts
// packages/react/src/index.ts
"use client";
export * from "@vizel/core";          // First re-export, before framework-specific ones.
export * from "./components";
export * from "./hooks";
export * from "./context";
```

Adding a symbol to `@vizel/core/index.ts` exposes it through all three
framework packages on the next build with no manual update.

#### Layer 2 — CI symmetry assertion

`scripts/check-reexport-mirror.ts` confirms that every Core public symbol
appears in every framework package's runtime exports. The script runs in
the `pre-push` lefthook and in CI. The assertion fails if `export *` is
removed or replaced with a manual list that omits symbols.

#### Layer 3 — PUBLIC vs INTERNAL physical separation

`@vizel/core` separates public and internal symbols at the directory
level:

```
packages/core/src/
├── index.ts             # PUBLIC API: re-exported by frameworks
└── _internal/           # INTERNAL: not exported from index.ts
```

The `_internal/` subdirectory contains symbols the Core package uses
internally. None of these symbols appear in `index.ts`, so frameworks
cannot accidentally re-export them.

### Tiptap symbol re-exports

Vizel re-exports the Tiptap types most users need:

- `type Editor`, `type Extensions`, `type JSONContent`, `type Range`,
  `type ChainedCommands`

Power users may install `@tiptap/core` directly if they need types or
runtime symbols outside this set.

### Role of `@vizel/core` package

The package remains published. Typical users never import from it; web
component or pure-JS integrations and third-party extension authors may
import from it directly.

### `package.json` exports

Each framework package declares the following subpath exports so the
CSS distribution from Section 13 reaches consumers without polluting
the main entry:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./styles.css": "./dist/styles.css",
    "./styles/variables.css": "./dist/styles/variables.css",
    "./styles/components.css": "./dist/styles/components.css"
  }
}
```

The framework packages do not own the CSS source; they re-publish the
files generated by `@vizel/core` so a single install plus a single
import suffice for typical use.

`.claude/` updates: add a "Re-export Mirror Rule" to
`.claude/rules/cross-framework.md`; add a "PUBLIC vs INTERNAL Physical
Separation" rule to `.claude/rules/packages/core.md`; add an "Exports
field" rule to `.claude/rules/packages/core.md` covering the subpath
list.

---

## 7. Error model unification

### `VizelErrorCode` literal union

```ts
export type VizelErrorCode =
  // === Configuration errors (developer mistakes — thrown at boundary) ===
  | "INVALID_CONFIG"
  | "INVALID_EXTENSION"
  | "MISSING_CONTEXT"
  | "INVALID_LOCALE"
  | "SSR_NOT_SUPPORTED"
  | "MISSING_OPTIONAL_DEP"          // Heavy peer dep absent; see Appendix A.4
  // === Input errors (runtime data issues — emitted via onError) ===
  | "INVALID_MARKDOWN"
  | "INVALID_JSON_CONTENT"
  | "INVALID_URL"
  | "MARKDOWN_LOSSY"
  // === Runtime errors (transient failures — emitted via onError) ===
  | "UPLOAD_FAILED"
  | "EMBED_LOAD_FAILED"
  | "CLIPBOARD_FAILED"
  // === Collaboration errors ===
  | "COLLAB_DISCONNECTED"
  | "COLLAB_SYNC_FAILED";
```

### `VizelError` class

```ts
export type VizelErrorSeverity = "error" | "warning";

export class VizelError extends Error {
  readonly code: VizelErrorCode;
  readonly severity: VizelErrorSeverity;
  readonly context?: Record<string, unknown>;

  constructor(
    code: VizelErrorCode,
    message: string,
    options?: {
      severity?: VizelErrorSeverity;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "VizelError";
    this.code = code;
    this.severity = options?.severity ?? "error";
    this.context = options?.context;
  }
}

export const isVizelError = (err: unknown): err is VizelError =>
  err instanceof VizelError;
```

### Three error categories

| Category | Handling | Examples |
|----------|----------|----------|
| Developer mistake (boundary) | `throw new VizelError(...)` to surface during development | `INVALID_CONFIG`, `MISSING_CONTEXT` |
| Runtime error (recoverable) | Invoke `options.onError?.(err)`; do not throw | `UPLOAD_FAILED`, `INVALID_MARKDOWN` |
| Warning | Invoke `options.onError?.(err)` with `severity: "warning"` | Deprecated feature use, `MARKDOWN_LOSSY` |

### Default behavior when `onError` is undefined

```ts
const emitVizelError = (
  err: VizelError,
  onError: ((err: VizelError) => void) | undefined
): void => {
  if (onError) {
    onError(err);
    return;
  }
  if (err.severity === "error") {
    console.error(err);
  }
  // Warning with no onError stays silent.
};
```

### Console call eradication

Biome's `noConsole` rule activates under `packages/core/src/`. The only
allowed `console.error` lives inside `emitVizelError`. Every other call
site routes through `VizelError`.

`.claude/` updates: rewrite the "Loud errors at boundaries" section of
`.claude/rules/architecture.md`; add an "Error Handling" section to
`.claude/rules/code-style.md` covering the three categories.

---

## 8. Feature option grouping

Features fall into three categories that answer different consumer
questions.

| Category | Question | Examples |
|----------|----------|----------|
| `content` | What can the document contain? | `image`, `table`, `mathematics`, `diagram`, `embed`, `callout`, `details`, `textColor`, `highlight`, `underline`, `superscript`, `subscript` |
| `interaction` | How does the user edit? | `slashMenu`, `blockMenu`, `bubbleMenu`, `dragHandle`, `mention`, `findAndReplace`, `autoSave`, `placeholder`, `characterCount`, `historyDepth`, `typography`, `visualHierarchy` |
| `collaboration` | Who edits together? | `provider`, `comments`, `versionHistory`, `presence` |

### Type definition

```ts
export type VizelFeatureOptions = {
  readonly content?: {
    readonly image?: boolean | VizelImageOptions;
    readonly table?: boolean | VizelTableOptions;
    readonly mathematics?: boolean | VizelMathOptions;
    readonly diagram?: boolean | VizelDiagramOptions;
    readonly embed?: boolean | VizelEmbedOptions;
    readonly callout?: boolean | VizelCalloutOptions;
    readonly details?: boolean | VizelDetailsOptions;
    readonly textColor?: boolean | VizelTextColorOptions;
    readonly highlight?: boolean | VizelHighlightOptions;
    readonly underline?: boolean;
    readonly superscript?: boolean;
    readonly subscript?: boolean;
  };
  readonly interaction?: {
    readonly slashMenu?: boolean | VizelSlashMenuOptions;
    readonly blockMenu?: boolean | VizelBlockMenuOptions;
    readonly bubbleMenu?: boolean | VizelBubbleMenuOptions;
    readonly dragHandle?: boolean | VizelDragHandleOptions;
    readonly mention?: boolean | VizelMentionOptions;
    readonly findAndReplace?: boolean | VizelFindReplaceOptions;
    readonly autoSave?: boolean | VizelAutoSaveOptions;
    readonly placeholder?: string;
    readonly characterCount?: boolean | VizelCharacterCountOptions;
    readonly historyDepth?: number;
    readonly typography?: boolean | VizelTypographyOptions;
    readonly visualHierarchy?: boolean;
  };
  readonly collaboration?: {
    readonly provider?: VizelCollaborationProvider;
    readonly comments?: VizelCommentsOptions;
    readonly versionHistory?: VizelVersionHistoryOptions;
    readonly presence?: VizelPresenceOptions;
  };
};
```

### Always-on core

Bold, italic, heading, list, blockquote, code block, link, hard break,
horizontal rule, paragraph, and undo/redo stay always-on. The `features`
object holds only opt-in functionality.

### Categorization rule

When adding a new feature, ask: *what is the user's main motivation to
turn this on?* That motivation determines the category. `mention` lives
under `interaction` because users turn it on for the completion
experience, not for the inline node it produces.

### Runtime validation

The editor constructor validates dependencies:

```ts
if (features.collaboration?.comments && !features.collaboration?.provider) {
  throw new VizelError(
    "INVALID_CONFIG",
    "features.collaboration.comments requires features.collaboration.provider",
    { context: { feature: "comments" } }
  );
}
```

The validation runs inside `createVizelEditorInstance(options)` before
constructing the editor. It throws a developer-mistake error of category
"boundary" per Section 7.

### Default behavior

`useVizelEditor({})` enables only the always-on core. Users opt in to
each feature explicitly. A convenience helper `vizelDefaultFeatures()`
returns a curated set for users who want everything turned on.

`.claude/` updates: add a "Feature Categories" section to
`.claude/rules/packages/core.md` with the three categories, the
motivation rule, and the dependency validation pattern.

---

## 9. Command abstraction unification

A single `VizelCommand` type replaces five separate item types (slash
item, toolbar action, bubble menu action, block menu action, keyboard
shortcut).

### Type

```ts
export type VizelCommand = {
  readonly id: string;                                  // Stable, shared across surfaces. Example: "format/bold".
  readonly label: (locale: VizelLocale) => string;
  readonly description?: (locale: VizelLocale) => string;
  readonly icon?: VizelIconName;
  readonly group?: string;
  readonly keywords?: readonly string[];
  readonly shortcut?: VizelShortcut;
  readonly canRun: (editor: Editor) => boolean;
  readonly isActive?: (editor: Editor) => boolean;
  readonly run: (editor: Editor) => boolean;
  readonly surfaces: VizelCommandSurfaceSet;
};

export type VizelCommandSurfaceSet = {
  readonly slashMenu?: { readonly priority?: number };
  readonly toolbar?: { readonly priority?: number };
  readonly bubbleMenu?: {
    readonly priority?: number;
    readonly showWhen?: (editor: Editor) => boolean;
  };
  readonly blockMenu?: { readonly priority?: number };
  readonly shortcut?: true;
};

export type VizelShortcut = {
  readonly mac: string;
  readonly other: string;
};
```

`mac` and `other` follow Tiptap's keymap notation, which uses `Mod` as
a platform-aware modifier (`Cmd` on macOS, `Ctrl` on other platforms),
`Alt` for the option/alt key, and `Shift` for shift. Examples:
`"Mod-B"` for bold, `"Mod-Shift-1"` for heading 1, `"Alt-ArrowUp"` for
move-up. The two fields exist because some shortcuts intentionally
differ across platforms (for example, find/replace with `"Mod-F"` on
macOS and `"Ctrl-H"` on others). When the two values are identical,
authors may set both to the same string rather than skipping the
distinction.

### Surface derivation

Surface-specific builders consume `VizelCommand[]` and produce spec
shapes from Section 2:

- `buildVizelSlashMenuSpec` filters by `surfaces.slashMenu`, runs the
  query filter, groups by `group`, and returns
  `VizelMenuSpec<VizelCommandSpec>`.
- `buildVizelToolbarSpec` filters by `surfaces.toolbar`, sorts by
  priority, and returns `readonly VizelCommandSpec[]`.
- `buildVizelBubbleMenuSpec` filters by `surfaces.bubbleMenu` and the
  `showWhen` predicate.
- `buildVizelBlockMenuSpec` filters by `surfaces.blockMenu`.
- `registerVizelShortcuts` walks every command with `surfaces.shortcut`
  and a `shortcut` field and registers Tiptap key bindings, choosing
  `mac` or `other` based on `isVizelMacPlatform()`.

### Default command registries

```ts
export const vizelFormatCommands: readonly VizelCommand[];
export const vizelBlockCommands: readonly VizelCommand[];
export const vizelInsertCommands: readonly VizelCommand[];
export const vizelDefaultCommands: readonly VizelCommand[]; // Concatenation of the above.
```

### Automatic node-type expansion

`vizelCommandsFromNodeTypes(nodeTypes)` derives a `VizelCommand[]` from
`VizelNodeTypeOption[]`. Adding a node type to `vizelDefaultNodeTypes`
registers it across slash menu, block menu, and shortcut surfaces with
one entry.

### Locale integration

`label` and `description` accept the locale and return strings. Users
override label strings by passing a customized `VizelLocale` to
`useVizelEditor`.

`.claude/` updates: add a "Command Layer" section to
`.claude/rules/packages/core.md` with the surface set rules, locale
integration rules, and shortcut OS-branching rules.

---

## 10. Markdown round-trip guarantee

### Library choice

`tiptap-markdown` (markdown-it base) replaces `@tiptap/markdown` (marked
base). The markdown-it ecosystem supplies plugins for Pandoc, footnotes,
front-matter, definition lists, math, and superscript/subscript that the
marked ecosystem lacks or maintains poorly.

### Flavor as plugin

`VizelMarkdownFlavor` becomes a first-class plugin type:

```ts
export type VizelMarkdownFlavor = {
  readonly name: string;
  readonly markdownItPlugins?: readonly ((md: MarkdownIt) => void)[];
  readonly nodeSerializers?: Readonly<Record<string, VizelNodeSerializer>>;
  readonly markSerializers?: Readonly<Record<string, VizelMarkSerializer>>;
  readonly config?: Readonly<Record<string, unknown>>;
};
```

Built-in flavors ship as `VizelMarkdownFlavor` instances:

```ts
export const vizelCommonMarkFlavor: VizelMarkdownFlavor;
export const vizelGfmFlavor: VizelMarkdownFlavor;
export const vizelObsidianFlavor: VizelMarkdownFlavor;
export const vizelDocusaurusFlavor: VizelMarkdownFlavor;
export const vizelPandocFlavor: VizelMarkdownFlavor;
```

Users compose flavors:

```ts
export function composeVizelMarkdownFlavors(
  flavors: readonly VizelMarkdownFlavor[],
  name?: string
): VizelMarkdownFlavor;
```

The compose helper applies later flavors after earlier ones, so later
serializer hooks override earlier ones.

### Parse tolerantly, serialize strictly

The parser registers markdown-it plugins from every built-in flavor plus
the user's selected flavor, so input remains tolerant across formats.
The serializer uses only the selected flavor's hooks, so output follows
that flavor strictly. When a node cannot serialize under the chosen
flavor, Vizel emits a `VizelError("MARKDOWN_LOSSY")` via `onError`.

### Encoding for lossy nodes

| Node | Default encoding | Lossless encoding (opt-in) |
|------|-----------------|---------------------------|
| `diagram` | Fenced code block with language tag | Same; no metadata loss |
| `embed` | Markdown link to URL | HTML comment carrying metadata: `[Title](url)<!-- vizel:embed type="..." id="..." -->` |
| `mention` | `@username` plain text | HTML comment carrying id: `@username <!-- vizel:mention id="..." -->` |
| `wikiLink` | Obsidian flavor: `[[page]]`; others: `[page](page)` | Flavor-dependent |

The encoding mode is configurable per node. Configuration flows through
the top-level `markdown` option on `useVizelEditor`, which the editor
constructor passes to `createVizelMarkdownExtension` internally:

```ts
useVizelEditor({
  markdown: {
    flavor: vizelGfmFlavor,
    encoding: {
      embed: "metadata-comment",
      mention: "metadata-comment",
    },
  },
});
```

The Markdown pipeline does not live inside `features` because the
Markdown extension is part of the always-on core (Section 8). `markdown`
sits at the top level of `VizelEditorOptions` alongside `extensions`,
`features`, and `onError`.

### Round-trip test suite

`tests/markdown-roundtrip/` validates losslessness for every flavor and
every sample. The suite targets 100+ samples × 5 flavors. Samples
include CommonMark spec examples, GFM spec examples, Pandoc syntax
fixtures, Obsidian-style content, and Docusaurus-style admonitions.

### Capability eradication

The Markdown extension joins the always-on core. The `editor.getMarkdown`
and `editor.markdown.parse` methods become available unconditionally
through module augmentation:

```ts
declare module "@tiptap/core" {
  interface Editor {
    getMarkdown(): string;
    markdown: { parse(md: string): JSONContent };
  }
}
```

The runtime capability checks (`hasMarkdownExport`, `hasMarkdownStorage`)
and the `as Parameters<...>` cast in `utils/markdown.ts` disappear.

### User-facing round-trip helper

```ts
export function assertMarkdownRoundtrip(
  flavor: VizelMarkdownFlavor,
  samples: readonly { name: string; input: string }[]
): void;
```

Authors of custom flavors validate their work with this helper.

`.claude/` updates: add a "Markdown Pipeline" section to
`.claude/rules/packages/core.md` covering the library choice, flavor
plugin system, parse-tolerant / serialize-strict policy, encoding modes,
and the round-trip helper.

---

## 11. Block UX advancement

v2.0.0 ships the full Notion-like block editing surface in a single
release.

### Items shipped

1. **Slash menu / block menu auto-expansion.**
   `vizelCommandsFromNodeTypes(nodeTypes)` derives commands from
   `vizelDefaultNodeTypes`. Adding a node type extends slash menu, block
   menu, and shortcut surfaces simultaneously.
2. **Merge / promote / demote / duplicate / move commands.** Block
   operations join the `VizelCommand` registry with shortcut and block
   menu surfaces:
   - `block/merge-previous` — Backspace at block start
   - `block/promote` — Shift+Tab
   - `block/demote` — Tab
   - `block/split` — Enter at block middle
   - `block/duplicate` — Mod+D
   - `block/move-up` — Alt+ArrowUp
   - `block/move-down` — Alt+ArrowDown
3. **Multi-block range selection.** A new extension
   `createVizelMultiBlockSelectionExtension` adds Shift+Click and
   Shift+Arrow range selection, with copy / cut / delete / Tab /
   Shift+Tab applied to the entire range. The extension joins the
   always-on core (Section 8) and carries no opt-in flag; Vizel treats
   block-range selection as fundamental block-editor behavior.
4. **Multi-block drag-and-drop.** The drag handle extension
   integrates with multi-block selection: the entire range moves
   together. ProseMirror's drop handler positions the range at the
   target depth.
5. **Block-aware clipboard and paste.** Vizel writes
   `application/x-vizel-blocks` (JSON) for internal copy/cut. Pasting
   from another editor parses `text/html` against the Tiptap schema,
   `text/markdown` or `text/plain` with markdown-it, and falls back to
   plain text. Lossy transitions emit `VizelError("MARKDOWN_LOSSY")`.
6. **Visual hierarchy indicator.** A new extension attaches a
   `data-vizel-depth="N"` decoration to each block. CSS in
   `styles/_block-hierarchy.scss` styles depth 1..6 with progressive
   left padding and a subtle guide line. `features.interaction.visualHierarchy`
   controls activation (default on).
7. **Block path API.** `getVizelBlockPath(editor)` returns the path
   from root to the cursor block. The helper enables custom breadcrumb
   UI without exposing ProseMirror internals.
8. **Outline component.** `VizelOutline` renders a navigation tree of
   the document's heading hierarchy. The Core builder
   `buildVizelOutlineSpec(editor, currentNodePos, locale)` returns a
   `VizelOutlineSpec`. The component ships in all three frameworks.
9. **Minimap component.** `VizelMinimap` renders a canvas reduction of
   the entire document with a viewport indicator. The Core helper
   `renderVizelMinimapToCanvas(canvas, spec, theme)` performs the
   drawing in framework-neutral code; framework components only own the
   canvas element lifecycle.
10. **Real-time collaborative cursor.** `createVizelPresenceExtension`
    decorates the document with other users' cursors and selections.
    The `features.collaboration.presence` option configures it.
    Vizel uses `Decoration.widget` for cursor lines and labels,
    `Decoration.inline` for selection highlights, and a CSS variable
    per user for color.

### Locale extension

`VizelLocale` gains a `blocks` map (per-node-type labels) and a
`commands.block.*` group (merge, promote, demote, split, duplicate,
moveUp, moveDown labels).

`.claude/` updates: add a "Block Operations Layer" section to
`.claude/rules/packages/core.md`; add `VizelOutline` and `VizelMinimap`
to the Component Parity Table in
`.claude/rules/cross-framework.md`; add `presence.ts`,
`multi-block-selection.ts`, and `block-hierarchy.ts` to the Extension
Catalog in `.claude/rules/packages/core.md`.

---

## 12. SSR / Static rendering

Vizel supports three modes. Each mode serves a distinct user need.

### Mode 1 — `VizelStaticView` (read-only, full SSR)

For blog rendering, CMS view pages, and documentation sites.

```tsx
<VizelStaticView markdown={mdString} flavor={vizelGfmFlavor} theme="dark" />
```

The server invokes `generateVizelStaticHtml(content, options)` and
returns static HTML. The client hydrates without making the content
interactive. The component carries no editor instance.

The `theme` prop writes `data-vizel-theme="dark"` onto the component's
own wrapper element, not onto `document.documentElement`. This scoping
matches the policy in Section 13: Vizel touches only its own element
attributes and never the global document state.

For diagram nodes (Mermaid, GraphViz) and other client-only renderers,
`generateVizelStaticHtml` emits the source content as a fenced code
block with the appropriate language tag. The renderer activates after
client hydration when the code block enters the DOM. Server output
remains pure HTML with no JavaScript dependencies.

### Mode 2 — `Vizel` editable with progressive enhancement

For blog editing and CMS editing pages where the initial paint should
already show the content.

```tsx
<Vizel initialMarkdown={mdString} />
```

The server uses `generateVizelStaticHtml` to render the initial content
inside the editor's wrapper. The client mount step (`useEffect`,
`onMounted`, `onMount`) creates a Tiptap instance over the same HTML.
The HTML produced on the server and the HTML produced on the client
match exactly, eliminating hydration mismatches.

### Mode 3 — `Vizel` editable with client-only mount

For dashboards and authenticated UI where SEO is irrelevant.

```tsx
<Vizel />
```

The server renders an empty wrapper. The client creates the editor on
mount.

### `createVizelEditorInstance` fails loudly during SSR

```ts
export function createVizelEditorInstance(options: VizelEditorOptions): Editor {
  if (typeof document === "undefined") {
    throw new VizelError(
      "SSR_NOT_SUPPORTED",
      "createVizelEditorInstance cannot be called during SSR. " +
        "Defer creation to a client lifecycle hook."
    );
  }
  // ...
}
```

### Layer-by-layer SSR safety

| Layer | Server-callable | DOM access |
|-------|----------------|-----------|
| `utils/` | Yes | Never |
| `builders/` | Yes | Never |
| `commands/` | Yes | Never |
| `controllers/` | Factory yes, `mount()` no | Inside `mount()` with SSR guard |
| `extensions/` | Factory yes, ProseMirror plugin no | Inside ProseMirror plugins only |
| `editor.ts` | No (throws) | (Throws before reaching DOM) |

### `vizelThemeInitScript`

A pre-hydration script that synchronously sets `data-vizel-theme` based
on `localStorage` or system preference. Users place its output in the
document head:

```ts
export function vizelThemeInitScript(options?: {
  readonly defaultTheme?: "light" | "dark" | "system";
  readonly storageKey?: string;
}): string;
```

The script eliminates the dark-mode flash that occurs when the client
hydrates with the wrong theme.

### Framework-specific guidance

| Framework | Pattern |
|-----------|---------|
| React (Next.js App Router) | Wrap interactive components with `"use client"`; render the theme init script in a Server Component head |
| Vue (Nuxt) | Wrap with `<ClientOnly>` when full editor is needed; use `useHead` for the theme init script |
| Svelte (SvelteKit) | Use `{#if browser}` or `export const ssr = false`; place the theme init script in `<svelte:head>` |

`.claude/` updates: add an "SSR Safety" section to
`.claude/rules/packages/core.md`; add SSR pattern sections to
`.claude/rules/packages/{react,vue,svelte}.md`; add a CI script
`scripts/check-ssr-safety.ts` that flags `document.` or `window.` usage
outside permitted layers.

---

## 13. CSS variables and theme

Vizel is theme-neutral. It writes only `data-vizel-theme` on the host
element. The library does not touch any host environment selector.

### Vizel-internal selectors

```scss
:root {
  --vizel-color-bg: #ffffff;
  --vizel-color-fg: #1a1a1a;
  // ...
}

[data-vizel-theme="dark"] {
  --vizel-color-bg: #1a1a1a;
  --vizel-color-fg: #f5f5f5;
  // ...
}
```

The redesign removes the existing `.light`, `.dark`,
`[data-theme="light"]`, and `[data-theme="dark"]` selectors from
`_variables.scss`. Those selectors belong to host theme libraries
(Tailwind, next-themes), not to Vizel.

### `applyVizelTheme` writes only `data-vizel-theme`

```ts
export function applyVizelTheme(theme: "light" | "dark", target?: HTMLElement): void {
  const el = target ?? document.documentElement;
  el.setAttribute("data-vizel-theme", theme);
}
```

### CSS distribution

```
@vizel/core/
├── styles.css            # Full bundle. Equivalent to:
│                         #   @import "@vizel/core/styles/variables.css";
│                         #   @import "@vizel/core/styles/components.css";
└── styles/
    ├── variables.css     # CSS variables only (the :root and [data-vizel-theme="dark"] blocks)
    └── components.css    # Component styles only (no variable declarations)
```

Three valid import patterns:

| Pattern | Import | Use case |
|---------|--------|----------|
| Full | `@vizel/core/styles.css` | Default. Vizel ships its own tokens. |
| Variables only | `@vizel/core/styles/variables.css` | The user provides their own component CSS. |
| Components only | `@vizel/core/styles/components.css` | The user provides token mapping from another design system. |

`styles.css` equals the union of `styles/variables.css` and
`styles/components.css`. Importing `styles.css` plus either subentry is
redundant but harmless. Vizel ships no integration-specific CSS files.

### User responsibility

Users override Vizel's tokens, map their own design system to Vizel's
tokens, and synchronize their host's dark-mode selector with
`data-vizel-theme` themselves.

### Documentation approach

`docs/guide/theming.md` consolidates all theme documentation. It covers:

- The variable catalog (table of every `--vizel-color-*` token)
- Override patterns (generic, no specific library named)
- Two synchronization patterns: class-based and attribute-based,
  described abstractly without naming a specific dark-mode library

The documentation does not enumerate library-specific recipes that decay
when the library changes its API. Users consult their library's own
documentation to subscribe to theme changes and call `applyVizelTheme`.

`.claude/` updates: strengthen the "Style surface" subsection of
`.claude/rules/architecture.md`; add a "CSS Variables and Theme"
section to `.claude/rules/packages/core.md` covering the two-selector
rule, the no-host-touch rule, and the documentation policy of not naming
specific libraries.

---

## 14. Playwright CT audit and expansion

### Existing coverage assessment

The current 28 shared scenarios and ~44 per-framework specs already
cover interactive behavior (typing `/`, filtering, Enter to select,
edit-after-insert, escape to dismiss, etc.). The expansion in v2.0.0
focuses on new functionality, parity enforcement, and adjacent test
suites (round-trip, SSR, a11y, visual).

### Discipline pillars

1. **Mechanical framework parity.** `scripts/check-ct-parity.ts`
   asserts that `tests/ct/{react,vue,svelte}/specs/` contain the same
   file names. The existing 43 / 44 / 44 imbalance disappears in v2.0.0.
2. **Behavior tests for every new feature in Sections 1–13.** Each
   added builder, controller, command, block operation, static view
   mode, and so on receives a shared scenario plus three per-framework
   specs.
3. **Markdown round-trip suite.** `tests/markdown-roundtrip/` runs the
   100+ samples × 5 flavors matrix described in Section 10.
4. **SSR suite.** `tests/ssr/` validates `generateVizelStaticHtml`
   output, progressive-enhancement hydration mismatches, the theme init
   script output, and `createVizelEditorInstance` throwing in a Node
   environment.
5. **Accessibility suite.** `tests/a11y/` runs `@axe-core/playwright`
   against each component for WCAG 2.1 AA conformance. The Section 2
   spec-based ARIA wiring keeps the cost low.
6. **Visual regression — CI-only, scope-limited.** Visual snapshots
   run only in CI to avoid the OS-level rendering differences that
   plague local execution. The suite covers ~20 essential views
   (editor light/dark, slash menu open, block menu open, bubble menu
   over selection, color picker, outline, minimap, link editor, find/
   replace). Baseline updates trigger through a `workflow_dispatch`
   workflow.
7. **Coverage discipline.** `.claude/rules/testing.md` lists the
   required test types for each new feature, and PR review verifies the
   list.

`.claude/` updates: rewrite `.claude/rules/testing.md` covering the
seven pillars; enhance `.claude/skills/test/` to run round-trip, SSR,
a11y, and visual suites; extend
`.claude/agents/cross-framework-reviewer.md` to verify CT spec parity.

---

## 15. Documentation overhaul

The redesign treats documentation as a first-class artifact maintained
under mechanical checks.

### Eleven pillars

1. **Information architecture.** The `docs/guide/` tree organizes by
   user concern: getting started, architecture, configuration,
   features (subdirectory by category), commands, markdown
   (subdirectory), theming, block UX, SSR, error handling, per-framework
   guides, migration, troubleshooting. The API reference lives under
   `docs/api/` and is auto-generated.

2. **Side-by-side framework display.** Every shared-concept page uses
   VitePress code groups to show React, Vue, and Svelte side by side.
   Framework-specific concerns (return types, lifecycle gotchas)
   isolate into `docs/guide/{react,vue,svelte}.md`.

3. **Executable code examples.** Every code block in the guides comes
   from a real file under `apps/demo/{framework}/src/pages/`. VitePress
   includes them with the `<<< @/...` syntax. The CI build of the demos
   verifies that examples compile.

4. **Auto-generated API reference.** TypeDoc + `typedoc-plugin-markdown`
   + `vitepress-plugin-typedoc` convert JSDoc into Markdown that
   VitePress renders. `pnpm docs:generate-api` regenerates the output,
   which lives at git commit level for review and diff-tracking.

5. **Eleven required new guides.** `architecture.md`, `commands.md`,
   `markdown/flavors.md`, `markdown/custom-flavor.md`,
   `markdown/roundtrip.md`, `block-ux.md`, `ssr.md`,
   `error-handling.md`, `theming.md` (rewrite), `migration-v1-to-v2.md`,
   `troubleshooting.md`.

6. **Mechanical consistency checks.**
   `scripts/check-docs-consistency.ts` asserts:
   - The error-handling guide's code table matches the
     `VizelErrorCode` literal union.
   - The theming guide's CSS variable table matches
     `_variables.scss`.
   - The features guides match the `VizelFeatureOptions` structure.
   - The API reference is regenerated and up to date.

7. **Search and navigation.** The VitePress sidebar follows the new
   information architecture. Every page ends with cross-links phrased
   as "Try this if you want to..." Local search ships enabled.

8. **README maintenance.** The repository root README and each package
   README receive a rewrite. The Quick Start section in the root README
   imports the same example file used in `docs/guide/getting-started.md`,
   so the README cannot drift.

9. **JSDoc on every public symbol.** Every export from
   `@vizel/core/index.ts` and each framework's public API receives a
   JSDoc block with: a one-line imperative summary, a why-and-when
   explanation, `@param` entries, `@returns`, `@throws { VizelError }`
   where applicable, `@see` cross-references, and an `@example` for
   every Core public API. The JSDoc style follows the technical writing
   convention.

10. **Technical writing convention as SSOT.** The
    `.claude/rules/architecture.md` "Technical Writing Convention"
    section governs every English text artifact: VitePress guides,
    READMEs, JSDoc, `.claude/` rule files. The rules are:
    - Start function or rule docs with an imperative verb.
    - One sentence per idea. Active voice. Present tense.
    - Avoid demonstratives without an explicit referent.
    - Define abbreviations on first use.
    - Explain *why* and *when to use*; leave *what* to the type signature.
    - State the subject explicitly.

11. **`.claude/` style audit.** Section 17 applies the convention to
    every `.claude/` Markdown file.

### Mechanical style lint

`scripts/check-rules-style.ts` and `scripts/check-docs-style.ts`
heuristically detect orphan demonstratives, overlong sentences, and
docstrings that do not start with an imperative verb. Violations beyond
a threshold fail the build.

`.claude/` updates: add a "Documentation" section to
`.claude/rules/architecture.md` describing the IA, side-by-side display,
executable example rule, API auto-generation, mechanical consistency
checks, README maintenance, JSDoc requirements, and technical writing
convention.

---

## 16. Demo app overhaul

The demos serve two audiences with two distinct surfaces.

### Two demo surfaces

| Surface | Audience | Form |
|---------|----------|------|
| **Showcase** | Users trying Vizel for the first time | One full-featured live editor |
| **Feature pages** | Developers seeking minimal examples | One page per feature, 50–150 lines |

### Directory structure

```
apps/demo/
├── shared/                            # Common assets (images, sample Markdown)
├── react/src/
│   ├── entry.tsx
│   ├── App.tsx                        # Navigation + page routing (~100 lines)
│   ├── pages/
│   │   ├── Showcase.tsx
│   │   ├── GettingStarted.tsx
│   │   ├── BlockUx.tsx
│   │   ├── Markdown.tsx
│   │   ├── Theming.tsx
│   │   ├── Ssr.tsx
│   │   ├── Collaboration.tsx
│   │   ├── ErrorHandling.tsx
│   │   ├── Commands.tsx
│   │   └── CustomFlavor.tsx
│   └── styles.css
├── vue/src/                           # Same structure with .vue files
└── svelte/src/                        # Same structure with .svelte files
```

### Documentation integration

The VitePress guides include demo page files directly via
`<<< @/../apps/demo/{framework}/src/pages/{Page}.{tsx,vue,svelte}`. The
demo files double as documentation examples. Drift between docs and
demo becomes physically impossible.

### Cross-framework parity

`scripts/check-demo-parity.ts` asserts:

- File names (without extension) match across the three `pages/`
  directories.
- Line counts diverge by no more than a factor of 1.5.

The check runs in the `pre-push` lefthook and CI.

### Quality bar

- Each page stays within 50–150 lines.
- Comments explain *why* and *when to use*, not *what*.
- App-level styling stays minimal; the demos rely on Vizel's own
  component CSS.
- Demos do not import shadcn/ui, Material UI, Tailwind, or any other
  host UI library. Demos depend only on Vizel and the framework's
  standard library.

### Deployment

The existing `pnpm docs:build` pipeline copies each framework's demo
bundle into `docs/.vitepress/dist/demo/{framework}/`. The deployed
GitHub Pages tree becomes:

```
https://seijikohara.github.io/vizel/
├── /                          # VitePress guides
├── /api/                      # TypeDoc-generated reference
└── /demo/
    ├── /react/
    ├── /vue/
    └── /svelte/
```

`.claude/` updates: rewrite `.claude/rules/demo.md` covering the
showcase / feature-pages split, the page directory structure, the
50–150 line rule, the host-UI-library prohibition, the VitePress
inclusion pattern, and the cross-framework parity check.

---

## 17. `.claude/` consistency check

This section consolidates every `.claude/` change scattered through
Sections 1–16 and applies a final style and consistency pass.

### Final `.claude/rules/` layout

```
.claude/rules/
├── architecture.md           # Layering, invariants, technical writing convention
├── code-style.md             # TypeScript style, error handling regulation
├── cross-framework.md        # Parity tables, idiom exception catalog, return-type table
├── git.md                    # Conventional Commits, branch, lefthook
├── testing.md                # CT structure, behavior tests, round-trip, SSR, a11y, visual
├── demo.md                   # Demo structure, page rules, parity
└── packages/
    ├── core.md
    ├── react.md
    ├── vue.md
    └── svelte.md
```

`packages/core.md` is the single source of truth for everything that
concerns the `@vizel/core` package as a unit: the four layers, builder
catalog, controller catalog, Markdown pipeline, SSR safety, CSS
variables, feature categories, command layer, and block operations. The
SSOT discipline operates at the *topic* level rather than the *file*
level: `packages/core.md` holds one section per topic, each section
acts as the SSOT for its topic, and no other file duplicates a section.
Each framework rule under `packages/{react,vue,svelte}.md` covers only
that framework's idioms and contains no Core-layer content.

### SSOT placement per topic

| Topic | SSOT location |
|-------|---------------|
| Four-layer architecture | `packages/core.md` |
| Five spec types | `packages/core.md` |
| Ten controllers | `packages/core.md` |
| Six parity tables + idiom exceptions | `cross-framework.md` |
| Return-type table (Option B) | `cross-framework.md` |
| Re-export mirror rule | `cross-framework.md` + `packages/core.md` |
| Error model | `code-style.md` (the implementation SSOT is `errors.ts`) |
| Feature categories | `packages/core.md` |
| VizelCommand abstraction | `packages/core.md` |
| Markdown flavor plugin system | `packages/core.md` |
| Three SSR modes | `packages/core.md` + per-framework rules |
| CSS variables / theme | `packages/core.md` |
| Block operations | `packages/core.md` |
| CT discipline | `testing.md` |
| Demo discipline | `demo.md` |
| Technical writing convention | `architecture.md` |

### Final `.claude/agents/` layout

```
.claude/agents/
└── cross-framework-reviewer.md
```

The subagent verifies identifier parity, component parity, props
parity, event payload parity, CT spec parity, and idiom exception
compliance. Additional verification responsibilities live in skills,
not in further subagents.

### Final `.claude/skills/` layout

```
.claude/skills/
├── test/                     # CT, round-trip, a11y, visual suites
├── lint-instructions/        # Project rule violation detection (existing)
└── docs/                     # API regeneration, style audit, example sync, consistency check
```

### CLAUDE.md root table refresh

The repository root `CLAUDE.md` re-publishes the rules table, the
skills table, and the subagents table to reflect the final layout.

### Mechanical consistency CI gate

`lefthook.yml` runs the following checks in the `pre-push` hook and
GitHub Actions reuses them in CI:

| Check | Script | Source section |
|-------|--------|----------------|
| Type check | (existing) | — |
| Lint | (existing) | — |
| Re-export mirror | `scripts/check-reexport-mirror.ts` | 6 |
| CT framework parity | `scripts/check-ct-parity.ts` | 14 |
| Demo framework parity | `scripts/check-demo-parity.ts` | 16 |
| Docs/implementation consistency | `scripts/check-docs-consistency.ts` | 15 |
| Rules SSOT consistency | `scripts/check-rules-consistency.ts` | 17 (new) |
| Writing style | `scripts/check-rules-style.ts` + `scripts/check-docs-style.ts` | 15, 17 |
| SSR layer safety | `scripts/check-ssr-safety.ts` | 12 |

### Style audit of `.claude/`

Every `.claude/rules/*.md`, `.claude/agents/*.md`, and
`.claude/skills/**/*.md` file passes through the technical writing
convention. The Section 15 style lint runs against these files. The
final v2.0.0 ships with every `.claude/` Markdown file conforming.

### Release sequencing

The repository performs Section 17 last in the v2.0.0 release sequence:

1. Land Sections 1–16 in topic-scoped pull requests.
2. Apply the style audit and consistency lint as a final
   integration pass.
3. Confirm every CI check from the table above passes.
4. Tag and publish v2.0.0.

---

## Cross-section dependencies

| Depends on | Sections | Reason |
|-----------|----------|--------|
| 1 (layering) | 2, 3, 6, 12 | Spec/controller/SSR rules build on directory layout |
| 2 (specs) | 9, 11 | VizelCommandSpec, outline/minimap specs derive from base shapes |
| 3 (controllers) | 11, 12 | Block UX and SSR rely on controller contract |
| 4 (return types) | 5 | Idiom exception catalog records the return-type differences |
| 5 (parity) | 14, 15, 16 | CT / docs / demos enforce the parity discipline |
| 6 (public surface) | 15 | Docs require the unified API surface to build references |
| 7 (errors) | 8, 10, 11, 12 | Validation and lossy operations throw / emit VizelError |
| 8 (features) | 9, 10, 11, 13 | Commands, Markdown, block UX, theming live inside feature categories |
| 9 (commands) | 11, 15 | Block UX and command guide depend on the abstraction |
| 10 (markdown) | 11, 14, 15 | Block UX paste, round-trip suite, docs reference the pipeline |
| 11 (block UX) | 14, 15, 16 | Tests, docs, demos cover the new functionality |
| 12 (SSR) | 14, 15 | Tests and docs cover all three modes |
| 13 (theme) | 15, 16 | Docs describe the policy, demos avoid host UI integration |
| 14 (CT) | 17 | Skill and subagent updates reinforce the discipline |
| 15 (docs) | 16, 17 | Demos feed into docs, style audit applies to docs |
| 16 (demos) | 15 | Docs include demo files directly |
| 17 (`.claude/`) | All | Consolidates rule edits from every section |

## Out of scope (post-v2.0.0)

The redesign keeps the following items out of v2.0.0:

- Backward-compatibility shims, codemods, or migration utilities for
  v1.4.0 consumers.
- Official integration packages for any specific host UI library.
- A bundled collaborative editing provider (Yjs, Liveblocks, etc.).
- Documentation translation. v2.0.0 ships English documentation only.
- A standalone Web Component build of `@vizel/core`. The framework-
  agnostic architecture enables this build, but v2.0.0 does not ship
  the artifact.

These items remain candidates for later minor or major releases.

---

## Appendix A: Resolved design decisions

This appendix records design decisions that the implementation needs
but that the main sections did not state explicitly. Each entry lists
the question, the decision, and the rationale.

### A.1 `vizelDefaultCommands` membership

**Question.** Which commands does `vizelDefaultCommands` contain?

**Decision.** Three sub-registries concatenate into the default set:

```ts
export const vizelFormatCommands: readonly VizelCommand[] = [
  bold, italic, strike, code, link,
  textColor, highlight, underline, superscript, subscript,
];

export const vizelBlockCommands: readonly VizelCommand[] = [
  heading1, heading2, heading3, heading4, heading5, heading6,
  bulletList, orderedList, taskList,
  blockquote, codeBlock, horizontalRule,
  callout, details,
  blockMergePrevious, blockPromote, blockDemote,
  blockSplit, blockDuplicate, blockMoveUp, blockMoveDown,
];

export const vizelInsertCommands: readonly VizelCommand[] = [
  image, table, mathematics, diagram, embed, mention,
];

export const vizelDefaultCommands: readonly VizelCommand[] = [
  ...vizelFormatCommands,
  ...vizelBlockCommands,
  ...vizelInsertCommands,
];
```

Each command lists the surfaces it appears on through its
`surfaces` field. Image, table, and embed appear on slash menu only
(not toolbar). Block-operation commands appear on block menu and
shortcuts only. Format commands appear on toolbar, bubble menu, and
shortcut.

**Rationale.** Vizel users expect a complete Notion-like command set
out of the box. Splitting into three sub-registries lets advanced users
opt out of one category while keeping the others.

### A.2 `VizelLocale` complete structure

**Question.** What is the full shape of `VizelLocale`?

**Decision.**

```ts
export type VizelLocale = {
  readonly language: string;                              // BCP 47 tag (e.g., "en-US", "ja-JP")
  readonly direction: "ltr" | "rtl";

  readonly commands: {
    readonly format: Readonly<Record<string, string>>;    // bold, italic, strike, code, link, ...
    readonly block: Readonly<Record<string, string>>;     // heading1..6, bulletList, ..., mergePrevious, promote, demote, split, duplicate, moveUp, moveDown
    readonly insert: Readonly<Record<string, string>>;    // image, table, mathematics, diagram, embed, mention
  };

  readonly blocks: Readonly<Record<string, string>>;      // Display labels per node type (used by node selector, breadcrumbs)

  readonly menus: {
    readonly slashMenu: { readonly placeholder: string; readonly empty: string };
    readonly mentionMenu: { readonly placeholder: string; readonly empty: string };
    readonly blockMenu: { readonly title: string };
    readonly nodeSelector: { readonly title: string; readonly ariaLabelTemplate: string };
  };

  readonly forms: {
    readonly linkEditor: {
      readonly urlLabel: string;
      readonly textLabel: string;
      readonly submitLabel: string;
      readonly cancelLabel: string;
      readonly embedToggleLabel: string;
    };
    readonly findReplace: {
      readonly findLabel: string;
      readonly replaceLabel: string;
      readonly nextLabel: string;
      readonly previousLabel: string;
      readonly replaceOneLabel: string;
      readonly replaceAllLabel: string;
      readonly noResultsLabel: string;
      readonly matchCountTemplate: string;
    };
  };

  readonly saveIndicator: {
    readonly saving: string;
    readonly saved: string;
    readonly error: string;
    readonly lastSavedTemplate: string;
  };

  readonly placeholders: {
    readonly empty: string;
    readonly heading: string;
  };
};

export const vizelEnUS: VizelLocale;
export const vizelJaJP: VizelLocale;
```

Vizel ships English (`vizelEnUS`) and Japanese (`vizelJaJP`) out of the
box. Users provide additional locales by constructing a `VizelLocale`
value.

**Rationale.** Locale customization needs are predictable for an
editor: command labels, block names, form fields, save status. A flat
structure invites omissions; the nested structure mirrors UI surfaces
so additions stay obvious.

### A.3 Markdown metadata-comment encoding syntax

**Question.** What is the exact syntax of metadata comments for embed,
mention, and other lossy nodes?

**Decision.** The syntax follows this grammar:

```
metadata-comment := "<!--" SP "vizel:" type SP attrs SP "-->"
type             := identifier  // e.g., "embed", "mention", "diagram"
attrs            := attr (SP attr)*
attr             := key "=" '"' value '"'
key              := identifier  // e.g., "id", "type", "url"
value            := escaped-string  // see escaping below
```

Examples:

```
<!-- vizel:embed type="youtube" id="dQw4w9WgXcQ" url="https://youtube.com/watch?v=dQw4w9WgXcQ" -->
<!-- vizel:mention id="user-123" name="Alice" -->
```

**Escaping.** The value escapes the following sequences:

| Source | Escape |
|--------|--------|
| `"` | `&quot;` |
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `-->` (the comment terminator) | `--&gt;` |

**Placement.** The metadata comment appears immediately after the
visible representation:

```
[Title](https://example.com)<!-- vizel:embed type="youtube" id="..." -->
@username <!-- vizel:mention id="user-123" -->
```

A single space separates the visible token from the metadata comment
when the visible token does not end with a closing bracket.

**Rationale.** The metadata-comment encoding survives any Markdown
renderer that respects HTML comments. The escape table prevents
collisions with the comment terminator and with HTML entities.

### A.4 Dependency declaration policy

**Question.** Which dependencies go into `dependencies`, into
`peerDependencies`, and into `peerDependencies` with
`peerDependenciesMeta.optional`? How does the architecture ensure that
unused features cost users neither install footprint nor bundle bytes?

**Decision: a three-layer dependency model.**

The model separates dependencies by both *who installs them* and *when
they load at runtime*.

#### Layer 1 — Vizel-managed dependencies (`dependencies` of `@vizel/core`)

Vizel installs these automatically; the user does not declare them.

| Package | Reason |
|---------|--------|
| `@tiptap/core`, `@tiptap/pm`, `@tiptap/suggestion` | Always required. Tiptap is the foundation. |
| Tiptap base extensions (`@tiptap/extension-document`, `-paragraph`, `-text`, `-heading`, `-bold`, `-italic`, `-strike`, `-code`, `-bullet-list`, `-ordered-list`, `-list-item`, `-task-list`, `-task-item`, `-blockquote`, `-code-block`, `-horizontal-rule`, `-hard-break`, `-link`, `-history`, `-placeholder`, `-dropcursor`, `-gapcursor`) | Always-on core (Section 8). |
| Tiptap optional-feature extensions (`@tiptap/extension-image`, `-table`, `-table-row`, `-table-header`, `-table-cell`, `-mention`, `-underline`, `-superscript`, `-subscript`, `-typography`, `-text-color`, `-highlight`, `-character-count`, `-details`, `-find-replace`) | Lightweight (3-10KB each). Tree-shaking removes unused extensions from the consumer's bundle automatically. |
| `tiptap-markdown` | Always-on Markdown pipeline (Section 10). |
| `markdown-it` | Always-on. Vizel manages flavor plugin configuration. |

**Rationale.** Tiptap's individual extensions are small. Forcing users
to install them as peer dependencies creates install-time friction
without saving bundle bytes (the bundler already removes unused
extensions through tree-shaking). Bundling them as `dependencies`
gives users a frictionless `pnpm install` experience.

#### Layer 2 — Optional peer dependencies with dynamic loading

These heavy libraries (100KB to 1.5MB each) are not installed unless
the user explicitly opts in to a feature that uses them. They live in
`peerDependencies` with `peerDependenciesMeta.optional: true`, so
package managers do not warn about their absence.

| Package | Approximate size | Required when feature enabled |
|---------|------------------|------------------------------|
| `katex` | ~250KB | `features.content.mathematics` |
| `mermaid` | ~600KB | `features.content.diagram` (with Mermaid renderer) |
| `@viz-js/viz` | ~1.5MB | `features.content.diagram` (with GraphViz renderer) |
| `lowlight` | ~100KB + syntax languages | Code-block syntax highlighting |
| `yjs`, `y-prosemirror`, `y-protocols` | ~150KB combined | `features.collaboration.provider` (when using Yjs) |

#### Layer 3 — Framework runtime peer dependencies

The framework packages declare their host framework as a peer
dependency:

| Package | Field |
|---------|-------|
| `@vizel/core` | `dependencies` (caret-pinned to v2.x) on each framework package |
| `react`, `react-dom` (`@vizel/react` only) | `peerDependencies` |
| `vue` (`@vizel/vue` only) | `peerDependencies` |
| `svelte` (`@vizel/svelte` only) | `peerDependencies` |

### Lazy loading and loud failure

Vizel exposes a single `createLazyOptionalLoader` helper that wraps a
dynamic `import()` and converts a missing-package error into a
`VizelError("MISSING_OPTIONAL_DEP")`:

```ts
// packages/core/src/_internal/lazy.ts
export function createLazyOptionalLoader<T>(
  packageName: string,
  loader: () => Promise<T>,
  featureName: string
): () => Promise<T> {
  let cache: Promise<T> | undefined;
  return () => {
    if (!cache) {
      cache = loader().catch((err) => {
        cache = undefined;
        throw new VizelError(
          "MISSING_OPTIONAL_DEP",
          `Feature "${featureName}" requires "${packageName}" to be installed. ` +
          `Add it to your project: pnpm add ${packageName}`,
          { context: { package: packageName, feature: featureName }, cause: err }
        );
      });
    }
    return cache;
  };
}
```

Each heavy feature uses this loader and surfaces a clear error if the
user enables the feature without installing the required package:

```ts
// extensions/mathematics.ts
const loadKatex = createLazyOptionalLoader(
  "katex",
  () => import("katex"),
  "content.mathematics"
);
```

The new `MISSING_OPTIONAL_DEP` error code joins the `VizelErrorCode`
literal union in Section 7. The error fires:

- During Tiptap node rendering, when the renderer first needs the
  heavy library and the dynamic import fails.
- Through `onError` (runtime error category), so users can present a
  helpful UI rather than seeing a silent failure.

### Trade-offs

| Choice | Outcome |
|--------|---------|
| Tiptap extensions as `dependencies` | Frictionless install; small (3-10KB) extras enter the install but tree-shaking removes unused ones from the bundle. |
| Heavy libraries as optional peer deps | Users who do not need math, diagrams, syntax highlighting, or Yjs collaboration install nothing extra. Users who enable these features add a single explicit `pnpm add` step. |
| Loud failure via `MISSING_OPTIONAL_DEP` | Misconfiguration becomes immediately visible with an actionable error message instead of a silent crash. |

**Rationale.** This split honors the principle that unused features
must cost the user nothing. Light dependencies cost effectively
nothing through tree-shaking, so bundling them simplifies the install
experience. Heavy dependencies justify the install-time friction
because the savings (potentially 1.5MB) outweigh it.

### A.5 Option reactivity table

**Question.** Which fields of `VizelEditorOptions` accept changes
after mount, and which require a remount?

**Decision.**

| Field | Reactive | Mechanism |
|-------|---------|-----------|
| `editable` | Yes | `editor.setEditable(value)` mirrors changes |
| `placeholder` | Yes | `editor.commands.updatePlaceholder(value)` |
| `locale` | No | Remount required |
| `theme` | No (use `applyVizelTheme` instead) | Theme is host-managed |
| `features.*` | No | Remount required |
| `extensions` | No | Remount required |
| `markdown.flavor` | No | Remount required |
| `markdown.encoding` | No | Remount required |
| `initialContent` / `initialMarkdown` | No | Mount-time only |
| Callbacks (`onUpdate`, `onError`, ...) | Yes (via internal latest-callback pattern) | Framework adapter stores the latest reference |

**Rationale.** Tiptap extensions configure at mount time; changing them
after mount requires reconstructing the editor instance. Vizel mirrors
this constraint rather than attempting partial reconfiguration, which
would be fragile. Callbacks remain reactive through a latest-ref
pattern in each framework adapter (Section 4 return types describe
this internally).

### A.6 Minimap canvas dimensions and sampling

**Question.** What canvas size does `VizelMinimap` use, and how does
it handle very large documents?

**Decision.**

- Default canvas size: `width=120px`, `height=fills the host container`.
- The canvas resolution is the CSS size multiplied by
  `window.devicePixelRatio` to avoid blur on HiDPI displays.
- For documents with fewer than 5000 blocks, the spec contains one
  entry per block.
- For documents with 5000+ blocks, `buildVizelMinimapSpec` samples
  every Nth block where `N = ceil(blockCount / 5000)`. Heading-type
  blocks bypass sampling and always appear.
- The component accepts a `maxEntries` prop that overrides the default
  5000 limit.

**Rationale.** A canvas of 120px width is wide enough to convey
document structure without consuming significant viewport space. The
sampling threshold prevents O(n) drawing cost from degrading the user
experience in pathological cases.

### A.7 `pre-push` hook scope

**Question.** Which checks belong in the `pre-push` lefthook, and
which run in CI only?

**Decision.**

| Check | `pre-push` | CI |
|-------|-----------|----|
| `pnpm typecheck` | Yes | Yes |
| `pnpm lint` | Yes | Yes |
| Re-export mirror | Yes | Yes |
| CT framework parity | Yes (file-name scan only) | Yes |
| Demo framework parity | Yes (file-name + line count) | Yes |
| Docs/implementation consistency | Yes (file scan) | Yes |
| Rules SSOT consistency | Yes | Yes |
| Writing style lint | Yes | Yes |
| SSR layer safety | Yes (grep-based) | Yes |
| Playwright CT execution | No | Yes |
| Markdown round-trip suite | No | Yes |
| SSR test suite | No | Yes |
| Accessibility suite | No | Yes |
| Visual regression | No | Yes only |

**Rationale.** The `pre-push` hook stays under 30 seconds total wall
clock on a developer's machine. All checks that scan files (static
analysis) qualify. Test suites that actually run code defer to CI to
preserve `pre-push` responsiveness.

### A.8 Presence provider interface

**Question.** Vizel's `presence` feature integrates with Yjs Awareness
in the reference implementation. How does it accommodate other
collaboration providers?

**Decision.**

`VizelPresenceOptions` accepts a generic provider that conforms to a
minimal awareness interface:

```ts
export type VizelPresenceAwareness = {
  readonly getStates: () => ReadonlyMap<number, VizelPresenceUserState>;
  readonly setLocalState: (state: VizelPresenceUserState) => void;
  readonly on: (event: "update", handler: () => void) => () => void;
};

export type VizelPresenceOptions = {
  readonly awareness: VizelPresenceAwareness;
  readonly currentUser: VizelPresenceUser;
  readonly resolveUser?: (id: string) => Promise<VizelPresenceUser>;
};
```

The reference Yjs Awareness instance satisfies this interface
naturally; adapters for Liveblocks or other providers wrap their
native API into this shape.

**Rationale.** Coupling presence to a single provider would constrain
the library. The minimal interface (get states, set local state,
subscribe to updates) covers every awareness-style protocol Vizel
needs.

### A.9 Multi-block selection visual feedback

**Question.** How are selected blocks styled?

**Decision.**

The `multi-block-selection` extension applies a `Decoration.node` with
class `vizel-selected-block` to each block in the range. CSS in
`styles/_multi-block-selection.scss` sets:

```scss
.vizel-selected-block {
  background-color: var(--vizel-color-selection-bg);
  border-radius: 4px;
}

[data-vizel-theme="dark"] .vizel-selected-block {
  // background-color already follows the --vizel-color-selection-bg variable.
}
```

Two new CSS variables enter the catalog:

| Variable | Default (light) | Default (dark) |
|----------|----------------|---------------|
| `--vizel-color-selection-bg` | `rgba(59, 130, 246, 0.12)` | `rgba(96, 165, 250, 0.16)` |
| `--vizel-color-selection-border` | `rgba(59, 130, 246, 0.4)` | `rgba(96, 165, 250, 0.4)` |

**Rationale.** Decoration-based styling avoids modifying the document.
Variable-based theming follows the Section 13 policy.

### A.10 Outline and minimap component placement

**Question.** Where do users place `VizelOutline` and `VizelMinimap`
in their layout?

**Decision.**

Both components stand alone. Users place them anywhere in their
application, typically inside a sibling `<aside>` to the editor:

```tsx
<VizelProvider>
  <aside>
    <VizelOutline />
    <VizelMinimap />
  </aside>
  <main>
    <Vizel />
  </main>
</VizelProvider>
```

The components consume the same editor instance through the provider
context. The components do not nest inside `<Vizel>` and do not depend
on a specific layout container.

**Rationale.** Block-editor users expect navigation aids to live in
their own panel. Forcing a layout would limit the patterns the library
supports.

## Appendix B: Open items for resolution during implementation

The following items remain open. The implementation phase resolves
each by my judgment unless one of them turns out to require user
input.

1. **Exact file split inside `controllers/`.** Whether each controller
   gets its own file or related controllers share a file. Decision
   defers to the natural cohesion observed during implementation.
2. **TypeDoc configuration details.** Theme, entry points, exclusions.
   Decision defers to TypeDoc plugin defaults plus minimum overrides.
3. **Biome rule additions.** Whether to add new lint rules beyond the
   existing configuration. Decision defers to violations observed
   during the rewrite.
4. **CI script implementation details.** The script bodies for
   `check-rules-consistency.ts`, `check-rules-style.ts`, etc. The
   spec defines what they check; implementation decides how.
5. **Visual regression baseline content.** The 20 specific screenshots
   that constitute the visual regression suite. Decision defers to
   the demo pages after they stabilize.
6. **Locale defaults beyond English and Japanese.** Whether Vizel ships
   additional locales out of the box. Decision: ship only English and
   Japanese in v2.0.0; users may contribute additional locales.

If any of these items reveals an ambiguity that needs a user-level
design decision (rather than a routine implementation choice), I will
surface the question rather than guessing.
