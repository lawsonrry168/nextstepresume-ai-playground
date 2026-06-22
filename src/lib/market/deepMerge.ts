import type { MessageTree } from "../../i18n/types";

export function deepMergeMessages(base: MessageTree, overrides: MessageTree): MessageTree {
  const result: MessageTree = { ...base };
  for (const key of Object.keys(overrides)) {
    const overrideVal = overrides[key];
    const baseVal = result[key];
    if (
      overrideVal &&
      typeof overrideVal === "object" &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = deepMergeMessages(baseVal as MessageTree, overrideVal as MessageTree);
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
}
