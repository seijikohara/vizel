# Migration: v1 to v2

Vizel v2 abandons the symmetric API contract that v1 enforced across React, Vue, and Svelte. Each adapter now delivers the framework's native idiom. Feature parity holds across the three packages, but the surface that exposes each feature differs.

This guide enumerates every breaking change with side-by-side v1 / v2 code samples for all three frameworks. Apply the sections in order — later sections assume earlier ones are already resolved. The motivating Architecture Decision Records (ADRs) are linked inline.

::: tip Why a clean break
v2 ships no compatibility shim. The maintainer's directive prioritises a coherent surface over deprecation cycles. [ADR-0005](/adr/ADR-0005-v2-breaking-release) records the decision. v1.x stays on npm at its published versions and receives no further patches.
:::

## At a glance

| Section | Change | ADR |
|---------|--------|-----|
| [1](#_1-the-cross-framework-symmetry-contract-retires) | Cross-framework symmetry retires; parity moves to a typed manifest | [ADR-0001](/adr/ADR-0001-feature-parity-over-api-symmetry), [ADR-0002](/adr/ADR-0002-feature-manifest-as-parity-ssot) |
| [2](#_2-editor-lifecycle-returns-the-editor-directly) | Editor lifecycle hooks return the editor directly | [ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api), [ADR-0009](/adr/ADR-0009-first-party-editor-reactivity) |
| [3](#_3-usevizeleditorstate-becomes-a-selector-subscription) | `useVizelEditorState` becomes a selector subscription | [ADR-0009](/adr/ADR-0009-first-party-editor-reactivity) |
| [4](#_4-bubble-menu-slash-menu-and-mention-menu-adopt-render-prop-idioms) | Bubble menu, slash menu, and mention menu adopt render-prop idioms | [ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api) |
| [5](#_5-link-editor-find-replace-and-color-picker-restructure) | Link editor, find-replace, and color picker restructure | [ADR-0007](/adr/ADR-0007-component-size-and-controller-delegation) |
| [6](#_6-theme-provider-and-theme-hooks) | Theme provider exposes `resetToSystem`; theme hooks reshape | [ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api) |
| [7](#_7-auto-save-shapes) | Auto-save composables adopt framework-native return shapes | [ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api) |
| [8](#_8-vizel-headless-becomes-a-transitive-dependency) | `@vizel/headless` becomes a transitive dependency | [ADR-0003](/adr/ADR-0003-vizel-headless-package) |
| [9](#_9-css-centralises-in-vizel-core) | CSS centralises in `@vizel/core`; adapters re-export | [ADR-0008](/adr/ADR-0008-css-belongs-in-core) |
| [10](#_10-controllers-replace-direct-dom-listeners) | Controllers replace direct DOM listeners | [ADR-0007](/adr/ADR-0007-component-size-and-controller-delegation) |
| [11](#_11-the-slash-menu-adopts-the-unified-vizelcommand-registry) | The slash menu adopts the unified `VizelCommand` registry; legacy slash-item exports are removed | [ADR-0005](/adr/ADR-0005-v2-breaking-release) |

---

## 1. The cross-framework symmetry contract retires

v1 enforced API symmetry across the three adapters through `.claude/rules/cross-framework.md` (472 lines of prose). Every component prop, hook name, return shape, and event payload had to mirror across React, Vue, and Svelte. The contract prevented each framework from using its native idiom.

v2 replaces the prose contract with a typed feature manifest at `packages/core/src/feature-manifest.ts`. The manifest lists every advertised feature and the symbol each adapter exports. CI runs `pnpm check:feature-parity` against the manifest before any test executes.

### What changes for consumers

- Hook, composable, and rune signatures diverge per framework. Each adapter now reads like idiomatic React 19, Vue 3.5, or Svelte 5 code.
- Component prop shapes diverge where the framework's slot or callback idiom differs. The feature set is identical.
- Cross-framework navigation goes through the migration guide, the manifest, and the per-framework guides — not through a single symmetric reference.

[ADR-0001](/adr/ADR-0001-feature-parity-over-api-symmetry) records the decision. [ADR-0002](/adr/ADR-0002-feature-manifest-as-parity-ssot) records the manifest design. [ADR-0006](/adr/ADR-0006-retire-cross-framework-rule) retires the prose rule.

---

## 2. Editor lifecycle returns the editor directly

v1 returned a destructured-getter wrapper around the editor instance. The wrapper added indirection that React, Vue, and Svelte each absorbed differently. v2 returns the editor in the shape each framework already expects.

[ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api) records the idiomatic API contract. [ADR-0009](/adr/ADR-0009-first-party-editor-reactivity) records the first-party reactivity primitive each adapter now ships.

### React: `useVizelEditor` returns `Editor | null`

The hook *is* the value. Drop the `{ current }` destructure.

#### Before (v1)

```tsx
import { useVizelEditor } from "@vizel/react";

function Editor() {
  // v1 wrapped the editor inside a getter object.
  const { current: editor } = useVizelEditor({
    placeholder: "Start typing...",
  });

  return <VizelEditor editor={editor} />;
}
```

#### After (v2)

```tsx
import { useVizelEditor, VizelEditor } from "@vizel/react";

function Editor() {
  // v2 returns the editor directly. `Editor | null` matches the React
  // idiom where the hook value flows straight into the component.
  const editor = useVizelEditor({
    placeholder: "Start typing...",
  });

  return <VizelEditor editor={editor} />;
}
```

### Vue: `useVizelEditor` returns `ShallowRef<Editor | null>`

The composable returns a `ShallowRef` so templates read `.value` once. The first-party reactivity primitive lives in `packages/vue/src/_reactivity.ts` and uses `shallowRef` plus `onScopeDispose`-bound listeners.

#### Before (v1)

```vue
<script setup lang="ts">
import { useVizelEditor } from "@vizel/vue";

const { current: editor } = useVizelEditor({
  placeholder: "Start typing...",
});
</script>

<template>
  <VizelEditor :editor="editor" />
</template>
```

#### After (v2)

```vue
<script setup lang="ts">
import { useVizelEditor, VizelEditor } from "@vizel/vue";

// `editor` is a ShallowRef<Editor | null>. Read `.value` in script,
// or pass the ref straight into templates — Vue unwraps top-level refs.
const editor = useVizelEditor({
  placeholder: "Start typing...",
});
</script>

<template>
  <VizelEditor :editor="editor" />
</template>
```

### Svelte: `createVizelEditor` returns `{ readonly current: Editor | null }`

The rune holds the editor in `$state.raw<Editor | null>` and exposes a `current` getter. Re-assignment triggers reactivity; field mutation does not, which matches Tiptap's mutable `Editor` instance.

#### Before (v1)

```svelte
<script lang="ts">
import { createVizelEditor, VizelEditor } from "@vizel/svelte";

// v1 returned the same wrapper shape that React and Vue consumed.
const { current: editor } = createVizelEditor({
  placeholder: "Start typing...",
});
</script>

<VizelEditor editor={editor} />
```

#### After (v2)

```svelte
<script lang="ts">
import { createVizelEditor, VizelEditor } from "@vizel/svelte";

// The rune returns a reactive accessor. Read `.current` inside templates
// or reactive scopes ($derived, $effect) so the read registers as a
// dependency.
const editor = createVizelEditor({
  placeholder: "Start typing...",
});
</script>

<VizelEditor editor={editor.current} />
```

---

## 3. `useVizelEditorState` becomes a selector subscription

v1 derived a fixed-shape state record (`{ characterCount, wordCount, canUndo, ... }`) and re-rendered on every transaction. The shape forced every consumer through the same recompute path even when the consumer cared about a single boolean.

v2 turns the hook into a selector subscription. The consumer picks the slice; the hook re-renders only when the slice changes. The hook reads the editor from the surrounding `VizelProvider` automatically — pass no editor argument.

[ADR-0009](/adr/ADR-0009-first-party-editor-reactivity) records the first-party reactivity contract. React uses `useSyncExternalStore`; Vue uses `shallowRef` plus `onScopeDispose`; Svelte uses `$state.raw` plus `createSubscriber`.

### React

#### Before (v1)

```tsx
import { useVizelEditorState } from "@vizel/react";

function StatusBar({ editor }: { editor: Editor | null }) {
  // v1: pass the editor, receive the full shape every render.
  const { characterCount, wordCount } = useVizelEditorState(editor);

  return (
    <div>
      <span>{characterCount} characters</span>
      <span>{wordCount} words</span>
    </div>
  );
}
```

#### After (v2)

```tsx
import { shallowEqualObject, useVizelEditorState } from "@vizel/react";

function StatusBar() {
  // Selector reads the slice; equalityFn suppresses re-renders when
  // the slice is structurally unchanged. The editor comes from the
  // surrounding <VizelProvider>; no argument is passed.
  const stats = useVizelEditorState(
    (editor) => ({
      characterCount: editor?.storage.characterCount?.characters() ?? 0,
      wordCount: editor?.storage.characterCount?.words() ?? 0,
    }),
    { equalityFn: shallowEqualObject },
  );

  return (
    <div>
      <span>{stats.characterCount} characters</span>
      <span>{stats.wordCount} words</span>
    </div>
  );
}
```

### Vue

The Vue composable returns a `ComputedRef<T>` whose value re-evaluates on every transaction the selector observes.

#### Before (v1)

```vue
<script setup lang="ts">
import { useVizelEditorState } from "@vizel/vue";

const props = defineProps<{ editor: Editor | null }>();
const state = useVizelEditorState(() => props.editor);
</script>

<template>
  <div>
    <span>{{ state.characterCount }} characters</span>
    <span>{{ state.wordCount }} words</span>
  </div>
</template>
```

#### After (v2)

```vue
<script setup lang="ts">
import { shallowEqualObject, useVizelEditorState } from "@vizel/vue";

// Selector receives a typed snapshot; the editor is injected from the
// surrounding <VizelProvider>. The return is a ComputedRef<T>.
const stats = useVizelEditorState(
  ({ editor }) => ({
    characterCount: editor?.storage.characterCount?.characters() ?? 0,
    wordCount: editor?.storage.characterCount?.words() ?? 0,
  }),
  { equalityFn: shallowEqualObject },
);
</script>

<template>
  <div>
    <span>{{ stats.characterCount }} characters</span>
    <span>{{ stats.wordCount }} words</span>
  </div>
</template>
```

### Svelte

The Svelte rune returns `{ readonly current: VizelEditorState }`. The implementation uses `$state.raw` plus the rune system; `createSubscriber` from `svelte/reactivity` hooks `editor.on('transaction')` once and registers the dependency through the compiler's tracking. The call site keeps the v1 getter form — reactivity flows through `.current` because Svelte 5 tracks reads, not selector arguments.

#### Before (v1)

```svelte
<script lang="ts">
import { createVizelEditorState } from "@vizel/svelte";

let { editor }: { editor: Editor | null } = $props();
// v1 returned an eager VizelEditorState object on every transaction.
const state = createVizelEditorState(() => editor);
</script>

<div>
  <span>{state.current.characterCount} characters</span>
  <span>{state.current.wordCount} words</span>
</div>
```

#### After (v2)

```svelte
<script lang="ts">
import { createVizelEditorState } from "@vizel/svelte";

let { editor }: { editor: Editor | null } = $props();

// v2 keeps the getter form. Read the slice you care about inside the
// template — the rune system only re-evaluates the bound expressions,
// so React-style equalityFn knobs do not ship on the Svelte rune.
const state = createVizelEditorState(() => editor);
</script>

<div>
  <span>{state.current.characterCount} characters</span>
  <span>{state.current.wordCount} words</span>
</div>
```

::: info Why no `equalityFn` on Svelte
React and Vue selectors recompute on every transaction; an `equalityFn` short-circuits the consequent re-render. Svelte 5's compiler tracks reads through the rune system, so only the bound expressions re-evaluate. The selector contract collapses into the template binding itself.
:::

---

## 4. Bubble menu, slash menu, and mention menu adopt render-prop idioms

v1 forced render customisation through a `renderItem` callback prop in every framework. v2 honours each framework's native render-prop idiom: React render-prop callback props (`bubbleMenuContent`, `toolbarContent`, `renderItem`), Vue scoped slots, Svelte snippets.

The container's keyboard handling, ARIA wiring, and dismissal logic stay owned by the component. Consumers only swap the per-item or per-section markup.

### React: callback render-props

React 19 keeps `children` as `ReactNode` for layout composition. v2 exposes per-item rendering through a dedicated `renderItem` callback prop that receives a typed argument object (`{ item, isSelected, onClick }`), mirroring how `bubbleMenuContent` and `toolbarContent` already work on the top-level `Vizel` component.

#### Before (v1)

```tsx
import { VizelSlashMenu } from "@vizel/react";

<VizelSlashMenu
  items={items}
  onSelect={handleSelect}
  // v1 separated the rendering state into a second positional argument.
  renderItem={(item, state) => (
    <div className={state.isSelected ? "active" : ""}>
      <CustomIcon name={item.id} />
      <span>{item.title}</span>
    </div>
  )}
/>
```

#### After (v2)

```tsx
import { VizelSlashMenu } from "@vizel/react";

<VizelSlashMenu
  items={items}
  onSelect={handleSelect}
  // v2 collapses the arguments into a single typed object so the React
  // signature mirrors Vue's scoped-slot props and Svelte's snippet args.
  renderItem={({ item, isSelected, onClick }) => (
    <button type="button" data-active={isSelected} onClick={onClick}>
      <CustomIcon name={item.id} />
      <span>{item.title}</span>
    </button>
  )}
/>
```

### Vue: scoped slots

#### Before (v1)

```vue
<script setup lang="ts">
import { VizelSlashMenu } from "@vizel/vue";

const renderItem = (item, state) => /* ... */;
</script>

<template>
  <VizelSlashMenu
    :items="items"
    :render-item="renderItem"
    @select="handleSelect"
  />
</template>
```

#### After (v2)

```vue
<script setup lang="ts">
import { VizelSlashMenu } from "@vizel/vue";
</script>

<template>
  <VizelSlashMenu :items="items" @select="handleSelect">
    <template #item="{ item, isSelected, onClick }">
      <!-- Scoped slot is the Vue-native render-prop equivalent. -->
      <button type="button" :data-active="isSelected" @click="onClick">
        <CustomIcon :name="item.id" />
        <span>{{ item.title }}</span>
      </button>
    </template>
  </VizelSlashMenu>
</template>
```

### Svelte: snippets

#### Before (v1)

```svelte
<script lang="ts">
import { VizelSlashMenu } from "@vizel/svelte";
</script>

<VizelSlashMenu
  items={items}
  onSelect={handleSelect}
  renderItem={(item, state) => /* awkward inline function */ ''}
/>
```

#### After (v2)

```svelte
<script lang="ts">
import { VizelSlashMenu } from "@vizel/svelte";
</script>

<VizelSlashMenu items={items} onselect={handleSelect}>
  {#snippet item({ item, isSelected, onclick })}
    <!-- Svelte 5 snippets read like template literals; lowercase
         `onselect` / `onclick` follow the DOM attribute convention. -->
    <button type="button" data-active={isSelected} {onclick}>
      <CustomIcon name={item.id} />
      <span>{item.title}</span>
    </button>
  {/snippet}
</VizelSlashMenu>
```

The same shape applies to `VizelBubbleMenu` (children render the menu body) and `VizelMentionMenu` (per-item render seam).

---

## 5. Link editor, find-replace, and color picker restructure

The three popover components shrank below the 120-line view-template budget that [ADR-0007](/adr/ADR-0007-component-size-and-controller-delegation) sets. Form state moved into Core; the framework code only renders the spec.

### `VizelLinkEditor`

- The `onClose` callback renames to `onclose` in Svelte (lowercase DOM-event convention) and becomes a `close` emit in Vue.
- The embed toggle is now part of the form spec; consumers cannot inject a custom embed toggle.

#### Before (v1)

```tsx
// React
<VizelLinkEditor editor={editor} onClose={handleClose} enableEmbed />
```

```vue
<!-- Vue -->
<VizelLinkEditor :editor="editor" @close="handleClose" enable-embed />
```

```svelte
<!-- Svelte -->
<VizelLinkEditor editor={editor} onClose={handleClose} enableEmbed />
```

#### After (v2)

```tsx
// React: prop name unchanged.
<VizelLinkEditor editor={editor} onClose={handleClose} enableEmbed />
```

```vue
<!-- Vue: emit form unchanged. -->
<VizelLinkEditor :editor="editor" @close="handleClose" enable-embed />
```

```svelte
<!-- Svelte: lowercase event prop. -->
<VizelLinkEditor editor={editor} onclose={handleClose} enableEmbed />
```

### `VizelFindReplace`

The component now reads the editor from the surrounding provider when the `editor` prop is omitted. The find-replace extension still requires explicit registration:

```ts
import { createVizelFindReplaceExtension } from "@vizel/<framework>";

const extensions = [createVizelFindReplaceExtension()];
```

The keyboard map (Cmd/Ctrl+F to open, Esc to close) now lives in the controller; consumers no longer wire global listeners.

### `VizelColorPicker`

- `onchange` (lowercase) in Svelte.
- `recentColors` is a controlled prop; the component no longer reads `localStorage` internally.

#### Svelte before / after

```svelte
<!-- v1 -->
<VizelColorPicker
  colors={colors}
  value={color}
  onChange={handleChange}
/>

<!-- v2 -->
<VizelColorPicker
  colors={colors}
  value={color}
  onchange={handleChange}
/>
```

---

## 6. Theme provider and theme hooks

The theme APIs now expose a single resolved theme plus a dedicated `resetToSystem()` method. v1's overloaded `setTheme("system")` is gone — the type system rejects it. The `theme` field always carries a concrete `VizelResolvedTheme` (`"light" | "dark"`), never `"system"`.

### React

#### Before (v1)

```tsx
import { useVizelTheme } from "@vizel/react";

function ThemeToggle() {
  const { theme, setTheme } = useVizelTheme();
  return (
    <>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("system")}>System</button>
    </>
  );
}
```

#### After (v2)

```tsx
import { useVizelTheme } from "@vizel/react";

function ThemeToggle() {
  // `theme` is `VizelResolvedTheme` ("light" | "dark"); `setTheme`
  // accepts only concrete values. Switching back to the OS preference
  // calls `resetToSystem`.
  const { theme, setTheme, resetToSystem } = useVizelTheme();
  return (
    <>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={resetToSystem}>System</button>
    </>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { useVizelTheme } from "@vizel/vue";

// `theme` is a ComputedRef<VizelResolvedTheme>. Read `theme.value` in
// script, or `{{ theme }}` in templates (Vue auto-unwraps refs).
const { theme, setTheme, resetToSystem } = useVizelTheme();
</script>

<template>
  <button @click="setTheme('light')">Light</button>
  <button @click="setTheme('dark')">Dark</button>
  <button @click="resetToSystem">System</button>
</template>
```

### Svelte

```svelte
<script lang="ts">
import { getVizelTheme } from "@vizel/svelte";

// `theme.current` is the resolved value; `setTheme` and
// `resetToSystem` mirror React and Vue.
const theme = getVizelTheme();
</script>

<button onclick={() => theme.setTheme("light")}>Light</button>
<button onclick={() => theme.setTheme("dark")}>Dark</button>
<button onclick={theme.resetToSystem}>System</button>
```

`VizelThemeProvider` props stay the same: `defaultTheme`, `storageKey`, `targetSelector`, `disableTransitionOnChange`.

---

## 7. Auto-save shapes

The auto-save composable still accepts the same options (`debounceMs`, `storage`, `key`, `onSave`, `onError`). The return shape adopts each framework's native primitive type.

| Framework | v1 return shape | v2 return shape |
|-----------|----------------|-----------------|
| React | `{ status, hasUnsavedChanges, lastSaved, error, save, restore }` (snapshot on render) | Same — React snapshots on every render, no change |
| Vue | Eager object | Per-field `ComputedRef` (read `.value` in script, auto-unwrapped in templates) |
| Svelte | Eager object | Rune-getter object (`status`, `lastSaved` etc. are getters) |

### Vue change

```vue
<script setup lang="ts">
import { useVizelAutoSave, useVizelEditor } from "@vizel/vue";

const editor = useVizelEditor();

// v2 returns { status: ComputedRef, hasUnsavedChanges: ComputedRef, ... }.
// Read `.value` in script; templates auto-unwrap.
const { status, lastSaved, save, restore } = useVizelAutoSave(
  () => editor.value,
  { debounceMs: 2000, storage: "localStorage", key: "vizel-demo" },
);
</script>

<template>
  <VizelSaveIndicator :status="status" :last-saved="lastSaved" />
</template>
```

### Svelte change

```svelte
<script lang="ts">
import { createVizelAutoSave, createVizelEditor } from "@vizel/svelte";

const editor = createVizelEditor();

// v2 returns { readonly status, readonly lastSaved, save, restore, ... }.
// Read the getters directly inside templates.
const autoSave = createVizelAutoSave(() => editor.current, {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo",
});
</script>

<VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
```

---

## 8. `@vizel/headless` becomes a transitive dependency

v2 introduces `@vizel/headless`, a framework-neutral package that hosts the dismissable layer, popover positioning, combobox keyboard map, focus trap, and floating positioning. Each adapter package declares `@vizel/headless` as a *dependency* (not a peer dependency) so consumers never import from it directly.

[ADR-0003](/adr/ADR-0003-vizel-headless-package) records the package decision.

### Consumer impact

- Add no entry for `@vizel/headless` to `package.json`. The framework adapter pulls it in transitively.
- Tree-shake-friendly: each primitive is exported from its own subpath; framework adapters import only the primitives they need.
- 21 v1 violations of "no `document.addEventListener` inside framework components" collapse to zero because the listeners now live in `dismissable/` controllers under `@vizel/headless`.

If your build tool surfaces transitive dependencies during dedup (pnpm's `pnpm.overrides`, npm's `overrides`), pin `@vizel/headless` alongside the framework package to keep major versions aligned.

---

## 9. CSS centralises in `@vizel/core`

v1 shipped CSS per adapter. Each `@vizel/<framework>/styles.css` duplicated the token catalogue. A token edit required three coordinated changes.

v2 keeps the consumer import unchanged but resolves it to a single source. Every adapter's `package.json` declares an `exports."./styles.css"` entry that re-exports `@vizel/core/styles.css`.

[ADR-0008](/adr/ADR-0008-css-belongs-in-core) records the decision.

### Consumer impact

The import statement does not change:

```ts
// All three frameworks — unchanged from v1.
import "@vizel/react/styles.css";
import "@vizel/vue/styles.css";
import "@vizel/svelte/styles.css";
```

The CSS now ships under exactly two top-level selectors plus the `prefers-color-scheme: dark` fallback:

- `:root, [data-vizel-theme="light"]`
- `[data-vizel-theme="dark"]`
- `@media (prefers-color-scheme: dark)` fallback for unset themes

Host-environment selectors (`.dark`, `.light`, `[data-theme="*"]`) remain banned. Integrate host theming by setting `data-vizel-theme` on a wrapper element. Vizel never reads host theme attributes.

If you wrote v1 overrides that targeted `[data-theme="dark"]` directly inside Vizel, switch them to `[data-vizel-theme="dark"]`. The host-theme bridge lives in your application code now.

---

## 10. Controllers replace direct DOM listeners

[ADR-0007](/adr/ADR-0007-component-size-and-controller-delegation) bans `document.addEventListener`, `window.addEventListener`, `MutationObserver`, and `ResizeObserver` calls inside `packages/{react,vue,svelte}/src/`. CI fails the build when the grep check finds one.

### Consumer impact

The consumer-facing API does not change — the controllers run inside the components. The contract matters if you extend Vizel with a custom bubble-menu replacement or a custom popover:

- Import the relevant controller from `@vizel/core/controllers/` or `@vizel/headless/`.
- Mount it inside the framework's lifecycle hook (`useEffect`, `onMounted`, `$effect`).
- Unmount it in the cleanup return.

Example with the `dismissable` controller from `@vizel/headless`:

```ts
import { createDismissableController } from "@vizel/headless/dismissable";

// Inside a React useEffect, Vue onMounted, or Svelte $effect:
const controller = createDismissableController({
  onDismiss: closeMenu,
});
controller.mount(menuElement);
// Cleanup:
return () => controller.unmount();
```

The controller owns the outside-click listener, the Escape-key handler, and the focus return. The framework code stays inside the 120-line view-template budget [ADR-0007](/adr/ADR-0007-component-size-and-controller-delegation) records.

---

## 11. The slash menu adopts the unified `VizelCommand` registry

v2 ships a single runtime-bearing `VizelCommand` type that defines one user action across every surface (slash menu, toolbar, bubble menu, block menu, keyboard shortcut). The slash menu now consumes the slash-surfaced subset of `vizelDefaultCommands` instead of the legacy `SlashCommandItem` list. [ADR-0005](/adr/ADR-0005-v2-breaking-release) authorises the removal of the legacy public exports as a breaking change.

### Removed public exports

The following symbols no longer exist on `@vizel/core` (or any adapter that re-exports it). Each had a dual-system replacement that v2 keeps as the single path:

| Removed export | Replacement |
|----------------|-------------|
| `createVizelSlashCommands(locale)` | `vizelDefaultCommands` / `vizelDefaultSlashMenuCommands` — locale-aware `VizelCommand[]` whose `label` / `description` are locale thunks |
| `vizelDefaultSlashCommands` | `vizelDefaultSlashMenuCommands` (the slash-surfaced subset) |
| `vizelDefaultGroupOrder` | The `groupOrder` option on the slash builder; the default order lives inside `buildVizelSlashMenuSpecFromCommands` |
| `VizelSlashItemView` | `VizelCommandSpec` — the derived view shape the menu renders |
| `buildVizelSlashMenuSpec(items, selectedIndex, options)` | `buildVizelSlashMenuSpecFromCommands(commands, { editor, locale, query, selectedIndex, ... })` |
| `VizelSlashCommandItem` (type) | `VizelCommand` (runtime) and `VizelCommandSpec` (view) |

The auxiliary helpers `createVizelSlashGroupOrder`, `filterVizelSlashCommands`, `searchVizelSlashCommands`, `groupVizelSlashCommands`, `flattenVizelSlashCommandGroups`, and the `VizelSlashCommandGroup` / `VizelSlashCommandRange` / `VizelSlashCommandSearchResult` types are removed with the same change; filtering and grouping now live inside `buildVizelSlashMenuSpecFromCommands`.

### The slash-menu feature option renames `items` to `commands`

The `features.interaction.slashMenu` option no longer accepts `items`. Pass a `VizelCommand[]` through `commands` instead.

#### Before (v1)

```ts
import { useVizelEditor } from "@vizel/react";
import { createVizelSlashCommands } from "@vizel/core";

const editor = useVizelEditor({
  features: {
    interaction: {
      slashMenu: { items: createVizelSlashCommands(locale) },
    },
  },
});
```

#### After (v2)

```ts
import { useVizelEditor } from "@vizel/react";
import { vizelDefaultCommands } from "@vizel/core";

const editor = useVizelEditor({
  features: {
    interaction: {
      // `commands` defaults to the slash-surfaced subset of
      // `vizelDefaultCommands`; pass your own `VizelCommand[]` to override.
      slashMenu: { commands: vizelDefaultCommands },
    },
  },
});
```

### Custom slash items move from `title` to `label`

The slash menu renders `VizelCommandSpec` items. A custom `renderItem` (Section 4) receives `item.label`, `item.description`, `item.icon`, and `item.shortcut` instead of the legacy `item.title`. The shortcut is a `VizelShortcutSpec` (`{ mac, other }`); render it with `formatVizelShortcut`, which selects the platform string automatically.

---

## Reading order

After applying the migration:

1. Read the per-framework getting-started page that matches your codebase: [React](/guide/getting-started-react), [Vue](/guide/getting-started-vue), or [Svelte](/guide/getting-started-svelte).
2. Read [ADR-0001](/adr/ADR-0001-feature-parity-over-api-symmetry) for the parity-over-symmetry rationale.
3. Read [ADR-0004](/adr/ADR-0004-per-framework-idiomatic-api) for the per-framework idiom contract.
4. Read [ADR-0009](/adr/ADR-0009-first-party-editor-reactivity) for the reactivity primitive details.

---

## Need help?

Open an issue at [github.com/seijikohara/vizel/issues](https://github.com/seijikohara/vizel/issues). Attach the v1 snippet, the v2 form you tried, and the error or behaviour you observe. A resolved `VizelError` (`code`, `context`, `cause`) speeds the diagnosis.
