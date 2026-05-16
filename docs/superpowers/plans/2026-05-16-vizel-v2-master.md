# Vizel v2.0.0 Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This file describes the overall release sequence; each section has its own sub-plan in this directory.

**Goal:** Deliver the seventeen-section v2.0.0 redesign of Vizel as a coordinated series of pull requests that land into `main` without ever shipping a half-finished public API.

**Architecture:** The redesign restructures `@vizel/core` into four layers (`extensions/`, `builders/`, `controllers/`, `utils/`), centralizes UI scaffolding in five spec types, replaces five command types with a single `VizelCommand` abstraction, switches the Markdown library to `tiptap-markdown` (markdown-it), and aligns React, Vue, and Svelte adapters around a shared core. Each section ships as one or more pull requests that respect the dependency graph below.

**Tech Stack:** TypeScript 5.x, Tiptap 3.x, ProseMirror, Vite, pnpm workspaces, Playwright Component Testing, VitePress 2.x, TypeDoc, Biome, lefthook.

**Spec:** `docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md`

**Release stance:** v2.0.0 npm publish stays **on hold**. The plan delivers every section to `main`; the final `npm publish` step does not run until the user explicitly authorizes it.

---

## Plan Layout

This master plan covers release sequencing, dependencies, and per-section gating. Each section has a dedicated sub-plan with task-level detail. Sub-plans live alongside this file:

```
docs/superpowers/plans/
├── 2026-05-16-vizel-v2-master.md                          # ← this file
├── 2026-05-16-vizel-v2-section-01-core-layering.md
├── 2026-05-16-vizel-v2-section-02-builder-types.md
├── 2026-05-16-vizel-v2-section-03-controller-types.md
├── 2026-05-16-vizel-v2-section-04-return-types.md
├── 2026-05-16-vizel-v2-section-05-parity.md
├── 2026-05-16-vizel-v2-section-06-public-api.md
├── 2026-05-16-vizel-v2-section-07-error-model.md
├── 2026-05-16-vizel-v2-section-08-feature-categories.md
├── 2026-05-16-vizel-v2-section-09-command-abstraction.md
├── 2026-05-16-vizel-v2-section-10-markdown.md
├── 2026-05-16-vizel-v2-section-11-block-ux.md
├── 2026-05-16-vizel-v2-section-12-ssr.md
├── 2026-05-16-vizel-v2-section-13-theme.md
├── 2026-05-16-vizel-v2-section-14-ct-audit.md
├── 2026-05-16-vizel-v2-section-15-docs-overhaul.md
├── 2026-05-16-vizel-v2-section-16-demo-overhaul.md
└── 2026-05-16-vizel-v2-section-17-claude-consistency.md
```

Sub-plans appear progressively: I write each sub-plan immediately before the implementer starts that section. Writing all seventeen up front would produce ~5000 lines of stale text by the time the later sections run.

---

## Release Sequence

The seventeen sections land in seven phases. Each phase finishes its sections in `main` before the next phase begins. Inside a phase, sections may run in parallel branches when their dependency graph allows.

### Phase 1 — Foundation (Sections 1, 7)

| Section | Lands as | Reason |
|---------|----------|--------|
| 1. Core layering | PR `refactor(core): introduce four-layer directory structure` | Every later section assumes the new directories. |
| 7. Error model | PR `feat(core): introduce VizelError and VizelErrorCode` | Every later section throws `VizelError` instances. |

Phase 1 lands first because everything else depends on it. Section 1 lands before Section 7 because Section 7's `errors.ts` lives in the new directory layout.

### Phase 2 — Core types (Sections 2, 3, 4)

| Section | Lands as | Reason |
|---------|----------|--------|
| 2. Builder type normalization | PR `feat(core): consolidate UI builders into five spec types` | Provides the spec shapes that components consume. |
| 3. Controller type normalization | PR `feat(core): unify DOM side effects under controller factories` | Provides the controller contract that components mount. |
| 4. Return type symmetry | PR `refactor(framework): apply idiom-respecting return type contract` | Aligns hook, composable, and rune return shapes per framework idiom. |

Sections 2 and 3 may run in parallel branches because they touch separate directories. Section 4 waits for both — return types reference both spec and controller shapes.

### Phase 3 — Cross-framework and public API (Sections 5, 6)

| Section | Lands as | Reason |
|---------|----------|--------|
| 5. Cross-framework parity | PR `feat: enforce cross-framework parity via tables and CI checks` | Encodes the parity discipline that later sections must respect. |
| 6. Public API unification | PR `feat: re-export all of @vizel/core from each framework package` | Establishes the import surface that documentation describes. |

Section 5 lands before Section 6 because Section 6's `export *` lives under Section 5's parity discipline.

### Phase 4 — Features and Markdown (Sections 8, 10, 13)

| Section | Lands as | Reason |
|---------|----------|--------|
| 8. Feature categories | PR `feat(core): restructure VizelFeatureOptions into three categories` | Defines the option surface used by Sections 10, 11, 12, 13. |
| 10. Markdown pipeline | PR `feat(core): replace @tiptap/markdown with tiptap-markdown` + flavor plugin system | Replaces the core Markdown stack. Large surface; may decompose into 2–3 sub-PRs. |
| 13. Theme | PR `refactor(core): simplify CSS variable selector to data-vizel-theme only` | Smaller scope. Independent of Markdown/features. |

