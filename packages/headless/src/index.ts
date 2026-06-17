/**
 * @vizel/headless
 *
 * Framework-neutral UI primitives consumed by every Vizel framework
 * adapter. The package exports spec builders and controller factories
 * (`{ mount, unmount, update }`) for combobox, popover, dismissable,
 * focus-trap, floating, and keyboard helpers. Adapter packages depend
 * on this package; consumers do not.
 *
 * Current scope:
 * - `dismissable/` ships click-outside, Escape, and focus-return
 *   wiring; adapter components mount this controller instead of
 *   attaching global `document` listeners themselves, so the wiring
 *   lives in one place and detaches deterministically on teardown.
 * - `keyboard/` ships list and grid navigation spec builders plus
 *   `keydown`-owning controllers; adapter menus consume the pure
 *   builders.
 * - `floating/` wraps `@floating-ui/dom` for anchored positioning.
 * - `popover/` composes `floating/` with `dismissable/` for the
 *   anchored block menu, toolbar dropdown, node selector, and color
 *   picker surfaces. `@vizel/core`'s popover controller re-exports it.
 * - `focus-trap/` confines keyboard focus to a modal-style surface; the
 *   link editor and find-replace forms mount it to keep Tab inside the
 *   form and to return focus to the trigger on close.
 * - `combobox/` resolves the slash-menu and mention-menu keyboard contract
 *   and supplies the `aria-activedescendant` / `aria-expanded` wiring; the
 *   menus consume the pure resolver because a Tiptap suggestion renderer
 *   forwards the raw `KeyboardEvent`s.
 *
 * The catalogue is now complete: every primitive ships.
 */

export {
  buildVizelComboboxKeySpec,
  createVizelComboboxController,
  type VizelComboboxAction,
  type VizelComboboxController,
  type VizelComboboxControllerOptions,
  type VizelComboboxKeyInput,
} from "./combobox/index.ts";
export {
  createVizelDismissable,
  type VizelDismissableController,
  type VizelDismissableOptions,
} from "./dismissable/index.ts";
export {
  buildVizelFloatingSpec,
  createVizelFloatingController,
  VIZEL_FLOATING_DEFAULT_OFFSET,
  VIZEL_FLOATING_DEFAULT_PLACEMENT,
  type VizelFloatingAnchor,
  type VizelFloatingController,
  type VizelFloatingControllerOptions,
  type VizelFloatingSpec,
  type VizelFloatingSpecOptions,
  type VizelVirtualElement,
} from "./floating/index.ts";
export {
  buildVizelFocusTrapSpec,
  createVizelFocusTrapController,
  type VizelFocusTrapController,
  type VizelFocusTrapOptions,
  type VizelFocusTrapSpec,
} from "./focus-trap/index.ts";
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
export {
  buildVizelPopoverPositionSpec,
  createVizelPopoverController,
  type VizelPopoverController,
  type VizelPopoverControllerOptions,
  type VizelPopoverPositionSpec,
  type VizelPopoverPositionSpecOptions,
} from "./popover/index.ts";
