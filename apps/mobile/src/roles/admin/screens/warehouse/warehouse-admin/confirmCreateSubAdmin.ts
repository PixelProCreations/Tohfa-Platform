/**
 * The "Create Sub Warehouse Admin?" confirmation (design M15-06) between the
 * Review step and POST /admin/sub-warehouse-admins. Same Alert pattern as the
 * capacity change (../shared/CapacityReviewPanel.tsx): Cancel does nothing,
 * only Confirm calls `onConfirm`, so the Review step's Create button can never
 * create an account on its own (BR-25, BR-81).
 */
import { Alert } from 'react-native';

import { t } from '../../../i18n';

export function confirmCreateSubAdmin(summary: { name: string; warehouse: string }, onConfirm: () => void): void {
  Alert.alert(t('warehouseAdmin.swa.create.confirm.title'), t('warehouseAdmin.swa.create.confirm.body', summary), [
    { text: t('warehouseAdmin.swa.create.cancel'), style: 'cancel' },
    { text: t('warehouseAdmin.swa.create.confirm.ok'), onPress: onConfirm },
  ]);
}
