import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';

/** `{ foo: T }` -> `{ setFoo: Dispatch<SetStateAction<T>> }`. */
export type FieldSetters<T> = {
  [K in keyof T & string as `set${Capitalize<K>}`]: Dispatch<SetStateAction<T[K]>>;
};

/** A form's values plus one setter per value, named exactly like a `useState` pair. */
export type Fields<T> = T & FieldSetters<T>;

/**
 * One state object for a whole form instead of a `useState` per field.
 *
 * The add-record modals of AnimalDetailScreen each had 10-50 `useState` pairs.
 * This keeps the same `value` / `setValue` names (so the JSX is unchanged) while
 * holding them in a single state cell. Setters are stable across renders,
 * accept a value or an updater like React's own, and leave the state untouched
 * (no re-render) when the value is unchanged, as `useState` does.
 */
export function useFields<T extends Record<string, unknown>>(initial: T): Fields<T> {
  const [values, setValues] = useState<T>(initial);
  const [keys] = useState(() => Object.keys(initial) as Array<keyof T & string>);
  const setters = useMemo(() => {
    const out: Record<string, Dispatch<SetStateAction<unknown>>> = {};
    for (const key of keys) {
      out[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] = (action) =>
        setValues((prev) => {
          const next =
            typeof action === 'function'
              ? (action as (previous: unknown) => unknown)(prev[key])
              : action;
          return Object.is(next, prev[key]) ? prev : { ...prev, [key]: next };
        });
    }
    return out as FieldSetters<T>;
  }, [keys]);
  return { ...values, ...setters };
}
