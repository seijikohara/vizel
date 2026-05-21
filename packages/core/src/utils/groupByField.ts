/**
 * Groups items into consecutive runs by a string field.
 * Items with the same group value that appear sequentially are placed
 * in the same group. Non-adjacent items with the same group value
 * are placed in separate groups.
 *
 * @param items - The array of items to group
 * @param field - The key of type `string` to group by
 * @returns An array of groups, where each group contains consecutive items with the same field value
 *
 * @example
 * ```ts
 * const items = [
 *   { group: "a", name: "1" },
 *   { group: "a", name: "2" },
 *   { group: "b", name: "3" },
 * ];
 * groupByConsecutiveField(items, "group");
 * // => [[{ group: "a", ... }, { group: "a", ... }], [{ group: "b", ... }]]
 * ```
 */
export function groupByConsecutiveField<T>(items: readonly T[], field: keyof T & string): T[][] {
  return items.reduce<T[][]>((groups, item) => {
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup[0]?.[field] === item[field]) {
      lastGroup.push(item);
    } else {
      groups.push([item]);
    }
    return groups;
  }, []);
}
