/**
 * The confirm-or-cancel panel of a UPI sale created pending (BR-94). Shown by
 * the Payment screen right after POST /admin/sales returns a pending UPI sale,
 * and by Sale Detail for a pending UPI sale opened later.
 *
 * The UPI transaction reference is what the cashier reads off the customer's
 * UPI app or the gateway; it is never generated here. The server refuses a
 * reference already used by another sale (409), which renders inline.
 *
 * Both writes are idempotent (root CLAUDE.md 2.4): a retry of the same
 * reference / the same cancel reuses its Idempotency-Key, so a timed-out
 * request replayed by the cashier confirms or cancels exactly once.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { adminErrorKey } from '../../../api/errors';
import { useIdempotencyKey } from '../../../api/hooks';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { upiTxnRefInput, type SaleDetailView } from './mappers';
import type { PermissionCheck } from './types';
import { useCancelSaleMutation, useConfirmSaleUpiPaymentMutation } from './useSalesData';

export interface PendingUpiPanelProps {
  /** A sale for which isPendingUpiSale(sale) holds; the caller checks that. */
  sale: SaleDetailView;
  can: PermissionCheck;
  /** The confirmed (PICKED_UP) or cancelled sale, as the server returned it. */
  onUpdated: (sale: SaleDetailView) => void;
}

export function PendingUpiPanel({ sale, can, onUpdated }: PendingUpiPanelProps): React.JSX.Element {
  const [refText, setRefText] = useState('');
  const [touched, setTouched] = useState(false);
  const confirmIdem = useIdempotencyKey();
  const cancelIdem = useIdempotencyKey();
  const confirmMutation = useConfirmSaleUpiPaymentMutation();
  const cancelMutation = useCancelSaleMutation();

  const canConfirm = can('payment.record');
  const canCancel = can('sales.sale.cancel');
  const upiTxnRef = upiTxnRefInput(refText);
  const busy = confirmMutation.isPending || cancelMutation.isPending;

  const handleConfirm = () => {
    setTouched(true);
    if (upiTxnRef === null || busy || !canConfirm) return;
    cancelMutation.reset();
    confirmMutation.mutate(
      { saleId: sale.id, body: { upiTxnRef }, idempotencyKey: confirmIdem.keyFor({ saleId: sale.id, upiTxnRef }) },
      {
        onSuccess: (updated) => {
          confirmIdem.reset();
          onUpdated(updated);
        },
      },
    );
  };

  const runCancel = () => {
    if (busy || !canCancel) return;
    confirmMutation.reset();
    cancelMutation.mutate(
      { saleId: sale.id, body: {}, idempotencyKey: cancelIdem.keyFor({ saleId: sale.id, cancel: true }) },
      {
        onSuccess: (updated) => {
          cancelIdem.reset();
          onUpdated(updated);
        },
      },
    );
  };

  const handleCancel = () => {
    Alert.alert(t('sales.upi.cancelTitle'), t('sales.upi.cancelMessage', { number: sale.saleNumber }), [
      { text: t('sales.upi.cancelKeep'), style: 'cancel' },
      { text: t('sales.upi.cancel'), style: 'destructive', onPress: runCancel },
    ]);
  };

  const error = confirmMutation.error ?? cancelMutation.error;

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {t('sales.upi.title')}
      </Text>
      <Text style={styles.meta}>{t('sales.upi.saleNumber', { number: sale.saleNumber })}</Text>

      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>{t('sales.upi.amountDue')}</Text>
        <Text style={styles.amountValue}>{formatPaise(sale.totalPaise)}</Text>
      </View>

      {canConfirm ? (
        <>
          <Text style={styles.label}>{t('sales.upi.refLabel')}</Text>
          <TextInput
            style={styles.input}
            value={refText}
            onChangeText={setRefText}
            onBlur={() => setTouched(true)}
            placeholder={t('sales.upi.refPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={120}
            editable={!busy}
            accessibilityLabel={t('sales.upi.refLabel')}
          />
          <Text style={styles.hint}>{t('sales.upi.refHint')}</Text>
          {touched && upiTxnRef === null ? <Text style={styles.error}>{t('sales.upi.refInvalid')}</Text> : null}
        </>
      ) : (
        <Text style={styles.hint}>{t('sales.upi.noConfirmPermission')}</Text>
      )}

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {t(adminErrorKey(error))}
        </Text>
      ) : null}

      {canConfirm ? (
        <TouchableOpacity
          style={[styles.primaryBtn, (upiTxnRef === null || busy) && styles.disabled]}
          onPress={handleConfirm}
          disabled={upiTxnRef === null || busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: upiTxnRef === null || busy, busy: confirmMutation.isPending }}
          activeOpacity={0.85}
        >
          {confirmMutation.isPending ? <ActivityIndicator color={adminColors.onBrand} /> : null}
          <Text style={styles.primaryBtnText}>
            {confirmMutation.isPending ? t('sales.upi.confirming') : t('sales.upi.confirm')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {canCancel ? (
        <TouchableOpacity
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={handleCancel}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy, busy: cancelMutation.isPending }}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>
            {cancelMutation.isPending ? t('sales.upi.cancelling') : t('sales.upi.cancel')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  title: {
    ...adminType.title,
    color: adminColors.warning.text,
  },
  meta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  amountBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    alignItems: 'center',
  },
  amountLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  amountValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  label: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  hint: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  error: {
    ...adminType.body,
    color: adminColors.danger.text,
    marginTop: adminSpacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    marginTop: adminSpacing.lg,
  },
  primaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  secondaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
  },
  disabled: {
    opacity: 0.5,
  },
});
