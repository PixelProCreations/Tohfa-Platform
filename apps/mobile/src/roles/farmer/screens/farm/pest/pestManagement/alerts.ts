import { t } from '../../../../../../i18n/farmer';
import { appAlert } from '@tohfa/mobile-ui';

/**
 * Confirmation shown after a detection's status changes. One helper for both
 * the "reopened" and the two "resolved" paths so the copy cannot drift.
 */
export function showStatusAlert(status: 'Ongoing' | 'Resolved'): void {
  if (status === 'Ongoing') {
    appAlert(t('farmer.pestManagement.alert.reopenedTitle'), t('farmer.pestManagement.alert.reopenedMessage'), undefined, { tone: 'success' });
    return;
  }
  appAlert(t('farmer.pestManagement.alert.resolvedTitle'), t('farmer.pestManagement.alert.resolvedMessage'), undefined, { tone: 'success' });
}
