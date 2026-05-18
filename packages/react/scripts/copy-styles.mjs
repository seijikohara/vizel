#!/usr/bin/env node
/**
 * Post-build step: copy core CSS bundles into this package's dist/.
 *
 * The CSS source lives in @vizel/core/src/styles/ and is built into
 * @vizel/core/dist/*.css. To let consumers write
 * `import "@vizel/react/styles.css"` instead of pulling from
 * @vizel/core directly, this script copies the built CSS into
 * @vizel/react/dist/ where the package.json subpath exports point.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../dist");
const coreDistDir = resolve(here, "../../core/dist");

const files = ["styles.css", "components.css", "mathematics.css"];

await mkdir(distDir, { recursive: true });

await Promise.all(
  files.map(async (name) => {
    const source = resolve(coreDistDir, name);
    const target = resolve(distDir, name);
    await copyFile(source, target);
    console.log(`Copied ${name} from @vizel/core/dist/ to dist/`);
  })
);
