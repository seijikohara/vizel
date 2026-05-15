# Changelog

All notable changes to Vizel are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-15

This release is the v2.x rework that aligns React, Vue, and Svelte adapters
around a shared, framework-agnostic core. Behavior remains backwards-compatible
for first-party consumers; the breaking changes listed below only affect
power users who reach into low-level menu refs or call certain framework
context APIs by hand.

### Breaking changes

- **Menu refs.** `VizelSlashMenuRef.onKeyDown` and `VizelMentionMenuRef.onKeyDown`
  now accept a raw `KeyboardEvent` instead of the `{ event }` wrapper. The
  Tiptap `SuggestionOptions.onKeyDown` contract is unchanged; only the
  component ref surface is unified.
  ```diff
  - menuRef.current.onKeyDown({ event })
  + menuRef.current.onKeyDown(event)
  ```
- **Svelte context.** `getVizelContext()` / `getVizelContextSafe()` now return
  a `VizelContextAccessor` (`{ readonly current: Editor | null }`) instead of
  a bare `() => Editor | null` getter function. This matches the documented
  cross-framework rule and aligns with how `$state` runes surface values.
  ```diff
  - const editor = getVizelContext()();
  + const editor = getVizelContext().current;
  ```
- **Invalid editor configuration.** Supplying both `initialContent` and
  `initialMarkdown` to `createVizelEditorInstance` now throws a `VizelError`
  with the new `INVALID_CONFIG` code (previously it logged a `console.warn`
  and silently fell back to `initialMarkdown`). Programming errors fail
  loudly so the misuse is caught on first run.

### Added

- `@vizel/core/interactions/` module exposing framework-agnostic state-machine
  and event-subscription primitives:
  - `createVizelEditorTransactionStore(getEditor)` — `{ subscribe, getVersion }`
    store backing `useVizelState` / `createVizelState` across React, Vue, Svelte.
  - `createVizelDismissibleController({ getElements, onDismiss })` — owns the
    outside-click + Escape dismissal listeners with a disposer.
  - `resolveVizelListNavigation` / `resolveVizelGridNavigation` — pure
    keyboard-navigation resolvers (ArrowUp / ArrowDown / Home / End wrap and
    2D grid traversal).
  - `createVizelEditorSubscription({ getEditor, event, handler })` — one-line
    Tiptap editor event listener with clean disposer.
- `mountVizelEditorView(editor, container)` — appends `view.dom` to a
  container element, sets the editable getter, and returns a disposer.
  Replaces the three-step pattern hand-written by every framework's
  `VizelEditor` component.
- `createVizelRelativeTimeTicker({ getDate, getLocale, onTick })` and
  `resolveVizelSaveIndicatorView(status, locale, lastSaved, relativeTime, showTimestamp)` —
  pure helpers consumed by `VizelSaveIndicator` in all three frameworks.
- `applyVizelColorToEditor(editor, type, color)` — single-call color apply
  routing (textColor vs highlight, with `"inherit"` / `"transparent"`
  remove sentinels).
- `loadVizelEmbedScripts(container, provider?)` and
  `resolveVizelEmbedView(data) → VizelEmbedViewModel` — embed script
  re-parenting plus a discriminated union view-model resolver.
- `resolveVizelFindReplaceLabels(locale)` — shared label resolver consumed
  by the React, Vue, and Svelte `VizelFindReplace` components.
- `createVizelBubbleMenuActions(locale)` + `filterVizelBubbleMenuActions` +
  `groupVizelBubbleMenuActions` + `vizelDefaultBubbleMenuActions` —
  bubble-menu action list, mirroring the existing toolbar-actions shape.
