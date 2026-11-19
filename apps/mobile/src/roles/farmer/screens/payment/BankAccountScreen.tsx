import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P, colors, typography } from '../../theme';
import { formatErrorMessage } from '../../../../shell/api/client';
import { t } from '../../../../i18n/farmer';
import {
  createMyBankAccount,
  listMyBankAccounts,
  updateMyBankAccount,
  type FarmerBankAccount,
  type UpdateFarmerBankAccountInput,
} from '../../api/payoutDestinations';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilEditIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l10.732-10.73z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.5 7.125L16.862 4.487"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.75l6 6 9-13.5"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 15, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.1" fill={color} />
    </Svg>
  );
}

// ── Screen Props ─────────────────────────────────────────────────────────────

export interface BankAccountScreenProps {
  onBack?: () => void;
  onSaveSuccess?: () => void;
}

export function BankAccountScreen({
  onBack,
  onSaveSuccess,
}: BankAccountScreenProps): React.JSX.Element {
  // The saved account comes from the server (GET /farmers/me/bank-accounts). The server only
  // ever returns the last four digits of the number (BR-53a), so that is all this screen can show.
  const [account, setAccount] = useState<FarmerBankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form draft state during editing
  const [draftHolder, setDraftHolder] = useState('');
  const [draftBank, setDraftBank] = useState('');
  const [draftNumber, setDraftNumber] = useState('');
  const [draftIfsc, setDraftIfsc] = useState('');
  const [draftBranch, setDraftBranch] = useState('');

  // Active focused input for border highlight
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await listMyBankAccounts();
      // Only bank rows (UPI is never listed here, but do not trust a null bank name to render).
      const banks = list.filter((a) => a.bankName !== null);
      setAccount(banks.find((a) => a.isDefault) ?? banks[0] ?? null);
    } catch (err) {
      setLoadError(formatErrorMessage(err, t('farmer.payment.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  // Display values. Nothing is invented: a missing account renders as a dash.
  const accountHolder = account?.accountHolderName ?? '—';
  const bankName = account?.bankName ?? '—';
  const accountNumber = account?.accountNumberLast4
    ? `• • • • • • • • ${account.accountNumberLast4}`
    : '—';
  const ifscCode = account?.ifsc ?? '—';
  const branch = account?.branchName ?? '—';

  // Hardware back press handling
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isEditing) {
        handleCancel();
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isEditing, onBack, saving]);

  const handleStartEditing = () => {
    setDraftHolder(account?.accountHolderName ?? '');
    setDraftBank(account?.bankName ?? '');
    // The full number is never returned, so it can only be re-entered, never edited in place.
    setDraftNumber('');
    setDraftIfsc(account?.ifsc ?? '');
    setDraftBranch(account?.branchName ?? '');
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (saving) return;
    setSaveError(null);
    setIsEditing(false);
  };

  const handleHeaderBack = () => {
    if (isEditing) {
      handleCancel();
    } else if (onBack) {
      onBack();
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaveError(null);

    const holder = draftHolder.trim();
    const bank = draftBank.trim();
    const number = draftNumber.replace(/\s/g, '');
    const ifsc = draftIfsc.trim().toUpperCase();
    const branchName = draftBranch.trim();

    // A new account needs the full number; an existing one keeps its number unless re-entered.
    if (!holder || !bank || !ifsc || (!account && !number)) {
      Alert.alert('Missing Required Fields', 'Please fill in all required fields marked with *.');
      return;
    }

    setSaving(true);
    try {
      let saved: FarmerBankAccount;
      if (account) {
        // Send only what changed: the server resets verification when the number or IFSC change
        // (BR-53c), and an untouched edit must not look like a re-submission.
        const patch: UpdateFarmerBankAccountInput = {};
        if (holder !== account.accountHolderName) patch.accountHolderName = holder;
        if (bank !== account.bankName) patch.bankName = bank;
        if (number) patch.accountNumber = number;
        if (ifsc !== account.ifsc) patch.ifsc = ifsc;
        if (branchName !== (account.branchName ?? '')) patch.branchName = branchName || null;
        if (Object.keys(patch).length === 0) {
          setIsEditing(false);
          return;
        }
        saved = await updateMyBankAccount(account.id, patch);
      } else {
        saved = await createMyBankAccount({
          accountHolderName: holder,
          accountNumber: number,
          ifsc,
          bankName: bank,
          ...(branchName ? { branchName } : {}),
        });
      }

      // Success only after a real 2xx: show what the server stored, not what was typed.
      const wasNew = !account;
      setAccount(saved);
      setIsEditing(false);
      Alert.alert(
        wasNew ? t('farmer.payment.bank.addedTitle') : 'Account Updated',
        wasNew
          ? t('farmer.payment.bank.addedBody')
          : 'Your bank account details have been updated and submitted to TOHFA Admin for re-verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSaveSuccess) onSaveSuccess();
            },
          },
        ]
      );
    } catch (err) {
      // Stay in edit mode with the draft intact so nothing the farmer typed is lost.
      setSaveError(formatErrorMessage(err, t('farmer.payment.bank.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Bank Account</Text>

          {/* Right Action: Pencil button in View Mode; hidden in Edit Mode */}
          {!isEditing ? (
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={handleStartEditing}
              disabled={loading || !!loadError}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit bank account details"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PencilEditIcon size={18} color={P.forestGreen} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Load state: real spinner, real server error, never a fabricated account */}
          {loading ? (
            <View style={styles.loadingRow} accessibilityLabel={t('farmer.payment.loading')}>
              <ActivityIndicator size="small" color={P.forestGreen} />
            </View>
          ) : null}
          {loadError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{loadError}</Text>
              <TouchableOpacity
                onPress={() => void loadAccount()}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.payment.retry')}
              >
                <Text style={styles.errorRetryText}>{t('farmer.payment.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {saveError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{saveError}</Text>
            </View>
          ) : null}

          {/* Verification Status Badge: the server's isVerified, never assumed */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                account?.isVerified ? styles.verifiedBadge : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  account?.isVerified ? styles.verifiedBadgeText : styles.pendingBadgeText,
                ]}
              >
                {!account
                  ? t('farmer.payment.status.notAdded')
                  : account.isVerified
                    ? 'Verified'
                    : 'Pending Verification'}
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Field 1: Account Holder Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Account Holder Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'holder' && styles.inputFocused,
                  ]}
                  value={draftHolder}
                  onChangeText={setDraftHolder}
                  placeholder="Full name as on passbook"
                  placeholderTextColor={P.twGray400}
                  onFocus={() => setFocusedField('holder')}
                  onBlur={() => setFocusedField(null)}
                />
              ) : (
                <View style={styles.viewBox}>
                  <Text style={styles.viewBoxText}>{accountHolder}</Text>
                </View>
              )}
            </View>

            {/* Field 2: Bank Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Bank Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'bank' && styles.inputFocused,
                  ]}
                  value={draftBank}
                  onChangeText={setDraftBank}
                  placeholder="Bank name"
                  placeholderTextColor={P.twGray400}
                  onFocus={() => setFocusedField('bank')}
                  onBlur={() => setFocusedField(null)}
                />
              ) : (
                <View style={styles.viewBox}>
                  <Text style={styles.viewBoxText}>{bankName}</Text>
                </View>
              )}
            </View>

            {/* Field 3: Account Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Account Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'account' && styles.inputFocused,
                  ]}
                  value={draftNumber}
                  onChangeText={setDraftNumber}
                  placeholder={
                    account
                      ? t('farmer.payment.bank.accountNumberChangePlaceholder')
                      : 'Account number'
                  }
                  placeholderTextColor={P.twGray400}
                  keyboardType="number-pad"
                  onFocus={() => setFocusedField('account')}
                  onBlur={() => setFocusedField(null)}
                />
              ) : (
                <View style={styles.viewBox}>
                  <Text style={styles.viewBoxText}>{accountNumber}</Text>
                </View>
              )}
              {isEditing && account ? (
                <Text style={styles.fieldHint}>{t('farmer.payment.bank.accountNumberHint')}</Text>
              ) : null}
            </View>

            {/* Field 4: IFSC Code */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                IFSC Code <Text style={styles.requiredStar}>*</Text>
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'ifsc' && styles.inputFocused,
                  ]}
                  value={draftIfsc}
                  onChangeText={(t) => setDraftIfsc(t.toUpperCase())}
                  placeholder="IFSC code"
                  placeholderTextColor={P.twGray400}
                  autoCapitalize="characters"
                  onFocus={() => setFocusedField('ifsc')}
                  onBlur={() => setFocusedField(null)}
                />
              ) : (
                <View style={styles.viewBox}>
                  <Text style={styles.viewBoxText}>{ifscCode}</Text>
                </View>
              )}
            </View>

            {/* Field 5: Branch (Optional, no star) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Branch</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'branch' && styles.inputFocused,
                  ]}
                  value={draftBranch}
                  onChangeText={setDraftBranch}
                  placeholder="Branch name"
                  placeholderTextColor={P.twGray400}
                  onFocus={() => setFocusedField('branch')}
                  onBlur={() => setFocusedField(null)}
                />
              ) : (
                <View style={styles.viewBox}>
                  <Text style={styles.viewBoxText}>{branch}</Text>
                </View>
              )}
            </View>

            {/* Warning / Helper Note */}
            <View style={styles.warningNote}>
              <View style={styles.warningIconBox}>
                <InfoCircleIcon size={16} color={P.twGray400} />
              </View>
              <Text style={styles.warningText}>
                Editing any field sets this account back to Pending Verification until TOHFA Admin manually re-checks it.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar: ONLY visible in Edit Mode (Image 2) */}
        {isEditing && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={saving}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSave()}
              disabled={saving}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
              accessibilityState={{ disabled: saving, busy: saving }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={P.white} />
              ) : (
                <CheckmarkIcon size={16} color={P.white} />
              )}
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 6,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
    marginLeft: 14,
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  statusRow: {
    marginBottom: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  verifiedBadge: {
    backgroundColor: colors.brandGreenLight,
  },
  pendingBadge: {
    backgroundColor: P.twAmber100,
  },
  statusBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  verifiedBadgeText: {
    color: P.deepGreen,
  },
  pendingBadgeText: {
    color: P.twAmber800,
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
    letterSpacing: -0.1,
  },
  requiredStar: {
    color: P.twRed600,
    fontWeight: '700',
  },
  viewBox: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  viewBoxText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray900,
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray900,
  },
  inputFocused: {
    borderColor: P.twEmerald800,
    borderWidth: 1.5,
  },
  loadingRow: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorBannerText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  errorRetryText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  fieldHint: {
    fontSize: typography.bodySmall,
    lineHeight: 17,
    color: P.twGray500,
    fontWeight: '400',
  },
  warningNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingRight: 10,
  },
  warningIconBox: {
    marginRight: 7,
    marginTop: 1.5,
  },
  warningText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 17,
    color: P.twGray500,
    fontWeight: '400',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 14,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    backgroundColor: P.white,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray800,
  },
  saveBtn: {
    flex: 1.6,
    height: 50,
    borderRadius: 14,
    backgroundColor: P.twEmerald800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.twEmerald800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnBusy: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
});
