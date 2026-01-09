import type { Extensions } from "@tiptap/core";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";

export interface VizelTaskListOptions {
  /**
   * HTML attributes to add to the task list element
   */
  HTMLAttributes?: Record<string, unknown>;
  /**
   * The node name for list items
   * @default 'taskItem'
   */
  itemTypeName?: string;
}

export interface VizelTaskItemOptions {
  /**
   * HTML attributes to add to the task item element
   */
  HTMLAttributes?: Record<string, unknown>;
  /**
   * Whether the task item checkbox is nested inside a label
   * @default true
   */
  nested?: boolean;
  /**
   * A callback triggered when a task item is clicked (checked/unchecked)
   */
  onReadOnlyChecked?: (node: unknown, checked: boolean) => boolean;
}

export interface VizelTaskListExtensionsOptions {
  /**
   * Options for the task list extension
   */
  taskList?: VizelTaskListOptions;
  /**
   * Options for the task item extension
   */
  taskItem?: VizelTaskItemOptions;
}

/**
 * Creates task list extensions for checkbox/todo functionality.
 *
 * @example
 * ```typescript
 * import { createVizelTaskListExtensions } from '@vizel/core'
 *
 * const extensions = createVizelTaskListExtensions({
 *   taskItem: { nested: true }
 * })
 * ```
 */
export function createVizelTaskListExtensions(
  options: VizelTaskListExtensionsOptions = {}
): Extensions {
  const { taskList = {}, taskItem = {} } = options;

  return [
    TaskList.configure({
      HTMLAttributes: {
        class: "vizel-task-list",
        ...taskList.HTMLAttributes,
      },
      itemTypeName: taskList.itemTypeName ?? "taskItem",
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: "vizel-task-item",
        ...taskItem.HTMLAttributes,
      },
      nested: taskItem.nested ?? true,
      ...(taskItem.onReadOnlyChecked !== undefined && {
        onReadOnlyChecked: taskItem.onReadOnlyChecked,
      }),
    }),
  ];
}

// Re-export for advanced usage
export { TaskItem, TaskList };
