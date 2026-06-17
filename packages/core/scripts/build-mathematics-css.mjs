#!/usr/bin/env node
import { copyFile, cp, mkdir } from "node:fs/promises";
/**
 * Build dist/mathematics.css by inlining the KaTeX stylesheet and copying
 * its glyph fonts alongside it.
 *
 * Sass preserves `@import "katex/dist/katex.min.css"` as a runtime
 * `@import` URL because the path ends with `.css` and is non-relative.
 * That left consumers' bundlers (vite/rolldown demos, the VitePress
 * docs build) trying to resolve `katex/dist/katex.min.css` at build
 * time, which fails whenever katex is not hoisted into the consumer
 * package's `node_modules`. Inlining at this package's build time
 * removes the runtime resolution requirement.
 *
 * The KaTeX stylesheet references its glyph fonts via `url(fonts/KaTeX_*)`
 * relative to itself, so the font directory must sit next to the emitted
 * CSS. Without the copy every consumer requests `fonts/KaTeX_*` from the
 * wrong location, the request 404s, and math renders with broken fallback
 * glyphs.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../dist");
const dest = resolve(distDir, "mathematics.css");

const require = createRequire(import.meta.url);
const katexCssPath = require.resolve("katex/dist/katex.min.css");
const katexFontsDir = resolve(dirname(katexCssPath), "fonts");

await mkdir(distDir, { recursive: true });
await copyFile(katexCssPath, dest);
await cp(katexFontsDir, resolve(distDir, "fonts"), { recursive: true });
