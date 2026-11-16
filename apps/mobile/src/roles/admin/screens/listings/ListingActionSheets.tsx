/**
 * The two inputs the API needs that the queue card cannot carry:
 *   - Reject: the spec requires `reasonCode` (enum) and a 5..500 char `reason`
 *     the farmer sees (POST /admin/listings/{id}/reject).
 *   - Counter: the spec requires `pricePerKg` and `quantityKg`, `message`
 *     optional (CounterOfferCreate).
 * The design's queue calls onReject / onCounter straight from the card, so
 * these sheets reuse the design's own counter-offer card look
 * (FarmerCounterOfferScreen "Your Counter Offer": price with "/ KG" suffix,
 * quantity with "KG", remarks box with counter, docked Cancel / Confirm).
 *
 * Nothing is sent until the draft passes listingsLogic's checks; the server's
 * failure (adminErrorKey) is shown inside the sheet. No ceiling check on the
 * counter price here: BR-07 is the server's.
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COUNTER_MESSAGE_MAX, REJECT_REASON_CODES, REJECT_REASON_MAX, REJECT_REASON_MIN, type ListingQueueRow, type RejectReasonCode } from '../../api/listings';
import type { CounterOfferBody, RejectListingBody } from '../../api/listings';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { formatQuantityKg, validateCounterDraft, validateRejectDraft, type CounterCheck, type RejectCheck } from './listingsLogic';
import { rejectCodeLabel } from './listingsLabels';
import { styles } from './listingsStyles';

interface SheetFrameProps {
  title: string;
  subtitle: string;
  errorText: string | null;
  isPending: boolean;
  confirmLabel: string;
  sendingLabel: string;
  cancelLabel: string;
  testPrefix: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

function SheetFrame(props: SheetFrameProps) {
  const { title, subtitle, errorText, isPending, confirmLabel, sendingLabel, cancelLabel, testPrefix, onCancel, onConfirm, children } = props;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetCard}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetSubtitle}>{subtitle}</Text>
              {children}
            </View>
            {errorText === null ? null : (
              <View style={[styles.errorBanner, styles.sheetError]} testID={`${testPrefix}.error`}>
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isPending}
              activeOpacity={0.8}
              accessibilityRole="button"
              testID={`${testPrefix}.cancel`}
            >
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, isPending && styles.disabled]}
              onPress={onConfirm}
              disabled={isPending}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: isPending, busy: isPending }}
              testID={`${testPrefix}.confirm`}
            >
              <Text style={styles.confirmBtnText}>{isPending ? sendingLabel : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function subtitleOf(row: ListingQueueRow): string {
  const dash = t('listingsAdmin.noValue');
  return t('listingsAdmin.card.cropQty', { crop: row.cropName ?? dash, qty: formatQuantityKg(row.quantityKg) ?? dash });
}

export interface RejectSheetProps {
  row: ListingQueueRow;
  isPending: boolean;
  /** The server's failure, already through adminErrorKey + t; null when none. */
  errorText: string | null;
  onCancel: () => void;
  onConfirm: (body: RejectListingBody) => void;
}

