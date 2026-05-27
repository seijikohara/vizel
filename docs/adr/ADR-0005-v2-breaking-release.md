# ADR-0005: v2.0.0 as a breaking release

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

Vizel v1 is published on npm. v1 consumers depend on the symmetric API, the legacy `VizelEditorRef` type, the per-feature state hooks, and the v1 CSS surface. Carrying any of these forward into v2 would compromise every other v2 decision.

The maintainer's directive is explicit: "後方互換性は一切放棄". v2 is a clean break.

## Decision

Vizel v2.0.0 is a breaking release. The repository declares it as such across every package. No compatibility shim ships.

Concretely:

- Every `package.json` under `packages/` bumps to `2.0.0`.
- The v1 surface (`VizelEditorRef`, per-feature state hooks, symmetric prop names, camelCase Svelte events) is removed, not deprecated.
- `docs/guide/migration-v1-to-v2.md` is the single migration artefact. It enumerates every breaking change and provides side-by-side code samples per framework.
- v1.x continues to exist on npm at its published versions. v2.0.0 publishes under the default `latest` dist-tag. v1 receives no further patches.
- Publishing v2.0.0 requires explicit maintainer approval. The release pipeline never auto-publishes.

## Consequences

Positive:

- Every other ADR can make optimal choices unconstrained by compatibility.
- The codebase shrinks because the deprecated paths disappear.
- The mental model simplifies: one supported version, one set of idioms.

Negative:

- v1 consumers must read the migration guide and rewrite call sites. The guide must cover every breaking change.
- Until the guide lands, early-adopter feedback risks being dominated by "how do I migrate" questions. Phase 4 prioritises the guide before publish (Phase 5).

Follow-up:

- Phase 4 writes `docs/guide/migration-v1-to-v2.md` covering every breaking change identified across ADR-0001 through ADR-0009.
- Phase 5 coordinates the v2.0.0 publish across `@vizel/core`, `@vizel/headless`, `@vizel/react`, `@vizel/vue`, and `@vizel/svelte`.
- The release-notes commit explicitly states that v1 receives no further patches.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md`
- Related: every other ADR in this directory.
