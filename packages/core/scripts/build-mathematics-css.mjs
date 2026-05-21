#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises";
/**
 * Build dist/mathematics.css by inlining the KaTeX stylesheet.
 *
 * Sass preserves `@import "katex/dist/katex.min.css"` as a runtime
 * `@import` URL because the path ends with `.css` and is non-relative.
 * That left consumers' bundlers (vite/rolldown demos, the VitePress
 * docs build) trying to resolve `katex/dist/katex.min.css` at build
 * time, which fails whenever katex is not hoisted into the consumer
 * package's `node_modules`. Inlining at this package's build time
 * removes the runtime resolution requirement.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../dist");
const dest = resolve(distDir, "mathematics.css");

const require = createRequire(import.meta.url);
const katexCssPath = require.resolve("katex/dist/katex.min.css");

await mkdir(distDir, { recursive: true });
await copyFile(katexCssPath, dest);
