import { useCallback, useState } from 'react';

export type ProfileModalKey =
  'editPersonal' | 'editFarm' | 'settings' | 'documents' | 'bank' | 'audits' | 'rating' | 'soil';

const ALL_CLOSED: Record<ProfileModalKey, boolean> = {
  editPersonal: false,
  editFarm: false,
  settings: false,
  documents: false,
  bank: false,
  audits: false,
  rating: false,
  soil: false,
};

/** Visibility flags for the Profile screen's bottom-sheet modals, kept as one record. */
export function useProfileModals() {
  const [visible, setVisible] = useState<Record<ProfileModalKey, boolean>>(ALL_CLOSED);
  const show = useCallback(
    (key: ProfileModalKey) => setVisible((prev) => ({ ...prev, [key]: true })),
    [],
  );
  const hide = useCallback(
    (key: ProfileModalKey) => setVisible((prev) => ({ ...prev, [key]: false })),
    [],
  );
  return { visible, show, hide };
}
