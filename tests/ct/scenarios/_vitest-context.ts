// Single neutral entry point for the Vitest Browser context so scenarios stay
// framework-agnostic. Each framework's spec renders its fixture, then calls a
// scenario. Scenarios locate component-scoped nodes via document queries wrapped
// in `page.elementLocator` and use `page` for portals (menus rendered to body).
import { type Locator, page, userEvent } from "vitest/browser";

export { page, userEvent };
export type { Locator };

// `root` is the rendered fixture's container element wrapped as a Locator.
export type VizelBcScenario = (root: Locator) => Promise<void>;
