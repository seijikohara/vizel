# Lint-Instructions Skill Examples

Concrete invocation patterns for the `lint-instructions` skill.

## Run before opening a pull request

The skill enumerates every rule that matches the changed files, then reports passes, violations, and warnings. Run it once the implementation is feature-complete and before requesting review.

## Verify writing style across documentation changes

When the change scope is `docs/**`, the skill loads `writing.md` and `git.md`. The skill checks active voice, present tense, ambiguous pronouns, and Conventional Commits.

## Verify cross-framework parity after adding a feature

When the change touches `packages/{react,vue,svelte}/`, the skill loads `feature-manifest.md` plus the per-framework rule. The skill confirms the manifest carries the new feature, every adapter exports the declared symbol, and the scenario folder exists.

## Verify code style after refactoring

When the change touches `packages/**` or `apps/**`, the skill loads `code-style.md`. The skill confirms `function` declarations, `satisfies` over annotations, type guards instead of `as` casts, and JSDoc on public APIs.

## Drive the report into action

The report sections (`Passing`, `Violations`, `Warnings`) map directly onto the work to do:

- For each violation, apply the suggested fix or escalate.
- For each warning, decide whether the case is genuine or a false positive; document the call in the pull-request body when accepting a warning.
- For each passing item, no action; the skill keeps the entry visible to reassure the reviewer that the rule was actively checked.
