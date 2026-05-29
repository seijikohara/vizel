# Architecture Decision Records

This directory records the architectural decisions that shape Vizel v2.0.0. Each record documents the context that motivated the decision, the decision itself, and the consequences that follow.

## Conventions

- Records use the `ADR-NNNN-kebab-case-title.md` naming pattern. `NNNN` is a four-digit number that increases monotonically.
- Status values are `Proposed`, `Accepted`, `Superseded`, or `Deprecated`. A superseded record links forward to the record that replaces it.
- Records describe one decision each. Bundle related decisions into separate records and cross-link.
- A record's **Decision** is immutable after acceptance. Reversing or replacing a Decision lands as a new record that supersedes the earlier one; the superseded record links forward to its replacement.
- A factual correction that leaves the Decision's intent intact — a renamed script, a moved path, a clarified mechanism — lands as a dated `## Update` section appended to the record, or as an inline fix when the original wording is simply wrong.

## Index

| ID | Title | Status |
|----|-------|--------|
| [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md) | Feature parity over API symmetry | Accepted |
| [ADR-0002](./ADR-0002-feature-manifest-as-parity-ssot.md) | Feature manifest as parity SSOT | Accepted |
| [ADR-0003](./ADR-0003-vizel-headless-package.md) | `@vizel/headless` as a transitive package | Accepted |
| [ADR-0004](./ADR-0004-per-framework-idiomatic-api.md) | Per-framework idiomatic API contract | Accepted |
| [ADR-0005](./ADR-0005-v2-breaking-release.md) | v2.0.0 as a breaking release | Accepted |
| [ADR-0006](./ADR-0006-retire-cross-framework-rule.md) | Retire `cross-framework.md` | Accepted |
| [ADR-0007](./ADR-0007-component-size-and-controller-delegation.md) | 120-line component size rule and controller delegation | Accepted |
| [ADR-0008](./ADR-0008-css-belongs-in-core.md) | CSS belongs in `@vizel/core`; adapters re-export | Accepted |
| [ADR-0009](./ADR-0009-first-party-editor-reactivity.md) | First-party editor reactivity in every adapter | Accepted |
| [ADR-0010](./ADR-0010-claude-config-official-format.md) | `.claude/` artefacts follow Anthropic's official reference | Accepted |
| [ADR-0011](./ADR-0011-technical-writing-style.md) | Technical-writing style governs every artefact | Accepted |
| [ADR-0012](./ADR-0012-playwright-ct-three-layer-rebuild.md) | Playwright Component Tests rebuilt in three layers | Accepted |
| [ADR-0013](./ADR-0013-adr-compliance-harness.md) | ADR compliance harness | Accepted |
| [ADR-0014](./ADR-0014-bundle-size-budgets.md) | Bundle-size budgets per package | Accepted |

## Template

```markdown
# ADR-NNNN: Title in sentence case

- **Status**: Proposed | Accepted | Superseded | Deprecated
- **Date**: YYYY-MM-DD
- **Targets**: vN.M (release that adopts the decision)

## Context

Describe the problem, the constraints, and the prior state. State the forces in play.

## Decision

State the decision in the active voice. One paragraph, then bullets that enumerate the binding rules.

## Consequences

List the trade-offs the decision accepts. Separate positive and negative outcomes. Identify follow-up work and risks.

## References

Link to the plan, related ADRs, external standards, and prior discussions.
```
