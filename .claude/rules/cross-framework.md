---
paths:
  - "packages/{react,vue,svelte}/**/*"
  - "packages/core/src/types.ts"
---

> **DEPRECATED — scheduled for removal in Phase 1.**
>
> This rule encodes v1's API-symmetry contract. v2.0.0 replaces it with the
> typed feature manifest at `packages/core/src/feature-manifest.ts` plus the
> per-framework idiomatic API contract. The new contract is documented in:
>
> - [ADR-0001](../../docs/adr/ADR-0001-feature-parity-over-api-symmetry.md) — feature parity over API symmetry
> - [ADR-0002](../../docs/adr/ADR-0002-feature-manifest-as-parity-ssot.md) — feature manifest as parity SSOT
> - [ADR-0004](../../docs/adr/ADR-0004-per-framework-idiomatic-api.md) — per-framework idiomatic API contract
> - [ADR-0006](../../docs/adr/ADR-0006-retire-cross-framework-rule.md) — retire this file
>
> Phase 1 lands the manifest and deletes this file in the same pull request.
> Until then, the tables below describe v1 behaviour for reference only.

# Cross-Framework Consistency

The React, Vue, and Svelte packages must maintain feature parity and consistent APIs.

This file is the single source of truth for cross-framework parity. The six
tables below are checked programmatically by
`scripts/check-cross-framework-parity.ts` (added in Section 5b). Drift
outside the Idiom Exception Catalog (Table 6) is a defect.

The architectural invariants that drive these tables — Core remains
framework-agnostic, framework packages are thin adapters, UI components
ship as Core skeletons plus framework renderers — live in
`.claude/rules/architecture.md`. If this file and architecture.md
conflict, architecture.md wins.

## Six SSOT Parity Tables

### 1. Identifier Parity Table

Every hook / composable / rune stem matches across the three framework
`src/index.ts` exports modulo the idiom-exception prefix (`use*` in
React and Vue, `create*` for Svelte factories, `get*` for Svelte
context getters). Differences outside this whitelist are defects.

| React (`hooks/`) | Vue (`composables/`) | Svelte (`runes/`) |
|------------------|----------------------|--------------------|
| `useVizelEditor` | `useVizelEditor` | `createVizelEditor` |
| `useVizelState` | `useVizelState` | `createVizelState` |
| `useVizelEditorState` | `useVizelEditorState` | `createVizelEditorState` |
| `useVizelAutoSave` | `useVizelAutoSave` | `createVizelAutoSave` |
| `useVizelMarkdown` | `useVizelMarkdown` | `createVizelMarkdown` |
| `useVizelTheme` | `useVizelTheme` | `getVizelTheme` |
| `useVizelThemeSafe` | `useVizelThemeSafe` | `getVizelThemeSafe` |
| `useVizelContext` | `useVizelContext` | `getVizelContext` |
| `useVizelContextSafe` | `useVizelContextSafe` | `getVizelContextSafe` |
| `useVizelIconContext` | `useVizelIconContext` | `getVizelIconContext` |
| `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` |
| `createVizelMentionMenuRenderer` | `createVizelMentionMenuRenderer` | `createVizelMentionMenuRenderer` |
| `useVizelCollaboration` | `useVizelCollaboration` | `createVizelCollaboration` |
| `useVizelComment` | `useVizelComment` | `createVizelComment` |
| `useVizelVersionHistory` | `useVizelVersionHistory` | `createVizelVersionHistory` |

### 2. Component Parity Table

Each component must exist in all three framework packages with equivalent
functionality. The file-extension column reflects each framework's
authoring convention.

