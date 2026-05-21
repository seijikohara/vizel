#!/usr/bin/env node
/**
 * Post-build step: copy core CSS bundles into this package's dist/.
 *
 * The CSS source lives in @vizel/core/src/styles/ and is built into
 * @vizel/core/dist/. To let consumers write
 * `import "@vizel/svelte/styles.css"`, this script copies the built
 * CSS into @vizel/svelte/dist/ where the package.json subpath exports
 * point.
 *
 * Layout mirrors @vizel/core's three-pattern split (Section 6c / §13
 * of the v2.0 design):
 *
 * - `dist/styles.css` — full bundle.
 * - `dist/styles/variables.css` — token catalog only.
 * - `dist/styles/components.css` — component styles only.
 * - `dist/mathematics.css` — KaTeX stylesheet.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../dist");
const coreDistDir = resolve(here, "../../core/dist");

const copies = [
  { src: "styles.css", dest: "styles.css" },
  { src: "styles/variables.css", dest: "styles/variables.css" },
  { src: "styles/components.css", dest: "styles/components.css" },
  { src: "mathematics.css", dest: "mathematics.css" },
];

await mkdir(distDir, { recursive: true });
await mkdir(resolve(distDir, "styles"), { recursive: true });

await Promise.all(
  copies.map(async ({ src, dest }) => {
    const source = resolve(coreDistDir, src);
    const target = resolve(distDir, dest);
    await copyFile(source, target);
    console.log(`Copied ${src} from @vizel/core/dist/ to dist/${dest}`);
  })
);
