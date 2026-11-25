/**
 * Admin farm rating edit API (D7): PUT /v1/admin/farmers/:id/rating
 */
import { adminPut } from './http';

export interface RatingScoreInput {
  categoryCode: string;
  score: number;
  remarks?: string;
}

export interface EditFarmerRatingBody {
  reason: string;
  scores: RatingScoreInput[];
  periodLabel?: string;
}

export interface EditFarmerRatingResponse {
  farmerId: string;
  totalScore: number;
  tier: string;
  periodLabel?: string;
  updatedAt: string;
}

export function editFarmerRating(farmerId: string, body: EditFarmerRatingBody) {
  return adminPut<EditFarmerRatingResponse>(`/v1/admin/farmers/${farmerId}/rating`, body);
}