| Component | React | Vue | Svelte |
|-----------|-------|-----|--------|
| Vizel | `.tsx` | `.vue` | `.svelte` |
| VizelBlockMenu | `.tsx` | `.vue` | `.svelte` |
| VizelEditor | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenu | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuDefault | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuButton | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuDivider | `.tsx` | `.vue` | `.svelte` |
| VizelBubbleMenuColorPicker | `.tsx` | `.vue` | `.svelte` |
| VizelLinkEditor | `.tsx` | `.vue` | `.svelte` |
| VizelNodeSelector | `.tsx` | `.vue` | `.svelte` |
| VizelOutline | `.tsx` | `.vue` | `.svelte` |
| VizelSlashMenu | `.tsx` | `.vue` | `.svelte` |
| VizelSlashMenuItem | `.tsx` | `.vue` | `.svelte` |
| VizelSlashMenuEmpty | `.tsx` | `.vue` | `.svelte` |
| VizelThemeProvider | `.tsx` | `.vue` | `.svelte` |
| VizelSaveIndicator | `.tsx` | `.vue` | `.svelte` |
| VizelPortal | `.tsx` | `.vue` | `.svelte` |
| VizelColorPicker | `.tsx` | `.vue` | `.svelte` |
| VizelEmbedView | `.tsx` | `.vue` | `.svelte` |
| VizelIcon | `.tsx` | `.vue` | `.svelte` |
| VizelIconProvider | `.tsx` | `.vue` | `.svelte` |
| VizelProvider | `.tsx` | `.vue` | `.svelte` |
| VizelFindReplace | `.tsx` | `.vue` | `.svelte` |
| VizelMentionMenu | `.tsx` | `.vue` | `.svelte` |
| VizelToolbar | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarButton | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarDefault | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarDivider | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarDropdown | `.tsx` | `.vue` | `.svelte` |
| VizelToolbarOverflow | `.tsx` | `.vue` | `.svelte` |

### 3. Props Parity Table

Each component's prop interface must match across the three frameworks by
name and shape, modulo the idiom exceptions in Table 6 (`className` vs
`class`, `children: ReactNode | Snippet`, ref-prop shape). The table
below lists the load-bearing props for each component; consult the
per-framework component source for the full set.

#### `Vizel` (all-in-one)

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `initialContent` | `JSONContent` | `JSONContent` | `JSONContent` |
| `initialMarkdown` | `string` | `string` | `string` |
| `transformDiagramsOnImport` | `boolean` | `boolean` | `boolean` |
| `placeholder` | `string` | `string` | `string` |
| `editable` | `boolean` | `boolean` | `boolean` |
| `autofocus` | `boolean \| "start" \| "end" \| "all" \| number` | (same) | (same) |
| `features` | `VizelFeatureOptions` | `VizelFeatureOptions` | `VizelFeatureOptions` |
| `flavor` | `VizelMarkdownFlavor` | `VizelMarkdownFlavor` | `VizelMarkdownFlavor` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |
| `extensions` | `Extensions` | `Extensions` | `Extensions` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| `showToolbar` | `boolean` | `boolean` | `boolean` |
| Toolbar slot | `toolbarContent?: (props) => ReactNode` | `<slot name="toolbar" :editor>` | `toolbar?: Snippet<[{ editor }]>` |
| `showBubbleMenu` | `boolean` | `boolean` | `boolean` |
| Bubble-menu slot | `bubbleMenuContent?: (props) => ReactNode` | `<slot name="bubble-menu" :editor>` | `bubbleMenu?: Snippet<[{ editor }]>` |
| `enableEmbed` | `boolean` | `boolean` | `boolean` |
| Children | `children?: ReactNode` | default slot | `children?: Snippet<[{ editor }]>` |
| Controlled `markdown` | `string` | `string` (`v-model:markdown`) | `string` (`bind:markdown`) |
| `onMarkdownChange` | `(md: string) => void` | emitted via `v-model:markdown` | bound via `bind:markdown` |
| Ref prop | `ref?: Ref<VizelRef>` | template ref → `defineExpose` | `ref?: VizelRef` (mutable prop) |
| Lifecycle callbacks | `onUpdate`, `onCreate`, `onDestroy`, `onSelectionUpdate`, `onFocus`, `onBlur`, `onError` | (same names) | (same names) |

#### `VizelEditor`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` | `Editor \| null` | `Editor \| null` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| Ref prop | `ref?: Ref<VizelEditorRef>` | template ref → `defineExpose` | `ref?: VizelEditorRef` |

#### `VizelProvider`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` | `Editor \| null` | `Editor \| null` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| Children | `children: ReactNode` (required) | default slot | `children: Snippet` (required) |

#### `VizelThemeProvider`

Extends `VizelThemeProviderOptions` from `@vizel/core` (`defaultTheme`,
`storageKey`, `targetSelector`, `disableTransitionOnChange`) in all three
frameworks. The only divergence is the children form.

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| Children | `children: ReactNode` (required) | default slot | `children: Snippet` (required) |

