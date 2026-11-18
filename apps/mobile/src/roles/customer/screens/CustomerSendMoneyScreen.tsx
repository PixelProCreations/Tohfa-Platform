import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ApiError } from '../../../shell/api/client';
import { useWallet } from '../api/wallet';
import { mapProblem } from '../api/problem';
import {
  useLookupRecipient,
  useSendTransfer,
  useTransfers,
  type CreatedTransfer,
  type TransferRecipient,
} from '../api/transfers';
import {
  checkAmount,
  exceedsBalance,
  formatInr,
  formatIstDateTime,
  normalizeIndianMobile,
  sanitizeAmountText,
  txnCodeFromId,
} from '../api/walletMoney';
import { t } from '../../../i18n/customer';

export interface CustomerSendMoneyScreenProps {
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A1A1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletBookSvg = ({ color = '#2E7D32', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M9 7h6M9 11h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const PhoneCallSvg = ({ color = '#676767', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletIdCardSvg = ({ color = '#676767', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={5} width={18} height={14} rx={3} stroke={color} strokeWidth={1.8} />
    <Path d="M3 10h18" stroke={color} strokeWidth={1.8} />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const GreenCheckmarkSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} fill="#2E7D32" />
    <Path
      d="M8 12.5l2.5 2.5 5.5-5.5"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SendPaperPlaneSvg = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseCrossSvg = ({ color = '#676767', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ReceiptDocSvg = ({ color = '#2E7D32', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CalendarSvg = ({ color = '#2E7D32', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CelebrationPlaneSvg = () => (
  <View style={styles.planeCircle}>
    <Svg width={36} height={36} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={22} fill="#DCFCE7" />
      <Path
        d="M36 12L19 27M36 12L25 36l-5-9-9-4 25-11z"
        stroke="#2E7D32"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#EDF8EE"
      />
      <Circle cx={12} cy={16} r={2} fill="#F59E0B" />
      <Circle cx={36} cy={34} r={2.5} fill="#3B82F6" />
      <Circle cx={14} cy={32} r={1.5} fill="#10B981" />
    </Svg>
  </View>
);

interface SendProblem {
  message: string;
  /** Shortfall (Money string) when the wallet is too low -> offer "Add money". */
  shortfall?: string | undefined;
  /** Not-retryable-by-user-edit: keep the confirm modal open for a same-key retry. */
  retryable: boolean;
  waitSeconds?: number | undefined;
}

function describeSendError(err: unknown): SendProblem | null {
  const p = mapProblem(err);
  if (p.silent) return null;
  if (err instanceof ApiError) {
    if (err.status === 404) return { message: t('customer.wallet.send.error.noAccount'), retryable: false };
    if (err.is('WALLET_INSUFFICIENT')) {
      return { message: p.message, shortfall: err.walletShortfall?.shortfall, retryable: false };
    }
    if (err.is('WALLET_TRANSFER_LIMIT_EXCEEDED') && err.detail) {
      return { message: err.detail, retryable: false };
    }
    if (p.action === 'wait' && p.retryAfterSeconds !== null) {
      return { message: p.message, retryable: false, waitSeconds: p.retryAfterSeconds };
    }
    return { message: p.message, retryable: p.action === 'retry' };
  }
  return { message: p.message, retryable: p.action === 'retry' };
}

const initialsOf = (displayName: string): string =>
  displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const CustomerSendMoneyScreen: React.FC<CustomerSendMoneyScreenProps> = ({ onBack, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const walletQuery = useWallet();
  const balance = walletQuery.data?.balance ?? null;
  const lookup = useLookupRecipient();
  const send = useSendTransfer();
  const history = useTransfers();

  const [mobileInput, setMobileInput] = useState<string>('');
  const [recipient, setRecipient] = useState<(TransferRecipient & { mobile: string }) | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [sendError, setSendError] = useState<SendProblem | null>(null);

  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState<boolean>(false);
  const [done, setDone] = useState<CreatedTransfer | null>(null);

  useEffect(() => {
    if (waitSeconds <= 0) return undefined;
    const id = setInterval(() => setWaitSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [waitSeconds > 0]);

  const normalizedMobile = normalizeIndianMobile(mobileInput);
  const amountCheck = checkAmount(amountInput);
  const tooMuch = amountCheck.ok && exceedsBalance(amountCheck.amount, balance);
  const canSend = recipient !== null && amountCheck.ok && !tooMuch && !send.isPending;
  const canVerify = normalizedMobile !== null && !lookup.isPending && waitSeconds === 0;

  const handleVerify = async () => {
    setLookupError(null);
    if (normalizedMobile === null) {
      setLookupError(t('customer.wallet.send.error.invalidMobile'));
      return;
    }
    try {
      const found = await lookup.mutateAsync(normalizedMobile);
      setRecipient({ ...found, mobile: normalizedMobile });
    } catch (err) {
      setRecipient(null);
      const problem = describeSendError(err);
      if (problem === null) return;
      setLookupError(problem.message);
      if (problem.waitSeconds !== undefined) setWaitSeconds(problem.waitSeconds);
    }
  };

  const handleConfirmTransfer = async () => {
    if (recipient === null || !amountCheck.ok) return;
    setSendError(null);
    try {
      const created = await send.mutateAsync({
        recipientMobile: recipient.mobile,
        amount: amountCheck.amount,
        note: noteInput,
      });
      setShowPaymentDetailsModal(false);
      setDone(created);
      void history.refetch();
    } catch (err) {
      const problem = describeSendError(err);
      if (problem === null) return;
      setSendError(problem);
      // Failures the user can only fix by editing (limits, self, insufficient funds...) close the review step.
      if (!problem.retryable && problem.shortfall === undefined) setShowPaymentDetailsModal(false);
    }
  };

  const handleCloseSuccess = () => {
    setDone(null);
    onBack?.();
  };

  const transfers = (history.data?.pages ?? []).flatMap((pg) => pg.items);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.circleIconButton}
          accessibilityLabel={t('customer.wallet.back')}
        >
          <BackArrowSvg color="#1A1A1A" size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.wallet.sendMoney')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── FROM SECTION ────────────────────────────────────────────────────── */}
        <Text style={styles.fieldLabel}>{t('customer.wallet.send.from')}</Text>
        <View style={styles.fromCard}>
          <View style={styles.fromIconBox}>
            <WalletBookSvg color="#2E7D32" size={20} />
          </View>
          <View style={styles.fromTextWrap}>
            <Text style={styles.fromTitle}>{t('customer.wallet.send.walletName')}</Text>
            <Text style={styles.fromSubtitle}>{t('customer.wallet.send.balance', { amount: formatInr(balance) })}</Text>
          </View>
        </View>

        {/* ── RECIPIENT (mobile number only: the API has no wallet-id / directory lookup) ─────── */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>{t('customer.wallet.send.mobileLabel')}</Text>
        <View style={styles.inputWrap}>
          <PhoneCallSvg color="#676767" size={18} />
          <TextInput
            style={styles.textInput}
            value={mobileInput}
            placeholder={t('customer.wallet.send.mobilePlaceholder')}
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={16}
            accessibilityLabel={t('customer.wallet.send.mobileA11y')}
            onChangeText={(text) => {
              setMobileInput(text);
              setRecipient(null);
              setLookupError(null);
              setSendError(null);
            }}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!canVerify}
            onPress={() => void handleVerify()}
            style={styles.rightIconPress}
            accessibilityLabel={t('customer.wallet.send.verifyA11y')}
          >
            {lookup.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text style={{ color: canVerify ? '#2E7D32' : '#9CA3AF', fontWeight: '700', fontSize: 13 }}>
                {waitSeconds > 0 ? `${waitSeconds}s` : t('customer.wallet.send.verify')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {lookupError !== null ? (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }} accessibilityRole="alert">
            {lookupError}
          </Text>
        ) : null}

        {/* ── VERIFIED RECIPIENT BADGE (masked by the API) ────────────────────── */}
        {recipient !== null ? (
          <View style={styles.verifiedCard}>
            <View style={[styles.avatarCircle, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.avatarText, { color: '#15803D' }]}>{initialsOf(recipient.displayName)}</Text>
            </View>
            <View style={styles.verifiedTextWrap}>
              <Text style={styles.verifiedName}>{recipient.displayName}</Text>
              <Text style={styles.verifiedDetail}>{recipient.mobileMasked}</Text>
            </View>
            <GreenCheckmarkSvg size={20} />
          </View>
        ) : null}

        {/* ── AMOUNT SECTION ─────────────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 22 }]}>{t('customer.wallet.topup.amountLabel')}</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amountInput}
            onChangeText={(text) => {
              setAmountInput(sanitizeAmountText(text));
              setSendError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel={t('customer.wallet.topup.amountLabel')}
          />
        </View>
        <View style={styles.amountUnderline} />
        {tooMuch ? (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {t('customer.wallet.send.error.exceedsBalance')}
          </Text>
        ) : null}

        {/* ── NOTE (OPTIONAL) SECTION ────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>{t('customer.wallet.send.noteLabel')}</Text>
        <TextInput
          style={styles.noteInput}
          placeholder={t('customer.wallet.send.notePlaceholder')}
          placeholderTextColor="#9CA3AF"
          value={noteInput}
          onChangeText={setNoteInput}
          maxLength={100}
          accessibilityLabel={t('customer.wallet.send.noteA11y')}
        />
        <View style={styles.noteUnderline} />
        <Text style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>{noteInput.length}/100</Text>

        {sendError !== null && !showPaymentDetailsModal ? (
          <View style={{ marginTop: 12 }} accessibilityRole="alert">
            <Text style={{ color: '#DC2626', fontSize: 12 }}>{sendError.message}</Text>
            {sendError.shortfall !== undefined ? (
              <TouchableOpacity
                onPress={() => onNavigate?.('Topup', { shortfall: sendError.shortfall })}
                accessibilityLabel={t('customer.wallet.send.addMoney')}
              >
                <Text style={{ color: '#2E7D32', fontWeight: '700', marginTop: 6 }}>{t('customer.wallet.send.addMoney')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── SEND MONEY BUTTON ──────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!canSend}
          onPress={() => {
            setSendError(null);
            setShowPaymentDetailsModal(true);
          }}
          style={[styles.sendMoneyMainBtn, !canSend && styles.sendMoneyMainBtnDisabled]}
          accessibilityLabel={t('customer.wallet.sendMoney')}
        >
          <SendPaperPlaneSvg color={canSend ? '#FFFFFF' : '#9CA3AF'} size={18} />
          <Text style={[styles.sendMoneyMainBtnText, !canSend && styles.sendMoneyMainBtnTextDisabled]}>
            {t('customer.wallet.sendMoney')}
          </Text>
        </TouchableOpacity>

        {/* ── TRANSFER HISTORY ───────────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 28 }]}>{t('customer.wallet.send.recent')}</Text>
        {history.isLoading ? (
          <ActivityIndicator accessibilityLabel={t('customer.wallet.send.loadingTransfers')} />
        ) : history.isError ? (
          <TouchableOpacity onPress={() => void history.refetch()} accessibilityLabel={t('customer.wallet.send.retryTransfers')}>
            <Text style={{ color: '#2E7D32', fontWeight: '700' }}>{t('customer.wallet.send.loadError')}</Text>
          </TouchableOpacity>
        ) : transfers.length === 0 ? (
          <Text style={{ color: '#6B7280', fontSize: 13 }}>{t('customer.wallet.send.empty')}</Text>
        ) : (
          <>
            {transfers.map((tr) => (
              <View key={tr.id} style={styles.summaryItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryItemValueBold}>
                    {tr.direction === 'SENT'
                      ? t('customer.wallet.send.sentTo', { name: tr.counterparty.displayName })
                      : t('customer.wallet.send.receivedFrom', { name: tr.counterparty.displayName })}
                  </Text>
                  <Text style={styles.summaryItemLabel}>{formatIstDateTime(tr.createdAt)}</Text>
                </View>
                <Text style={[styles.summaryItemValueBold, { color: tr.direction === 'SENT' ? '#DC2626' : '#15803D' }]}>
                  {tr.direction === 'SENT' ? '-' : '+'} {formatInr(tr.amount)}
                </Text>
              </View>
            ))}
            {history.hasNextPage ? (
              <TouchableOpacity onPress={() => void history.fetchNextPage()} accessibilityLabel={t('customer.wallet.send.loadMoreA11y')}>
                <Text style={{ color: '#2E7D32', fontWeight: '700', marginTop: 8 }}>{t('customer.wallet.tx.loadMore')}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* ── CONFIRM MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={showPaymentDetailsModal} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.paymentModalCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPaymentDetailsModal(false)}
              style={styles.modalCloseBtn}
              accessibilityLabel={t('customer.wallet.close')}
            >
              <CloseCrossSvg color="#676767" size={14} />
            </TouchableOpacity>

            {recipient !== null ? (
              <View style={styles.modalRecipientBadge}>
                <View style={[styles.avatarCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.avatarText, { color: '#15803D' }]}>{initialsOf(recipient.displayName)}</Text>
                </View>
                <View style={styles.verifiedTextWrap}>
                  <Text style={styles.verifiedName}>{recipient.displayName}</Text>
                  <Text style={styles.verifiedDetail}>{recipient.mobileMasked}</Text>
                </View>
                <GreenCheckmarkSvg size={18} />
              </View>
            ) : null}

            <Text style={styles.modalSectionTitle}>{t('customer.wallet.send.paymentDetails')}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('customer.wallet.topup.amountLabel')}</Text>
              <Text style={styles.detailValue}>{amountCheck.ok ? formatInr(amountCheck.amount) : '—'}</Text>
            </View>
            {noteInput.trim() !== '' ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('customer.wallet.send.note')}</Text>
                <Text style={styles.detailValue}>{noteInput.trim()}</Text>
              </View>
            ) : null}
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('customer.wallet.send.totalPayable')}</Text>
              <Text style={styles.totalValue}>{amountCheck.ok ? formatInr(amountCheck.amount) : '—'}</Text>
            </View>

            {sendError !== null ? (
              <View style={{ marginTop: 10 }} accessibilityRole="alert">
                <Text style={{ color: '#DC2626', fontSize: 12 }}>{sendError.message}</Text>
                {sendError.shortfall !== undefined ? (
                  <TouchableOpacity
                    onPress={() => {
                      setShowPaymentDetailsModal(false);
                      onNavigate?.('Topup', { shortfall: sendError.shortfall });
                    }}
                    accessibilityLabel={t('customer.wallet.send.addMoney')}
                  >
                    <Text style={{ color: '#2E7D32', fontWeight: '700', marginTop: 6 }}>{t('customer.wallet.send.addMoney')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={send.isPending}
              onPress={() => void handleConfirmTransfer()}
              style={styles.confirmTransferBtn}
              accessibilityLabel={t('customer.wallet.send.confirm')}
            >
              {send.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmTransferBtnText}>
                  {sendError?.retryable ? t('customer.wallet.send.retryTransfer') : t('customer.wallet.send.confirm')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MONEY SENT SUCCESSFULLY MODAL ─────────────────────────────────────── */}
      <Modal visible={done !== null} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCloseSuccess}
              style={styles.modalCloseBtn}
              accessibilityLabel={t('customer.wallet.close')}
            >
              <CloseCrossSvg color="#676767" size={14} />
            </TouchableOpacity>

            <CelebrationPlaneSvg />

            <Text style={styles.successTitle}>{t('customer.wallet.send.successTitle')}</Text>

            {done !== null ? (
              <>
                <Text style={styles.successSubtext}>
                  {t('customer.wallet.send.sentToLine', { amount: formatInr(done.amount) })}{'\n'}
                  <Text style={styles.boldText}>{done.counterparty.displayName}</Text>
                  {'\n'}({done.counterparty.mobileMasked}).
                </Text>

                <View style={styles.successSummaryCard}>
                  <View style={styles.summaryItemRow}>
                    <View style={styles.summaryItemLeft}>
                      <ReceiptDocSvg color="#2E7D32" size={15} />
                      <Text style={styles.summaryItemLabel}>{t('customer.wallet.result.transactionId')}</Text>
                    </View>
                    <Text style={styles.summaryItemValueBold}>{txnCodeFromId(done.id)}</Text>
                  </View>

                  <View style={styles.summaryItemRow}>
                    <View style={styles.summaryItemLeft}>
                      <CalendarSvg color="#2E7D32" size={15} />
                      <Text style={styles.summaryItemLabel}>{t('customer.wallet.send.dateTime')}</Text>
                    </View>
                    <Text style={styles.summaryItemValue}>{formatIstDateTime(done.createdAt)}</Text>
                  </View>

                  <View style={styles.summaryItemRow}>
                    <View style={styles.summaryItemLeft}>
                      <WalletIdCardSvg color="#2E7D32" size={15} />
                      <Text style={styles.summaryItemLabel}>{t('customer.wallet.send.updatedBalance')}</Text>
                    </View>
                    <Text style={styles.summaryItemValueBold}>{formatInr(done.balanceAfter)}</Text>
                  </View>
                </View>
              </>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCloseSuccess}
              style={styles.closeOutlineBtn}
              accessibilityLabel={t('customer.wallet.close')}
            >
              <Text style={styles.closeOutlineBtnText}>{t('customer.wallet.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#676767',
    marginBottom: 6,
  },

  // From Card
  fromCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  fromIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fromTextWrap: {
    flex: 1,
  },
  fromTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  fromSubtitle: {
    fontSize: 12.5,
    color: '#676767',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  tabButtonActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#EDF8EE',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#676767',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  rightIconPress: {
    padding: 4,
  },

  // Verified Badge
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8EE',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedTextWrap: {
    flex: 1,
  },
  verifiedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  verifiedDetail: {
    fontSize: 11.5,
    color: '#676767',
  },

  // Amount
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rupeeSymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingVertical: 2,
  },
  amountUnderline: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 6,
  },

  // Note
  noteInput: {
    fontSize: 13,
    color: '#1A1A1A',
    paddingVertical: 6,
  },
  noteUnderline: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },

  // Send Money Main Button
  sendMoneyMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    height: 50,
    borderRadius: 25,
    marginTop: 32,
    gap: 8,
  },
  sendMoneyMainBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendMoneyMainBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sendMoneyMainBtnTextDisabled: {
    color: '#9CA3AF',
  },

  // Contacts Modal
  contactsModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contactsSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contactsSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    gap: 8,
  },
  contactsSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  contactsSectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: '#676767',
  },

  // Modal Backdrop & Cards
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paymentModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalRecipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8EE',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    marginTop: 12,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#676767',
  },
  detailValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  otpHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  otpSubtext: {
    fontSize: 11.5,
    color: '#676767',
    lineHeight: 16,
    marginBottom: 10,
  },
  otpInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  confirmTransferBtn: {
    backgroundColor: '#2E7D32',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  confirmTransferBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success Modal
  successModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    position: 'relative',
  },
  planeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 13,
    color: '#676767',
    textAlign: 'center',
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  successSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#676767',
  },
  summaryItemValue: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  summaryItemValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeOutlineBtn: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    height: 44,
    borderRadius: 22,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  closeOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
});
