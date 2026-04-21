#!/usr/bin/env node
/**
 * Post-build step: compile raw .svelte files in dist/ to .js modules.
 *
 * Shipping raw .svelte files requires consumers to run the Svelte
 * transform before any barrel file that re-exports their default bindings
 * is evaluated. Under Vite 8 + SvelteKit 2 that ordering cannot be
 * guaranteed, which results in "Indirectly exported binding name 'default'
 * cannot be resolved by star export entries". Compiling the components
 * ahead of time eliminates the ordering requirement.
 *
 * The output uses the plain .js extension (not .svelte.js) because
 * vite-plugin-svelte reserves the .svelte.js suffix for rune modules and
 * attempts to compile them again, which fails on already-compiled output.
 */
import { readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";

const distDir = fileURLToPath(new URL("../dist", import.meta.url));

async function findFilesWithSuffix(dir, suffix) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findFilesWithSuffix(full, suffix)));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      files.push(full);
    }
  }
  return files;
}

async function compileFile(file) {
  const source = await readFile(file, "utf8");
  const result = compile(source, {
    filename: file,
    generate: "client",
    dev: false,
    css: "external",
    runes: true,
  });
  const outPath = file.replace(/\.svelte$/, ".js");
  await writeFile(outPath, result.js.code);
  await rm(file);
  return { file, outPath };
}

async function renameTypeFile(file) {
  const target = file.replace(/\.svelte\.d\.ts$/, ".d.ts");
  await rename(file, target);
  const mapFile = `${file}.map`;
  try {
    const mapSource = await readFile(mapFile, "utf8");
    await writeFile(`${target}.map`, mapSource);
    await rm(mapFile);
  } catch {
    // Source map is optional; ignore if missing.
  }
}

async function rewriteBarrels(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteBarrels(full);
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts"))) {
      const content = await readFile(full, "utf8");
      const updated = content.replace(/(["'])(\.\.?\/[^"']*?)\.svelte\1/g, "$1$2.js$1");
      if (updated !== content) {
        await writeFile(full, updated);
      }
    }
  }
}

const svelteFiles = await findFilesWithSuffix(distDir, ".svelte");
await Promise.all(svelteFiles.map(compileFile));

const typeFiles = await findFilesWithSuffix(distDir, ".svelte.d.ts");
await Promise.all(typeFiles.map(renameTypeFile));

await rewriteBarrels(distDir);

console.log(`Compiled ${svelteFiles.length} Svelte components to .js`);
for (const f of svelteFiles) {
  console.log(`  ${relative(distDir, f)} → ${relative(distDir, f.replace(/\.svelte$/, ".js"))}`);
}
