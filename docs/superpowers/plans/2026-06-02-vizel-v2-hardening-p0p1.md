# Vizel v2.0.0 P0/P1 Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan PR-by-PR with review checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the P0/P1 findings from the 2026-06-02 multi-perspective scorecard. The v2 *code* already meets the four project goals (radical refactor, zero backward-compat, 3-framework parity, idiomatic per-framework API); the gap is that several quality/parity **guardrails are false-green** (they cannot detect a regression) and a few real defects ship behind them. This plan makes every gate trustworthy and fixes the defects, then advances the radical-refactor goals that depend on trustworthy gates. It also raises the supported Node.js runtime baseline to `>=24`.

**Source:** Scorecard + remediation workflows in session `382a255d`. Every finding below was verified against the code (file:line) by an auditor and re-verified by an adversarial critic before landing here.

**Release stance:** v2.0.0 npm publish stays **on hold**. Every PR lands on `main`; no PR advances the publish state. Each gate-tightening PR lands on a known-green baseline with an independent kill switch (see Rollback).

**Status:** APPROVED (2026-06-03). All nine decisions are locked (see Decisions Register). Execution proceeds PR-by-PR in the dependency order below, each branch rebased onto the latest `main` then squash-merged.

---

## Verified Findings → Work Items

| Finding | Evidence | Work Item |
|---------|----------|-----------|
| F-A feature-parity check is asleep | `scripts/check-feature-parity.ts:115` `if (surface.reexportsCore) continue;` — every adapter has the mandatory `export * from "@vizel/core"`, so no missing symbol is ever flagged | WI-2 |
| F-B `scenarios/v2` are stubs | `tests/ct/scenarios/v2/find-replace/index.ts:11` `run()` = `Promise.reject(...)`; `check-scenarios.ts` only `existsSync` the 23 folders. Real coverage is the flat `scenarios/*.scenario.ts` + per-FW specs | WI-3 |
| F-C node16 declaration defect | `packages/{vue,react}/dist/index.d.ts` import `from "./*.ts"`; `add-dts-extensions.mjs:26` treats `.ts/.vue` as already-extensioned. Counts: core 230, headless 8, react 46, vue 45, svelte 0 | WI-1 |
| F-D React view-line metric fragile | `check-adr-compliance.ts` `extractViewBlockLineCount` regex matches only the first `return (...)`, returns 0 on no match; the flagship `Vizel` component is never measured | WI-7 |
| F-E dual command system | `commands/slash-items.ts` (726 lines) coexists with `commands/registry/`; `core/index.ts` still exports `createVizelSlashCommands` (234), `vizelDefaultSlashCommands` (378) | WI-6 |
| F-F upload failure swallowed | image/file upload rejections never reach editor-level `onError`; ~12 raw `throw new Error` in `plugin-system.ts`/`lazy-import.ts`/`code-block-lowlight.ts`; `UPLOAD_FAILED`/`INVALID_EXTENSION`/`MISSING_OPTIONAL_DEP` codes unused | WI-5 |
| F-G a11y/md-roundtrip not PR-gated | a11y job gated on `workflow_dispatch` (a real Vue hang is masked); `test:md-roundtrip` not in CI | WI-4 |
| F-H comment rot / dangling refs | `packages/svelte/src/index.ts:20-23` → non-existent `check-cross-framework-parity.ts`; dangling `cross-framework.md` refs in rules; ADR-0009 narrative drift | WI-9 |
| F-I selector-shape divergence | React `useVizelEditorState` selector differs from Vue/Svelte `{editor, transaction}`; false portability claims in Svelte/Vue headers | WI-8 |
| F-J packaging | `@vizel/core` is a peerDependency in adapters; Tiptap/ProseMirror not deduped to one `prosemirror-model`; inconsistent dependency docs | WI-10 |
| F-K manifest ARIA/keyboard contract unenforced | `ariaContract.requiredAttributes` + `keyboardMap.bindings` declared on 23 features, read by no check | WI-11 |
| New directive: Node baseline | Raise minimum supported Node.js runtime to `>=24` | WI-12 |

---

## Decisions Register — LOCKED (2026-06-03)

All recommendations are accepted as written, except D-6, which is reframed to an idiom-first rationale (the outcome is unchanged in code; the justification changes). D-5 is resolved by re-baselining.

These nine decisions shape the work. The recommendation is the default the plan currently assumes.

