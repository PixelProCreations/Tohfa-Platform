import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  HistoryClockIcon,
  PlusIcon,
  RupeeTagIcon,
} from '../../components/AdminIcons';

export interface WalletDeductionFlowProps {
  customer?: {
    name?: string | undefined;
    id?: string | undefined;
    mobile?: string | undefined;
    balance?: string | undefined;
  } | undefined;
  role?: string | undefined;
  onBack: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const REASON_CATEGORIES = [
  'Wallet Correction',
  'Duplicate Credit Reversal',
  'Incorrect Wallet Credit',
  'Order Refund Adjustment',
  'Promotional Credit Reversal',
  'Payment / Transaction Failed',
  'Unauthorized Credit Reversal',
  'Admin Adjustment',
  'Fraud / Suspicious Activity',
  'Other',
];

/**
 * WalletDeductionFlow (M13-S06, M13-S07, M13-S08)
 *
 * Implements the 3-step Customer Wallet money deduction flow:
 * 1. Deduction Money (M13-S06)
 * 2. Fiscal Cash Tag Review (M13-S07)
 * 3. Deduction Confirmation (M13-S08)
 */
export function WalletDeductionFlow({
  customer = {
    name: 'Ravi Kumar',
    id: 'CUS-001245',
    mobile: '+91 XXXXX XXXXX',
    balance: '₹4,500',
  },
  role = 'SUPER_ADMIN',
  onBack,
  onSuccess,
}: WalletDeductionFlowProps): React.JSX.Element {
  const [step, setStep] = useState<'amount' | 'fiscal_tag' | 'confirm'>('amount');

  // Form State
  const [deductAmount, setDeductAmount] = useState<number>(500);
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountText, setCustomAmountText] = useState<string>('500');
  const [selectedReason, setSelectedReason] = useState<string>('Wallet Correction');
  const [fiscalCashTag, setFiscalCashTag] = useState<string>('FC-20261013-002');
  const [description, setDescription] = useState<string>(
    'Deducting ₹500 due to Order refund adjustment.'
  );
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState<boolean>(true);
  const [showReasonDropdown, setShowReasonDropdown] = useState<boolean>(false);

  // Parse current balance
  const currentNumeric = 4500;
  const newBalanceNumeric = Math.max(0, currentNumeric - deductAmount);

