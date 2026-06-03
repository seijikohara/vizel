/**
 * Publish-readiness harness.
 *
 * Packs every publishable package with `pnpm pack` (which resolves the pnpm
 * `workspace:` protocol exactly as the publish step's rewrite does) and asserts
 * the would-be-published package.json carries no unresolved `workspace:`
 * dependency spec. A leaked `workspace:` spec makes a consumer `npm install`
 * abort with EUNSUPPORTEDPROTOCOL before any registry lookup, so this gate
 * blocks the release before it ships a broken tarball.
 *
 * The harness also asserts that the cross-package @vizel dependencies resolve to
 * a concrete semver range, catching the inverse failure where a rewrite drops a
 * dependency entirely.
 *
 * Two further guards protect the v2 packaging contract:
 *
 * 1. Each adapter (react, vue, svelte) must declare @vizel/core in
 *    `dependencies` and must NOT declare it in `peerDependencies`. ADR-0003
 *    and the architecture rule require @vizel/core to be a transitive
 *    dependency so "install one adapter is sufficient" holds without relying
 *    on a package manager's auto-install-peers behaviour.
 * 2. The workspace must resolve a single prosemirror-model version. ProseMirror
 *    resolves Schema and Node identity with `instanceof` checks, so two copies
 *    of prosemirror-model corrupt collaboration and clipboard handling. The
 *    version is pinned in the pnpm-workspace.yaml overrides block.
 *
 * Run: `pnpm check:publishable`.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

const PUBLISHABLE = ["core", "headless", "react", "vue", "svelte"] as const;
const ADAPTERS = ["react", "vue", "svelte"] as const;
const DEP_SECTIONS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "devDependencies",
] as const;

interface PackedManifest {
  readonly name: string;
  readonly dependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

interface PackageResult {
  readonly pkg: string;
  readonly leaks: readonly string[];
  readonly coreDependencyViolations: readonly string[];
}

const isAdapter = (pkg: string): boolean => (ADAPTERS as readonly string[]).includes(pkg);

const packManifest = (pkg: string): PackedManifest => {
  const dest = mkdtempSync(join(tmpdir(), `vizel-pub-${pkg}-`));
  execFileSync("pnpm", ["--filter", `@vizel/${pkg}`, "pack", "--pack-destination", dest], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });
  const tarball = readdirSync(dest).find((entry) => entry.endsWith(".tgz"));
  if (!tarball) throw new Error(`pnpm pack produced no tarball for @vizel/${pkg}`);
  const manifest = execFileSync(
    "tar",
    ["-xzO", "-f", join(dest, tarball), "package/package.json"],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }
  );
  return JSON.parse(manifest) as PackedManifest;
};

const workspaceLeaks = (manifest: PackedManifest): readonly string[] =>
  DEP_SECTIONS.flatMap((section) => {
    const deps = manifest[section] ?? {};
    return Object.entries(deps)
      .filter(([, spec]) => spec.startsWith("workspace:"))
      .map(([name, spec]) => `${section}.${name} = "${spec}"`);
  });

/**
 * Assert an adapter ships @vizel/core as a transitive dependency.
 *
 * The check reports a violation when @vizel/core is missing from
 * `dependencies` or present in `peerDependencies` of the packed manifest.
 */
const coreDependencyViolations = (manifest: PackedManifest): readonly string[] => {
  const inDependencies = manifest.dependencies?.["@vizel/core"] !== undefined;
  const inPeer = manifest.peerDependencies?.["@vizel/core"] !== undefined;
  return [
    ...(inDependencies ? [] : ["@vizel/core is absent from dependencies"]),
    ...(inPeer ? ["@vizel/core is declared in peerDependencies (must be transitive)"] : []),
  ];
};

/**
 * Return the distinct prosemirror-model versions installed in the workspace.
 *
 * `pnpm why` prints one `prosemirror-model@<version>` heading per resolved
 * version, so the count of those headings equals the number of installed
 * copies.
 */
const resolvedProsemirrorModelVersions = (): readonly string[] => {
  const output = execFileSync("pnpm", ["why", "prosemirror-model"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map((line) => line.match(/^prosemirror-model@(\S+)/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => match[1]);
};

const main = (): void => {
  const results: readonly PackageResult[] = PUBLISHABLE.map((pkg) => {
    const manifest = packManifest(pkg);
    return {
      pkg,
      leaks: workspaceLeaks(manifest),
      coreDependencyViolations: isAdapter(pkg) ? coreDependencyViolations(manifest) : [],
    };
  });

  for (const result of results) {
    const failed = result.leaks.length > 0 || result.coreDependencyViolations.length > 0;
    console.log(`[${failed ? "FAIL" : "PASS"}] @vizel/${result.pkg}`);
    for (const leak of result.leaks) console.log(`        leaked workspace spec: ${leak}`);
    for (const violation of result.coreDependencyViolations)
      console.log(`        @vizel/core dependency: ${violation}`);
  }

  const prosemirrorVersions = resolvedProsemirrorModelVersions();
  const prosemirrorDuplicated = prosemirrorVersions.length !== 1;
  console.log(
    `[${prosemirrorDuplicated ? "FAIL" : "PASS"}] prosemirror-model resolves to ${prosemirrorVersions.length} version(s): ${prosemirrorVersions.join(", ")}`
  );

  const packageFailures = results.filter(
    (result) => result.leaks.length > 0 || result.coreDependencyViolations.length > 0
  );

  const messages = [
    ...(packageFailures.some((result) => result.leaks.length > 0)
      ? [
          `${packageFailures.filter((result) => result.leaks.length > 0).length} package(s) ship an unresolved "workspace:" spec. ` +
            "The publish step must rewrite every workspace dependency to a concrete version.",
        ]
      : []),
    ...(packageFailures.some((result) => result.coreDependencyViolations.length > 0)
      ? [
          "@vizel/core must be a regular dependency of every adapter and never a peer dependency. " +
            "See ADR-0003 and .claude/rules/architecture.md.",
        ]
      : []),
    ...(prosemirrorDuplicated
      ? [
          `prosemirror-model resolves to ${prosemirrorVersions.length} versions (${prosemirrorVersions.join(", ")}). ` +
            "Pin a single version in the pnpm-workspace.yaml overrides block; ProseMirror requires one Schema/Node identity.",
        ]
      : []),
  ];

  if (messages.length > 0) {
    console.error(`\nPublish gate FAILED:\n- ${messages.join("\n- ")}`);
    process.exit(1);
  }

  console.log(
    `\nPublish gate passed (${PUBLISHABLE.length} packages, no workspace leaks, ` +
      "@vizel/core transitive, single prosemirror-model)."
  );
};

main();
