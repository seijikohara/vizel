import type { Editor, Extensions } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";

// =============================================================================
// Types
// =============================================================================

/**
 * Plugin interface for extending Vizel with third-party functionality.
 *
 * @example
 * ```typescript
 * import type { VizelPlugin } from "@vizel/core";
 * import { MyExtension } from "./extension";
 *
 * export const myPlugin: VizelPlugin = {
 *   name: "my-vizel-plugin",
 *   version: "1.0.0",
 *   description: "Adds cool feature to Vizel",
 *   extensions: [MyExtension],
 *   onInstall: (editor) => {
 *     console.log("Plugin installed");
 *   },
 * };
 * ```
 */
export interface VizelPlugin {
  /** Unique plugin identifier (must be kebab-case, e.g. "my-plugin") */
  name: string;
  /** Plugin version (semver format, e.g. "1.0.0") */
  version: string;
  /** Human-readable plugin description */
  description?: string;
  /** Tiptap extensions to add to the editor */
  extensions?: Extensions;
  /** CSS styles to inject into the document */
  styles?: string;
  /** Called when the plugin is installed (editor is set) */
  onInstall?: (editor: Editor) => void;
  /** Called when the plugin is uninstalled */
  onUninstall?: (editor: Editor) => void;
  /** Called on each editor transaction */
  onTransaction?: (props: { editor: Editor; transaction: Transaction }) => void;
  /** Plugin names that must be registered before this plugin */
  dependencies?: string[];
}

// =============================================================================
// Validation
// =============================================================================

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;
const PLUGIN_NAME_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Validates a plugin's required fields and format.
 * Throws a descriptive error if validation fails.
 */
export function validateVizelPlugin(plugin: VizelPlugin): void {
  if (!plugin.name) {
    throw new Error("Vizel plugin must have a name");
  }
  if (!PLUGIN_NAME_REGEX.test(plugin.name)) {
    throw new Error(`Vizel plugin name "${plugin.name}" must be kebab-case (e.g. "my-plugin")`);
  }
  if (!plugin.version) {
    throw new Error(`Vizel plugin "${plugin.name}" must have a version`);
  }
  if (!SEMVER_REGEX.test(plugin.version)) {
    throw new Error(
      `Vizel plugin "${plugin.name}" version "${plugin.version}" must be valid semver (e.g. "1.0.0")`
    );
  }
}

// =============================================================================
// Dependency Resolution
// =============================================================================

/**
 * Resolves plugin dependencies via topological sort.
 * Throws if a circular dependency or missing dependency is detected.
 *
 * @returns Plugins in dependency-first order
 */
export function resolveVizelPluginDependencies(plugins: VizelPlugin[]): VizelPlugin[] {
  const pluginMap = new Map<string, VizelPlugin>();
  for (const plugin of plugins) {
    pluginMap.set(plugin.name, plugin);
  }

  const resolved: VizelPlugin[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(name: string, path: string[]): void {
    if (visited.has(name)) return;

    if (visiting.has(name)) {
      const cycle = [...path, name].join(" → ");
      throw new Error(`Circular plugin dependency detected: ${cycle}`);
    }

    const plugin = pluginMap.get(name);
    if (!plugin) {
      throw new Error(`Plugin dependency "${name}" not found (required by "${path.at(-1)}")`);
    }

    visiting.add(name);

    for (const dep of plugin.dependencies ?? []) {
      visit(dep, [...path, name]);
    }

    visiting.delete(name);
    visited.add(name);
    resolved.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin.name, []);
  }

  return resolved;
}

// =============================================================================
// Style Injection
// =============================================================================

const STYLE_ID_PREFIX = "vizel-plugin-style-";

