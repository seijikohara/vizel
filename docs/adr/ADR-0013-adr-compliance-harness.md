# ADR-0013: ADR compliance harness

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

The ADRs in this directory declare binding rules that span source code, test layout, package metadata, and `.claude/` artefacts. The Phase plan in `docs/superpowers/plans/` (or `/Users/seiji/.claude/plans/starry-petting-planet.md`) breaks the rebuild into discrete steps, but reviewers had no mechanical way to verify whether a given Phase actually closed the ADR gaps it claimed to.

A recent audit revealed two failure modes:

- A reviewer reported ADR-0009 (no `@tiptap/react` or `@tiptap/vue-3` dependency) as outstanding even though the codebase had already complied since v1. The audit was wrong because no script enforced the invariant.
- ADR-0007 (zero `document.addEventListener` in framework adapters) drifted between v1 and the start of the v2 rebuild — 21 violations accumulated — because no CI job grepped for them.

Both gaps are mechanical: a small script can verify the invariant in seconds. Verification by inspection does not scale across the ADR catalogue and a multi-Phase rebuild.

## Decision

Introduce a single ADR-compliance harness (`scripts/check-adr-compliance.ts`) that walks every ADR with a mechanically-checkable invariant and emits PASS / WARN / FAIL per ADR. The harness:

- Runs locally on `pre-push` (lefthook).
- Runs in CI as the `ADR compliance harness` step in the `Quality + Parity` job (`quality.yml`).
- Returns a non-zero exit code when any FAIL is detected. WARN does not block CI but appears in the report.

Each ADR enforced by the harness owns one section in the script with a self-contained check function. The check function returns `{ adr, status, message }`. Adding a new ADR adds one function; the harness does not need a registry update.

A companion subagent (`.claude/agents/phase-review.md`) handles qualitative review at Phase boundaries. The subagent reads the Phase deliverables from the plan, runs the mechanical harness, and reports any gap that requires human judgement (Phase scope drift, missing ADR for a new exception, documentation lag).

## Concrete mechanical checks (initial scope)

| ADR | Check | FAIL condition |
|-----|-------|----------------|
| 0005 | Every `packages/*/package.json` carries `"version": "2.0.0"` | Any other version |
| 0006 | `.claude/rules/cross-framework.md` does not exist | File present after Phase 1 |
| 0007 | `grep -r 'document\.addEventListener' packages/{react,vue,svelte}/src/` returns zero lines | Any match |
| 0007 | View-template line count in every `Vizel*.{tsx,vue,svelte}` component ≤ 120 | Any file over budget |
| 0008 | Every adapter `package.json` `exports."./styles.css"` resolves to `@vizel/core/styles.css` | Resolution to a different file |
| 0009 | `grep -r '@tiptap/react' packages/ apps/ tests/` returns zero lines | Any match |
| 0009 | `grep -r '@tiptap/vue-3' packages/ apps/ tests/` returns zero lines | Any match |
| 0009 | No `@tiptap/react` or `@tiptap/vue-3` in any `package.json` dependencies, peerDependencies, or devDependencies | Any entry |
| 0010 | Every `.claude/skills/*/SKILL.md` carries `description` + `when_to_use` + (when path-scoped) `paths:` frontmatter | Any skill missing fields |
| 0011 | `.claude/rules/writing.md` exists with a `paths:` frontmatter | File missing or missing frontmatter |
| 0012 | Every entry in `VIZEL_FEATURE_MANIFEST` has a corresponding `tests/ct/scenarios/v2/<feature-id>/index.ts` | Any manifest entry without a scenario folder |

ADR-0001, ADR-0002, ADR-0003, ADR-0004 carry no mechanical invariants on their own; they are enforced indirectly through ADR-0009, the feature manifest, the adapter publish workflow, and code review respectively.

The table above is the initial scope. The shipped harness expands the ADR-0007 and ADR-0009 rows into per-adapter checks (react / vue / svelte), so it reports 14 checks in total. ADR-0014's per-package bundle budget is enforced separately by the `Bundle size` job in `quality.yml`, not by this harness.

## Status semantics

| Status | Meaning | Build effect |
|--------|---------|--------------|
| PASS | The invariant holds | continue |
| WARN | The invariant has a documented Phase transition; CI prints the message but does not fail | continue |
| FAIL | The invariant is violated outside an accepted transition | exit code 1 |

WARN exists so a Phase in transition (e.g. ADR-0007 during Phase 3b before Vue dismissable migration lands) can ship without forcing a CI red. The harness records the expected Phase that closes each WARN; once that Phase merges, the WARN must turn into PASS or the build fails.

## Consequences

Positive:

- Reviewers no longer manually audit each ADR per PR. The harness reports the state in one place.
- Drift is caught at edit time (`pre-push`) instead of at audit time.
- The harness doubles as ADR documentation: every check function carries the ADR ID and a one-line summary that maps back to the record under `docs/adr/`.

Negative:

- Adding a new ADR with a mechanical invariant requires adding a check function. The marginal cost is small (one function, ~20 lines).
- The WARN-to-PASS transition window for each Phase needs to be tracked in the harness; a missed transition lets a Phase ship without closing its ADR gap.

Follow-up:

- Phase Review subagent dispatch is manual today. When the team stabilises on a Phase cadence, wire the subagent into a GitHub Action that runs on merge to main.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md`
- Related: every other ADR. The harness is the operational layer that makes the other ADRs verifiable.
