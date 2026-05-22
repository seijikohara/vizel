/**
 * Shared axe-core scan for the Pillar 5 a11y suite.
 *
 * Each per-framework spec mounts a fixture, waits for the editor to
 * render, and then defers to {@link expectNoVizelA11yViolations} to
 * run `@axe-core/playwright` against the `.vizel-root` subtree. The
 * helper asserts WCAG 2.1 AA conformance and prints the violation
 * list on failure so the diff alone identifies the regression.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Rules disabled across every Vizel a11y scan.
 *
 * Each entry must include the upstream rule id and a one-line
 * rationale so reviewers can audit the allow-list without re-reading
 * axe-core's catalog. Keep this set as small as possible — silence a
 * rule only when the violation reflects a measurement limitation of
 * axe-core rather than a defect in Vizel.
 *
 * - `region`: Component-test fixtures do not render a `<main>`
 *   landmark; the production host page is responsible for the
 *   document-level landmark structure. axe-core flags every standalone
 *   widget without one, which is noise here.
 * - `color-contrast`: axe-core color sampling against the editor's
 *   placeholder text is unreliable inside the CT iframe because the
 *   shadow background blends with the host page. The bubble-menu /
 *   toolbar contrast tokens are validated separately at design time.
 * - `aria-input-field-name`: Tiptap's ProseMirror root advertises
 *   `role="textbox"` but leaves naming to the host application — the
 *   consuming page wraps Vizel inside a labelled region (`<label>`,
 *   `aria-labelledby`, or `aria-label` on the surrounding container).
 *   The CT fixture has no surrounding chrome, so this rule fires
 *   unconditionally and reflects a host-page responsibility rather
 *   than a Vizel defect.
 */
const DISABLED_RULES: readonly string[] = ["region", "color-contrast", "aria-input-field-name"];

/**
 * WCAG conformance tags axe-core checks for. WCAG 2.1 AA is the
 * Section 14 Pillar 5 target.
 */
const WCAG_TAGS: readonly string[] = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface AxeRunOptions {
  /**
   * CSS selector for the subtree to scan. Defaults to `.vizel-root`,
   * the wrapper every framework's `VizelProvider` and `Vizel` shell
   * emit. Override when a fixture renders a popover into
   * `document.body`.
   */
  readonly selector?: string;
  /**
   * Additional rule ids to disable beyond {@link DISABLED_RULES}.
   * Reserve for fixture-specific quirks; prefer fixing the
   * underlying markup over expanding the allow-list.
   */
  readonly disableRules?: readonly string[];
}

/**
 * Run axe-core against a Vizel component fixture and assert zero
 * WCAG 2.1 AA violations.
 *
 * The helper waits for the supplied component locator to be visible
 * before scanning so the editor's ARIA wiring has settled. On
 * failure the assertion message contains the full violation list as
 * pretty-printed JSON — no separate console inspection is needed.
 */
export async function expectNoVizelA11yViolations(
  component: Locator,
  page: Page,
  options: AxeRunOptions = {}
): Promise<void> {
  await expect(component).toBeVisible();

  const selector = options.selector ?? ".vizel-root";
  const disabledRules = [...DISABLED_RULES, ...(options.disableRules ?? [])];

  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags([...WCAG_TAGS])
    .disableRules([...disabledRules])
    .analyze();

  expect(
    results.violations,
    `axe-core reported ${results.violations.length} violation(s):\n${JSON.stringify(
      results.violations,
      null,
      2
    )}`
  ).toEqual([]);
}
