/**
 * Re-exports the pure keyboard navigation helpers. Kept here as a thin
 * shim until Section 3 of the v2.0.0 redesign introduces the actual
 * `createVizelListboxController` factory at this path.
 */
export {
  resolveVizelGridNavigation,
  resolveVizelListNavigation,
} from "../utils/keyboard-navigation.ts";
