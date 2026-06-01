# Changelog

All notable changes to Vizel are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Unreleased

v2.0.0 is a breaking rebuild of Vizel. Per
[ADR-0005](docs/adr/ADR-0005-v2-breaking-release.md), the release abandons
backward compatibility with v1.x: no API, type, prop, event, or runtime contract
is preserved. The only bridge for existing consumers is the migration guide at
[docs/guide/migration-v1-to-v2.md](docs/guide/migration-v1-to-v2.md), which walks
through every breaking change per framework with side-by-side code.

The rebuild replaces the v1 cross-framework API-symmetry contract with **feature
parity**: every adapter ships the same capabilities, but each one expresses them
in its framework's native idiom rather than mirroring a shared API shape.

### Breaking changes

Every area below is documented in full, with before/after code per framework, in
the migration guide. This list is the index.

- **API symmetry retires in favour of feature parity.** Adapter APIs no longer
  mirror each other; each follows its framework's idiom. Parity is enforced by
  the feature manifest (`packages/core/src/feature-manifest.ts`) rather than by
  matching signatures. See [ADR-0001](docs/adr/ADR-0001-feature-parity-over-api-symmetry.md).
- **Editor lifecycle returns the editor directly.** React `useVizelEditor`
  returns `Editor | null`; Vue returns `ShallowRef<Editor | null>`; Svelte
  `createVizelEditor` returns `{ readonly current: Editor | null }`.
- **`useVizelEditorState` becomes a selector subscription.** Each adapter
  re-renders only when the selected slice changes (React `useSyncExternalStore`,
  Vue `computed` over a transaction listener, Svelte `createSubscriber`).
- **Bubble, slash, and mention menus adopt render-prop idioms** — React callback
  children, Vue scoped slots, Svelte snippets — and Svelte callback props move to
  the lowercase DOM-attribute convention (`onclose`, `onselect`).
- **Link editor, find-replace, and color picker restructure** their props and
  imperative surfaces per framework.
- **Theme, auto-save, context, and provider APIs** change shape per framework
  (for example Svelte `getVizelContext()` now returns
  `{ readonly current: Editor | null }`).
- **Invalid editor configuration throws.** Supplying both `initialContent` and
  `initialMarkdown` now throws a `VizelError` with the `INVALID_CONFIG` code
  instead of warning and silently falling back.

### Added

- **`@vizel/headless`** — a framework-neutral package of UI primitives consumed
  transitively by every adapter (combobox, popover, dismissable, focus-trap,
  floating, and keyboard). Each primitive ships a pure spec builder plus a
  `{ mount, unmount, update }` controller and guards SSR. See
  [ADR-0003](docs/adr/ADR-0003-vizel-headless-package.md).
- **First-party editor reactivity in every adapter.** React uses
  `useSyncExternalStore`, Vue uses `shallowRef` + an `onScopeDispose`-bound
  transaction listener, and Svelte uses `$state.raw` + `createSubscriber`.
  `@tiptap/react` and `@tiptap/vue-3` are no longer dependencies. See
  [ADR-0009](docs/adr/ADR-0009-first-party-editor-reactivity.md).
- **Feature manifest as the parity single source of truth.**
  `VIZEL_FEATURE_MANIFEST` declares every feature; `pnpm check:feature-parity`
  verifies all three adapters cover every entry. See
  [ADR-0002](docs/adr/ADR-0002-feature-manifest-as-parity-ssot.md).
- **Pure spec builders and DOM controllers in `@vizel/core`.** Every menu and
  form component consumes a `buildVizel<Component>Spec(...)` builder plus a
  controller that owns its DOM listeners, so adapters never attach global
  listeners directly. See
  [ADR-0007](docs/adr/ADR-0007-component-size-and-controller-delegation.md).
- **Architecture Decision Records** under `docs/adr/` capturing every binding
  rule, and a per-framework migration guide.

### Changed

- **CSS centralises in `@vizel/core`.** A single catalogue ships under two
  selectors (`:root, [data-vizel-theme="light"]` and `[data-vizel-theme="dark"]`)
  plus the `prefers-color-scheme` fallback; each adapter re-exports the same
  `styles.css`. See [ADR-0008](docs/adr/ADR-0008-css-belongs-in-core.md).
- **Controllers replace direct DOM listeners.** Outside-click, Escape, focus
  trapping, and positioning move into `@vizel/core` controllers and
  `@vizel/headless` primitives; adapter components stay at or under 120
  view-template lines.
- **Tiptap dependency surface narrows.** The only Tiptap runtime dependencies are
  `@tiptap/core`, `@tiptap/pm`, and the per-feature `@tiptap/extension-*`
  packages, declared by `@vizel/core`.

### Removed

- `@tiptap/react` and `@tiptap/vue-3` dependencies.
- The v1 cross-framework API-symmetry rule and its prose source of truth
  (`.claude/rules/cross-framework.md`), retired by
  [ADR-0006](docs/adr/ADR-0006-retire-cross-framework-rule.md) in favour of the
  feature manifest and ADRs.
