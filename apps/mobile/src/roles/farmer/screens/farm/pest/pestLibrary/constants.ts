/**
 * Crop filter options. `value` is the canonical English string sent to the API
 * (`crop` query param) and is locale-independent; `labelKey` is display only.
 * `ALL_CROPS` is the "no filter" sentinel.
 */
export const ALL_CROPS = 'All crops';

export const CROP_FILTER_OPTIONS = [
  { value: ALL_CROPS, labelKey: 'farmer.pestLibrary.crop.all' },
  { value: 'Tomato', labelKey: 'farmer.pestLibrary.crop.tomato' },
  { value: 'Potato', labelKey: 'farmer.pestLibrary.crop.potato' },
  { value: 'Cabbage', labelKey: 'farmer.pestLibrary.crop.cabbage' },
  { value: 'Carrot', labelKey: 'farmer.pestLibrary.crop.carrot' },
  { value: 'Beetroot', labelKey: 'farmer.pestLibrary.crop.beetroot' },
] as const;

export function cropLabelKey(value: string): string | undefined {
  return CROP_FILTER_OPTIONS.find((o) => o.value === value)?.labelKey;
}

export const SKELETON_COUNT = 3;
export const SKELETON_CARD_HEIGHT = 110;
export const SKELETON_ANALYTICS_HEIGHT = 100;
export const SKELETON_FULL_WIDTH = '100%';
