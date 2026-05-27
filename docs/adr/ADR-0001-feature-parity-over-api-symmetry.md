# ADR-0001: Feature parity over API symmetry

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

Vizel v1 enforced API symmetry across React, Vue, and Svelte. Every component prop, hook or composable or rune name, return shape, and event payload had to mirror across packages. The intent was to ease cross-framework navigation. The result was the opposite: each framework lost its native idiom for the sake of a contract that no consumer ever asked to enforce.

The audit of v1 confirms the harm:

- Vue 3.5 uses `defineModel` in a single file. Every other component re-implements two-way binding via props + emit pairs.
- Svelte 5 uses `Snippet` virtually nowhere. Render-prop semantics ship through component-constructor props, and events are forced to camelCase (`onClose`) instead of the Svelte 5 lowercase DOM-attribute convention.
- React 19 over-uses `useImperativeHandle` to mirror Vue and Svelte ref patterns. Destructured-getter hooks (`const { current: editor } = useVizelEditor()`) sacrifice the React idiom of "the hook *is* the value".

A symmetric API forces the same shape across three different runtime models. A native API lets each framework use what its 2025-era best practices already provide.

## Decision

Vizel v2 abandons API symmetry. The new contract has three binding mandates:

- Vizel provides features to all three frameworks.
- Each framework's API delivers that framework's best-in-class developer experience.
- Feature parity is maintained across the three frameworks.

Concretely:

- The cross-framework rule that enforced symmetry retires (see [ADR-0006](./ADR-0006-retire-cross-framework-rule.md)).
- The SSOT for parity becomes a typed feature manifest, verified in CI (see [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md)).
- Each adapter expresses every feature in its framework's preferred shape (see [ADR-0004](./ADR-0004-per-framework-idiomatic-api.md)).

## Consequences

Positive:

- Vue authors get `defineModel`, `defineExpose`, typed slots, `useId`, `useTemplateRef`, and generic SFCs.
- Svelte authors get snippets, runes (`$state.raw`, `$bindable`), and lowercase events.
- React authors get hooks-first state subscription, standard `forwardRef`, and selector-style re-render control.
- Component size shrinks because logic that previously duplicated across frameworks moves into `@vizel/core` and `@vizel/headless`.

Negative:

- Documentation must be authored per framework instead of once with cross-links.
- Cross-framework navigation requires a translation step the parity manifest provides.
- The migration from v1 demands a guide that maps every old name to every new shape.

Follow-up:

- Implement the feature manifest before any adapter rewrite begins.
- Write `docs/guide/migration-v1-to-v2.md` enumerating every breaking change with side-by-side code samples.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md`
- Superseded: `.claude/rules/cross-framework.md`
- Related: [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md), [ADR-0004](./ADR-0004-per-framework-idiomatic-api.md), [ADR-0005](./ADR-0005-v2-breaking-release.md), [ADR-0006](./ADR-0006-retire-cross-framework-rule.md)
