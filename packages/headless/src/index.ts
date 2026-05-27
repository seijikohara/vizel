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
 * Current scope (Phase 2):
 * - `dismissable/` ships the first primitive and is the migration
 *   target for the 21 `document.addEventListener` violations that
 *   v1 adapter components carry.
 *
 * Subsequent primitives (combobox, popover, focus-trap, floating,
 * keyboard) land in follow-up commits alongside each Phase 3 adapter
 * rewrite that needs them.
 */

export {
  createVizelDismissable,
  type VizelDismissableController,
  type VizelDismissableOptions,
} from "./dismissable/index.ts";
