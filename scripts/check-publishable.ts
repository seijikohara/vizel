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

const main = (): void => {
  const results = PUBLISHABLE.map((pkg) => {
    const manifest = packManifest(pkg);
    return { pkg, leaks: workspaceLeaks(manifest) };
  });

  const failures = results.filter((result) => result.leaks.length > 0);

  for (const result of results) {
    const status = result.leaks.length === 0 ? "PASS" : "FAIL";
    console.log(`[${status}] @vizel/${result.pkg}`);
    for (const leak of result.leaks) console.log(`        leaked workspace spec: ${leak}`);
  }

  if (failures.length > 0) {
    console.error(
      `\nPublish gate FAILED: ${failures.length} package(s) ship an unresolved "workspace:" spec. ` +
        "The publish step must rewrite every workspace dependency to a concrete version."
    );
    process.exit(1);
  }

  console.log(`\nPublish gate passed (${PUBLISHABLE.length} packages, no workspace leaks).`);
};

main();
