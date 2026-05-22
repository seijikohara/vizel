#!/usr/bin/env tsx
/**
 * Post-process the Markdown output of typedoc so that VitePress's Vue
 * compiler does not choke on JSDoc text fragments such as bare HTML-tag
 * names appearing outside fenced code blocks.
 *
 * VitePress runs Markdown through Vue's template compiler after
 * markdown-it. Bare angle-bracketed text outside a fenced code block
 * becomes a Vue element node, which fails with "Element is missing end
 * tag" or gets silently rewritten as an empty tag. markdown-it does
 * not escape such fragments because the source is technically valid
 * Markdown.
 *
 * Strategy: walk each generated Markdown file, leave fenced code
 * blocks (``` and ~~~) and indented code blocks alone, and escape
 * `<` and `>` to the HTML entities elsewhere. This is purely cosmetic
 * for the rendered prose — readers see exactly the same characters
 * either way — but it lets the Vue compiler proceed.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const GENERATED_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "docs",
  "api",
  "generated"
);

interface WalkAcc {
  readonly files: string[];
}

async function walkMarkdown(dir: string, acc: WalkAcc): Promise<WalkAcc> {
  const entries = await readdir(dir, { withFileTypes: true });
  const next = await entries.reduce<Promise<WalkAcc>>(async (pending, entry) => {
    const carrier = await pending;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkMarkdown(full, carrier);
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      return { files: [...carrier.files, full] };
    }
    return carrier;
  }, Promise.resolve(acc));
  return next;
}

function escapeProseAngleBrackets(markdown: string): string {
  const lines = markdown.split("\n");
  type State = { inFence: boolean; fence: string | null };

  const result = lines.reduce<{ state: State; output: string[] }>(
    (carrier, line) => {
      const fenceMatch = /^(```+|~~~+)/.exec(line);
      if (fenceMatch && fenceMatch[1]) {
        if (!carrier.state.inFence) {
          return {
            state: { inFence: true, fence: fenceMatch[1] },
            output: [...carrier.output, line],
          };
        }
        if (line.startsWith(carrier.state.fence ?? "")) {
          return {
            state: { inFence: false, fence: null },
            output: [...carrier.output, line],
          };
        }
        return { state: carrier.state, output: [...carrier.output, line] };
      }

      if (carrier.state.inFence) {
        return { state: carrier.state, output: [...carrier.output, line] };
      }

      // Skip indented code blocks (4+ space prefix on otherwise-blank prose).
      if (/^ {4}\S/.test(line)) {
        return { state: carrier.state, output: [...carrier.output, line] };
      }

      // Replace `<` / `>` with HTML entities, but keep inline code spans
      // (backtick-wrapped) intact — backticks already prevent Vue compiler
      // parsing.
      const segments = line.split(/(`+[^`]*`+)/g);
      const escaped = segments
        .map((segment) => {
          if (segment.startsWith("`")) return segment;
          return segment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        })
        .join("");
      return { state: carrier.state, output: [...carrier.output, escaped] };
    },
    { state: { inFence: false, fence: null }, output: [] }
  );

  return result.output.join("\n");
}

async function main(): Promise<void> {
  const { files } = await walkMarkdown(GENERATED_ROOT, { files: [] });
  await Promise.all(
    files.map(async (file) => {
      const before = await readFile(file, "utf8");
      const after = escapeProseAngleBrackets(before);
      if (after !== before) {
        await writeFile(file, after, "utf8");
      }
    })
  );
}

main().catch((err: unknown) => {
  process.exitCode = 1;
  throw err;
});
