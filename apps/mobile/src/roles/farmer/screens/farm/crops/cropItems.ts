import { useCallback, useEffect, useState } from 'react';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, colors } from '../../../theme';
import { listDiaryPlots, type DiaryPlot } from '../../../api/farmDiary';
import {
  listFarmCrops,
  type FarmCropResponse,
  type FarmCropStatus,
} from '../../../api/crops';

/**
 * The crop view-model the farmer crop screens pass between each other
 * (ProduceCalendar -> CropDetail -> milestones/inputs/workforce/NPK, and the
 * input/pest/attendance crop pickers).
 *
 * It used to be backed by an in-memory mock list with ids like `"crop-1"`.
 * Every `CropItem` is now built by `toCropItem()` from a real `farm_crops`
 * row, so `id` is always the backend UUID and can be sent to any API that
 * takes a `farmCropId`, or re-fetched with `getFarmCrop(id)`.
 *
 * Fields the API has no source for are left empty rather than invented:
 * `imageUri` is never set (crop_master only has an `iconKey`), and there is
 * no "action due" concept (no fertigation/pest schedule backs it).
 */
export type CropIllustrationType = 'carrot' | 'tomato' | 'cabbage' | 'custom';

export interface CropItem {
  /** Real `farm_crops.id` (UUID). */
  id: string;
  name: string;
  variety: string;
  cropType: CropIllustrationType;
  zone: string;
  zoneShort: string;
  area: string;
  /** Days since `plantedOn`; null when no planting date was recorded. */
  daysOld: number | null;
  statusType: 'ready' | 'harvest' | 'growing';
  /** Days until `expectedHarvestOn` (0 once due); null when no expected date was recorded. */
  statusDays: number | null;
  statusText: string;
  accentColor: string;
  imageUri?: string | undefined;
}

/** A real farm crop, the plot it is on, and its derived view-model. */
export interface FarmCropEntry {
  crop: FarmCropResponse;
  plot: DiaryPlot;
  item: CropItem;
}

/** The statuses the "active crops" pickers and calendar show. */
export const ACTIVE_CROP_STATUSES: readonly FarmCropStatus[] = ['PLANNED', 'GROWING'];

const MS_PER_DAY = 86_400_000;
/** The list endpoint's max page size (crops.schema.ts's listFarmCropsQuery). */
const PAGE_LIMIT = 100;

/** Whole-day difference, `b - a`. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * Picks which built-in illustration to draw. This is only a choice of
 * picture, derived from the crop's real name / crop_master icon key;
 * anything unrecognised gets the generic illustration.
 */
export function cropIllustrationType(crop: {
  cropName: string;
  cropIconKey: string | null;
}): CropIllustrationType {
  const key = `${crop.cropIconKey ?? ''} ${crop.cropName}`.toLowerCase();
  if (key.includes('carrot')) return 'carrot';
  if (key.includes('tomato')) return 'tomato';
  if (key.includes('cabbage')) return 'cabbage';
  return 'custom';
}

/** Maps a real farm_crops row (+ its plot) onto the shared `CropItem` shape. */
export function toCropItem(crop: FarmCropResponse, plot: DiaryPlot, today: Date = new Date()): CropItem {
  const plantedOn = crop.plantedOn ? new Date(crop.plantedOn) : null;
  const expectedHarvestOn = crop.expectedHarvestOn ? new Date(crop.expectedHarvestOn) : null;
  const daysOld = plantedOn ? Math.max(0, daysBetween(plantedOn, today)) : null;
  const daysToHarvest = expectedHarvestOn ? daysBetween(today, expectedHarvestOn) : null;
  const isDue = daysToHarvest !== null && daysToHarvest <= 0;

  let statusText: string;
  if (daysToHarvest === null) {
    statusText = t(
      crop.status === 'PLANNED'
        ? 'farmer.crops.activeCrops.statusPlanned'
        : 'farmer.crops.activeCrops.statusGrowingNoDate',
    );
  } else if (daysToHarvest < 0) {
    statusText = t('farmer.crops.activeCrops.statusOverdue', { days: Math.abs(daysToHarvest) });
  } else if (daysToHarvest === 0) {
    statusText = t('farmer.crops.calendar.statusDueToday');
  } else {
    statusText = t('farmer.crops.activeCrops.statusHarvestIn', { days: daysToHarvest });
  }

  return {
    id: crop.id,
    name: crop.cropName,
    variety: crop.seedVariety ?? crop.cropName,
    cropType: cropIllustrationType(crop),
    zone: plot.name,
    zoneShort: plot.name,
    area: plot.areaAcres !== null ? t('farmer.crops.activeCrops.areaAcres', { area: plot.areaAcres }) : '',
    daysOld,
    statusType: isDue ? 'ready' : daysToHarvest !== null ? 'harvest' : 'growing',
    statusDays: daysToHarvest === null ? null : Math.max(0, daysToHarvest),
    statusText,
    accentColor: isDue ? P.twOrange500 : crop.status === 'GROWING' ? colors.brandGreen : P.twBlue600,
  };
}

/** Every crop on one plot. The endpoint is cursor-paginated, so this follows every page. */
async function listAllPlotCrops(plotId: string, signal?: AbortSignal): Promise<FarmCropResponse[]> {
  const items: FarmCropResponse[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await listFarmCrops(
      plotId,
      { limit: PAGE_LIMIT, ...(cursor !== undefined ? { cursor } : {}) },
      signal,
    );
    items.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) return items;
    cursor = page.page.nextCursor;
  }
}

/**
 * The farmer's plots and every crop on them. The real crops endpoint is
 * per-plot, so this queries each plot (same approach as ActiveCropsScreen).
 * `statuses` filters client-side; omit it to get every status.
 */
export async function loadFarmCropEntries(
  options: { statuses?: readonly FarmCropStatus[]; signal?: AbortSignal } = {},
): Promise<{ plots: DiaryPlot[]; entries: FarmCropEntry[] }> {
  const { statuses, signal } = options;
  const plots = await listDiaryPlots(signal);
  const perPlot = await Promise.all(
    plots.map(async (plot) => ({ plot, crops: await listAllPlotCrops(plot.id, signal) })),
  );
  const today = new Date();
  const entries: FarmCropEntry[] = [];
  for (const { plot, crops } of perPlot) {
    for (const crop of crops) {
      if (statuses && !statuses.includes(crop.status)) continue;
      entries.push({ crop, plot, item: toCropItem(crop, plot, today) });
    }
  }
  return { plots, entries };
}

/**
 * The farmer's active (PLANNED / GROWING) crops as `CropItem`s, for the crop
 * pickers on the input, pest and attendance screens.
 */
export function useActiveCropItems(): {
  items: CropItem[];
  loading: boolean;
  error: unknown | null;
  reload: () => Promise<void>;
} {
  const [items, setItems] = useState<CropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { entries } = await loadFarmCropEntries({ statuses: ACTIVE_CROP_STATUSES });
      setItems(entries.map((e) => e.item));
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
