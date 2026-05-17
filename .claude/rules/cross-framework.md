---
paths:
  - "packages/{react,vue,svelte}/**/*"
  - "packages/core/src/types.ts"
---

# Cross-Framework Consistency

The React, Vue, and Svelte packages must maintain feature parity and consistent APIs.

## Source of Truth

`@vizel/core` owns all framework-agnostic code. See `packages/core.md` for the centralization rules.

The framework packages do NOT re-export symbols from `@vizel/core`. Consumers import shared symbols directly:

- Import Vizel types and utilities from `@vizel/core`.
- Import Tiptap types (`JSONContent`, `Editor`, etc.) from `@tiptap/core`.

## Component Equivalence

Each component must exist in all three framework packages with equivalent functionality.

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

## Props Interface

Each component exposes equivalent props across frameworks. React uses `className`. Vue and Svelte use `class`.

```typescript
interface VizelEditorProps {
  editor?: Editor | null;
  class?: string; // React: className
}

interface VizelBubbleMenuProps {
  editor?: Editor | null;
  class?: string;
  children?: ReactNode | VNode | Snippet; // framework-specific child type
}
```

### Custom Item Renderers

Components that iterate a list (e.g. `VizelSlashMenu`, `VizelMentionMenu`)
expose an item-level customization seam through whatever the framework's
idiomatic slot mechanism is. Consumers may swap the rendering of a
single item, but the menu container's structure, keyboard handlers, and
ARIA wiring stay owned by the component.

| Framework | API form |
|-----------|----------|
| React | `renderItem?: (item, state) => ReactNode` prop |
| Vue | `<slot name="item" :item="..." :is-selected="..." />` |
| Svelte | `renderItem?: Snippet<[{ item, isSelected, onclick }]>` |

The cross-framework concept is identical — give the consumer the item
data plus the selection state and let them return a node — only the
binding form differs to honor each framework's slot idiom.

## State Management Equivalence

Each framework exposes equivalent state primitives under its idiomatic naming.

| React (`hooks/`) | Vue (`composables/`) | Svelte (`runes/`) |
|------------------|----------------------|--------------------|
| `useVizelEditor` | `useVizelEditor` | `createVizelEditor` |
| `useVizelState` | `useVizelState` | `createVizelState` |
| `useVizelEditorState` | `useVizelEditorState` | `createVizelEditorState` |
| `useVizelAutoSave` | `useVizelAutoSave` | `createVizelAutoSave` |
| `useVizelMarkdown` | `useVizelMarkdown` | `createVizelMarkdown` |
| `useVizelTheme` | `useVizelTheme` | `getVizelTheme` |
| `useVizelContext` | `useVizelContext` | `getVizelContext` |
| `useVizelIconContext` | `useVizelIconContext` | `getVizelIconContext` |
| `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` | `createVizelSlashMenuRenderer` |
| `createVizelMentionMenuRenderer` | `createVizelMentionMenuRenderer` | `createVizelMentionMenuRenderer` |
| `useVizelCollaboration` | `useVizelCollaboration` | `createVizelCollaboration` |
| `useVizelComment` | `useVizelComment` | `createVizelComment` |
| `useVizelVersionHistory` | `useVizelVersionHistory` | `createVizelVersionHistory` |

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

### Return Type Equivalence

| React | Vue | Svelte |
|-------|-----|--------|
| `Editor \| null` | `ShallowRef<Editor \| null>` | `{ get current(): Editor \| null }` |

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
| `Editor \| null` (`useVizelContext()` throws outside a provider; `useVizelContextSafe()` returns `null` both outside a provider and while the provider's editor is still `null`) | `ShallowRef<Editor \| null>` (both `useVizelContext()` and `useVizelContextSafe()`; the safe variant returns `null` outside a provider) | `{ get current(): Editor \| null }` |

## Context API Equivalence

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

## Suggestion Menu Ref Convention

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

## Reactive vs Mount-time Editor Options

`useVizelEditor` / `createVizelEditor` create the Tiptap instance once on
mount. Most options (`initialContent`, `initialMarkdown`, `placeholder`,
`features`, `extensions`, `flavor`, `locale`, `autofocus`) are captured at
that point and cannot be changed via prop updates.

The single exception is `editable`, which all three frameworks mirror through
`editor.setEditable()` whenever the prop changes after mount. Toggle this to
switch the editor between read-write and read-only modes.

To change other options at runtime, use the corresponding Tiptap command
(`editor.commands.setContent(...)`, `editor.commands.focus(...)`, etc.).

## State Subscription Convention

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
3. Verify props, options, and return types match across frameworks.
4. Update each demo app to exercise the feature.
5. Add Playwright Component Tests with shared scenarios under `tests/ct/scenarios/`.
6. Run `pnpm typecheck && pnpm build && pnpm test:ct`.
