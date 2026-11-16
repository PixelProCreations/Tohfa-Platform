/**
 * Thin wrapper that hosts NotificationsCenterScreen.
 * The host passes `can` (RBAC check) and `onBack` (navigation callback).
 */
import React from 'react';
import { NotificationsCenterScreen } from './NotificationsCenterScreen';

export function NotificationsCenterFlow({
  can,
  onBack,
}: {
  can: (code: string) => boolean;
  onBack: () => void;
}) {
  return <NotificationsCenterScreen can={can} onBack={onBack} />;
}
