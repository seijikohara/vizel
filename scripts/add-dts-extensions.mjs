/**
 * Add explicit `.js` extensions to relative imports in emitted `.d.ts` files.
 *
 * vite-plugin-dts emits extensionless relative specifiers (`from "./x"`), which
 * TypeScript's node16 / nodenext module resolution rejects. This post-build step
 * rewrites every relative specifier in each package's dist `.d.ts` to the form
 * node16 requires: `./x.js` for a sibling file or `./x/index.js` for a directory.
 * Bundler resolution already accepts both forms, so the rewrite is safe across
 * every consumer.
 *
 * Usage: node scripts/add-dts-extensions.mjs <dist dir> [<dist dir> ...]
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const collectDtsFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectDtsFiles(full);
    return entry.name.endsWith(".d.ts") ? [full] : [];
  });

const resolveSpecifier = (fileDir, specifier) => {
  // Already extensioned (.js, .json, .css, ...) — leave untouched.
  if (/\.[a-z]+$/i.test(specifier)) return specifier;
  if (existsSync(join(fileDir, `${specifier}.d.ts`))) return `${specifier}.js`;
  const asDir = join(fileDir, specifier);
  if (existsSync(asDir) && statSync(asDir).isDirectory() && existsSync(join(asDir, "index.d.ts"))) {
    return `${specifier}/index.js`;
  }
  return specifier;
};

const REL_SPECIFIER =
  /(from\s+|import\(\s*|export\s+\*\s+from\s+|export\s+\{[^}]*\}\s+from\s+)(["'])(\.\.?\/[^"']+)\2/g;

const rewriteFile = (file) => {
  const fileDir = dirname(file);
  const source = readFileSync(file, "utf8");
  const next = source.replace(REL_SPECIFIER, (match, prefix, quote, specifier) => {
    const resolved = resolveSpecifier(fileDir, specifier);
    return resolved === specifier ? match : `${prefix}${quote}${resolved}${quote}`;
  });
  if (next === source) return 0;
  writeFileSync(file, next);
  return 1;
};

const main = () => {
  const dirs = process.argv.slice(2).filter((arg) => existsSync(arg));
  if (dirs.length === 0) {
    console.error("Usage: node scripts/add-dts-extensions.mjs <dist dir> [<dist dir> ...]");
    process.exit(1);
  }
  const changed = dirs
    .flatMap((dir) => collectDtsFiles(dir))
    .reduce((sum, file) => sum + rewriteFile(file), 0);
  console.log(
    `Added .js extensions in ${changed} declaration file(s) across ${dirs.length} dir(s).`
  );
};

main();
