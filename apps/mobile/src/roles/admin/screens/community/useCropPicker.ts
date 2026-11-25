/**
 * State behind the "Related crops" chips on the article and video forms
 * (BR-59r). No decisions here: which state the picker is in, the label of a
 * chip and the shape of the request body all live in ./communityLogic.ts, which
 * plain-Node vitest can test; this only wires the crop-list query to them.
 *
 * Two permissions meet here. The content is written under `learning.admin.manage`
 * but the crop list is `GET /admin/crop-master`, gated by
 * `admin.crop_taxonomy.manage` (rules.md BR-59r). An admin who can edit content
 * and cannot browse the crops must get an honest "denied", so the list is not
 * even requested without the permission, and the server still has the last word.
 */
import { useState } from 'react';
import { useCropMasterList } from '../../api/produceHooks';
import type { LearningCropRef } from '../../api/learning';
import { CROP_TAXONOMY_MANAGE, cropPickerState, mergeCropOptions, type CropPickerState } from './communityLogic';

export interface CropPicker {
  state: CropPickerState;
  /** What can be offered: the fetched list plus anything already tagged. Chips only draw in `ready`. */
  options: LearningCropRef[];
  /** What the item is already tagged with; shown read-only whenever the list is not available. */
  tagged: LearningCropRef[];
  selectedIds: readonly string[];
  toggle: (id: string) => void;
  retry: () => void;
  /** Create: the selection, or nothing to send when none is chosen (omitted and `[]` store the same). */
  cropIdsForCreate: string[] | undefined;
  /**
   * Update: the whole new set, but ONLY when the picker was usable and the admin
   * changed it. Anything else is `undefined`, which the server reads as "leave
   * the tags as they are" — sending `[]` by accident would wipe them.
   */
  cropIdsForUpdate: string[] | undefined;
}

export function useCropPicker(can: ((code: string) => boolean) | undefined, tagged: readonly LearningCropRef[] = []): CropPicker {
  const canBrowse = can !== undefined && can(CROP_TAXONOMY_MANAGE);
  const list = useCropMasterList({ enabled: canBrowse });
  const [selectedIds, setSelectedIds] = useState<string[]>(() => tagged.map((c) => c.id));
  const [touched, setTouched] = useState(false);

  const options = mergeCropOptions(list.data?.items ?? [], tagged);
  const state = cropPickerState({
    canBrowse,
    isPending: list.isPending,
    error: list.error,
    optionCount: options.length,
  });

  return {
    state,
    options,
    tagged: [...tagged],
    selectedIds,
    toggle: (id) => {
      setTouched(true);
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    retry: () => {
      void list.refetch();
    },
    cropIdsForCreate: selectedIds.length > 0 ? [...selectedIds] : undefined,
    cropIdsForUpdate: state === 'ready' && touched ? [...selectedIds] : undefined,
  };
}