- [ ] **D-1 (WI-1, attw / CSS exports):** attw flags the four CSS subpath exports (`./styles.css`, `./styles/variables.css`, `./styles/components.css`, `./mathematics.css`) as `NoResolution`. → **Recommend A:** `.attw.json` `excludeEntrypoints` scoped to those four CSS paths on core/react/vue/svelte (headless has none), keeping every JS/type entrypoint strictly gated. Reject fake `.d.ts` CSS shims (contradicts ADR-0008).
- [ ] **D-2 (WI-2, parity resolution mechanism):** how to resolve each adapter's real export set through `export * from "@vizel/core"`. Pure dynamic-import of `dist/index.js` is **verified-broken for Svelte** (`ERR_PACKAGE_PATH_NOT_EXPORTED` via `@iconify/svelte`). → **Recommend hybrid:** statically read each adapter `index.ts`'s named/`export *` set + resolve the Core `index.ts` namespace to enumerate forwarded names; do **not** runtime-import the Svelte dist.
- [ ] **D-3 (WI-3, scenario layer):** (A) implement 23 `scenarios/v2/*/run()` bodies + rewire 102 specs, or (B) delete the stub layer and re-point `check:scenarios` at the real flat scenarios. → **Recommend B:** the flat surface already delivers 100% of real three-framework coverage; A is an XL rewrite of a passing suite.
- [ ] **D-4 (WI-4, color-contrast):** re-enable WCAG AA `color-contrast` in the axe allow-list, or keep waived. → **Recommend keep waived** with a tightened, dated CT-iframe-measurement rationale (re-enabling flakes on a measurement artifact). The urgent part of WI-4 is diagnosing the real Vue hang, not this waiver.
- [ ] **D-5 (WI-7, React size gate):** after the corrected AST metric, keep React at FAIL or demote to WARN. → **Re-baselined:** with the fixed algorithm, `VizelColorPicker ~108`, `VizelFindReplace ~91`, `VizelBlockMenu ~81` — **all under 120**. So **keep FAIL on a proven-green baseline; no React refactor needed.**
- [x] **D-6 (WI-8, React selector) — DECIDED, idiom-first:** Derive each adapter's selector independently. React's `useSyncExternalStore`/`useSelector` convention takes a single snapshot, and feature parity requires the selector to read the transaction (which only Vue/Svelte can today). So React's selector becomes `(snapshot: { editor, transaction }) => T` — **the idiomatic React form that also closes the parity gap**, NOT a symmetry move. The input shape coincides across adapters only as a consequence of each framework's idiom plus parity; the **output/delivery stays framework-native** (React returns `T`; Vue a `ComputedRef`; Svelte a `$derived` rune). Drop the "same contract three times" / "portable selector" framing from code and ADRs; soften ADR-0009's wording to align with ADR-0001/0004 (parity, not symmetry).
- [ ] **D-7 (WI-11, ARIA/keyboard):** (A) full enforcement now, (B) downgrade to advisory, or (A-phased) static check now + runtime check after WI-4. → **Recommend A-phased:** full runtime enforcement is blocked on the a11y CI job (WI-4); static role/attribute enforcement ships now, runtime follows.
- [ ] **D-8 (WI-10, ProseMirror dedupe):** pin `prosemirror-model` in `pnpm-workspace.yaml` overrides, or migrate the whole Tiptap/ProseMirror set to a pnpm catalog. → **Recommend pin** `prosemirror-model` to **1.25.4** (the version the main `@tiptap/pm@3.23.6` + `y-prosemirror@1.3.7` tree wants — the original analysis inverted this). Also resolve the `@tiptap/pm` 3.23.6-vs-3.24.0 split.
- [ ] **D-9 (WI-12, nodenext switch):** flip published-package `tsconfig` `moduleResolution` to `nodenext` in WI-12, or defer to WI-1. → **Recommend defer to WI-1:** switching to nodenext is what makes F-C fatal, so it must land in the same PR as the `.ts→.js` declaration rewrite. WI-12 stays a pure, low-risk Node-floor bump.

---

## Phased Rollout

```
Phase 0  Toolchain & resolution foundation   PR#1 WI-1   →  PR#2 WI-12
Phase 1  Wake the sleeping gates             PR#3 WI-2   →  PR#4 WI-3 ;  PR#5 WI-4 (∥ after PR#2)
Phase 2  Harden enforcement & clean rot      PR#6 WI-7   →  PR#7 WI-9  →  PR#8 WI-11
Phase 3  Refactor the editor surface         PR#9 WI-5 ; PR#10 WI-6 ; PR#11 WI-8 ; PR#12 WI-10
```

| PR | Title | WI | Depends on PR | Notes |
|----|-------|----|---------------|-------|
| 1 | `fix(build): normalise declaration specifiers to .js and add attw type-resolution gate` | WI-1 | — | **P0 publish-blocker**, independent of WI-12 |
| 2 | `build: raise the Node.js baseline to >=24` | WI-12 | 1 | rebases all CI onto one `node-version-file` |
| 3 | `fix(ct): rewrite check-feature-parity to resolve the real adapter surface` | WI-2 | 2 | first true parity gate |
| 4 | `test(ct): retire scenarios/v2 stub layer and enforce flat-scenario coverage` | WI-3 | 3 | also edits `check-adr-compliance.ts` `checkScenarioFolders` |
| 5 | `ci: diagnose the a11y CI hang, then gate a11y and md-roundtrip on PRs` | WI-4 | 2 | ∥ with PR#3; **diagnose hang first** |
| 6 | `refactor(scripts): AST-based React view-line metric and reactivity-primitive checks` | WI-7 | 3, 4 | must precede WI-6 migration |
| 7 | `docs: clear comment-rot, dangling references, and ADR-0009 narrative drift` | WI-9 | 6 | shares `check-adr-compliance.ts` |
| 8 | `feat(core): enforce manifest ARIA/keyboard contract with a static check` | WI-11 | 3, 7 | Phase-1 static; runtime later |
| 9 | `fix(core): route upload failures through the editor-level onError sink` | WI-5 | 3, 4 | ∥ with PR#6-8 |
| 10 | `refactor(core): remove legacy slash-items, route the slash menu through the command registry` | WI-6 | 3, 4, 6 | XL, highest blast radius |
| 11 | `refactor(react): unify the editor-state selector on the {editor,transaction} snapshot` | WI-8 | 6, 9, 10 | |
| 12 | `build(deps): promote @vizel/core to a dependency and dedupe prosemirror` | WI-10 | 1, 2 | ∥ with the Phase-2 chain |