#### `VizelBubbleMenu`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` | `Editor \| null` | `Editor \| null` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| `showDefaultMenu` | `boolean` | `boolean` | `boolean` |
| `pluginKey` | `string` | `string` | `string` |
| `updateDelay` | `number` | `number` | `number` |
| `shouldShow` | `(props: { editor, from, to }) => boolean` | (same) | (same) |
| `enableEmbed` | `boolean` | `boolean` | `boolean` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |
| Children | `children?: ReactNode` | default slot | `children?: Snippet` |

#### `VizelToolbar`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` | `Editor \| null` | `Editor \| null` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| `showDefaultToolbar` | `boolean` | `boolean` | `boolean` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |
| Children | `children?: ReactNode` | default slot | `children?: Snippet<[{ editor }]>` |

#### `VizelLinkEditor`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` (context fallback) | `Editor \| null` (context fallback) | `Editor \| null` (context fallback) |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| Close callback | `onClose?: () => void` | (emit `close`) | `onclose?: () => void` |
| `enableEmbed` | `boolean` | `boolean` | `boolean` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |

#### `VizelFindReplace`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` | `Editor \| null` | `Editor \| null` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |
| Close callback | `onClose?: () => void` | (emit `close`) | `onclose?: () => void` |

#### `VizelOutline`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `editor` | `Editor \| null` | `Editor \| null` | `Editor \| null` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| `currentPos` | `number \| null` | `number \| null` | `number \| null` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |

#### `VizelSlashMenu`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `items` | `VizelSlashCommandItem[]` | `VizelSlashCommandItem[]` | `VizelSlashCommandItem[]` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| Selection callback | `onSelect: (item) => void` | emit `select` | `onselect: (item) => void` |
| `showGroups` | `boolean` | `boolean` | `boolean` |
| `groupOrder` | `string[]` | `string[]` | `string[]` |
| Item renderer | `renderItem?: (state) => ReactNode` | `#item` slot | `renderItem?: Snippet<[state]>` |
| Empty renderer | `renderEmpty?: () => ReactNode` | `#empty` slot | `renderEmpty?: Snippet` |
| Imperative ref | `ref?: Ref<VizelSlashMenuRef>` | template ref → `defineExpose` | `ref?: VizelSlashMenuRef` (mutable prop) |

#### `VizelMentionMenu`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `items` | `VizelMentionItem[]` | `VizelMentionItem[]` | `VizelMentionItem[]` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |
| Selection callback | `onSelect: (item) => void` | emit `select` | `onselect: (item) => void` |
| `locale` | `VizelLocale` | `VizelLocale` | `VizelLocale` |
| Item renderer | `renderItem?: (state) => ReactNode` | `#item` slot | `renderItem?: Snippet<[state]>` |
| Empty renderer | `renderEmpty?: () => ReactNode` | `#empty` slot | `renderEmpty?: Snippet` |
| Imperative ref | `ref?: Ref<VizelMentionMenuRef>` | template ref → `defineExpose` | `ref?: VizelMentionMenuRef` (mutable prop) |

#### `VizelColorPicker`

| Prop | React | Vue | Svelte |
|------|-------|-----|--------|
| `colors` | `readonly VizelColorDefinition[]` | (same) | (same) |
| `value` | `string` | `string` | `string` |
| Change callback | `onChange: (color: string) => void` | emit `change` | `onchange: (color: string) => void` |
| `label`, `recentColors`, `recentLabel`, `hexPlaceholder`, `applyTitle`, `applyAriaLabel`, `noneValues` | `string` / `string[]` | (same) | (same) |
| `allowCustomColor`, `showRecentColors` | `boolean` | `boolean` | `boolean` |
| Class prop | `className?: string` | `class?: string` | `class?: string` |

Class-prop, ref-prop, and slot/children form differences come from the
Idiom Exception Catalog (Table 6) and are not defects. Any divergence in
the other rows is a defect.

#### Custom Item Renderers

Components that iterate a list (`VizelSlashMenu`, `VizelMentionMenu`)
expose an item-level customization seam through whatever the framework's
idiomatic slot mechanism is. Consumers may swap the rendering of a
single item; the menu container's structure, keyboard handlers, and
ARIA wiring stay owned by the component.

| Framework | API form |
|-----------|----------|
| React | `renderItem?: (item, state) => ReactNode` prop |
| Vue | `<slot name="item" :item="..." :is-selected="..." />` |
| Svelte | `renderItem?: Snippet<[{ item, isSelected, onclick }]>` |

The cross-framework concept is identical — give the consumer the item
data plus the selection state and let them return a node — only the
binding form differs to honor each framework's slot idiom.

