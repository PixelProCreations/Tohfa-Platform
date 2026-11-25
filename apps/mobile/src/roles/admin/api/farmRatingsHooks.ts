/**
 * TanStack Query hooks for admin farm rating edits (D7).
 */
import { editFarmerRating, type EditFarmerRatingBody, type EditFarmerRatingResponse } from './farmRatings';
import { useAdminMutation } from './hooks';
import { adminKeys, FARMERS_MODULE } from './queryKeys';

export function useEditFarmerRating(farmerId: string) {
  return useAdminMutation<EditFarmerRatingBody, EditFarmerRatingResponse>({
    mutationFn: (body) => editFarmerRating(farmerId, body),
    invalidates: [adminKeys.module(FARMERS_MODULE)],
  });
}
