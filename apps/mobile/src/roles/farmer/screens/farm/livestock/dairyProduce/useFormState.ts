import { useCallback, useReducer } from 'react';

type Patch<S> = Partial<S> | ((prev: S) => Partial<S>);

function reducer<S>(state: S, patch: Patch<S>): S {
  return { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
}

/** One object of related fields + one stable `update` -- replaces a column of
 *  sibling `useState` calls that always change together. */
export function useFormState<S extends object>(initial: S): [S, (patch: Patch<S>) => void] {
  const [state, dispatch] = useReducer(reducer as (s: S, p: Patch<S>) => S, initial);
  const update = useCallback((patch: Patch<S>) => dispatch(patch), []);
  return [state, update];
}