### 4. Return Type Table

| API | React | Vue | Svelte |
|-----|-------|-----|--------|
| `useVizelEditor` / `createVizelEditor` | `Editor \| null` | `ShallowRef<Editor \| null>` | `{ readonly current: Editor \| null }` |
| `useVizelState` / `createVizelState` | `number` | `ComputedRef<number>` | `{ readonly version: number }` |
| `useVizelEditorState` / `createVizelEditorState` | `VizelEditorState` | `ComputedRef<VizelEditorState>` | `{ readonly current: VizelEditorState }` |
| `useVizelMarkdown` / `createVizelMarkdown` | `{ markdown: string; setMarkdown: (md: string) => void; isPending: boolean; flush: () => void }` | `{ markdown: Readonly<ShallowRef<string>>; setMarkdown: (md: string) => void; isPending: ComputedRef<boolean>; flush: () => void }` | `{ readonly current: string; setMarkdown: (md: string) => void; readonly isPending: boolean; flush: () => void }` |
| `useVizelTheme` / `getVizelTheme` | `{ theme: VizelResolvedTheme; setTheme: (next: VizelResolvedTheme) => void }` | `{ theme: ComputedRef<VizelResolvedTheme>; setTheme: (next: VizelResolvedTheme) => void }` | `{ readonly current: VizelResolvedTheme; setTheme: (next: VizelResolvedTheme) => void }` |
| `useVizelAutoSave` / `createVizelAutoSave` | `{ status: VizelSaveStatus; hasUnsavedChanges: boolean; lastSaved: Date \| null; error: Error \| null; save: () => Promise<void>; restore: () => Promise<JSONContent \| null> }` | `{ status: ComputedRef<VizelSaveStatus>; hasUnsavedChanges: ComputedRef<boolean>; lastSaved: ComputedRef<Date \| null>; error: ComputedRef<Error \| null>; save: () => Promise<void>; restore: () => Promise<JSONContent \| null> }` | `{ readonly status: VizelSaveStatus; readonly hasUnsavedChanges: boolean; readonly lastSaved: Date \| null; readonly error: Error \| null; save: () => Promise<void>; restore: () => Promise<JSONContent \| null> }` |
| `useVizelContext` / `getVizelContext` | `Editor \| null` | `ShallowRef<Editor \| null>` | `{ readonly current: Editor \| null }` |
| Suggestion menu imperative ref | `RefObject<{ onKeyDown: (e: KeyboardEvent) => boolean }>` | `Ref<{ onKeyDown: (e: KeyboardEvent) => boolean } \| null>` | `{ onKeyDown: (e: KeyboardEvent) => boolean } \| null` (mutable prop) |

Notes on shape choices:

- The Svelte `version` field on `createVizelState` distinguishes the
  tick value from the editor-instance accessor (`current`) used
  elsewhere.
- The Vue `Readonly<ShallowRef<...>>` on `useVizelMarkdown.markdown`
  signals read-only intent at the type level (writes route through
  `setMarkdown`).
- `useVizelAutoSave` is unwrapped in React (snapshot-on-render),
  `ComputedRef`-wrapped per-field in Vue (templates use `.value`
  directly), and `readonly`-wrapped in Svelte runes (rune-getter
  idiom).
- The Section 4 rationale for the per-framework shape choices lives in
  `docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md`.

### 5. Event Payload Table

Callback prop names and argument shapes are identical across the three
frameworks. The canonical signatures live in
`packages/core/src/types.ts` (`VizelEditorOptions`). The framework
components either accept the callback verbatim as a prop (React, Svelte)
or emit a matching event (Vue), but the payload shape never changes.

