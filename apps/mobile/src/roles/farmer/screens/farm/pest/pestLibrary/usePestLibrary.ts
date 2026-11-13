import { useCallback, useEffect, useReducer } from 'react';
import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms } from '../../../../api/farms';
import {
  getPestAnalyticsSummary,
  listPestLibrary,
  listWeatherRiskNotes,
  type PestAnalyticsSummary,
  type PestLibraryEntry,
  type WeatherRiskNote,
} from '../../../../api/pest';
import { ALL_CROPS } from './constants';
import { pl } from './i18n';

interface State {
  searchQuery: string;
  selectedCrop: string;
  isCropPickerOpen: boolean;
  selectedPestDetail: PestLibraryEntry | null;
  isAnalyticsModalOpen: boolean;
  resolvedFarmId: string;
  entries: PestLibraryEntry[];
  entriesLoading: boolean;
  entriesError: string | null;
  weatherNote: WeatherRiskNote | null;
  analyticsSummary: PestAnalyticsSummary | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
}

const reducer = (s: State, patch: Partial<State>): State => ({ ...s, ...patch });

/**
 * All state + data loading for the Pest Library screen. State lives in one
 * reducer (patch-merge) so related fields change together, e.g. loading/error.
 */
export function usePestLibrary(farmId: string | undefined) {
  const [state, patch] = useReducer(reducer, {
    searchQuery: '',
    selectedCrop: ALL_CROPS,
    isCropPickerOpen: false,
    selectedPestDetail: null,
    isAnalyticsModalOpen: false,
    resolvedFarmId: farmId ?? '',
    entries: [],
    entriesLoading: true,
    entriesError: null,
    weatherNote: null,
    // Analytics modal state -- fetched lazily, only once the modal is opened.
    analyticsSummary: null,
    analyticsLoading: false,
    analyticsError: null,
  });

  useEffect(() => {
    if (farmId) {
      patch({ resolvedFarmId: farmId });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const farms = await getFarms();
        if (!cancelled) patch({ resolvedFarmId: farms[0]?.id ?? '' });
      } catch {
        // Non-fatal: the library list still works without a farm; only the
        // Pest Analytics card needs one.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const notes = await listWeatherRiskNotes();
        if (!cancelled) patch({ weatherNote: notes[0] ?? null });
      } catch {
        // Non-fatal: the library screen still works without the weather banner.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { searchQuery, selectedCrop, resolvedFarmId } = state;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      patch({ entriesLoading: true, entriesError: null });
      try {
        // Canonical English crop value; never the localised label.
        const items = await listPestLibrary({
          q: searchQuery.trim() || undefined,
          crop: selectedCrop === ALL_CROPS ? undefined : selectedCrop,
        });
        if (!cancelled) patch({ entries: items });
      } catch (err) {
        if (!cancelled) {
          patch({ entriesError: formatErrorMessage(err, pl('farmer.pestLibrary.error.loadLibrary')) });
        }
      } finally {
        if (!cancelled) patch({ entriesLoading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedCrop]);

  const openAnalyticsModal = useCallback(() => {
    patch({ isAnalyticsModalOpen: true });
    if (!resolvedFarmId) {
      patch({ analyticsError: pl('farmer.pestLibrary.error.noFarm') });
      return;
    }
    patch({ analyticsLoading: true, analyticsError: null });
    getPestAnalyticsSummary(resolvedFarmId)
      .then((summary) => patch({ analyticsSummary: summary }))
      .catch((err) =>
        patch({ analyticsError: formatErrorMessage(err, pl('farmer.pestLibrary.error.loadAnalytics')) }),
      )
      .finally(() => patch({ analyticsLoading: false }));
  }, [resolvedFarmId]);

  return { state, patch, openAnalyticsModal };
}
