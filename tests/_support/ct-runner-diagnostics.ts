import type { FullResult, Reporter } from "@playwright/test/reporter";

/**
 * Diagnose and mitigate the runner-side post-run hang (#630).
 *
 * The experimental-ct dev server keeps the Node event loop alive after the
 * suite finishes on the GitHub Linux runner, so the standalone a11y and
 * Markdown round-trip jobs reach `timeout-minutes` even though every test
 * passed. The suite exits cleanly on macOS, so the leak does not reproduce
 * locally.
 *
 * `onEnd` runs once Playwright has finished, before the process would hang.
 * It logs the resource types still keeping the process alive
 * (`process.getActiveResourcesInfo()`) so the root cause is visible in the
 * CI log, then force-exits with the run's own status so a clean pass is
 * reported instead of a timeout. A real failure still exits non-zero.
 */
export default class CtRunnerDiagnostics implements Reporter {
  onEnd(result: FullResult): void {
    const info =
      typeof process.getActiveResourcesInfo === "function" ? process.getActiveResourcesInfo() : [];
    const counts = info.reduce<Record<string, number>>((acc, name) => {
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    process.stdout.write(
      `\n[ct-diag] status=${result.status} activeResources=${JSON.stringify(counts)}\n`
    );

    const code = result.status === "passed" ? 0 : 1;
    // Defer briefly so other reporters flush their output, then exit hard to
    // pre-empt the dev-server leak that would otherwise hang the process.
    setTimeout(() => process.exit(code), 500);
  }
}
