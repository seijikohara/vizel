# @vizel/headless

Framework-neutral UI primitives that power the Vizel editor adapters.

This package is a **transitive dependency** of `@vizel/react`, `@vizel/vue`, and
`@vizel/svelte`. Install one of those adapters; npm resolves `@vizel/headless`
automatically. You do not depend on this package directly.

## What it provides

Each primitive ships a pure spec builder plus a controller that owns its DOM
side effects behind a `{ mount, unmount, update }` contract. Every primitive
guards Server-Side Rendering (SSR) and imports no framework runtime.

| Subpath                       | Primitive   | Purpose                                                        |
| ----------------------------- | ----------- | -------------------------------------------------------------- |
| `@vizel/headless/combobox`    | Combobox    | Keyboard contract and ARIA wiring for autocomplete-style menus |
| `@vizel/headless/popover`     | Popover     | Anchored popover positioning and dismissal                     |
| `@vizel/headless/dismissable` | Dismissable | Outside-pointer and Escape dismissal with focus return         |
| `@vizel/headless/focus-trap`  | Focus trap  | Focus boundary for modal surfaces                              |
| `@vizel/headless/floating`    | Floating    | `@floating-ui/dom` positioning wrapper                         |
| `@vizel/headless/keyboard`    | Keyboard    | List and grid roving-selection navigation                      |

## Design

The package depends only on `@floating-ui/dom` and standard DOM APIs.

## License

MIT
