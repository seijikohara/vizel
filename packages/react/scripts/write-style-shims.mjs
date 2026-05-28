#!/usr/bin/env node
/**
 * Post-build step: emit re-export shims that defer to @vizel/core/styles.css.
 *
 * ADR-0008 establishes @vizel/core/styles.css as the single CSS source of
 * truth. Each adapter must NOT ship its own copy of the catalogue, because
 * the duplication forces a token edit to touch three identical files.
 *
 * Node's exports field rejects bare specifiers like "@vizel/core/styles.css"
 * (ERR_INVALID_PACKAGE_TARGET). The exports value must be a relative path.
 * This script writes a one-line CSS shim at dist/styles.css that consumes the
 * Core catalogue via @import; the consumer's bundler resolves the @import
 * through the workspace's @vizel/core dependency. The adapter therefore
 * carries a few bytes of redirection metadata while the catalogue itself
 * lives only in @vizel/core/dist/styles.css.
 *
 * The four shim files mirror @vizel/core's subpath layout so that
 * consumers can pick the slice they need (full, variables-only,
 * components-only, KaTeX-only) without changing the adapter import.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../dist");

// Each entry maps an adapter subpath to the @vizel/core subpath the shim
// re-exports. The dest is package-relative; the src is the bare module
// specifier resolved at consumer build time.
const shims = [
  { src: "@vizel/core/styles.css", dest: "styles.css" },
  { src: "@vizel/core/styles/variables.css", dest: "styles/variables.css" },
  { src: "@vizel/core/styles/components.css", dest: "styles/components.css" },
  { src: "@vizel/core/mathematics.css", dest: "mathematics.css" },
];

await mkdir(distDir, { recursive: true });
await mkdir(resolve(distDir, "styles"), { recursive: true });

await Promise.all(
  shims.map(async ({ src, dest }) => {
    const target = resolve(distDir, dest);
    // The leading sentinel comment helps the ADR-0008 harness detect that
    // the file is a re-export, not a stale copy of the catalogue.
    const body = `/* ADR-0008: re-export of @vizel/core/styles.css; do not edit. */\n@import "${src}";\n`;
    await writeFile(target, body);
    console.log(`Wrote ${dest} -> ${src}`);
  })
);
