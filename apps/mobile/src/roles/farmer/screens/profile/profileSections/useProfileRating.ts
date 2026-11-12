import { useCallback, useEffect, useState } from 'react';
import { deriveFarmRatingView, getMyFarmRating, type FarmRating } from '../../../api/farmer';

/**
 * Real farm rating: GET /v1/farmers/me/rating (BR-06), loaded independently
 * of the profile/certs fetches so a failure here doesn't blank the rest of the screen.
 */
export function useProfileRating() {
  const [farmRating, setFarmRating] = useState<FarmRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState<boolean>(true);

  const loadRating = useCallback(async () => {
    try {
      const res = await getMyFarmRating();
      setFarmRating(res);
    } catch {
      // Leave farmRating null -- deriveFarmRatingView(null) already renders
      // the same "not yet rated" empty state, so no separate error UI is
      // needed for this summary card.
    } finally {
      setRatingLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRating();
  }, [loadRating]);

  const ratingView = deriveFarmRatingView(farmRating);

  return { ratingLoading, ratingView };
}
