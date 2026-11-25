import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { t } from '../../i18n';
import { adminColors, adminType } from '../../theme';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:      adminColors.brandDeep,
  orange:         adminColors.brand,
  pageBg:         adminColors.canvas,
  cardBg:         adminColors.card,
  ink:            adminColors.ink,
  labelMuted:     adminColors.muted,
  border:         adminColors.border,
  creditGreen:    adminColors.success.text,
  creditGreenBg:  adminColors.success.bg,
  debitRed:       adminColors.danger.text,
  debitRedBg:     adminColors.danger.bg,
  chipActiveBg:   adminColors.brandTint,
  chipActiveText: adminColors.brand,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={adminColors.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ACCOUNT_HEADS = [
  'Revenue / Escrow Clearing',
  'Farmer Payable / Axis Bank',
  'Operational Expense / Utilities',
  'Customer Advances',
  'Logistics / Freight',
  'Warehouse Maintenance',
] as const;

export interface AddManualJournalEntryScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function AddManualJournalEntryScreen({
  onBack,
}: AddManualJournalEntryScreenProps) {
  const [entryType, setEntryType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [accountHead, setAccountHead] = useState<string>(ACCOUNT_HEADS[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  // There is no journal or general-ledger write endpoint in docs/openapi.yaml,
  // so nothing here may claim an entry was posted (brief 07 R3). The form stays
  // as designed; Post is drawn unavailable with the reason under it, the same
  // way screens/community/ draws a control the API cannot back.
  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button First */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <BackChevronIcon />
          </TouchableOpacity>

          {/* Heading Next */}
          <Text style={styles.screenTitle}>Manual Journal Entry</Text>
          <Text style={styles.screenSub}>
            Record manual debit or credit directly into General Ledger
          </Text>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Entry Type Toggle */}
            <Text style={styles.fieldLabel}>Entry Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  entryType === 'CREDIT' && styles.typeBtnCreditActive,
                ]}
                onPress={() => setEntryType('CREDIT')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    entryType === 'CREDIT' && styles.typeBtnCreditTextActive,
                  ]}
                >
                  + Credit (Inflow)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  entryType === 'DEBIT' && styles.typeBtnDebitActive,
                ]}
                onPress={() => setEntryType('DEBIT')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    entryType === 'DEBIT' && styles.typeBtnDebitTextActive,
                  ]}
                >
                  - Debit (Outflow)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account Head */}
            <Text style={styles.fieldLabel}>Account Head</Text>
            <View style={styles.chipsWrap}>
              {ACCOUNT_HEADS.map((head) => {
                const isActive = accountHead === head;
                return (
                  <TouchableOpacity
                    key={head}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setAccountHead(head)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {head}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount Input */}
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 25000"
                placeholderTextColor={adminColors.placeholder}
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description / Narration</Text>
            <TextInput
              style={styles.textInputArea}
              placeholder="e.g. Settlement Batch adjustment for Coonoor warehouse invoice"
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Reference Number */}
            <Text style={styles.fieldLabel}>Voucher / Reference # (Optional)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. JRNL-2026-0924-01"
                placeholderTextColor={adminColors.placeholder}
                value={referenceNo}
                onChangeText={setReferenceNo}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Submit Button: no journal endpoint, so drawn unavailable (R3). */}
          <TouchableOpacity
            style={[styles.submitBtn, styles.actionUnavailable]}
            disabled
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="finance.journal.submit"
          >
            <Text style={styles.submitBtnText}>Post Journal Entry</Text>
          </TouchableOpacity>
          <Text style={styles.unavailableNote}>{t('wiringFinance.journal.unavailable')}</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
    marginTop: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnCreditActive: {
    backgroundColor: PALETTE.creditGreenBg,
    borderColor: PALETTE.creditGreen,
  },
  typeBtnDebitActive: {
    backgroundColor: PALETTE.debitRedBg,
    borderColor: PALETTE.debitRed,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  typeBtnCreditTextActive: {
    color: PALETTE.creditGreen,
    fontWeight: '700',
  },
  typeBtnDebitTextActive: {
    color: PALETTE.debitRed,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipActive: {
    backgroundColor: PALETTE.chipActiveBg,
    borderColor: PALETTE.orange,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  chipTextActive: {
    color: PALETTE.chipActiveText,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: PALETTE.pageBg,
    height: 48,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: PALETTE.pageBg,
    fontSize: 13,
    color: PALETTE.ink,
    textAlignVertical: 'top',
    height: 76,
  },
  submitBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  /** The designed control, kept visible, drawn as unavailable (screens/community/ pattern). */
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 8,
  },
});
