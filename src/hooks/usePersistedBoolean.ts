import { useState, useEffect, useCallback } from "react";

export function usePersistedBoolean(storageKey: string, defaultValue = false) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === "true") return true;
      if (raw === "false") return false;
    } catch {
      // ignore
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(value));
    } catch {
      // ignore
    }
  }, [storageKey, value]);

  const toggle = useCallback(() => setValue((v) => !v), []);

  return [value, setValue, toggle] as const;
}
