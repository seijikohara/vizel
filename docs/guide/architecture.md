# Architecture

Vizel is a block-based visual Markdown editor built on [Tiptap](https://tiptap.dev/). It ships React, Vue, and Svelte adapters around one framework-agnostic core. This page states the architectural facts that hold across the library.

## Product model

- Vizel edits content as Tiptap nodes (block-level structure). Markdown is the source of truth on save and load; Tiptap's internal HTML is an editing-time representation, not a persisted format.
- The authoring surface targets a Notion-like experience: slash menu, drag handle, mentions, block menu, embeds, find-and-replace, version history, comments, and collaboration.

## Packages

| Package | Role |
|---------|------|
| `@vizel/core` | Framework-agnostic Tiptap extensions, pure spec builders, controller factories, the feature manifest, and the single CSS catalogue. It never imports a framework runtime. |
| `@vizel/headless` | Framework-neutral UI primitives — combobox, popover, dismissable, focus-trap, floating, and keyboard helpers — each shipped as a spec builder plus a controller factory with no framework imports. |
| `@vizel/react` / `@vizel/vue` / `@vizel/svelte` | Thin adapters that express every feature in their framework's native idiom. |

Installing one adapter is sufficient. `@vizel/core` and `@vizel/headless` are transitive dependencies; consumers never declare them directly.

## Feature parity and per-framework idiom

- Every adapter ships the same features. API symmetry across frameworks is not a goal: each adapter follows its framework's idioms. React and Vue expose hooks and composables named `useVizel*`; Svelte exposes runes named `createVizel*` and `getVizel*`.
- The parity contract is a typed manifest at `packages/core/src/feature-manifest.ts`. Every advertised feature is one entry that names the adapter symbols, the ARIA contract, the keyboard map, and the test scenarios. `pnpm check:feature-parity` fails the build when an adapter omits a declared symbol.

## First-party editor reactivity

- Each adapter implements editor reactivity natively. `@tiptap/react` and `@tiptap/vue-3` are not dependencies.
- React subscribes through `useSyncExternalStore`. Vue holds the editor in `shallowRef` and detaches listeners through `onScopeDispose`. Svelte holds the editor in `$state.raw` and subscribes through `createSubscriber`.
- The only Tiptap runtime dependencies are `@tiptap/core`, `@tiptap/pm`, and the per-feature `@tiptap/extension-*` packages, all declared by `@vizel/core`.

## Styling

- The CSS source of truth lives in `@vizel/core`. Each adapter exposes one entry — for example `@vizel/react/styles.css` — that resolves to the Core catalogue.
- The catalogue ships under two selectors, `:root, [data-vizel-theme="light"]` and `[data-vizel-theme="dark"]`, plus a `prefers-color-scheme: dark` fallback. Host theming integrates by setting `data-vizel-theme`. Vizel never writes host theme selectors such as `.dark` or `[data-theme]`. See [Theming](./theming) for the integration patterns.

## SSR safety

- Every Core utility guards `document` and `window` access. Adapter components mount DOM-touching controllers only inside the framework's lifecycle hook — `useEffect`, `onMounted`, or `$effect`.
- Constructing an editor on the server throws a typed `VizelError("SSR_NOT_SUPPORTED")` that points at the correct lifecycle hook. See [SSR](./ssr) for rendering modes.

## Error model

Misuse surfaces as a typed `VizelError` carrying a stable `VizelErrorCode`. Configuration mistakes throw at the boundary; recoverable runtime errors flow through `emitVizelError` and the consumer-supplied `onError` callback.

## Bundle-size budgets

Each published package carries a gzipped JavaScript budget enforced in continuous integration. A package that exceeds its budget fails the build.

| Package | Budget (gzip) |
|---------|--------------:|
| `@vizel/core` | 300 kB |
| `@vizel/headless` | 10 kB |
| `@vizel/react` | 40 kB |
| `@vizel/vue` | 40 kB |
| `@vizel/svelte` | 60 kB |

## Node.js baseline

- The toolchain targets Node.js 24 for contributors and continuous integration. The root and every package declare `"engines": { "node": ">=24" }`.
- `engines.node` is advisory: it does not gate the Node.js runtime of a consumer application. The published packages are standard ECMAScript Modules that bundlers and runtimes resolve without a Node.js 24 minimum at install time; npm warns rather than errors when a consumer app runs below the floor.
