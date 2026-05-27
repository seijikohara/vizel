# ADR-0007: 120-line component size rule and controller delegation

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

The v1 audit shows that 65 percent of framework components exceed 120 view-template lines. `VizelBubbleMenu.vue` reaches 200+ lines. `VizelLinkEditor.tsx` reaches 195+. Every overflow case contains the same pattern: framework code that should delegate to a controller re-implements DOM listeners, ARIA wiring, keyboard maps, dismiss logic, and focus management inline.

The architecture rule already forbids direct `document.addEventListener` calls in framework components. The rule went unenforced: 21 violations remain across the three adapters.

## Decision

v2 introduces two binding constraints:

1. **Every adapter component file stays at or under 120 view-template lines.** "View-template lines" means JSX, template, or `.svelte` markup lines; `<script>` declarations count separately. CI fails the build when any component exceeds the limit. The limit applies to the file's view block, not its supporting hooks or composables.
2. **Adapter components delegate all global side effects to a controller.** A "controller" comes from `@vizel/core/controllers/` or `@vizel/headless/`. Controllers expose `{ mount(target), unmount(), update(args) }`. Adapter code passes an element into a controller and lets the controller own the listener, the positioning, and the focus return.

Direct calls to `document.addEventListener`, `window.addEventListener`, `MutationObserver`, or `ResizeObserver` inside `packages/{react,vue,svelte}/src/` are forbidden. CI enforces the rule with `grep`.

## Consequences

Positive:

- Adapter files become readable in a single screen. New contributors orient in seconds.
- Listener cleanup centralises. Memory leaks become a controller bug, not a framework bug.
- Cross-framework parity becomes easier because the controllers do the heavy lifting once.

Negative:

- Logic that previously lived in `<script>` blocks must move into Core. Phase 3 sub-phases carry this cost up front.
- The 120-line audit script fails the build immediately on overflow. Authors must split files or extract logic instead of letting overflow accumulate.

Follow-up:

- Phase 2 lands the headless controllers that absorb the 21 violations.
- Phase 3a, 3b, and 3c rewrite each adapter against the size rule.
- CI adds a `view-lines` check that runs on every pull request.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R3, R4)
- Related: [ADR-0003](./ADR-0003-vizel-headless-package.md), [ADR-0009](./ADR-0009-first-party-editor-reactivity.md)
