/**
 * Shared axe-core scan for the Pillar 5 a11y suite (Vitest Browser Mode).
 *
 * Each per-framework spec renders a fixture, then defers to
 * {@link expectNoVizelA11yViolations} to run `axe-core` against the
 * `.vizel-root` subtree. The test runs inside the browser, so it calls
 * `axe.run` directly on the rendered DOM rather than through the
 * `@axe-core/playwright` runner. The helper asserts WCAG 2.1 AA conformance
 * and prints the violation list on failure so the diff alone identifies the
 * regression.
 */
import axe from "axe-core";
import { expect } from "vitest";

/**
 * Rules disabled across every Vizel a11y scan.
 *
 * - `region`: Component fixtures render no `<main>` landmark; the production
 *   host page owns the document-level landmark structure. axe-core flags every
 *   standalone widget without one, which is noise here.
 * - `color-contrast`: axe-core color sampling against the editor placeholder is
 *   unreliable inside the test iframe because the background blends with the
 *   host page. Contrast tokens are validated separately at design time.
 * - `aria-input-field-name`: Tiptap's ProseMirror root advertises
 *   `role="textbox"` but leaves naming to the host application. The fixture has
 *   no surrounding chrome, so this rule fires unconditionally and reflects a
 *   host-page responsibility rather than a Vizel defect.
 */
const DISABLED_RULES: readonly string[] = ["region", "color-contrast", "aria-input-field-name"];

/** WCAG conformance tags axe-core checks for. WCAG 2.1 AA is the Pillar 5 target. */
const WCAG_TAGS: readonly string[] = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface AxeRunOptions {
  /**
   * CSS selector for the subtree to scan. Defaults to `.vizel-root`, the
   * wrapper every framework's `VizelProvider` and `Vizel` shell emit. Override
   * when a fixture renders a popover into `document.body`.
   */
  readonly selector?: string;
  /** Additional rule ids to disable beyond {@link DISABLED_RULES}. */
  readonly disableRules?: readonly string[];
}

/**
 * Run axe-core against a Vizel fixture and assert zero WCAG 2.1 AA violations.
 *
 * The helper polls for the scan root before analyzing so the editor's ARIA
 * wiring has settled after the asynchronous Tiptap mount. On failure the
 * assertion message carries the full violation list as pretty-printed JSON.
 */
export async function expectNoVizelA11yViolations(options: AxeRunOptions = {}): Promise<void> {
  const selector = options.selector ?? ".vizel-root";
  await expect.poll(() => document.querySelector(selector), { timeout: 15_000 }).not.toBeNull();
  const root = document.querySelector<HTMLElement>(selector);
  if (root === null) throw new Error(`expected an element matching ${selector}`);

  const disabledRules = [...DISABLED_RULES, ...(options.disableRules ?? [])];
  const results = await axe.run(root, {
    runOnly: { type: "tag", values: [...WCAG_TAGS] },
    rules: Object.fromEntries(disabledRules.map((id) => [id, { enabled: false }])),
  });

  expect(
    results.violations,
    `axe-core reported ${results.violations.length} violation(s):\n${JSON.stringify(
      results.violations,
      null,
      2
    )}`
  ).toEqual([]);
}