function injectPluginStyle(pluginName: string, css: string): void {
  if (typeof document === "undefined") return;

  const id = `${STYLE_ID_PREFIX}${pluginName}`;
  // Avoid duplicate injection
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

function removePluginStyle(pluginName: string): void {
  if (typeof document === "undefined") return;

  const id = `${STYLE_ID_PREFIX}${pluginName}`;
  document.getElementById(id)?.remove();
}

// =============================================================================
// Plugin Manager
// =============================================================================

/**
 * Manages Vizel plugins: registration, lifecycle, extensions, and styles.
 *
 * @example
 * ```typescript
 * import { VizelPluginManager } from "@vizel/core";
 * import { myPlugin } from "my-vizel-plugin";
 *
 * const plugins = new VizelPluginManager();
 * plugins.register(myPlugin);
 *
 * // Pass extensions to the editor
 * const editor = useVizelEditor({
 *   extensions: plugins.getExtensions(),
 * });
 *
 * // Connect the editor to enable lifecycle hooks
 * if (editor) plugins.setEditor(editor);
 * ```
 */
export class VizelPluginManager {
  private plugins = new Map<string, VizelPlugin>();
  private editor: Editor | null = null;
  private transactionHandler:
    | ((props: { editor: Editor; transaction: Transaction }) => void)
    | null = null;

  /**
   * Register a plugin. Validates the plugin, checks for duplicates,
   * verifies dependencies, and injects styles.
   * If an editor is already connected, calls `onInstall`.
   */
  register(plugin: VizelPlugin): void {
    validateVizelPlugin(plugin);

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Vizel plugin "${plugin.name}" is already registered`);
    }

    // Verify dependencies are registered
    for (const dep of plugin.dependencies ?? []) {
      if (!this.plugins.has(dep)) {
        throw new Error(
          `Vizel plugin "${plugin.name}" requires "${dep}" which is not registered. Register dependencies first.`
        );
      }
    }

    this.plugins.set(plugin.name, plugin);

    // Inject styles
    if (plugin.styles) {
      injectPluginStyle(plugin.name, plugin.styles);
    }

    // Call onInstall if editor is already connected
    if (this.editor) {
      plugin.onInstall?.(this.editor);
    }

    // Rebind transaction handler to include new plugin
    this.rebindTransactionHandler();
  }

  /**
   * Unregister a plugin by name. Removes styles, calls `onUninstall`,
   * and checks that no other plugin depends on it.
   */
  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Vizel plugin "${pluginName}" is not registered`);
    }

    // Check if other plugins depend on this one
    for (const [name, p] of this.plugins) {
      if (p.dependencies?.includes(pluginName)) {
        throw new Error(`Cannot unregister "${pluginName}": plugin "${name}" depends on it`);
      }
    }

    // Call onUninstall
    if (this.editor) {
      plugin.onUninstall?.(this.editor);
    }

    // Remove styles
    removePluginStyle(pluginName);

    this.plugins.delete(pluginName);

    // Rebind transaction handler without removed plugin
    this.rebindTransactionHandler();
  }

  /**
   * Connect an editor instance. Calls `onInstall` on all registered plugins
   * and subscribes to transactions for plugins with `onTransaction`.
   *
   * If a previous editor was connected, it is unbound first
   * and `onUninstall` is called for all plugins.
   */
  setEditor(editor: Editor): void {
    // Uninstall from previous editor
    if (this.editor) {
      this.unbindTransactionHandler();
      for (const plugin of this.plugins.values()) {
        plugin.onUninstall?.(this.editor);
      }
    }

    this.editor = editor;

    // Call onInstall for all plugins
    for (const plugin of this.plugins.values()) {
      plugin.onInstall?.(editor);
    }

    // Bind transaction handler
    this.rebindTransactionHandler();
  }

  /**
   * Disconnect the editor and clean up all plugins.
   */
  destroy(): void {
    this.unbindTransactionHandler();

    // Call onUninstall for all plugins
    if (this.editor) {
      for (const plugin of this.plugins.values()) {
        plugin.onUninstall?.(this.editor);
      }
    }

    // Remove all plugin styles
    for (const name of this.plugins.keys()) {
      removePluginStyle(name);
    }

    this.editor = null;
    this.plugins.clear();
  }

  /**
   * Get aggregated extensions from all registered plugins,
   * ordered by dependency resolution.
   */
  getExtensions(): Extensions {
    const ordered = resolveVizelPluginDependencies([...this.plugins.values()]);
    return ordered.flatMap((p) => p.extensions ?? []);
  }

  /**
   * Get a registered plugin by name.
   */
  getPlugin(name: string): VizelPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * List all registered plugins.
   */
  listPlugins(): VizelPlugin[] {
    return [...this.plugins.values()];
  }

  /**
   * Check if a plugin is registered.
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  private rebindTransactionHandler(): void {
    this.unbindTransactionHandler();

    const pluginsWithTransaction = [...this.plugins.values()].filter((p) => p.onTransaction);

    if (pluginsWithTransaction.length === 0 || !this.editor) return;

    this.transactionHandler = ({ editor, transaction }) => {
      for (const plugin of pluginsWithTransaction) {
        plugin.onTransaction?.({ editor, transaction });
      }
    };

    this.editor.on("transaction", this.transactionHandler);
  }

  private unbindTransactionHandler(): void {
    if (this.transactionHandler && this.editor) {
      this.editor.off("transaction", this.transactionHandler);
      this.transactionHandler = null;
    }
  }
}
