/**
 * Sales > Returns & Refunds (design of record: origin/Superadmin-main). The
 * layout is the design's; the tickets are the live returns queue
 * (GET /admin/returns) and both enabled actions go through the API:
 *
 *   Wallet Refund  POST /admin/returns/{id}/refund/wallet  rma.refund.wallet_process (BR-61, BR-61d; Idempotency-Key)
 *   Reject         POST /admin/returns/{id}/reject         rma.refund.approve       (BR-61)
 *                  with the reason the admin types (1..300 characters, openapi
 *                  ReturnRejectCreate) in a reason step reusing the listing
 *                  Reject sheet's frame and styles.
 *   Bank Refund    disabled: api/returns.ts deliberately does not wrap
 *                  /refund/bank (owner decision, brief 07 P1 #6).
 *
 * BR-61: the wallet refund is offered only for an APPROVED return and reject
 * only for PENDING / INSPECTED (returnActions); the server enforces the same
 * machine. Success is shown only after a 2xx; a failure shows the error. The
 * wallet refund's Idempotency-Key comes from useWalletRefund (keyed on the
 * return), so a retry never credits twice (BR-61d).
 *
 * The return summary carries no customer name, order number or amount, so
 * those slots are dashes, never a uuid or a ₹0.
 */
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors, adminShadow } from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { REJECT_REASON_MAX_LENGTH, type ReturnStatus } from '../../api/returns';
import {
  isReturnStatus,
  returnActions,
  returnRefundErrorKey,
  returnWriteErrorKey,
  validateRejectReason,
} from '../warehouse/returns-rma/mappers';
import { styles as sheetStyles } from '../listings/listingsStyles';
import { useRejectReturn, useReturnList, useWalletRefund } from '../warehouse/returns-rma/useReturnsData';
import type { ReturnRowView } from '../warehouse/returns-rma/types';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { BackChevronIcon, SALES_PALETTE } from './SalesChannelOverviewScreen';

