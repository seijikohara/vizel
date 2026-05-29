/**
 * @vizel/headless
 *
 * Framework-neutral UI primitives consumed by every Vizel framework
 * adapter. The package exports spec builders and controller factories
 * (`{ mount, unmount, update }`) for combobox, popover, dismissable,
 * focus-trap, floating, and keyboard helpers. Adapter packages depend
 * on this package; consumers do not.
 *
 * ADR-0003 records the design rationale.
 *
 * Current scope:
 * - `dismissable/` ships click-outside, Escape, and focus-return
 *   wiring; it is the migration target for the adapter components that
 *   v1 attached `document` listeners directly.
 * - `keyboard/` ships list and grid navigation spec builders plus
 *   `keydown`-owning controllers; adapter menus consume the pure
 *   builders.
 *
 * The remaining primitives (combobox, popover, focus-trap, floating)
 * land in follow-up commits alongside each adapter rewrite that needs
 * them.
 */

export {
  createVizelDismissable,
  type VizelDismissableController,
  type VizelDismissableOptions,
} from "./dismissable/index.ts";
export {
  buildVizelGridNavSpec,
  buildVizelListNavSpec,
  createVizelKeyboardGridController,
  createVizelKeyboardListController,
  type VizelGridNavInput,
  type VizelKeyboardController,
  type VizelKeyboardGridControllerOptions,
  type VizelKeyboardListControllerOptions,
  type VizelListNavInput,
} from "./keyboard/index.ts";