| Callback prop | Argument type | Source |
|---------------|---------------|--------|
| `onUpdate` | `(props: { editor: Editor }) => void` | `VizelEditorOptions.onUpdate` |
| `onCreate` | `(props: { editor: Editor }) => void` | `VizelEditorOptions.onCreate` |
| `onDestroy` | `() => void` | `VizelEditorOptions.onDestroy` |
| `onSelectionUpdate` | `(props: { editor: Editor }) => void` | `VizelEditorOptions.onSelectionUpdate` |
| `onFocus` | `(props: { editor: Editor }) => void` | `VizelEditorOptions.onFocus` |
| `onBlur` | `(props: { editor: Editor }) => void` | `VizelEditorOptions.onBlur` |
| `onError` | `(error: VizelError) => void` | `VizelEditorOptions.onError` |
| `onMarkdownChange` (`Vizel`) | `(markdown: string) => void` | `Vizel` component (controlled markdown) |
| `onClose` (`VizelLinkEditor`, `VizelFindReplace`) | `() => void` | per-component, dismissal callback |
| `onSelect` / `onselect` (`VizelSlashMenu`, `VizelMentionMenu`) | `(item: VizelSlashCommandItem) => void` / `(item: VizelMentionItem) => void` | per-component, selection callback |
| `onChange` / `onchange` (`VizelColorPicker`) | `(color: string) => void` | per-component, selection callback |
| `onUpload` (image feature) | `(file: File) => Promise<string>` | `VizelImageUploadPluginOptions.onUpload` |
| `onValidationError` (image feature) | `(error: VizelImageValidationError) => void` | `VizelImageUploadPluginOptions.onValidationError` |

The casing difference for Svelte's `onclose` / `onchange` /
`onselect` is the same DOM-attribute-casing exception that applies to
every Svelte 5 component (lowercase native event handlers); the React
and Vue equivalents use camelCase per their own conventions.

### 6. Idiom Exception Catalog

Differences that fall inside this catalog are intentional and honor the
host framework's idiom. Differences outside this catalog are defects.

| Target | React | Vue | Svelte | Justification |
|--------|-------|-----|--------|---------------|
| Function prefix | `useFoo` | `useFoo` | `createFoo` | Svelte 5 rune convention |
| Context getter prefix | `useVizelContext` | `useVizelContext` | `getVizelContext` | Svelte context API convention |
| Hook return type | bare value | `Ref` / `ShallowRef` / `ComputedRef` | `{ readonly current }` | See Return Type Table (Table 4) |
| Class prop name | `className` | `class` | `class` | Each framework's HTML attribute convention |
| Children / slot | `children: ReactNode` | `<slot />` / `default` slot | `Snippet` | Each framework's children convention |
| Imperative ref | `ref` prop + `useImperativeHandle` | `defineExpose` + template ref | mutable ref prop | Each framework's ref convention (React 19 treats `ref` as a regular prop — no `forwardRef`) |
| Hook scalar field | semantic name (`theme`, `markdown`, `editor`) | semantic name (`theme`, `markdown`, `editor`) | rune-getter `current` | Svelte runes expose a single getter (`{ readonly current }`); React / Vue keep the semantic name so destructuring `{ theme }` / `{ markdown }` reads naturally |
| Event handler prop | `onUpdate` | `onUpdate` | `onUpdate` | All frameworks unify on the `on*` callback prop |

## Supporting Conventions

### Source of Truth

`@vizel/core` owns all framework-agnostic code. See `packages/core.md` for the centralization rules.

The framework packages re-export the full `@vizel/core` surface via
`export * from "@vizel/core"` in each `packages/{react,vue,svelte}/src/index.ts`.
Installing one framework package is sufficient to access every Core
type, constant, extension, builder, controller, and utility — consumers
do not need a direct `@vizel/core` dependency for normal use (Section 6
of the v2 redesign, enforced by `pnpm check:parity`).

- Import Vizel symbols from the framework package you already use
  (`@vizel/react`, `@vizel/vue`, or `@vizel/svelte`).
- Import Tiptap types (`JSONContent`, `Editor`, etc.) from `@tiptap/core`.
- Style imports remain explicit: `import "@vizel/<framework>/styles.css"`
  works because CSS cannot be re-exported across packages.

### Naming Conventions

Each framework follows its idiomatic naming:

- **React**: prefix hooks with `use`.
- **Vue**: prefix composables with `use`.
- **Svelte**: prefix factories with `create` and context getters with `get`.

### Options Interface

All packages accept identical options. Define the option types in `@vizel/core`:

```typescript
// @vizel/core
interface VizelEditorOptions {
  extensions?: Extensions;
  // ...
}
```

### Editor Accessor Convention

Each framework accepts the editor in the shape that is idiomatic for its
reactivity model.

| Framework | Hook / composable / rune signature |
|-----------|-----------------------------------|
| React | `useVizelX(editor: Editor \| null \| undefined, options?)` — pass the editor value directly. React reads the variable each render, no getter indirection needed. |
| Vue | `useVizelX(() => editor.value, options?)` — pass a getter that reads `.value` so the composable can track the `ShallowRef` across changes. |
| Svelte | `createVizelX(() => editor.current, options?)` — pass a getter that reads `.current` so the rune can react inside `$effect`. |

