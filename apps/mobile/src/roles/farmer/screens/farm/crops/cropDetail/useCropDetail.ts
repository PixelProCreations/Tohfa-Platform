import { useCallback, useEffect, useState } from 'react';
import { listDiaryPlots, listDiaryEntries, type DiaryPlot, type DiaryEntrySummary } from '../../../../api/farmDiary';
import { getFarmCrop, type FarmCropResponse } from '../../../../api/crops';

const DIARY_ENTRIES_LIMIT = 20;

export interface UseCropDetailResult {
  farmCrop: FarmCropResponse | null;
  cropPlot: DiaryPlot | null;
  diaryEntries: DiaryEntrySummary[] | null;
  loadingCrop: boolean;
  cropError: unknown | null;
  loadCropDetail: () => Promise<void>;
}

/**
 * Real farm_crops row (+ its plot + recent diary entries) for CROP DETAILS,
 * LINKED RECORDS and RECENT DIARY ENTRIES. Every other section on the screen
 * (lifecycle stages, milestones, inputs/workforce/NPK summaries) has no
 * backing table and stays on its preset/mock data.
 */
export function useCropDetail(cropId: string | undefined): UseCropDetailResult {
  const [farmCrop, setFarmCrop] = useState<FarmCropResponse | null>(null);
  const [cropPlot, setCropPlot] = useState<DiaryPlot | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntrySummary[] | null>(null);
  const [loadingCrop, setLoadingCrop] = useState(Boolean(cropId));
  const [cropError, setCropError] = useState<unknown | null>(null);

  const loadCropDetail = useCallback(async () => {
    if (!cropId) return;
    setLoadingCrop(true);
    setCropError(null);
    try {
      const fetchedCrop = await getFarmCrop(cropId);
      // No backend filter exists for "diary entries for this crop" (only by
      // plotId/date/month/categoryKey — see farm-diary.schema.ts's
      // listDiaryEntriesQuery), so this lists by plotId and shows the plot's
      // most recent entries, not strictly this crop cycle's own.
      const [plots, diary] = await Promise.all([
        listDiaryPlots(),
        listDiaryEntries({ plotId: fetchedCrop.plotId, limit: DIARY_ENTRIES_LIMIT }),
      ]);
      setFarmCrop(fetchedCrop);
      setCropPlot(plots.find((p) => p.id === fetchedCrop.plotId) ?? null);
      setDiaryEntries(diary.items);
    } catch (err: unknown) {
      setCropError(err);
    } finally {
      setLoadingCrop(false);
    }
  }, [cropId]);

  useEffect(() => {
    void loadCropDetail();
  }, [loadCropDetail]);

  return { farmCrop, cropPlot, diaryEntries, loadingCrop, cropError, loadCropDetail };
}
