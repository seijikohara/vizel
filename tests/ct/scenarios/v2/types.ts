/**
 * Shared types for the v2 Playwright CT scenario layer.
 *
 * Each feature in `VIZEL_FEATURE_MANIFEST` owns a folder under
 * `tests/ct/scenarios/v2/<feature-id>/` that exports a typed scenario.
 * Per-framework spec files in `tests/ct/{react,vue,svelte}/specs/`
 * invoke the scenario through a framework-specific mount helper.
 *
 * ADR-0012 describes the three-layer structure (`scenarios/v2/`,
 * `<framework>/specs/`, `parity/`) and the rationale for replacing the
 * v1 shared `.scenario.ts` files.
 */

import type { Locator, Page } from "@playwright/test";
import type { VizelFeatureId } from "@vizel/core";

/**
 * Result returned by a framework-specific mount helper. The harness
 * uses `host` for DOM queries and `unmount` to tear down after the
 * scenario completes.
 */
export interface VizelScenarioMountResult {
  /** Locator scoped to the component's mount root. */
  readonly host: Locator;
  /** Tear down the component and release resources. */
  unmount(): Promise<void>;
}

/**
 * Framework-specific mount helper passed by the per-framework spec.
 *
 * The helper renders the component using the framework's idiomatic API
 * (`v-model` for Vue, `bind:markdown` for Svelte, hooks plus refs for
 * React) and returns a handle the scenario uses for DOM assertions.
 */
export type VizelScenarioMount<TProps> = (
  page: Page,
  props: TProps
) => Promise<VizelScenarioMountResult>;

/**
 * Common context every scenario receives.
 */
export interface VizelScenarioContext {
  readonly page: Page;
}

/**
 * Definition of a feature scenario. Each feature folder under
 * `tests/ct/scenarios/v2/<feature-id>/` re-exports this shape.
 */
export interface VizelScenarioDefinition<TProps> {
  readonly featureId: VizelFeatureId;
  readonly description: string;
  /**
   * Run the scenario against a framework-specific mount helper. The
   * helper is supplied by the per-framework spec file.
   */
  run(context: VizelScenarioContext, mount: VizelScenarioMount<TProps>): Promise<void>;
}
