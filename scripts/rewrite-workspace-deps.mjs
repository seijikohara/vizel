/**
 * Rewrite pnpm `workspace:` dependency specs to concrete versions before
 * `npm publish`.
 *
 * `npm publish` does not understand the pnpm `workspace:` protocol, so any
 * `workspace:` spec ships verbatim and aborts a consumer install with
 * EUNSUPPORTEDPROTOCOL. The CI publish jobs run this script over each package
 * before publishing so @vizel/core and @vizel/headless resolve to the release
 * version. `pnpm pack` / `pnpm publish` perform the same rewrite; this keeps the
 * proven `npm publish --provenance` (OIDC) path while removing the brittle
 * hand-rolled sed.
 *
 * Plain ESM (.mjs) so it runs on any Node the publish jobs provide without
 * type-stripping support.
 *
 * Usage: node scripts/rewrite-workspace-deps.mjs <package.json path> <version>
 */

import { readFileSync, writeFileSync } from "node:fs";

const DEP_SECTIONS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "devDependencies",
];

const resolveSpec = (spec, version) => {
  // pnpm protocol: workspace:^ -> ^<version>, workspace:~ -> ~<version>,
  // workspace:* -> <version>, workspace:<range> -> <range>.
  if (!spec.startsWith("workspace:")) return spec;
  const rest = spec.slice("workspace:".length);
  if (rest === "^" || rest === "~") return `${rest}${version}`;
  if (rest === "*" || rest === "") return version;
  return rest;
};

const rewriteSection = (section, version) => {
  if (!section) return { next: section, changed: [] };
  const entries = Object.entries(section);
  const changed = entries
    .filter(([, spec]) => spec.startsWith("workspace:"))
    .map(([name, spec]) => `${name}: ${spec} -> ${resolveSpec(spec, version)}`);
  const next = Object.fromEntries(
    entries.map(([name, spec]) => [name, resolveSpec(spec, version)])
  );
  return { next, changed };
};

const main = () => {
  const [manifestPath, version] = process.argv.slice(2);
  if (!(manifestPath && version)) {
    console.error("Usage: node scripts/rewrite-workspace-deps.mjs <package.json path> <version>");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const rewritten = DEP_SECTIONS.map((section) => {
    const result = rewriteSection(manifest[section], version);
    if (result.next !== undefined) manifest[section] = result.next;
    return { section, changed: result.changed };
  });

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const allChanged = rewritten.flatMap((entry) =>
    entry.changed.map((line) => `${entry.section}.${line}`)
  );
  if (allChanged.length === 0) {
    console.log(`No workspace specs in ${manifestPath}`);
    return;
  }
  console.log(`Rewrote ${allChanged.length} workspace spec(s) in ${manifestPath}:`);
  for (const line of allChanged) console.log(`  ${line}`);
};

main();