function WalletBtnIcon({ color = SALES_PALETTE.greenText, size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M16 3H4a2 2 0 0 0-2 2v2M18 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function BankBtnIcon({ color = SALES_PALETTE.blueText, size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 3L2 8h20L12 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RejectBtnIcon({ color = SALES_PALETTE.redText, size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M6 18L18 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** How a return of `status` is drawn here (BR-61 actions before permissions). */
export interface SalesReturnView {
  /** Still needs an admin action: the action row, no pill. */
  open: boolean;
  /** APPROVED: the wallet refund may be sent. */
  refundable: boolean;
  /** PENDING / INSPECTED: may be rejected. */
  rejectable: boolean;
  /** The closed-state pill; null for an open return. */
  pillKey: TranslationKey | null;
}

const ALLOW_ALL = () => true;

/** Every docs/openapi.yaml ReturnStatus, mapped (and anything else read as a closed "Unknown"). */
export function salesReturnView(status: string): SalesReturnView {
  const actions = returnActions(status, ALLOW_ALL);
  const open = status === 'PENDING' || status === 'INSPECTED' || status === 'APPROVED';
  const pills: Readonly<Record<Exclude<ReturnStatus, 'PENDING' | 'INSPECTED' | 'APPROVED'>, TranslationKey>> = {
    REJECTED: 'wiringPayouts.returnPill.REJECTED',
    REFUND_PENDING_BANK: 'wiringPayouts.returnPill.REFUND_PENDING_BANK',
    REFUNDED: 'wiringPayouts.returnPill.REFUNDED',
  };
  const pillKey: TranslationKey | null = open
    ? null
    : isReturnStatus(status)
      ? pills[status as keyof typeof pills]
      : 'wiringPayouts.returnPill.unknown';
  return { open, refundable: actions.refundWallet, rejectable: actions.reject, pillKey };
}

export interface SalesReturnsRefundsScreenProps {
  onBack?: () => void;
  /** Permission check from /auth/me. Missing denies both writes (fail closed, root CLAUDE.md 2.1). */
  can?: Can | undefined;
}

export function SalesReturnsRefundsScreen({ onBack, can }: SalesReturnsRefundsScreenProps) {
  const list = useReturnList(undefined, undefined);
  const deny = () => false;
  const check = typeof can === 'function' ? can : deny;
  // The return the open confirm prompt (or the write in flight) is about.
  const [target, setTarget] = useState<ReturnRowView | undefined>(undefined);
  const walletRefund = useWalletRefund(target?.id);
  const reject = useRejectReturn(target?.id);

  const handleWalletRefund = (ticket: ReturnRowView) => {
    if (!returnActions(ticket.status, check).refundWallet) return;
    setTarget(ticket);
    Alert.alert(
      t('wiringPayouts.salesReturns.refund.confirm.title'),
      t('wiringPayouts.salesReturns.refund.confirm.body', { ticket: ticket.reference }),
      [
        { text: t('wiringPayouts.common.cancel'), style: 'cancel' },
        {
          text: t('wiringPayouts.salesReturns.refund.confirm.ok'),
          onPress: () => {
            reject.reset();
            walletRefund.run(undefined, (result) => {
              Alert.alert(
                t('wiringPayouts.salesReturns.refund.done.title'),
                t('wiringPayouts.salesReturns.refund.done.body', {
                  amount: result.amountLabel ?? ADMIN_NO_VALUE,
                  ticket: ticket.reference,
                }),
              );
            });
          },
        },
      ],
    );
  };

  // Reject asks for the reason the API requires (owner decision 2026-11-25): a reason step, not a fixed string.
  const [rejecting, setRejecting] = useState<ReturnRowView | undefined>(undefined);
  const [rejectReason, setRejectReason] = useState('');
  const reasonCheck = validateRejectReason(rejectReason);

  const handleReject = (ticket: ReturnRowView) => {
    if (!returnActions(ticket.status, check).reject) return;
    walletRefund.reset();
    reject.reset();
    setTarget(ticket);
    setRejectReason('');
    setRejecting(ticket);
  };

  const closeRejectSheet = () => {
    if (reject.isPending) return;
    reject.reset();
    setRejecting(undefined);
  };

  const confirmReject = () => {
    if (rejecting === undefined || !reasonCheck.ok || reject.isPending) return;
    const ticket = rejecting;
    reject.run(reasonCheck.reason, () => {
      setRejecting(undefined);
      Alert.alert(
        t('wiringPayouts.salesReturns.reject.done.title'),
        t('wiringPayouts.salesReturns.reject.done.body', { ticket: ticket.reference }),
      );
    });
  };

  // A failure is shown in place, worded for the action that failed.
  // The refund's failure shows on the screen; the reject's shows in its reason step.
  const refundFailure = walletRefund.error ? walletRefund.error : null;

  const openCount = list.items.filter((r) => salesReturnView(r.status).open).length;
  // R4: a count of loaded rows is the total only once every page is in.
  const openCountText = list.hasMore ? ADMIN_NO_VALUE : String(openCount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Returns & Refunds</Text>
          <Text style={styles.screenSubtitle}>
            {t('wiringPayouts.salesReturns.subtitle', { count: openCountText })}
          </Text>
        </View>

        {refundFailure !== null ? (
          <Text style={styles.errorText} testID="salesReturns.error">
            {t(returnRefundErrorKey(refundFailure))}
          </Text>
        ) : null}

        {/* Tickets List */}
        {list.isLoading ? (
          <AdminLoadingState label={t('wiringPayouts.returns.loading')} />
        ) : list.error && list.items.length === 0 ? (
          <AdminErrorState error={list.error} onRetry={list.refresh} />
        ) : list.items.length === 0 ? (
          <AdminEmptyState title={t('wiringPayouts.returns.empty.title')} subtitle={t('wiringPayouts.returns.empty.subtitle')} />
        ) : (
          <FlatList
            data={list.items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={list.hasMore ? list.loadMore : undefined}
            renderItem={({ item }) => {
              const view = salesReturnView(item.status);
              const allowed = returnActions(item.status, check);
              const busy = target?.id === item.id && (walletRefund.isPending || reject.isPending);
              const refundEnabled = allowed.refundWallet && !busy;
              const rejectEnabled = allowed.reject && !busy;
              return (
                <View style={styles.ticketCard}>
                  <Text style={styles.ticketNumber}>{item.reference}</Text>
                  <Text style={styles.ticketIssue}>{item.reason || ADMIN_NO_VALUE}</Text>
                  {/* Customer, order number and amount are not in the return summary. */}
                  <Text style={styles.ticketMeta}>
                    {ADMIN_NO_VALUE} · {ADMIN_NO_VALUE} · {ADMIN_NO_VALUE}
                  </Text>

                  {view.open ? (
                    <View style={styles.actionsRow}>
                      {/* Wallet Refund: APPROVED only (BR-61). */}
                      <TouchableOpacity
                        style={[styles.walletBtn, !refundEnabled && styles.actionUnavailable]}
                        onPress={refundEnabled ? () => handleWalletRefund(item) : undefined}
                        activeOpacity={0.7}
                        disabled={!refundEnabled}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !refundEnabled, busy }}
                        testID={`salesReturns.walletRefund.${item.id}`}
                      >
                        <WalletBtnIcon color={SALES_PALETTE.greenText} size={14} />
                        <Text style={styles.walletBtnText}>Wallet Refund</Text>
                      </TouchableOpacity>

                      {view.rejectable ? (
                        <TouchableOpacity
                          style={[styles.rejectBtn, !rejectEnabled && styles.actionUnavailable]}
                          onPress={rejectEnabled ? () => handleReject(item) : undefined}
                          activeOpacity={0.7}
                          disabled={!rejectEnabled}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !rejectEnabled, busy }}
                          testID={`salesReturns.reject.${item.id}`}
                        >
                          <RejectBtnIcon color={SALES_PALETTE.redText} size={14} />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      ) : (
                        /* Bank Refund: no client wrapper by owner decision; disabled (R3). */
                        <TouchableOpacity
                          style={[styles.bankBtn, styles.actionUnavailable]}
                          disabled
                          activeOpacity={1}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: true }}
                          testID={`salesReturns.bankRefund.${item.id}`}
                        >
                          <BankBtnIcon color={SALES_PALETTE.blueText} size={14} />
                          <Text style={styles.bankBtnText}>Bank Refund</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.statusPill,
                        item.status === 'REFUNDED' ? styles.pillGreen : item.status === 'REJECTED' ? styles.pillRed : styles.pillAmber,
                      ]}
                      testID={`salesReturns.pill.${item.id}`}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          item.status === 'REFUNDED' ? styles.pillTextGreen : item.status === 'REJECTED' ? styles.pillTextRed : styles.pillTextAmber,
                        ]}
                      >
                        {view.pillKey === null ? ADMIN_NO_VALUE : t(view.pillKey)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Reject reason step: the listing Reject sheet's frame and styles (screens/listings). */}
      {rejecting !== undefined ? (
        <Modal visible transparent animationType="slide" onRequestClose={closeRejectSheet}>
          <KeyboardAvoidingView style={sheetStyles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={sheetStyles.sheet}>
              <ScrollView contentContainerStyle={sheetStyles.sheetBody} keyboardShouldPersistTaps="handled">
                <View style={sheetStyles.sheetCard}>
                  <Text style={sheetStyles.sheetTitle}>{t('wiringPayouts.salesReturns.reject.confirm.title')}</Text>
                  <Text style={sheetStyles.sheetSubtitle}>
                    {t('wiringPayouts.salesReturns.reject.sheet.subtitle', { ticket: rejecting.reference })}
                  </Text>
                  <Text style={sheetStyles.fieldLabel}>{t('wiringPayouts.salesReturns.reject.sheet.reasonLabel')}</Text>
                  <TextInput
                    style={sheetStyles.notesInput}
                    multiline
                    maxLength={REJECT_REASON_MAX_LENGTH}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholder={t('wiringPayouts.salesReturns.reject.sheet.reasonPlaceholder')}
                    placeholderTextColor={adminColors.placeholder}
                    editable={!reject.isPending}
                    testID="salesReturns.rejectSheet.reason"
                  />
                  <Text style={sheetStyles.charCounter}>
                    {t('wiringPayouts.salesReturns.reject.sheet.charCount', { count: rejectReason.length, max: REJECT_REASON_MAX_LENGTH })}
                  </Text>
                </View>
                {reject.error ? (
                  <View style={[sheetStyles.errorBanner, sheetStyles.sheetError]} testID="salesReturns.rejectSheet.error">
                    <Text style={sheetStyles.errorText}>{t(returnWriteErrorKey(reject.error))}</Text>
                  </View>
                ) : null}
              </ScrollView>
              <View style={sheetStyles.footer}>
                <TouchableOpacity
                  style={sheetStyles.cancelBtn}
                  onPress={closeRejectSheet}
                  disabled={reject.isPending}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  testID="salesReturns.rejectSheet.cancel"
                >
                  <Text style={sheetStyles.cancelBtnText}>{t('wiringPayouts.common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[sheetStyles.confirmBtn, (!reasonCheck.ok || reject.isPending) && sheetStyles.disabled]}
                  onPress={confirmReject}
                  disabled={!reasonCheck.ok || reject.isPending}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !reasonCheck.ok || reject.isPending, busy: reject.isPending }}
                  testID="salesReturns.rejectSheet.confirm"
                >
                  <Text style={sheetStyles.confirmBtnText}>
                    {reject.isPending ? t('wiringPayouts.salesReturns.reject.sheet.sending') : t('wiringPayouts.salesReturns.reject.confirm.ok')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

// Design styles (origin/Superadmin-main), its raw colours mapped to the admin tokens.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    color: SALES_PALETTE.redText,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 32,
  },
  ticketCard: {
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  ticketNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  ticketIssue: {
    fontSize: 14,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 4,
  },
  ticketMeta: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SALES_PALETTE.greenBg,
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  walletBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: SALES_PALETTE.greenText,
  },
  bankBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SALES_PALETTE.blueBg,
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  bankBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: SALES_PALETTE.blueText,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SALES_PALETTE.redBg,
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: SALES_PALETTE.redText,
  },
  /** The designed control, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
  },
  pillGreen: { backgroundColor: SALES_PALETTE.greenBg },
  pillRed: { backgroundColor: SALES_PALETTE.redBg },
  pillAmber: { backgroundColor: SALES_PALETTE.amberBg },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextGreen: { color: SALES_PALETTE.greenText },
  pillTextRed: { color: SALES_PALETTE.redText },
  pillTextAmber: { color: SALES_PALETTE.amberText },
});