**Critical path:** PR1 → PR2 → PR3 → PR4 → PR6 → PR10 → PR11.
**Parallelizable:** after PR2, PR3 ∥ PR5; after PR4, PR9 and PR12 run ∥ with the PR6→PR7→PR8 harness chain.
**Estimate:** ~39–50 engineer-days (~8–10 weeks solo; ~4–5 weeks with two engineers). Dominant uncertainty: the two XL items (WI-6, WI-11) and WI-4's undiagnosed Vue hang.

---

## Shared-Harness Coordination

Five surfaces have multiple owners; each region gets a single owner and a strict landing order so no PR clobbers another.

1. **`scripts/check-adr-compliance.ts`** (WI-3, WI-7, WI-9). Order: WI-3 (#4) removes `checkScenarioFolders` + its `CHECKS` entry → WI-7 (#6) replaces only the React branch of `extractViewBlockLineCount` and **appends** `checkReactivityPrimitives` → WI-9 (#7) edits only `checkCrossFrameworkRuleRetired`. Disjoint functions; each rebases on the prior PR.
2. **`scripts/check-feature-parity.ts`** — sole owner WI-2 (#3). Full rewrite.
3. **`tests/ct/parity/check-scenarios.ts`** — sole owner WI-3 (#4).
4. **CI workflows** (`ci.yml`, `quality.yml`, `publish.yml`, `deploy-docs.yml`, composite action) — WI-1 adds the attw step → WI-12 (#2) rewrites **all** setup-node steps to `node-version-file` → later CI edits (WI-2 reorder, WI-4 a11y/md-roundtrip jobs, WI-11 aria step, WI-10 publishable guards) each touch a distinct job/step block and rebase sequentially.
5. **`packages/*/package.json`** — WI-12 edits only the `engines` block; WI-10 edits only `dependencies`/`peerDependencies` and lands after WI-12. **`feature-manifest.md` banner + ADR-0002** are owned exclusively by WI-2; WI-9/WI-11 are barred from those lines.

---

## Rollback Strategy

Every gate-tightening PR can turn previously-green CI red, so:

1. Each new/strengthened check ships as its own PR with a **negative test** proving it fails on a seeded regression and passes on current `main`.
2. **Per-check kill switch:** each check is a separate `package.json` script + distinct CI step + distinct `CHECKS` entry. Rollback = revert that single commit without touching the rest of the harness.
3. **WI-4** does not flip the a11y gate to a required dependency until (a) the real hang is reproduced and fixed and (b) a full green CI run is demonstrated on `main`. If a11y goes red post-merge, revert only the trigger flip (restore `workflow_dispatch`) while keeping the diagnosis fix and the md-roundtrip job.
4. **WI-10** keeps the `pnpm` overrides edit and the dep-class move in separable commits so the ProseMirror pin can be reverted independently if collaboration CT regresses.
5. Tag the merge commit of each Phase so a phase can be reverted wholesale; never advance the publish-on-hold state via a harness revert.

---

## Work Items

### Phase 0 — Toolchain & resolution foundation

#### WI-1 · `fix(build)` · node16/nodenext declaration resolution + attw gate · P0 · [PR#1] · deps: none

**Problem:** Emitted `.d.ts` carry relative specifiers ending in source extensions (`.ts/.tsx/.vue`), which `nodenext` rejects (`TS2307`/`InternalResolutionError`). Verified counts of relative source-extension `from`-specifiers in shipped `.d.ts`: core **230**, headless 8, react 46, vue 45, svelte 0 (svelte source already uses `.js`). Root cause: `scripts/add-dts-extensions.mjs:26` `if (/\.[a-z]+$/i.test(specifier)) return specifier;` skips them. Invisible to `pnpm typecheck` because root `tsconfig.json:10` uses `moduleResolution: bundler`. A nodenext consumer fixture confirmed `TS2307: Cannot find module './Vizel.vue'`; rewriting to `./Vizel.vue.js` fixes it.

- [ ] Rewrite `resolveSpecifier` in `scripts/add-dts-extensions.mjs`: `.ts/.mts/.cts → .js/.mjs/.cjs`; **`.tsx/.jsx`** decl sibling is `<base>.d.ts` (extension stripped) → emit `<base>.js`; **`.vue/.svelte`** decl sibling is `<name>.vue.d.ts`/`<name>.svelte.d.ts` → append `.js` (keep source ext); leave `.js/.json/.css` untouched; keep extensionless + dir-index behavior. The `existsSync` gate checks the **`.d.ts`** sibling, never the `.js`.
- [ ] Update the script's leading docstring to describe source-extension normalisation and the React-strips-`.tsx` vs Vue-keeps-`.vue` decl-naming difference.
- [ ] `pnpm build`, then `grep -rEl "from ['\"]\.\.?/[^'\"]+\.(ts|tsx|vue|svelte)['\"]"` across all five `dist/` → expect zero.
- [ ] Add `@arethetypeswrong/cli` (pinned) to root devDependencies; add `.attw.json` with `excludeEntrypoints` for the four CSS subpaths on core/react/vue/svelte (per **D-1**); add `check:attw` running `attw --pack` per package with an explicit **esm-only/node16 profile** (so unrelated CJS/node10 findings don't fail the gate).
- [ ] `pnpm check:attw` green (node16-from-ESM + bundler) for all five packages, no `NoResolution` on JS/type entrypoints.
- [ ] Add a `Type resolution gate (attw)` step to `.github/workflows/quality.yml` after the publint step (post-build).
- [ ] (Recommended) Add a `check:typecheck:nodenext` consumer-style fixture so `tsc` also catches the regression; keep `bundler` as the dev default.

**Verify:** `pnpm build`; zero source-ext specifiers in dist; `pnpm check:attw` exits 0; nodenext consumer fixture imports `@vizel/vue`/`@vizel/react` cleanly; `pnpm typecheck` + publint still pass.
**ADR:** No invariant broken; add a short note to the packaging ADR (optional).

#### WI-12 · `build` · raise Node.js baseline to >=24 · P1 · [PR#2] · deps: WI-1, WI-10

**Problem:** Make `>=24` the minimum supported Node runtime, consistent with ADR-0005. Separate from WI-1: this does **not** fix F-C.

- [ ] Create `.nvmrc` and `.node-version`, each containing `24`.
- [ ] Add root `"engines": { "node": ">=24" }` (reconcile `engines.pnpm` with the existing `packageManager: pnpm@11.3.0` pin — omit `engines.pnpm` unless justified).
- [ ] Raise `engines.node` `">=18" → ">=24"` in all five `packages/*/package.json` (line 18).
- [ ] Replace `node-version: lts/*` with `node-version-file: .nvmrc` in `.github/actions/test/action.yml`, `ci.yml` (both steps), `quality.yml`, `deploy-docs.yml`, and **all FIVE** `publish.yml` steps (92, 159, 203, 251, 307 — not four).
- [ ] Per **D-9**, do **not** switch `tsconfig` to `nodenext` here (WI-1 owns that).
- [ ] Write `docs/adr/ADR-0015-node-24-baseline.md`; add its row to `docs/adr/README.md`. Fix `.claude/rules/architecture.md` (its `## Decision records` section has no list — add one or amend the prose). Update the `CLAUDE.md` ADR table, which **already** omits ADR-0013/0014 — add 0013, 0014, **and** 0015.
- [ ] Update `CLAUDE.md:29` ("Use Node.js LTS") and `docs/guide/getting-started.md`, distinguishing **build/toolchain** Node>=24 (advisory `engines`) from **consumer runtime**.

**Verify:** `node --version` = v24.x from `.nvmrc`; six `">=24"` matches; no `lts/*` in `.github`; `pnpm install --frozen-lockfile`, lint, typecheck, build, `check:publishable`, publint all pass on Node 24; publish dry-run resolves Node 24 in every setup-node step.
**ADR:** Create ADR-0015; update README index, architecture rule, CLAUDE.md.

### Phase 1 — Wake the sleeping gates

#### WI-2 · `fix(ct)` · make feature-parity actually enforce parity · P0 · [PR#3] · deps: WI-12

**Problem:** F-A. The `reexportsCore` short-circuit makes the check structurally unable to flag a missing component symbol.

- [ ] Prove the check is asleep: after `pnpm build`, delete e.g. `VizelEmbedView` from `packages/react/dist/index.js` and confirm the current check still passes.
- [ ] Replace the mechanism per **D-2** (hybrid static surface + Core-dist namespace; **not** a runtime import of the Svelte dist, which throws `ERR_PACKAGE_PATH_NOT_EXPORTED` via `@iconify/svelte`). Delete `loadAdapterSurface`, the `reexportsCore` field, and the named-export regexes.
- [ ] The check must FAIL when any framework drops a declared `component`/`companion` symbol; it must still PASS for intentional per-FW-only symbols (Svelte `getVizelTheme`/`createVizel*`, React `use*`).
- [ ] Add a **Svelte-specific** negative regression test (delete a Svelte-declared symbol, e.g. `getVizelIconContext`, confirm FAIL).
- [ ] Reconcile `docs/adr/ADR-0002` Decision text (line 21) with the mechanism that actually ships; do **not** paste the false "dynamically imports each adapter dist" sentence. Update `.claude/rules/feature-manifest.md` CI-verification wording and remove its stale status banner (WI-2 owns these lines).
- [ ] Reorder `quality.yml` so `Build` precedes `Feature manifest parity`; note in `lefthook.yml` that the check self-builds on pre-push.

**Verify:** `pnpm build && pnpm check:feature-parity` passes; symbol-deletion negative test (React **and** Svelte) fails as expected; build-precondition test (`CI=1` + missing dist) exits 1; per-FW-only symbols don't false-fail; lint/typecheck/no-let pass.
**ADR:** Update ADR-0002 to the shipped mechanism. No invariant broken (the wildcard re-export remains).

#### WI-3 · `test(ct)` · retire scenarios/v2 stub, enforce flat-scenario coverage · P0 · [PR#4] · deps: WI-2

**Problem:** F-B. Per **D-3 (B)**: delete the stub layer; make `check:scenarios` prove real coverage.

- [ ] Confirm `scenarios/v2` is dead (`grep -rn "scenarios/v2"` shows only the two live consumers); **delete** `tests/ct/scenarios/v2/`.
- [ ] Rewrite `tests/ct/parity/check-scenarios.ts`: enumerate `tests/ct/scenarios/*.scenario.ts`, assert each exports ≥1 invoked `test*` function, and for each, build the set of frameworks whose specs **import the literal specifier** `../../scenarios/<basename>.scenario` *and* invoke a test fn. Detection keys on the import specifier, not the spec filename (the `Use*`/`Create*` idiom differs per FW).
- [ ] **Also edit `scripts/check-adr-compliance.ts`:** delete/rewrite `checkScenarioFolders()` (lines 515-540) so it no longer asserts `scenarios/v2/<id>/index.ts` presence; update or remove its `CHECKS` entry.
- [ ] Amend `docs/adr/ADR-0012` (dated amendment) superseding Decision bullet 2 (line 19, the "asserts every entry has a folder under `scenarios/v2`" clause) **and** the "v1 flat scenarios removed" clause. Reconcile `.claude/rules/testing.md` + `feature-manifest.md` wording.
- [ ] Negative control: rename `testReplaceAll` in `find-replace.scenario.ts` (or comment its invocation in one FW spec) and confirm `check:scenarios` fails.

**Verify:** `pnpm check:scenarios` exits 0 with a verified count (34); negative control fails; `test -d tests/ct/scenarios/v2` → GONE; `check:ct-parity` still green; `pnpm check:adr-compliance` green (add it to the verify set — most likely to break); real find-replace CT still runs.
**ADR:** Amend ADR-0012.

#### WI-4 · `ci` · gate a11y + md-roundtrip on every PR · P0 · [PR#5] · deps: WI-12

**Problem:** F-G. **Diagnose the real Vue hang first** — the html-reporter theory is falsified (`playwright/lib/reporters/html.js:134` early-returns on `process.env.CI`; `:137` requires `process.stdin.isTTY`).

- [ ] **Reproduce** the actual Vue a11y CI hang on an ubuntu-like env (`CI=1 pnpm exec playwright test -c tests/a11y/vue/playwright-ct.config.ts --project=chromium --reporter=line`) and find the true root cause **before** flipping any gate.
- [ ] Set `reporter: [["html", { open: "never" }]]` in all three a11y configs + the md-roundtrip config; add `PLAYWRIGHT_HTML_OPEN: never` env as belt-and-braces.
- [ ] Resolve the `ctPort 3110` collision between `tests/a11y/react/playwright-ct.config.ts:24` and `tests/markdown-roundtrip/playwright-ct.config.ts:26` before co-scheduling.
- [ ] Add a `md-roundtrip` job to `ci.yml` gated on `needs: changes` / `code == 'true'`, with explicit `timeout-minutes` (mirror a11y's 15).
- [ ] Only **after** the hang is fixed and a green CI run is demonstrated on `main`: change the a11y job from `workflow_dispatch` to `pull_request`, and re-add `a11y` + `md-roundtrip` to `test-summary`'s `needs` (use `needs.<job>.result` directly, not artifacts).
- [ ] Per **D-4**, keep `color-contrast` waived with a tightened dated rationale at `axe.scenario.ts:26-29`. Flip `.claude/rules/testing.md` Pillar 5 to shipped.
- [ ] Coordinate the `ci.yml` edit window with WI-1/WI-10/WI-12 (rebase on the node-floor change).

**Verify:** `CI=1 PLAYWRIGHT_HTML_OPEN=never pnpm test:a11y` exits cleanly with no hung process; `CI=1 pnpm test:md-roundtrip` passes; a draft-PR run shows both jobs triggering on `pull_request` and feeding Test Summary; no a11y config lacks `open: never`.
**ADR:** None required (enforces existing Pillars + Markdown-as-SSOT).

### Phase 2 — Harden enforcement & clean rot

#### WI-7 · `refactor(scripts)` · AST React view-line metric + reactivity-primitive checks · P1 · [PR#6] · deps: WI-2

**Problem:** F-D. The regex measures only the first `return (...)`, returns 0 otherwise, and (via `/^Vizel[A-Z]/`) never measures the flagship `Vizel` component.

- [ ] Add `import ts from "typescript";`. Write `measureReactViewLines(source)` using `ts.createSourceFile`; compute the count as the **union span** of captured JSX node ranges (min `getStart`, max `getEnd`).
- [ ] Change the component-name pattern from `/^Vizel[A-Z]/` to `/^Vizel/` so `Vizel.tsx` (`export function Vizel(`) is measured; also walk **arrow-function** component declarations (`export const VizelX = (...) =>`), not only `ts.isFunctionDeclaration`.
- [ ] Collect JSX from the union of (a) the `Vizel*` component body **and** (b) every non-component helper render fn in the file, so delegating components are not silently zeroed.
- [ ] Replace the React branch of `extractViewBlockLineCount` (`:285-290`) with `measureReactViewLines`; rewrite the JSDoc.
- [ ] Add `checkReactivityPrimitives()` (comment-aware — strip JSDoc first; the tokens appear in comments at react:10/vue:10/svelte:60) asserting `_reactivity.ts` (react) uses `useSyncExternalStore`, (vue) uses `onScopeDispose`, and the Svelte editor-state rune uses `$state.raw` + `createSubscriber`. Append to `CHECKS` **after** WI-2's additions (rebase on WI-2).
- [ ] Per **D-5**: re-run and confirm `VizelColorPicker ~108`, `VizelFindReplace ~91`, `VizelBlockMenu ~81` — all under 120 → keep React at **FAIL** on this green baseline; no component refactor.

**Verify:** `pnpm check:adr-compliance` exits 0; reactivity-probe regression (make the substring check robust to the 2 existing `editor.off(` calls) fails as expected; view-line probe (delete the main return JSX) flags it; `pnpm check` + typecheck pass.
**ADR:** Add a paragraph to ADR-0013 on the AST metric. (ADR-0009 narrative drift is fixed by WI-9.)

#### WI-9 · `docs` · comment-rot, dangling refs, ADR-0009 sync · P1 · [PR#7] · deps: WI-7

**Problem:** F-H.

- [ ] Rewrite `packages/svelte/src/index.ts:20-23` to mirror the correct React/Vue comment (reference `check-feature-parity.ts` + the manifest, not the non-existent `check-cross-framework-parity.ts`).
- [ ] Redirect dangling `cross-framework.md` refs: `.claude/rules/packages/react.md:10`, `vue.md:10`, `.claude/rules/testing.md:43` (→ `check-ct-parity.ts`) and `:57-59` → `feature-manifest.md` / `check-feature-parity.ts`.
- [ ] Delete the obsolete status banner at `.claude/rules/feature-manifest.md:13`.
- [ ] Extend `checkCrossFrameworkRuleRetired` in `check-adr-compliance.ts` to also grep (`['.md','.ts']`) for live references to `cross-framework.md`/`check-cross-framework-parity.ts` (escape the dots). **Allow-list `packages/core/src/feature-manifest.ts`** (+ exclude `*.d.ts`) or the harness FAILs on `main` and blocks lefthook. Drop the `cross-framework-reviewer.md` allow-list entry (it carries no literal match).
- [ ] Append a dated `## Update (2026-06-02)` to `docs/adr/ADR-0009` (don't edit the immutable Decision): `getServerSnapshot` returns `0` not `null`; `subscribe` also attaches `selectionUpdate`; the Svelte selector lives in `createVizelEditorState.svelte.ts`.
- [ ] Update the ADR-0006 row in `docs/adr/ADR-0013:35` (not "~46"); leave the "14 checks" note at `:48`.

**Verify:** `check-adr-compliance` ADR-0006 row = PASS; `grep` for `cross-framework.md`/`check-cross-framework-parity.ts` in `.claude`/src/scripts returns nothing live; lint + typecheck pass.
**ADR:** Update ADR-0009 (dated note) + ADR-0013 (ADR-0006 row).

#### WI-11 · `feat(core)` · enforce manifest ARIA/keyboard contract (static now) · P1 · [PR#8] · deps: WI-2, WI-3 (+ WI-4 for Phase 2)

**Problem:** F-K. Per **D-7 (A-phased)**: static enforcement now; runtime after WI-4.

- [ ] Write `scripts/check-aria-contract.ts`: load the manifest; for each feature with a `role`/non-empty `requiredAttributes`, resolve `feature.adapters[fw].component` → `packages/<fw>/src/components/<Component>.*` and statically assert the role and attributes. Handle **dynamic bindings** (`role={spec.root.role}`, `spec.trigger.attrs[...]`) explicitly via the builder layer. Source the keyboard command-name allow-list from the `commands/registry/` (so it can't rot).
- [ ] **Reconcile all 5 manifest/source role contradictions** (not just bubble-menu): bubble-menu (`manifest:122` menu vs component `toolbar`), toolbar-dropdown (`:208` menu vs `listbox`), node-selector, outline, and find-replace (`role="dialog"` with no `aria-modal` at `VizelFindReplace.tsx:174-175` + Vue/Svelte twins). Decide per case whether to fix the manifest or the component.
- [ ] Add `check:aria-contract` to `package.json`, the `Quality + Parity` job in `quality.yml` (after Feature manifest parity), and `lefthook.yml` pre-push. Sequence with WI-2 (shared job/file).
- [ ] Rewrite `VizelAriaContract`/`VizelKeyboardMap` JSDoc to scope the guarantee to static presence (Phase 1) + planned runtime (Phase 2); remove "must honour" wording. Update `.claude/rules/feature-manifest.md`.
- [ ] **Phase 2 (after WI-4):** add `tests/a11y/scenarios/aria-contract.scenario.ts` (manifest-driven runtime axe/keyboard assertions); flip Pillar 5 to shipped.

**Verify:** `pnpm check:aria-contract` exits 0 after reconciling all 5 roles; negative test (delete an `aria-label`) fails; `git grep 'must honour' feature-manifest.ts` empty; typecheck + lint pass; CI shows a green ARIA/keyboard step.
**ADR:** Update ADR-0002 (static role/attribute now enforced). Effort: **XL**.

### Phase 3 — Refactor the editor surface

#### WI-5 · `fix(core)` · unify error model, surface upload errors · P1 · [PR#9] · deps: WI-2, WI-3

**Problem:** F-F.

- [ ] Add `onError?: (err: VizelError) => void` to `VizelImageUploadPluginOptions` (`plugins/image-upload.ts`); thread it through. At the `.catch` (`image-upload.ts:282-283`) build `new VizelError('UPLOAD_FAILED', ...)`, emit via the editor-level `onError`, **and** still call `onUploadError` (both audiences). Apply the same to the two catch blocks in `image.ts` and the `INVALID_EXTENSION` branch (`image.ts:260-269`).
- [ ] Thread `getOnError` end-to-end: add it to `VizelCreateUploadEventHandlerOptions` (`editorHelpers.ts:114-119`); destructure `onError` in `createVizelEditorInstance` (`editorFactory.ts:146-152`). **React wiring reads `optionsRef.current.editorOptions.onError`** (not `.onError`); Vue `() => editorOptions.onError`; Svelte same. Resolve the `onError` name collision from `VizelImageFeatureOptions extends Partial<VizelImageUploadPluginOptions>` (`types.ts:41`).
- [ ] Convert the 10 `throw new Error` in `plugin-system.ts` (lines 61,64,67,70,101,106,193,199,228,234) → `VizelError('INVALID_CONFIG', ..., { context: { plugin } })`; `lazy-import.ts:49` + `code-block-lowlight.ts:114` → `VizelError('MISSING_OPTIONAL_DEP', ..., { cause, context: { moduleName } })`.
- [ ] Rewrite the `onError` JSDoc at `types.ts:278-303` to match the shipped emit-and-rethrow (init) vs emit-without-rethrow (upload) behavior — the current doc contradicts the code.
- [ ] Add `tests/ct/scenarios/error-model.scenario.ts` (`testUploadFailureReachesOnError`) + `UploadErrorFixture` + `UploadError.spec` for all three frameworks (drive `features.content.image.onUpload` rejecting, assert the error reaches editor-level `onError`). Add a smoke test for the `INVALID_CONFIG` conversion. Update `.claude/rules/packages/core.md` error examples.

**Verify:** typecheck passes with `onError` threaded; lint passes (no new `console.*`); `grep "throw new Error" packages/core/src` returns no hits in the three files; the three UploadError specs pass; `check:ct-parity` balances; `check:ssr` green.
**ADR:** None (implements the existing three-category model). Update core.md examples.

#### WI-6 · `refactor(core)` · remove legacy slash-items, route slash menu through registry · P1 · [PR#10] · deps: WI-2, WI-3, WI-7

**Problem:** F-E. Completes the Section-09 command unification's "out of scope" framework migration + `SlashCommandItem` removal.

- [ ] **Extend the existing `formatVizelShortcut`** at `packages/core/src/utils/keyboard.ts:45` (already exported from `index.ts:529`) to accept `-` keymap notation (`Mod-Alt-1`) and the `VizelShortcutSpec {mac, other}` shape — **do not create a new file**.
- [ ] Redefine `VizelSlashCommand` (`extensions/slash-command.ts`) to take `commands?: readonly VizelCommand[]`; update `addSlashMenuExtension` (`base.ts:152-167`) to pass `commands` (default `vizelDefaultCommands`).
- [ ] Delete `buildVizelSlashMenuSpec` + `VizelSlashItemView` from `builders/slash-menu.ts`; retype `types.ts` slashMenu options from `items: VizelSlashCommandItem[]` → `commands: readonly VizelCommand[]`; retype `createSlashMenuRenderer` in `editorFactory.ts`/`editorHelpers.ts`.
- [ ] **Delete `packages/core/src/commands/slash-items.ts`** (726 lines) and remove the re-exports of `createVizelSlashCommands`, `vizelDefaultSlashCommands`, `vizelDefaultGroupOrder`, `VizelSlashItemView`, `buildVizelSlashMenuSpec` from `core/src/index.ts` + `builders/index.ts`.
- [ ] `pnpm typecheck` to surface every adapter import of the deleted symbols → migrate `VizelSlashMenu` + `VizelSlashMenuItem` + `createVizelSlashMenuRenderer` for React, Vue, Svelte to `VizelCommandSpec` items + id-based select; render shortcuts via `formatVizelShortcut`. Keep each framework's native reactivity (ADR-0009).
- [ ] Document the removed public exports in `docs/guide/migration-v1-to-v2.md`; annotate the Section-09 plan's "out of scope" bullets as completed.

**Verify:** typecheck passes with zero references to the deleted symbols; `grep` for `slash-items`/`VizelSlashCommandItem`/`createVizelSlashCommands`/`vizelDefaultSlashCommands` returns nothing in src; build emits; SlashMenu CT matrix (React/Vue/Svelte) green; `check:feature-parity` + `check:ct-parity` green; lint clean.
**ADR:** None (ADR-0005 authorizes the breaking export removal). ADR-0009 preserved. Effort: **XL**.

#### WI-8 · `refactor(react)` · unify the editor-state selector on `{editor, transaction}` · P1 · [PR#11] · deps: WI-7, WI-9

**Problem:** F-I. Per **D-6 (idiom-first)**: React's `useSyncExternalStore`/`useSelector` idiom takes a single snapshot, and parity requires the selector to read the transaction — so React's selector receives `{ editor, transaction }`. This is the idiomatic React form plus a parity fix, NOT symmetry; the output/delivery stays framework-native. Reframe the docs accordingly (no "same contract three times" / "portable selector" language).

- [ ] Pick the canonical type name across all three adapters (Svelte currently exports `VizelEditorStateSnapshot`, Vue `VizelEditorSnapshot` — unify the name). Add the snapshot interface to `packages/react/src/_reactivity.ts`, track `latestTransaction` in the store, build the snapshot in `getClientSnapshot`. Re-export the type from `packages/react/src/index.ts` **and add the missing re-export to `packages/vue/src/index.ts`**.
- [ ] Change `useVizelEditorState`'s selector param type to the snapshot; migrate the **3** React call sites in `UseVizelEditorStateFixture.tsx` (:28/:34/:52) and the 6 source/demo selectors (`VizelOutline:49`, `VizelToolbarDefault:62`, `VizelFindReplace:70`, `VizelBubbleMenuDefault:62`, `VizelNodeSelector:61`, `apps/demo/react/src/App.tsx:132`) from `(editor) =>` to `({ editor }) =>`.
- [ ] **Resolve the shared-scenario conflict** (`touchesSharedHarness: true`): add a transaction-derived `data-testid` to **all three** fixtures (React/Vue/Svelte `UseVizelEditorState`/`CreateVizelEditorState`) so the shared scenario stays balanced.
- [ ] Fix the false portability JSDoc in `createVizelEditorState.svelte.ts:14-15` and `vue/_reactivity.ts` header. Update ADR-0009 (React bullet :24 + Consequences :32) and ADR-0004 to state the idiom-first rationale: the selector **input** shape converges across adapters as a consequence of each framework's idiom plus feature parity (never for symmetry), while the **return type/delivery diverges idiomatically** (React `T`; Vue `ComputedRef`; Svelte `$derived`). Remove any "same contract three times" / "portable selector" language. Coordinate the F-H ADR-0009 edits with WI-9.
- [ ] Note: the new `export type` line in `packages/react/src/index.ts` is written `from "./_reactivity.ts"` and inherits the F-C fix (WI-1).

**Verify:** typecheck passes (React pkg + demo compile against the new signature; a Vue-style `({ editor }) =>` selector type-checks against React's API); React `UseVizelEditorState.spec.tsx` green incl. the new transaction assertion; Vue/Svelte specs stay green; lint clean; no live "stays portable" claim.
**ADR:** Update ADR-0009 + ADR-0004 (Option A restores, not breaks, the invariant).

#### WI-10 · `build(deps)` · promote @vizel/core to a dependency, dedupe prosemirror · P1 · [PR#12] · deps: WI-1, WI-12

**Problem:** F-J. Per **D-8**: pin `prosemirror-model`.

- [ ] Move `@vizel/core` from `peerDependencies` → `dependencies` (`workspace:^`) in react/vue/svelte `package.json` (realigns code with ADR-0003 / architecture.md:23). Note svelte declares **no** `@tiptap/pm` peer (only `@tiptap/extension-*`).
- [ ] `pnpm why prosemirror-model` etc. to map the real graph: `@tiptap/pm@3.23.6` (root-pinned) + `y-prosemirror@1.3.7` → `prosemirror-model@1.25.4`; the transitive `@tiptap/pm@3.24.0` (via `@tiptap/y-tiptap@3.0.4`) pulls 1.25.7. **Pin only `prosemirror-model` to 1.25.4** in `pnpm-workspace.yaml` overrides (the other leaves are already single-version). Address the `@tiptap/pm`/`@tiptap/core` 3.23.6-vs-3.24.0 split.
- [ ] `pnpm install`; confirm `pnpm why prosemirror-model` resolves exactly one version; commit the regenerated `pnpm-lock.yaml` in the same change (before the frozen-lockfile verify).
- [ ] Add two `check-publishable.ts` guards: (A) `@vizel/core` in `dependencies` and absent from `peerDependencies` of the packed manifest; (B) single `prosemirror-model`.
- [ ] Rewrite `docs/guide/getting-started.md:35-46` peer-dependency admonition (move `@vizel/core`/`@vizel/headless` to transitive); append a dated note to `docs/adr/ADR-0003`. **WI-1 must land before** this PR's build/typecheck step.

**Verify:** node check confirms dep-class move for all three; `pnpm why prosemirror-model | ... | wc -l` = 1; `check:publishable` PASS incl. new guards; `pnpm install --frozen-lockfile` exits 0; build + typecheck + lint + the three CT suites (collaboration exercises ProseMirror) green; getting-started no longer calls `@vizel/core` a peer.
**ADR:** Update ADR-0003 (dated note). Effort: **L**.

---

## Appendix — Adversarial-critique corrections already folded in

Every plan above was marked `needs-revision` by an independent critic; the corrections are already applied here, notably: WI-1 `dependsOn` removed (it is independent of WI-12); WI-2 abandons pure dynamic-import (Svelte-broken); WI-3 must also edit `check-adr-compliance.ts`; WI-4 must reproduce the real Vue hang (html-reporter theory falsified); WI-5 React reads `editorOptions.onError`; WI-6 extends the existing `formatVizelShortcut`; WI-7 regex `/^Vizel[A-Z]/ → /^Vizel/` and a re-baseline showing all React components under 120; WI-9 must allow-list `feature-manifest.ts`; WI-10 pins `prosemirror-model` to 1.25.4 (not 1.25.7); WI-12 has FIVE `publish.yml` steps and must add ADR-0013/0014 to the CLAUDE.md table.