Section 13 may run in parallel with Section 8 and Section 10. Section 8 must complete before Sections 11, 12 begin.

### Phase 5 — Commands, UX, and SSR (Sections 9, 11, 12)

| Section | Lands as | Reason |
|---------|----------|--------|
| 9. Command abstraction | PR `feat(core): introduce VizelCommand unified abstraction` | Replaces five command types. |
| 11. Block UX | PR `feat: add advanced block operations, outline, minimap, presence` (likely 2–3 sub-PRs) | Largest single section. Builds on Sections 1–9. |
| 12. SSR / Static rendering | PR `feat: add VizelStaticView and three SSR modes` | Independent of Section 11. |

Section 9 lands before Section 11 (the block operations are `VizelCommand` instances).

### Phase 6 — Quality (Section 14)

| Section | Lands as | Reason |
|---------|----------|--------|
| 14. Playwright CT audit and expansion | PR `test: align CT specs and add round-trip / SSR / a11y / visual suites` | Tests cover everything from Phases 1–5. |

Section 14 may begin opportunistically (per-feature tests can land with their features), but the framework-parity check, round-trip suite, SSR suite, a11y suite, and visual regression baseline all land here as a coordinated test infrastructure PR.

### Phase 7 — Documentation and finalization (Sections 15, 16, 17)

| Section | Lands as | Reason |
|---------|----------|--------|
| 15. Documentation overhaul | PR `docs: rewrite guides, add TypeDoc API reference, integrate code examples` | Touches every guide page. |
| 16. Demo app overhaul | PR `refactor(demo): split into pages, sync with documentation examples` | Section 15 includes demo files via VitePress; demos must exist first. |
| 17. `.claude/` consistency check | PR `chore: consolidate .claude/ rule files, apply style audit` | Final integration pass. |

Section 16 lands before Section 15's final commit because Section 15 references demo files. Practically: Section 16 lands first as a smaller PR, then Section 15 lands and includes the demo files.

### Release gate (held)

After Section 17 lands and CI passes, the release sequence pauses. The final `npm publish` workflow does not run until the user explicitly authorizes it. The held state allows additional review, integration testing, or external validation before the publish becomes irreversible.

---

## Dependency Graph

```
Phase 1: 1 ─→ 7
              │
Phase 2:      ├─→ 2 ─┐
              │      │
              ├─→ 3 ─┤
              │      │
              └─→ 4 ─┤
                     ↓
Phase 3:             5 ─→ 6
                     │
Phase 4:             ├─→ 8 ─┐
                     │      │
                     │      ├─→ 10
                     │      │
                     └─→ 13 ┘
                     │
Phase 5:             ├─→ 9 ─→ 11
                     │
                     └─→ 12
                     │
Phase 6:             └─→ 14
                     │
Phase 7:             ├─→ 16 ─→ 15 ─→ 17 ─→ (RELEASE GATE - HELD)
```

Arrows mean "must complete before". Sections inside a phase that share an arrow source may run in parallel.

---

## Working Conventions

### Branch naming

Each section uses a branch named after its phase and topic:

```
refactor/v2-section-01-core-layering
feat/v2-section-02-builder-types
feat/v2-section-03-controller-types
refactor/v2-section-04-return-types
feat/v2-section-05-parity
feat/v2-section-06-public-api
feat/v2-section-07-error-model
feat/v2-section-08-feature-categories
feat/v2-section-09-command-abstraction
feat/v2-section-10-markdown
feat/v2-section-11-block-ux
feat/v2-section-12-ssr
refactor/v2-section-13-theme
test/v2-section-14-ct-audit
docs/v2-section-15-docs-overhaul
refactor/v2-section-16-demo-overhaul
chore/v2-section-17-claude-consistency
```

Section 10, 11, and 15 each decompose into 2–3 sub-branches when the change set warrants it.

### Commit message format

Each commit follows `.claude/rules/git.md` (Conventional Commits):

```
<type>(<scope>): <description>

<body>

<footer>
```

`type` aligns with the section's primary nature (`feat`, `refactor`, `test`, `docs`, `chore`). `scope` is `core`, `react`, `vue`, `svelte`, `demo`, or empty for repository-wide changes.

### Per-section task structure

Each sub-plan follows the same outline:

1. **Goal** — one sentence
2. **Architecture** — two or three sentences linking the section's design to the codebase
3. **Spec section reference** — link to the relevant section of the v2.0.0 design spec
4. **File structure** — which files this PR creates, modifies, or deletes
5. **Tasks** — TDD-style steps (write failing test → run → implement → run → commit)
6. **`.claude/` updates** — rule file edits required by this section
7. **Self-review checklist** — verifies the PR before opening

### Test-driven discipline

Every behavior change has a test that fails before the implementation lands. Per-section sub-plans show the failing test as Step 1 of each task. The Playwright CT suite, the Markdown round-trip suite, and the SSR suite all participate in this discipline.

