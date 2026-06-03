/**
 * Normalise relative specifiers in emitted `.d.ts` files to the `.js` path
 * Node16 / NodeNext module resolution requires.
 *
 * Two distinct defects produce non-resolvable specifiers, and this post-build
 * step repairs both:
 *
 * 1. Extensionless specifiers. vite-plugin-dts emits `from "./x"`, which
 *    Node16 rejects. The fix appends `.js` for a sibling file or `/index.js`
 *    for a directory.
 * 2. Source-extension specifiers. vue-tsc and vite-plugin-dts emit the
 *    original source extension literally (`from "./_reactivity.ts"`,
 *    `from "./Vizel.tsx"`, `from "./Vizel.vue"`). Node16 / NodeNext reject a
 *    `.ts` / `.tsx` / `.vue` specifier with TS2307 / InternalResolutionError
 *    because the runtime ships `.js`, not the source file. The root tsconfig
 *    uses `moduleResolution: bundler`, which accepts both forms, so
 *    `pnpm typecheck` never surfaces the defect; only a Node16 consumer does.
 *
 * The correct rewrite target depends on how each toolchain names its emitted
 * declaration sibling:
 *
 * - `.ts` / `.mts` / `.cts` swap the extension to `.js` / `.mjs` / `.cjs`.
 * - `.tsx` / `.jsx` strip the extension: TypeScript emits the declaration
 *   sibling as `<base>.d.ts` (React drops `.tsx`), so the runtime is
 *   `<base>.js` (e.g. `./Vizel.tsx` -> `./Vizel.js`).
 * - `.vue` / `.svelte` keep the extension: vue-tsc and the Svelte toolchain
 *   emit `<name>.vue.d.ts` / `<name>.svelte.d.ts`, so the runtime appends
 *   `.js` (e.g. `./Vizel.vue` -> `./Vizel.vue.js`).
 * - `.js` / `.mjs` / `.cjs` / `.json` / `.css` and any other asset extension
 *   stay untouched.
 *
 * The `existsSync` gate checks the `.d.ts` declaration sibling, never a `.js`
 * runtime file: some packages (for example Vue) ship `<name>.vue.d.ts` with
 * no co-located `<name>.vue.js`, so gating on the runtime target would skip a
 * specifier that genuinely needs rewriting.
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

// Map a source extension to the suffixes the rewrite needs. `runtime` is the
// suffix the rewritten specifier carries; `declaration` is the suffix of the
// on-disk `.d.ts` the gate checks. Both attach to the extension-stripped base,
// which is why React's `.tsx` (declaration `.d.ts`, runtime `.js`) and Vue's
// `.vue` (declaration `.vue.d.ts`, runtime `.vue.js`) diverge here.
const SOURCE_EXTENSION_RULES = [
  { match: /\.ts$/, runtime: ".js", declaration: ".d.ts" },
  { match: /\.mts$/, runtime: ".mjs", declaration: ".d.mts" },
  { match: /\.cts$/, runtime: ".cjs", declaration: ".d.cts" },
  // React strips `.tsx`/`.jsx`: the declaration is `<base>.d.ts`.
  { match: /\.tsx$/, runtime: ".js", declaration: ".d.ts" },
  { match: /\.jsx$/, runtime: ".js", declaration: ".d.ts" },
  // Vue and Svelte keep the extension: the declaration is `<name>.vue.d.ts`.
  { match: /\.vue$/, runtime: ".vue.js", declaration: ".vue.d.ts" },
  { match: /\.svelte$/, runtime: ".svelte.js", declaration: ".svelte.d.ts" },
];

const rewriteSourceExtension = (fileDir, specifier, rule) => {
  const base = specifier.replace(rule.match, "");
  // Gate on the declaration sibling, never a `.js` runtime file: some packages
  // (Vue) ship `<name>.vue.d.ts` with no co-located `<name>.vue.js`.
  if (!existsSync(join(fileDir, `${base}${rule.declaration}`))) return specifier;
  return `${base}${rule.runtime}`;
};

const resolveSpecifier = (fileDir, specifier) => {
  const sourceRule = SOURCE_EXTENSION_RULES.find((rule) => rule.match.test(specifier));
  if (sourceRule) return rewriteSourceExtension(fileDir, specifier, sourceRule);
  // Any other extension (.js, .mjs, .cjs, .json, .css, asset) is already a
  // resolvable runtime target; leave it untouched.
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