  // ─── STEP 2: Fiscal Cash Tag (M13-S07) ──────────────────────────────────────
  if (step === 'fiscal_tag') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setStep('amount')}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fiscal Cash Tag</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Transaction Summary Card */}
          <Text style={styles.sectionTitle}>Transaction Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Customer</Text>
                <Text style={styles.cardMetaValue}>{customer.name}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Customer ID</Text>
                <Text style={styles.cardMetaValue}>{customer.id}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Current Balance</Text>
                <Text style={styles.cardMetaValue}>₹{currentNumeric.toLocaleString()}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Deduction Amount</Text>
                <Text style={styles.cardMetaValue}>
                  ₹{deductAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Expected New Balance</Text>
                <Text style={styles.cardMetaValue}>
                  ₹{newBalanceNumeric.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Fiscal Cash Tag Input Field (Matching Image 1 left) */}
          <View style={{ marginTop: adminSpacing.lg }}>
            <View style={[styles.rowBetween, { marginBottom: 6 }]}>
              <Text style={styles.label}>Fiscal Cash Tag</Text>
              <Text style={styles.requiredBadge}>Required</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={fiscalCashTag}
              onChangeText={setFiscalCashTag}
              placeholder="e.g. FC-20260925-0012"
              placeholderTextColor={adminColors.placeholder}
              autoCapitalize="characters"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (!fiscalCashTag.trim()) {
                Alert.alert('Required Field', 'Please enter a valid Fiscal Cash Tag.');
                return;
              }
              setStep('confirm');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>→ Review Deduction</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 3: Confirm Cash Deduction (M13-S08) ───────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setStep('fiscal_tag')}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Cash Deduction</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Card */}
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{customer.name}</Text>
            <Text style={styles.cardMeta}>{customer.id}</Text>
          </View>

          {/* Wallet Card */}
          <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>Wallet</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Current Balance</Text>
              <Text style={styles.fieldValue}>₹{currentNumeric.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Deduction</Text>
              <Text style={[styles.fieldValue, styles.dangerText]}>
                -₹{deductAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={[styles.fieldLabel, styles.newBalanceLabel]}>New Balance</Text>
              <Text style={[styles.fieldValue, styles.newBalanceValue]}>
                ₹{newBalanceNumeric.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Cash Information Card */}
          <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>
            Cash Information
          </Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Transition Type</Text>
                <Text style={styles.cardMetaValue}>Deduct Money</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Fiscal Cash Tag</Text>
                <Text style={styles.cardMetaValue}>{fiscalCashTag}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Fiscal Cash Tag</Text>
                <Text style={styles.cardMetaValue}>{fiscalCashTag}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Reason Category</Text>
                <Text style={styles.cardMetaValue}>{selectedReason}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.cardMetaLabel}>Description</Text>
              <Text style={styles.cardMetaValue}>{description}</Text>
            </View>
          </View>

          {/* Admin Information Card */}
          <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>
            Admin Information
          </Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Processed By</Text>
                <Text style={styles.cardMetaValue}>
                  {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Demo TOHFA Admin'}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Date</Text>
                <Text style={styles.cardMetaValue}>25 Sep 2026</Text>
              </View>
            </View>
            <View style={[styles.twoColRow, { marginTop: 12 }]}>
              <View style={styles.col}>
                <Text style={styles.cardMetaLabel}>Time</Text>
                <Text style={styles.cardMetaValue}>10:42 AM</Text>
              </View>
              <View style={styles.col} />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Confirm Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Alert.alert(
                'Deduction Successful',
                `₹${deductAmount.toFixed(2)} has been successfully debited from ${customer.name}'s wallet. Tag: ${fiscalCashTag}`,
                [
                  {
                    text: 'Done',
                    onPress: () => {
                      onSuccess();
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>✓ Confirm Deduction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setStep('fiscal_tag')}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 1: Deduction Money (M13-S06) ───────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deduction Money</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Profile Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{customer.name}</Text>
            <Text style={styles.cardMeta}>{customer.id}</Text>
            <Text style={styles.currentBalanceText}>Current Wallet Balance</Text>
            <Text style={styles.currentBalanceVal}>{customer.balance}</Text>
          </View>

          {/* Deduct Amount Box */}
          <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>
            Deduct Amount
          </Text>
          <View style={styles.amountDisplayCard}>
            <Text style={styles.currencySymbol}>₹</Text>
            {isCustomAmount ? (
              <TextInput
                style={styles.amountBigInput}
                value={customAmountText}
                onChangeText={(val) => {
                  setCustomAmountText(val);
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) setDeductAmount(parsed);
                }}
                keyboardType="numeric"
                autoFocus
              />
            ) : (
              <Text style={styles.amountBigText}>{deductAmount.toFixed(2)}</Text>
            )}
          </View>

          {/* Preset Amounts */}
          <View style={styles.rowBetween}>
            <Text style={styles.presetHeading}>Preset Amounts</Text>
            <Text style={styles.configDrivenText}>Config-driven</Text>
          </View>
          <View style={styles.presetsGrid}>
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = !isCustomAmount && deductAmount === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                  onPress={() => {
                    setIsCustomAmount(false);
                    setDeductAmount(amt);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetBtnText, isSelected && styles.presetBtnTextActive]}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.customPresetBtn, isCustomAmount && styles.presetBtnActive]}
            onPress={() => {
              setIsCustomAmount(true);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.presetBtnText,
                isCustomAmount && styles.presetBtnTextActive,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>

          {/* Reason Category Dropdown */}
          <Text style={[styles.label, { marginTop: adminSpacing.md }]}>
            Reason Category *
          </Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowReasonDropdown(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownBtnText}>{selectedReason}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {/* Fiscal Cash Tag / Transaction ID */}
          <Text style={[styles.label, { marginTop: adminSpacing.md }]}>
            Fiscal Cash Tag / Transaction ID *
          </Text>
          <TextInput
            style={styles.textInput}
            value={fiscalCashTag}
            onChangeText={setFiscalCashTag}
            placeholder="e.g. FC-20261013-002"
            placeholderTextColor={adminColors.placeholder}
          />

          {/* Description / Reason */}
          <View style={[styles.rowBetween, { marginTop: adminSpacing.md }]}>
            <Text style={styles.label}>Description / Reason *</Text>
            <Text style={styles.charCount}>{description.length}/250</Text>
          </View>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter reason for deduction..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            maxLength={250}
          />

          {/* Confirmation Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsConfirmedCheckbox(!isConfirmedCheckbox)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkboxBox,
                isConfirmedCheckbox && styles.checkboxBoxActive,
              ]}
            >
              {isConfirmedCheckbox && (
                <CheckmarkIcon size={14} color={adminColors.onBrand} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I confirm to deduct ₹{deductAmount.toFixed(2)} from this customer's wallet.
            </Text>
          </TouchableOpacity>

          {/* Balance Preview Card */}
          <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>
            Balance Preview
          </Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Current Balance</Text>
              <Text style={styles.fieldValue}>₹{currentNumeric.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Deduction</Text>
              <Text style={[styles.fieldValue, styles.dangerText]}>
                -₹{deductAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={[styles.fieldLabel, styles.newBalanceLabel]}>New Balance</Text>
              <Text style={[styles.fieldValue, styles.newBalanceValue]}>
                ₹{newBalanceNumeric.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomBarRow}>
        <TouchableOpacity
          style={styles.cancelHalfBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryHalfBtn, !isConfirmedCheckbox && styles.disabledBtn]}
          onPress={() => {
            if (!isConfirmedCheckbox) {
              Alert.alert('Confirmation Required', 'Please check the confirmation checkbox.');
              return;
            }
            if (!fiscalCashTag.trim()) {
              Alert.alert('Required Field', 'Please enter a Fiscal Cash Tag / Transaction ID.');
              return;
            }
            setStep('fiscal_tag');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Review deduction</Text>
        </TouchableOpacity>
      </View>

      {/* Reason Category Modal Dropdown (Matching Image 5 right) */}
      <Modal
        visible={showReasonDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReasonDropdown(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Reason Category</Text>
            {REASON_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.dropdownOptionRow,
                  selectedReason === cat && styles.dropdownOptionRowActive,
                  idx > 0 && styles.dropdownOptionDivider,
                ]}
                onPress={() => {
                  setSelectedReason(cat);
                  setShowReasonDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedReason === cat && styles.dropdownOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
                {selectedReason === cat && (
                  <Text style={styles.dropdownOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  cardMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  currentBalanceText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  currentBalanceVal: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '800',
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  amountDisplayCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  currencySymbol: {
    fontSize: 24,
    color: adminColors.muted,
    fontWeight: '600',
  },
  amountBigText: {
    fontSize: 34,
    fontWeight: '800',
    color: adminColors.ink,
  },
  amountBigInput: {
    fontSize: 34,
    fontWeight: '800',
    color: adminColors.ink,
    minWidth: 120,
    textAlign: 'center',
  },
  presetHeading: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    marginTop: adminSpacing.md,
  },
  configDrivenText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    marginTop: adminSpacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  presetBtnText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
  },
  presetBtnTextActive: {
    color: adminColors.onBrand,
  },
  customPresetBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  label: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    marginBottom: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  dropdownBtnText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  textInput: {
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
  },
  textArea: {
    height: 80,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
    textAlignVertical: 'top',
  },
  charCount: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  checkboxBoxActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  fieldValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  dangerText: {
    color: adminColors.danger.text,
  },
  boldInk: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  newBalanceLabel: {
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  newBalanceValue: {
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  cardMetaLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  cardMetaValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredBadge: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.brand,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  bottomBarRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: adminColors.card,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  cancelHalfBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryHalfBtn: {
    flex: 2,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dropdownModalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  dropdownModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  dropdownOptionRowActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownOptionDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  dropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownOptionTextActive: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  dropdownOptionCheck: {
    fontSize: 16,
    color: adminColors.brand,
    fontWeight: '700',
  },
});

