# ADR-0014: Bundle-size budgets per package

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

Vizel v2 splits the runtime across one Core package, one Headless
primitives package, and three framework adapters. Each adapter ships a
minified, gzipped JavaScript bundle to the consumer; adapter authors
sometimes pull a heavy dependency into a controller or a builder
without observing the downstream weight.

The v1 codebase ran without a published budget. Bundle weight crept up
between releases because no CI signal flagged a regression — the
visible-to-consumer cost stayed invisible to the contributor. The
audit recorded several recent commits that added more than 5 kB to
one adapter's gzipped bundle without a corresponding contributor note.

A published per-package budget makes the cost visible at review time
and gives the contributor a concrete number to defend.

## Decision

Vizel v2 defines a gzipped JavaScript budget for each shipped package.
The budget covers the package's published entrypoints under
`dist/`, measured after minification and gzip compression. The
budgets are:

| Package | Gzipped JS budget |
|---------|-------------------|
| `@vizel/core` | 300 kB |
| `@vizel/headless` | 10 kB |
| `@vizel/react` | 40 kB |
| `@vizel/vue` | 40 kB |
| `@vizel/svelte` | 60 kB |

Each adapter budget sits inside roughly two times the package's
current weight at the v2 cut. The Svelte budget sits higher than
React and Vue because the Svelte component file format ships
template-source strings in the production bundle (each rune file
inlines the markup), so the same feature set lands heavier than the
React or Vue equivalent. The Headless budget is small because the
package exports framework-neutral primitives only; a single
controller plus tree-shakeable helpers must not exceed the
allocation.

The Core budget is large because Core absorbs every Tiptap extension
and the entire Markdown pipeline. The number reflects the upper bound
the consumer's bundler observes after externalising the `@tiptap/*`
peer dependencies — the JavaScript Vizel itself contributes.

A CI job (`Bundle size`) runs after `pnpm build` on every pull
request and compares each package's `dist/` gzipped size against the
budget. A package exceeding its budget fails the job. The job reports
the measured size against the budget so contributors see how close
each package sits to its ceiling.

## Consequences

Positive:

- A pull request that pulls in a heavy dependency surfaces the cost
  at review time. The reviewer sees the exact byte delta against the
  budget.
- The CI job runs on every PR. Drift cannot accumulate silently
  between releases.
- The budget table becomes a published contract for downstream
  consumers planning their own bundles. The page-weight budget for
  the consumer's app can subtract Vizel's contribution and know the
  remaining headroom.

Negative:

- A contributor who needs a one-off increase must amend this ADR. The
  budget is intentionally rigid — a casual increase defeats the
  budgeting purpose. Legitimate increases land as an `## Update`
  section on this record with a rationale and the new number.
- The Svelte budget will tighten when the adapter migrates to a more
  efficient compiled output. Until then, the higher allocation
  reflects the current cost.

Follow-up:

- The `Bundle size` job in `.github/workflows/quality.yml` enforces
  the budget. The job concatenates each package's shipped `.js`
  chunks, gzips the stream, and compares the byte count to the
  budget. Concatenating before compression matches what a consumer
  downloads when importing the whole adapter; per-file gzip
  understates the total because of gzip's per-stream overhead.
- A contributor who finds a 5 kB+ regression should split the
  responsible change behind an explicit feature flag rather than
  pushing the budget up.

## Update (2026-05-29): `@vizel/headless` adopts `@floating-ui/dom`

The `floating` and `popover` primitives land in `@vizel/headless` and
adopt `@floating-ui/dom` as the positioning engine, per ADR-0003. Two
facts about this record follow:

- `@vizel/headless` now declares `@floating-ui/dom` as a runtime
  `dependency`. A consumer that installs an adapter gains
  `@floating-ui/dom` transitively, so the consumer's total page weight
  grows by the gzipped `@floating-ui/dom` payload (roughly 8 kB). The
  per-package budgets in this record measure each Vizel package's own
  shipped `dist/` bytes, not its transitive dependency tree.
- The headless build externalises `@floating-ui/dom` (the Vite config
  lists it under `rollupOptions.external`), so the engine's bytes stay
  out of `packages/headless/dist`. The measured headless bundle after
  this change is 3 kB gzipped — well under the 10 kB ceiling — because
  the dist carries only the import statement, not the inlined library.

The 10 kB headless budget stays unchanged: it measures only
Vizel-authored bytes, and the externalised dependency keeps the package
within the existing allocation. No `BUDGET_KB` entry in
`.github/workflows/quality.yml` changes.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (Phase 5)
- Related: [ADR-0003](./ADR-0003-vizel-headless-package.md), [ADR-0005](./ADR-0005-v2-breaking-release.md)
