/**
 * @vizel/tailwind
 *
 * Tailwind CSS integration for Vizel editor.
 *
 * @example
 * ```ts
 * // tailwind.config.ts
 * import { vizelPlugin } from '@vizel/tailwind';
 *
 * export default {
 *   plugins: [vizelPlugin],
 * };
 * ```
 *
 * Or use the preset for a complete configuration:
 *
 * ```ts
 * import { vizelPreset } from '@vizel/tailwind/preset';
 *
 * export default {
 *   presets: [vizelPreset],
 * };
 * ```
 */

export { vizelPlugin } from "./plugin.js";
export { vizelPreset } from "./preset.js";