export function RejectSheet({ row, isPending, errorText, onCancel, onConfirm }: RejectSheetProps) {
  const [reasonCode, setReasonCode] = useState<RejectReasonCode | null>(null);
  const [reason, setReason] = useState('');
  const [check, setCheck] = useState<RejectCheck | null>(null);
  const errors = check !== null && !check.ok ? check.errors : {};

  const confirm = () => {
    if (isPending) return;
    const next = validateRejectDraft({ reasonCode, reason });
    setCheck(next);
    if (next.ok) onConfirm(next.body);
  };

  return (
    <SheetFrame
      title={t('listingsAdmin.reject.title')}
      subtitle={subtitleOf(row)}
      errorText={errorText}
      isPending={isPending}
      confirmLabel={t('listingsAdmin.reject.confirm')}
      sendingLabel={t('listingsAdmin.reject.sending')}
      cancelLabel={t('listingsAdmin.reject.cancel')}
      testPrefix="listingsAdmin.rejectSheet"
      onCancel={onCancel}
      onConfirm={confirm}
    >
      <Text style={styles.fieldLabel}>{t('listingsAdmin.reject.reasonCode')}</Text>
      <View style={styles.chipRow}>
        {REJECT_REASON_CODES.map((code) => {
          const selected = reasonCode === code;
          return (
            <TouchableOpacity
              key={code}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => setReasonCode(code)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`listingsAdmin.rejectSheet.code.${code}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{rejectCodeLabel(code)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.reasonCode ? <Text style={styles.fieldError}>{t('listingsAdmin.reject.codeRequired')}</Text> : null}

      <Text style={styles.fieldLabel}>{t('listingsAdmin.reject.reason')}</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        maxLength={REJECT_REASON_MAX}
        value={reason}
        onChangeText={setReason}
        placeholder={t('listingsAdmin.reject.reasonPlaceholder')}
        placeholderTextColor={adminColors.placeholder}
        testID="listingsAdmin.rejectSheet.reason"
      />
      <Text style={styles.charCounter}>{t('listingsAdmin.counter.charCount', { count: reason.length, max: REJECT_REASON_MAX })}</Text>
      {errors.reason ? <Text style={styles.fieldError}>{t('listingsAdmin.reject.reasonRequired', { min: REJECT_REASON_MIN })}</Text> : null}
    </SheetFrame>
  );
}

export interface CounterSheetProps {
  row: ListingQueueRow;
  isPending: boolean;
  errorText: string | null;
  onCancel: () => void;
  onConfirm: (body: CounterOfferBody) => void;
}

export function CounterSheet({ row, isPending, errorText, onCancel, onConfirm }: CounterSheetProps) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(formatQuantityKg(row.quantityKg) ?? '');
  const [message, setMessage] = useState('');
  const [check, setCheck] = useState<CounterCheck | null>(null);
  const errors = check !== null && !check.ok ? check.errors : {};

  const confirm = () => {
    if (isPending) return;
    const next = validateCounterDraft({ price, quantity, message });
    setCheck(next);
    if (next.ok) onConfirm(next.body);
  };

  return (
    <SheetFrame
      title={t('listingsAdmin.counter.title')}
      subtitle={subtitleOf(row)}
      errorText={errorText}
      isPending={isPending}
      confirmLabel={t('listingsAdmin.counter.confirm')}
      sendingLabel={t('listingsAdmin.counter.sending')}
      cancelLabel={t('listingsAdmin.counter.cancel')}
      testPrefix="listingsAdmin.counterSheet"
      onCancel={onCancel}
      onConfirm={confirm}
    >
      <Text style={styles.fieldLabel}>{t('listingsAdmin.counter.price')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputInner}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
          placeholderTextColor={adminColors.placeholder}
          testID="listingsAdmin.counterSheet.price"
        />
        <Text style={styles.inputSuffix}>{t('listingsAdmin.counter.priceSuffix')}</Text>
      </View>
      {errors.price ? <Text style={styles.fieldError}>{t('listingsAdmin.counter.priceInvalid')}</Text> : null}

      <Text style={styles.fieldLabel}>{t('listingsAdmin.counter.quantity')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputInner}
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
          placeholderTextColor={adminColors.placeholder}
          testID="listingsAdmin.counterSheet.quantity"
        />
        <Text style={styles.inputSuffix}>{t('listingsAdmin.counter.quantitySuffix')}</Text>
      </View>
      {errors.quantity ? <Text style={styles.fieldError}>{t('listingsAdmin.counter.quantityInvalid')}</Text> : null}

      <Text style={styles.fieldLabel}>{t('listingsAdmin.counter.message')}</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        maxLength={COUNTER_MESSAGE_MAX}
        value={message}
        onChangeText={setMessage}
        placeholder={t('listingsAdmin.counter.messagePlaceholder')}
        placeholderTextColor={adminColors.placeholder}
        testID="listingsAdmin.counterSheet.message"
      />
      <Text style={styles.charCounter}>{t('listingsAdmin.counter.charCount', { count: message.length, max: COUNTER_MESSAGE_MAX })}</Text>
      {errors.message ? <Text style={styles.fieldError}>{t('listingsAdmin.counter.messageInvalid')}</Text> : null}
    </SheetFrame>
  );
}
