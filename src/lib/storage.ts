import { useState, useCallback } from "react";
export const STORAGE_EVENT = "1mind-storage-error";
export function readStored<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const data: unknown = JSON.parse(raw);
      if (validate(data)) return data;
    }
  } catch {
    /* Keep the usable default when storage is blocked or corrupt. */
  }
  return fallback;
}
export function useStored<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
) {
  const [state, setState] = useState<T>(() =>
    readStored(key, fallback, validate),
  );
  const update = useCallback(
    (value: T | ((previous: T) => T)) => {
      setState((previous) => {
        const next =
          typeof value === "function"
            ? (value as (p: T) => T)(previous)
            : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          window.dispatchEvent(new Event(STORAGE_EVENT));
        }
        return next;
      });
    },
    [key],
  );
  return [state, update] as const;
}
