# ADR-0006: Retire `cross-framework.md`

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

`.claude/rules/cross-framework.md` (472 lines) was v1's SSOT for cross-framework consistency. It enforced API symmetry through prose tables: identical component names, identical props, identical hook signatures, identical event payloads across React, Vue, and Svelte.

[ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md) drops the symmetry requirement. [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md) moves the parity SSOT into TypeScript. `cross-framework.md` has no remaining purpose.

## Decision

Delete `.claude/rules/cross-framework.md`. Replace it with `.claude/rules/feature-manifest.md`, which describes how to add, modify, and verify entries in `packages/core/src/feature-manifest.ts`.

The deletion lands in the same pull request that introduces the feature manifest (Phase 1). The new `feature-manifest.md` includes:

- The schema for `VizelFeatureDefinition`.
- The workflow for adding a feature (manifest entry → adapter implementations → scenarios → parity check).
- The workflow for modifying a feature (update manifest → coordinated adapter changes → scenario updates).
- The CI verification commands (`pnpm check:feature-parity`, `pnpm check:ct-parity`).

## Consequences

Positive:

- The 472-line prose rule retires. Reviewers no longer read three documents to verify a single change.
- The parity contract becomes type-checked. The TypeScript compiler enforces structural integrity at edit time, not at review time.

Negative:

- The deletion is a hard break for anyone who linked to `cross-framework.md` in prior discussions. The replacement `feature-manifest.md` covers the same intent in a different shape.

Follow-up:

- Phase 1 lands the deletion alongside the manifest.
- ADR-0005's migration guide notes the rule retirement for anyone navigating from v1 documentation.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (Phase 1)
- Related: [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md), [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md), [ADR-0010](./ADR-0010-claude-config-official-format.md)