### CI gating

Every PR must pass:

| Check | Source |
|-------|--------|
| `pnpm typecheck` | existing |
| `pnpm lint` | existing |
| `pnpm test:ct` (all three frameworks, Chromium) | existing |
| `scripts/check-reexport-mirror.ts` | introduced in Section 6 |
| `scripts/check-ct-parity.ts` | introduced in Section 14 |
| `scripts/check-demo-parity.ts` | introduced in Section 16 |
| `scripts/check-docs-consistency.ts` | introduced in Section 15 |
| `scripts/check-rules-consistency.ts` | introduced in Section 17 |
| `scripts/check-rules-style.ts` / `scripts/check-docs-style.ts` | introduced in Section 15 / 17 |
| `scripts/check-ssr-safety.ts` | introduced in Section 12 |

Sections that introduce a script add it to `lefthook.yml` and the CI workflow within the same PR.

### Rebase policy

Each section's branch rebases onto the latest `main` before merge. The branch never merges if `main` has moved; the implementer rebases and re-runs CI.

---

## Phase-by-phase task tracker

- [ ] **Phase 1: Foundation**
  - [ ] Section 1 — Core layering (sub-plan written, executed, merged)
  - [ ] Section 7 — Error model (sub-plan written, executed, merged)
- [ ] **Phase 2: Core types**
  - [ ] Section 2 — Builder type normalization (parallel branch with Section 3)
  - [ ] Section 3 — Controller type normalization (parallel branch with Section 2)
  - [ ] Section 4 — Return type symmetry (after Sections 2 and 3)
- [ ] **Phase 3: Cross-framework and public API**
  - [ ] Section 5 — Cross-framework parity
  - [ ] Section 6 — Public API unification
- [ ] **Phase 4: Features and Markdown**
  - [ ] Section 8 — Feature categories
  - [ ] Section 10 — Markdown pipeline
  - [ ] Section 13 — Theme (parallel branch with Sections 8 and 10)
- [ ] **Phase 5: Commands, UX, and SSR**
  - [ ] Section 9 — Command abstraction
  - [ ] Section 11 — Block UX
  - [ ] Section 12 — SSR / Static rendering
- [ ] **Phase 6: Quality**
  - [ ] Section 14 — Playwright CT audit and expansion
- [ ] **Phase 7: Documentation and finalization**
  - [ ] Section 16 — Demo app overhaul (first)
  - [ ] Section 15 — Documentation overhaul (after Section 16)
  - [ ] Section 17 — `.claude/` consistency check (last)
- [ ] **Release gate** (held; awaits explicit user authorization)
  - [ ] `npm publish` workflow dispatch
  - [ ] Git tag `v2.0.0`
  - [ ] GitHub Release notes

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Section 10's Markdown library swap breaks existing content | Round-trip test suite (Section 14) lands in parallel with Section 10's branch and gates the merge. |
| Section 11's block-UX scope creep delays the release | Each block-UX item (outline, minimap, multi-block selection, presence) becomes a separate sub-PR. The section merges incrementally. |
| Section 15's documentation rewrite drifts from implementation | `scripts/check-docs-consistency.ts` runs on every PR after Section 15 lands. |
| Cross-framework drift accumulates as features ship | The cross-framework-reviewer subagent (Section 5) reviews every section's PR. |
| Release authorization arrives before all sections land | The release gate explicitly waits for user authorization. The phase tracker above signals progress. |
| Heavy library (KaTeX, Mermaid) integration breaks at runtime | `createLazyOptionalLoader` (Appendix A.4) emits `VizelError("MISSING_OPTIONAL_DEP")` with actionable install instructions. |
| Hydration mismatches in progressive enhancement | Section 12's SSR test suite asserts byte-equal server and client HTML for representative documents. |

---

## Open Items for Implementation

These items deferred to implementation per Appendix B of the spec. They become concrete during the relevant sub-plan:

1. Exact file split inside `controllers/` (Section 3)
2. TypeDoc configuration details (Section 15)
3. Additional Biome rule selections (Section 7 onwards)
4. CI script implementation details (Sections 6, 14, 15, 16, 17)
5. Visual regression baseline screenshots (Section 14)
6. Locale defaults beyond English and Japanese (Section 8 — none ship in v2.0.0)

Each becomes a concrete decision when its sub-plan is written. If any item reveals an ambiguity that needs user-level input, the sub-plan writer surfaces the question rather than guessing.

---

## How to use this plan

The implementing engineer:

1. Reads this master plan to understand the seven-phase release.
2. Opens the sub-plan for the current section (e.g.,
   `2026-05-16-vizel-v2-section-01-core-layering.md`).
3. Follows the sub-plan's TDD-structured tasks.
4. Opens a PR with the branch name from the convention above.
5. Waits for CI to pass.
6. Merges into `main`.
7. Returns to step 2 for the next section per the phase order.
8. After Section 17 lands, stops. Does not run `npm publish`. Awaits explicit user authorization to release v2.0.0.

Each sub-plan's "Self-review checklist" gates the PR before review. Each section's PR description references both the spec section and this master plan's phase entry.
