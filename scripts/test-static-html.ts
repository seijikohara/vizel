#!/usr/bin/env tsx
/**
 * SSR static rendering smoke test.
 *
 * Drives `generateVizelStaticHtml` against a handful of canonical
 * Markdown samples and asserts the produced HTML contains the
 * expected DOM markers. Replaces a full unit-test harness (Vitest)
 * with a Node-only script so the SSR path stays exercised in CI
 * without adding another test runner dependency.
 *
 * Exit code is 0 on success, 1 on any assertion failure.
 */

import {
  generateVizelStaticHtml,
  vizelGfmFlavor,
  vizelObsidianFlavor,
} from "../packages/core/src/index.ts";

interface StaticHtmlCase {
  readonly name: string;
  readonly markdown: string;
  readonly mustInclude: readonly string[];
  readonly mustNotInclude?: readonly string[];
  readonly flavor?: "gfm" | "obsidian";
}

const CASES: readonly StaticHtmlCase[] = [
  {
    name: "heading and paragraph",
    markdown: "# Hello SSR\n\nFirst paragraph.",
    mustInclude: [
      `<div class="vizel-static" data-vizel-static="true">`,
      "<h1>Hello SSR</h1>",
      "<p>First paragraph.</p>",
    ],
  },
  {
    name: "bullet list",
    markdown: "- one\n- two\n- three\n",
    mustInclude: ["<ul", "<li>", "one", "two", "three"],
  },
  {
    name: "ordered list",
    markdown: "1. first\n2. second\n3. third\n",
    mustInclude: ["<ol", "<li>", "first", "second", "third"],
  },
  {
    name: "fenced code block (js)",
    markdown: "```js\nconsole.log('hi');\n```\n",
    mustInclude: ["<pre", "<code", "language-js"],
  },
  {
    name: "mermaid fenced block stays a code block on the server",
    markdown: "```mermaid\ngraph TD;\nA-->B;\n```\n",
    // Diagram nodes must NOT render to a diagram on the server — Section 12
    // promises the client hydrates them later. Verify the source survives
    // verbatim inside a <code> element with the language tag.
    mustInclude: ["<pre", "<code", "language-mermaid", "graph TD"],
    mustNotInclude: ["<svg"],
  },
  {
    name: "link inside paragraph",
    markdown: "See [the docs](https://example.com/docs) for details.",
    mustInclude: [`<a `, `href="https://example.com/docs"`, "the docs"],
  },
  {
    name: "image inside paragraph",
    markdown: "![alt text](https://example.com/cat.png)",
    mustInclude: [`<img `, `src="https://example.com/cat.png"`, `alt="alt text"`],
  },
  {
    name: "mention plus wiki-link survive without crashing",
    flavor: "obsidian",
    markdown: "Hello @alice — see [[Welcome Page]] for next steps.",
    // The exact serialization depends on flavor wiring; we only assert that
    // the wrapper exists and the surrounding paragraph survives so the path
    // does not throw for these lossy node types.
    mustInclude: [`<div class="vizel-static" data-vizel-static="true">`, "Hello", "next steps"],
  },
];

interface CaseFailure {
  readonly name: string;
  readonly message: string;
  readonly html: string;
}

async function runCase(testCase: StaticHtmlCase): Promise<CaseFailure | null> {
  const flavor = testCase.flavor === "obsidian" ? vizelObsidianFlavor : vizelGfmFlavor;
  const html = await generateVizelStaticHtml({
    markdown: testCase.markdown,
    flavor,
  });

  const missing = testCase.mustInclude.filter((needle) => !html.includes(needle));
  if (missing.length > 0) {
    return {
      name: testCase.name,
      message: `output is missing required substrings: ${missing.map((s) => JSON.stringify(s)).join(", ")}`,
      html,
    };
  }

  const forbidden = (testCase.mustNotInclude ?? []).filter((needle) => html.includes(needle));
  if (forbidden.length > 0) {
    return {
      name: testCase.name,
      message: `output unexpectedly contains: ${forbidden.map((s) => JSON.stringify(s)).join(", ")}`,
      html,
    };
  }

  return null;
}

async function main(): Promise<void> {
  const results = await Promise.all(CASES.map((testCase) => runCase(testCase)));
  const failures = results.filter((result): result is CaseFailure => result !== null);

  if (failures.length === 0) {
    process.stdout.write(`SSR static HTML check passed (${CASES.length} cases).\n`);
    process.exit(0);
  }

  process.stderr.write(
    `SSR static HTML check failed (${failures.length}/${CASES.length} cases):\n\n`
  );
  for (const failure of failures) {
    process.stderr.write(`- ${failure.name}: ${failure.message}\n`);
    process.stderr.write(`  HTML: ${failure.html}\n\n`);
  }
  process.exit(1);
}

main().catch((err: unknown) => {
  process.stderr.write(`SSR static HTML check threw: ${String(err)}\n`);
  if (err instanceof Error && err.stack) {
    process.stderr.write(`${err.stack}\n`);
  }
  process.exit(1);
});
