# ADR-0008: CSS belongs in `@vizel/core`; adapters re-export

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

v1 ships CSS per adapter. Each adapter exports `styles.css` independently. The three files duplicate the same token catalogue and component rules, which means a token change requires three coordinated edits.

The maintainer's directive: "CSSのスタイリングなどは各フレームワークのパッケージではなく共通のパッケージで管理したい".

## Decision

The CSS source of truth lives in `@vizel/core/styles.css`. Every adapter package declares an `exports."./styles.css"` entry in its `package.json` that resolves to the Core file. Consumers continue to write a single import:

```ts
import "@vizel/react/styles.css";   // resolves to @vizel/core/styles.css
```

The CSS catalogue ships under exactly two top-level selectors plus the `prefers-color-scheme: dark` fallback for unset themes:

- `:root, [data-vizel-theme="light"]`
- `[data-vizel-theme="dark"]`
- `@media (prefers-color-scheme: dark)` fallback

Host-environment selectors (`.dark`, `.light`, `[data-theme="*"]`) remain banned. Host theming integrates by setting `data-vizel-theme` on a wrapper element; Vizel never reads host theme attributes.

## Consequences

Positive:

- A token edit touches one file. The three adapter packages stay in lockstep automatically.
- Bundle size drops because consumers no longer pay for three near-identical stylesheets.
- The CSS catalogue documents itself: the variables, components, and themes live where the engine lives.

Negative:

- Adapter packages must keep their `exports."./styles.css"` re-export pointing at the Core file. A package-manager hoisting failure could break the resolution; the build verifies that `@vizel/{react,vue,svelte}/styles.css` resolves to a file that contains the Core sentinel comment.
- Authors adding component CSS must do so in `@vizel/core`, not in their adapter package.

Follow-up:

- Phase 1 (or earlier) updates each adapter's `package.json` exports to point at Core.
- Phase 2 (headless extraction) keeps CSS in Core; the headless package ships no CSS of its own.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R6)
- Related: [ADR-0003](./ADR-0003-vizel-headless-package.md)
