import type { BoundaryOrigin, LngLat, ManualPointRow } from '../manualPoints';
import type { MapboxFeature } from './locationUtils';

/**
 * Small "patch" reducers for the groups of Step3Location state that always change together.
 * A patch may be a partial object or a function of the previous state (for the places the screen
 * previously used a functional `setState`). They deliberately carry no business logic: every
 * decision stays in the screen, this only replaces a pile of parallel `useState` calls.
 */
export type Patch<T> = Partial<T> | ((prev: T) => Partial<T>);

export function patchReducer<T extends object>(state: T, patch: Patch<T>): T {
  return { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
}

/** Place-search overlay. */
export interface SearchState {
  isOpen: boolean;
  query: string;
  isSearching: boolean;
  suggestions: MapboxFeature[];
}
export const INITIAL_SEARCH_STATE: SearchState = {
  isOpen: false,
  query: '',
  isSearching: false,
  suggestions: [],
};
/** What closing the overlay (cancel, pick a suggestion, switch parcel) resets. */
export const SEARCH_CLOSED: Patch<SearchState> = { isOpen: false, query: '', suggestions: [] };

/** Location-details popup. Drafts are seeded explicitly on every open. */
export interface DetailsModalState {
  isOpen: boolean;
  draftLabel: string;
  draftAreaAcresText: string;
}
export const INITIAL_DETAILS_STATE: DetailsModalState = {
  isOpen: false,
  draftLabel: '',
  draftAreaAcresText: '',
};

/** Place labels picked from search for the active parcel. */
export interface PlaceState {
  village: string;
  taluk: string;
  district: string;
}

/** Manual-coordinates fallback for the active parcel. */
export interface ManualState {
  points: ManualPointRow[];
  entryOpen: boolean;
  origin: BoundaryOrigin;
  markerCoord: LngLat | null;
}