- `@vizel/core/skeletons/` module exposing declarative UI scaffolding
  for the menu and form components. Each framework's component is now a
  thin transformer that maps the spec to its native template:
  - `VizelMenuSpec<TData>` — generic spec describing root container ARIA,
    sections (optionally headed), and per-item attrs (`role`, `id`,
    `aria-selected`, `aria-haspopup`, `aria-expanded`, `tabIndex`).
  - `buildVizelMentionMenuSkeleton(items, selectedIndex, locale)` —
    flat listbox spec for `@vizel/{react,vue,svelte}` `VizelMentionMenu`.
  - `buildVizelSlashMenuSkeleton(items, selectedIndex, options)` +
    `getNextVizelSlashMenuGroupIndex(spec, currentIndex)` — grouped
    listbox spec for `VizelSlashMenu` plus the Tab-to-next-group
    navigation helper.
  - `buildVizelBlockMenuSkeleton(actions, turnIntoOptions, showTurnInto,
    locale)` — main menu + submenu trigger + submenu spec for
    `VizelBlockMenu`.
  - `buildVizelToolbarDropdownSkeleton(dropdown, editor, isOpen,
    focusedIndex)` — trigger + listbox-popover spec for
    `VizelToolbarDropdown`.
  - `buildVizelNodeSelectorSkeleton(editor, nodeTypes, isOpen,
    focusedIndex, locale)` — trigger + listbox-popover spec for
    `VizelNodeSelector` with active-node-type detection and locale-aware
    aria-label template.
  - `resolveVizelLinkEditorLabels(locale)` +
    `buildVizelLinkEditorViewState(editor, url, enableEmbed)` +
    `applyVizelLinkEdit(editor, params, canEmbed)` — labels, derived
    visibility flags, and the chain-command apply logic for
    `VizelLinkEditor`.
  - `buildVizelFindReplaceViewState(state, noResultsLabel)` and
    `buildVizelFindReplaceViewStateFromLocale(state, locale)` — derived
    match-counter / replace-mode / disabled flags for `VizelFindReplace`.

### Changed

- **Vue / Svelte `useVizelEditor` / `createVizelEditor`** now mirror the
  `editable` prop through `editor.setEditable()` when it changes after
  mount (previously React-only).
- **Markdown sync runtime.** `useVizelMarkdown` in React and Vue now flush
  any pending debounced markdown export before detaching from an editor,
  matching the Svelte rune. Editor swaps and unmount no longer drop
  unsynced markdown.
- **Vue / Svelte `VizelProvider`** always emit the `vizel-root` class on
  their wrapper element so the CSS variable scope (`.vizel-root { --vizel-* }`)
  applies consistently with React.
- **Svelte `VizelPortal`** migrates from a `use:portal` action (whose
  closure captured `layer` / `className` at action creation) to a
  `$effect`-based mount/attribute pair so prop changes propagate to the
  wrapper element.
- **Svelte `VizelBubbleMenu`** reads `shouldShow` with `untrack(...)` so
  value updates flow through the wrapper closure without re-registering
  the Tiptap plugin (matches the React `shouldShowRef` pattern).
- **Vue `useVizelComment`** drops a dead options watcher and replaces the
  `onMounted` + non-immediate watch split with a single
  `watch(getEditor, ..., { immediate: true })`.
- **Svelte `createVizelCollaboration`** no longer recreates handlers on
  the `null → null` provider transition.
- **Vue `VizelThemeProvider`** watches all three inputs (`resolvedTheme`,
  `targetSelector`, `disableTransitionOnChange`) and re-applies the theme
  on any change.
- **Vue `Vizel.vue`** memoizes its locale-bound props object so child
  toolbars / bubble-menus / block-menus no longer see a fresh identity
  each render.
- **React `VizelBlockMenu`** group key strategy aligned with Vue / Svelte
  (`groupIndex` instead of `group[0]?.group`).
- **MentionMenu accessibility.** Each framework's `VizelMentionMenu`
  container now declares `role="listbox"`, `aria-label`, and
  `aria-activedescendant`, with stable `id`s on each option.
- **Bubble-menu defaults.** Each framework's `VizelBubbleMenuDefault`
  collapses from ~150 lines of repeated buttons to an iteration over the
  shared `createVizelBubbleMenuActions(locale)` list.
- **UI skeletonization.** The DOM scaffolding for `VizelMentionMenu`,
  `VizelSlashMenu`, `VizelBlockMenu`, `VizelToolbarDropdown`,
  `VizelNodeSelector`, `VizelLinkEditor`, and `VizelFindReplace` is now
  declared in `@vizel/core/skeletons/`. Each framework component is a
  thin transformer that maps the spec to its native template instead of
  duplicating ARIA wiring, identifier schemes, and view-state
  derivations three times.

### Fixed

- **Vue `VizelSlashMenu` type lie.** The declared
  `(props: { event }) => boolean` ref signature never matched the
  underlying `defineExpose` body. Both now agree on
  `(event: KeyboardEvent) => boolean`.
- **`docs/guide/{react,vue,svelte}.md`** `VizelPortal` examples no longer
  show a fictional `container` prop (the component exposes `layer` /
  `class` / `disabled`).

### Documentation

- `.claude/rules/cross-framework.md` gains sections covering the Provider
  Root Class convention, the Suggestion Menu Ref convention, and the
  "Reactive vs Mount-time Editor Options" contract.