The cross-framework concept (`hook(editor, options)`) is identical; only the
binding form differs to honor each framework's reactivity model.

### Context Consumer Return Shape

| React | Vue | Svelte |
|-------|-----|--------|
| `Editor \| null` (`useVizelContext()` throws outside a provider; `useVizelContextSafe()` returns `null` both outside a provider and while the provider's editor is still `null`) | `ShallowRef<Editor \| null>` (both `useVizelContext()` and `useVizelContextSafe()`; the safe variant returns `null` outside a provider) | `{ readonly current: Editor \| null }` (`getVizelContext()` throws outside a provider; `getVizelContextSafe()` returns `null` outside a provider) |

### Context API Equivalence

| Feature | React | Vue | Svelte |
|---------|-------|-----|--------|
| Provider | `VizelProvider` | `VizelProvider` | `VizelProvider` |
| Consumer (required) | `useVizelContext()` | `useVizelContext()` | `getVizelContext()` |
| Consumer (optional) | `useVizelContextSafe()` | `useVizelContextSafe()` | `getVizelContextSafe()` |

### Provider Root Class

`VizelProvider` in every framework renders a `<div class="vizel-root" data-vizel-root>`
wrapper, prepending the consumer-supplied class. The `.vizel-root` selector
scopes all CSS custom properties (`--vizel-*`), so omitting the class would
break theming for any descendant that depends on those variables.

### Suggestion Menu Ref Convention

`VizelSlashMenu` and `VizelMentionMenu` expose keyboard control to the
Tiptap suggestion renderer through an imperative `onKeyDown` handle. The
signature is identical in all three frameworks:

```typescript
type VizelSlashMenuRef = { onKeyDown: (event: KeyboardEvent) => boolean };
type VizelMentionMenuRef = { onKeyDown: (event: KeyboardEvent) => boolean };
```

The renderer unwraps the `KeyboardEvent` from Tiptap's `{ event }` payload
before forwarding. Components accept the raw event so the same ref shape
works across React (`useImperativeHandle`), Vue (`defineExpose`), and
Svelte (ref-prop pattern). The previous React/Vue declarations used a
`{ event }` wrapper that did not match the underlying implementation;
v2.0 collapses them to the raw-event form.

### Reactive vs Mount-time Editor Options

`useVizelEditor` / `createVizelEditor` create the Tiptap instance once on
mount. Most options (`initialContent`, `initialMarkdown`, `placeholder`,
`features`, `extensions`, `flavor`, `locale`, `autofocus`) are captured at
that point and cannot be changed via prop updates.

The single exception is `editable`, which all three frameworks mirror through
`editor.setEditable()` whenever the prop changes after mount. Toggle this to
switch the editor between read-write and read-only modes.

To change other options at runtime, use the corresponding Tiptap command
(`editor.commands.setContent(...)`, `editor.commands.focus(...)`, etc.).

### State Subscription Convention

The `useVizelState` / `createVizelState` primitives in every framework
wrap `createVizelEditorTransactionStore` from `@vizel/core`. They
**increment a monotonic version counter** on every Tiptap `transaction`
event and surface that counter through the framework's native
reactivity primitive.

The counter value itself is intentionally meaningless — the hook
exists to force a re-render so that subsequent `editor.isActive(...)`
or `editor.state.*` reads happen against the latest snapshot. Reading
`editor.state.tr` directly inside `useSyncExternalStore`'s
`getSnapshot` would return a fresh `Transaction` on every call (it is
a getter that constructs new instances), so React tears down the
subscription with an infinite loop. The version-counter indirection
is the only stable shape that satisfies React's referential-stability
contract while still triggering on every transaction.

Consumers typically ignore the return value:

```tsx
useVizelState(editor); // just subscribe, throw away the tick
return <button className={editor.isActive("bold") ? "active" : ""} />;
```

## Adding a New Feature

Follow this sequence to add a feature with consistent cross-framework support:

1. Add shared logic and types to `@vizel/core`.
2. Implement the feature in all three framework packages.
3. Verify props, options, and return types match across frameworks
   against the six tables above; update the tables in the same PR.
4. Update each demo app to exercise the feature.
5. Add Playwright Component Tests with shared scenarios under `tests/ct/scenarios/`.
6. Run `pnpm typecheck && pnpm build && pnpm test:ct`.
