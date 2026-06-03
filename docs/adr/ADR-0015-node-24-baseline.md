# ADR-0015: Node.js 24 runtime baseline

- **Status**: Accepted
- **Date**: 2026-06-03
- **Targets**: v2.0.0

## Context

Vizel v2.0.0 abandons backward compatibility (ADR-0005). The release carries no compatibility shim and supports one set of idioms. The toolchain inherits the same stance: contributors and Continuous Integration (CI) run a single, current Node.js version rather than a transition window across several releases.

Before this decision, the five published packages each declared `engines.node` as `>=18`, the root `package.json` declared no `engines` field at all, and every `actions/setup-node` step resolved `node-version: lts/*`. The floating `lts/*` selector drifts whenever a new Node.js Long-Term Support (LTS) line ships, so two CI runs can execute on different Node.js versions. The mismatch between the `>=18` floor and the version contributors actually run hides Node-18-incompatible code until a consumer reports it.

Two prior constraints shape this decision:

- Decision D-9 keeps every `tsconfig` on `moduleResolution: bundler`. WI-1 already fixed declaration emission to stay Node16-resolvable without switching any `tsconfig` to `nodenext`. A TypeScript resolution mode is not a runtime version, so the runtime floor moves independently.
- Decision M-1 is locked: CI tests on Node 24 only. The repository ships no 18/20/22 transition window.

## Decision

Vizel adopts Node.js 24 as the minimum supported toolchain runtime. The repository pins one version for contributors and CI and declares the floor across every manifest.

Concretely:

- The root `package.json` and the five package manifests under `packages/{core,headless,react,vue,svelte}/` declare `"engines": { "node": ">=24" }`.
- The root pins the Node.js version through `.nvmrc` and `.node-version`, both containing `24`, so nvm, fnm, asdf, and mise resolve the same version.
- Every `actions/setup-node` step reads `node-version-file: .nvmrc` instead of `node-version: lts/*`. CI runs on Node 24 only; the CI matrix varies framework and browser, not Node.js version.
- The root declares no `engines.pnpm`. The `packageManager` field (`pnpm@11.3.0`) already pins the package manager; a second `engines.pnpm` constraint would duplicate and risk conflicting with that pin.
- `engines.node` is advisory toolchain guidance. The field governs the environment that builds, tests, and publishes Vizel. It does not gate the Node.js version of a consumer application that installs `@vizel/react`, `@vizel/vue`, or `@vizel/svelte`. A consumer app chooses its own runtime; npm emits a warning, not an error, when a consumer's Node.js version falls below the declared floor.
- This runtime floor is independent of the WI-1 declaration fix. Node16 and NodeNext name a module-resolution mode, not a runtime version. WI-1 keeps `moduleResolution: bundler` per Decision D-9; this decision changes only the runtime floor.

## Consequences

Positive:

- Contributors and CI run one Node.js version. The pinned `.nvmrc` removes the `lts/*` drift between runs.
- The codebase targets a known runtime. Authors rely on Node 24 APIs without compatibility guards for Node 18, 20, or 22.
- The advisory floor signals the supported toolchain without forcing a consumer's runtime, matching the zero-backward-compat stance for tooling while keeping the published packages broadly installable.

Negative:

- Contributors on Node.js below 24 must upgrade. The pinned `.nvmrc` and `.node-version` make the required version explicit and machine-resolvable.
- A consumer who reads `engines.node` as a hard requirement may believe the packages demand Node 24 at runtime. The advisory distinction above documents the intent; the README and getting-started guide repeat it.

Follow-up:

- Future Node.js majors raise the floor through a new dated `## Update` section on this record or a superseding ADR, never a silent `lts/*` reintroduction.

## References

- Work item: WI-12 (Node 24 runtime baseline).
- Related: [ADR-0005](./ADR-0005-v2-breaking-release.md) for the zero-backward-compat stance, and the WI-1 declaration fix that keeps `moduleResolution: bundler` under Decision D-9.
- External: [actions/setup-node `node-version-file`](https://github.com/actions/setup-node#usage), [npm `engines` field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#engines).
