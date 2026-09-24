import React, { useState, useEffect } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

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
  // Stored / saved state
  const [accountHolder, setAccountHolder] = useState('Murugan R.');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('• • • • • • • • 4821');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [branch, setBranch] = useState('Ooty Main Branch');
  const [verificationStatus, setVerificationStatus] = useState<'Verified' | 'Pending Verification'>('Verified');

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form draft state during editing
  const [draftHolder, setDraftHolder] = useState(accountHolder);
  const [draftBank, setDraftBank] = useState(bankName);
  const [draftNumber, setDraftNumber] = useState(accountNumber);
  const [draftIfsc, setDraftIfsc] = useState(ifscCode);
  const [draftBranch, setDraftBranch] = useState(branch);

  // Active focused input for border highlight
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
  }, [isEditing, onBack]);

  const handleStartEditing = () => {
    setDraftHolder(accountHolder);
    setDraftBank(bankName);
    setDraftNumber(accountNumber);
    setDraftIfsc(ifscCode);
    setDraftBranch(branch);
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Revert draft values
    setDraftHolder(accountHolder);
    setDraftBank(bankName);
    setDraftNumber(accountNumber);
    setDraftIfsc(ifscCode);
    setDraftBranch(branch);
    setIsEditing(false);
  };

  const handleHeaderBack = () => {
    if (isEditing) {
      handleCancel();
    } else if (onBack) {
      onBack();
    }
  };

  const handleSave = () => {
    if (!draftHolder.trim() || !draftBank.trim() || !draftNumber.trim() || !draftIfsc.trim()) {
      Alert.alert('Missing Required Fields', 'Please fill in all required fields marked with *.');
      return;
    }

    // Save changes
    setAccountHolder(draftHolder.trim());
    setBankName(draftBank.trim());
    setAccountNumber(draftNumber.trim());
    setIfscCode(draftIfsc.trim().toUpperCase());
    setBranch(draftBranch.trim());
    setVerificationStatus('Pending Verification');
    setIsEditing(false);

    Alert.alert(
      'Account Updated',
      'Your bank account details have been updated and submitted to TOHFA Admin for re-verification.',
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSaveSuccess) onSaveSuccess();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

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
          {/* Verification Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                verificationStatus === 'Verified'
                  ? styles.verifiedBadge
                  : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  verificationStatus === 'Verified'
                    ? styles.verifiedBadgeText
                    : styles.pendingBadgeText,
                ]}
              >
                {verificationStatus}
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
                  placeholder="Account number"
                  placeholderTextColor={P.twGray400}
                  onFocus={() => setFocusedField('account')}
                  onBlur={() => setFocusedField(null)}
                />
              ) : (
                <View style={styles.viewBox}>
                  <Text style={styles.viewBoxText}>{accountNumber}</Text>
                </View>
              )}
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
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
            >
              <CheckmarkIcon size={16} color={P.white} />
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
    fontSize: 20,
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
    fontSize: 12,
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
    fontSize: 13,
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
    fontSize: 14.5,
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
    fontSize: 14.5,
    fontWeight: '500',
    color: P.twGray900,
  },
  inputFocused: {
    borderColor: P.twEmerald800,
    borderWidth: 1.5,
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
    fontSize: 12,
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
    fontSize: 15,
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
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
