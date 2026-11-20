// Design id: M16-S10 through M16-S15
/**
 * TOHFA Bank Account Management for Super Admin (Module M16, Part C).
 *
 * Provides:
 *   - M16-S10: Bank Account Management Hub (KPIs, primary account card, bank list, actions)
 *   - M16-S11: Add / Edit Bank Account form (validation, IFSC lookup, account types)
 *   - M16-S12: Bank Account Added Successfully popup modal
 *   - M16-S13: Account Details screen (masked/unmasked toggle, copy IFSC, verification status)
 *   - M16-S14: Make Primary Account confirmation modal
 *   - M16-S15: Remove Bank Account confirmation modal with primary safeguard
 *
 * Strictly adheres to admin theme tokens (adminColors, adminRadius, adminSpacing, adminType).
 * No raw hex or rgba color literals.
 */
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import {
  BankIcon,
  CalendarIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  PencilEditIcon,
  PlusIcon,
  TrashIcon,
  WarningTriangleIcon,
} from '../../../components/AdminIcons';
import {
  Card,
  SectionTitle,
  WalletButton,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';

// ─── Types & Models ──────────────────────────────────────────────────────────

export interface TohfaBankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType: 'Savings Account' | 'Current Account';
  isPrimary: boolean;
  status: 'Verified' | 'Pending Verification';
  addedOn: string;
  verifiedOn?: string;
}

const INITIAL_ACCOUNTS: TohfaBankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'HDFC Bank',
    accountHolderName: 'TOHFA Farming Pvt Ltd.',
    accountNumber: '50200012340123',
    ifscCode: 'HDFC0001234',
    branch: 'Ooty, TN',
    accountType: 'Current Account',
    isPrimary: true,
    status: 'Verified',
    addedOn: '12 Nov 2026, 10:24 AM',
    verifiedOn: '12 Nov 2026, 03:14 PM',
  },
  {
    id: 'bank-2',
    bankName: 'State Bank of India',
    accountHolderName: 'TOHFA Farming Pvt Ltd.',
    accountNumber: '30489201940123',
    ifscCode: 'SBIN0001234',
    branch: 'Coimbatore Main, TN',
    accountType: 'Current Account',
    isPrimary: false,
    status: 'Verified',
    addedOn: '05 Oct 2026, 11:30 AM',
    verifiedOn: '06 Oct 2026, 02:15 PM',
  },
  {
    id: 'bank-3',
    bankName: 'ICICI Bank',
    accountHolderName: 'TOHFA Farming Pvt Ltd.',
    accountNumber: '001105020123',
    ifscCode: 'SBIN0001234',
    branch: 'Nilgiris, TN',
    accountType: 'Current Account',
    isPrimary: false,
    status: 'Pending Verification',
    addedOn: '18 Nov 2026, 04:45 PM',
  },
];

const POPULAR_BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
];

// ─── Inline Custom Icons (Themed) ───────────────────────────────────────────

function StarOutlineIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CopyDocumentIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 14, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 21a8 8 0 1 0-16 0" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CardNumberIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function HashIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bank Monogram / Emblem Logo ─────────────────────────────────────────────

function BankLogoBadge({ bankName }: { bankName: string }) {
  const isHdfc = bankName.toLowerCase().includes('hdfc');
  const isSbi = bankName.toLowerCase().includes('state bank') || bankName.toLowerCase().includes('sbi');
  const isIcici = bankName.toLowerCase().includes('icici');

  if (isHdfc) {
    return (
      <View style={[styles.bankLogoBox, { backgroundColor: adminColors.canvas, borderColor: adminColors.border }]}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="2" width="20" height="20" rx="3" stroke={adminColors.info.text} strokeWidth="2.5" />
          <Rect x="7" y="7" width="10" height="10" fill={adminColors.danger.text} />
          <Path d="M12 2v20M2 12h20" stroke={adminColors.canvas} strokeWidth="2.5" />
        </Svg>
      </View>
    );
  }

  if (isSbi) {
    return (
      <View style={[styles.bankLogoBox, { backgroundColor: adminColors.canvas, borderColor: adminColors.border }]}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" fill={adminColors.info.text} />
          <Circle cx="12" cy="12" r="4.5" fill={adminColors.canvas} />
          <Rect x="10.8" y="12" width="2.4" height="7" fill={adminColors.canvas} />
        </Svg>
      </View>
    );
  }

  if (isIcici) {
    return (
      <View style={[styles.bankLogoBox, { backgroundColor: adminColors.canvas, borderColor: adminColors.border }]}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={adminColors.brandDeep} strokeWidth="2" />
          <Path d="M12 7v10M9 8c2-2 5-1 5 2 0 4-5 3-5 7" stroke={adminColors.brand} strokeWidth="2.2" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.bankLogoBox, { backgroundColor: adminColors.brandTint, borderColor: adminColors.border }]}>
      <BankIcon size={20} color={adminColors.brandDeep} />
    </View>
  );
}

// ─── Screen Props ────────────────────────────────────────────────────────────

export interface TohfaBankAccountManagementScreenProps {
  onBack: () => void;
}

export function TohfaBankAccountManagementScreen({ onBack }: TohfaBankAccountManagementScreenProps) {
  const [accounts, setAccounts] = useState<TohfaBankAccount[]>(INITIAL_ACCOUNTS);
  const [activeScreen, setActiveScreen] = useState<'hub' | 'add' | 'edit' | 'details'>('hub');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Modals state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMakePrimaryModal, setShowMakePrimaryModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showBankPickerModal, setShowBankPickerModal] = useState(false);

  // Account details view state
  const [unmaskAccountNumber, setUnmaskAccountNumber] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Form state (Add / Edit)
  const [formBankName, setFormBankName] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('TOHFA Farming Pvt Ltd.');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formConfirmAccountNumber, setFormConfirmAccountNumber] = useState('');
  const [formIfscCode, setFormIfscCode] = useState('');
  const [formAccountType, setFormAccountType] = useState<'Savings Account' | 'Current Account'>('Current Account');
  const [formBranch, setFormBranch] = useState('Ooty Main Branch, TN');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];
  const primaryAccount = accounts.find((a) => a.isPrimary) ?? accounts[0];

  const totalCount = accounts.length;
  const verifiedCount = accounts.filter((a) => a.status === 'Verified').length;
  const pendingCount = accounts.filter((a) => a.status === 'Pending Verification').length;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const maskAccount = (num: string) => {
    if (!num || num.length < 4) return '****';
    const last4 = num.slice(-4);
    return `*********${last4}`;
  };

  const shortMaskAccount = (num: string) => {
    if (!num || num.length < 4) return '****';
    const last4 = num.slice(-4);
    return `******${last4}`;
  };

  const handleOpenAccountActions = (account: TohfaBankAccount) => {
    setSelectedAccountId(account.id);
    setShowActionSheet(true);
  };

  const handleOpenDetails = (accountId: string) => {
    setSelectedAccountId(accountId);
    setUnmaskAccountNumber(false);
    setShowActionSheet(false);
    setActiveScreen('details');
  };

  const handleOpenAdd = () => {
    setFormBankName('');
    setFormAccountHolder('TOHFA Farming Pvt Ltd.');
    setFormAccountNumber('');
    setFormConfirmAccountNumber('');
    setFormIfscCode('');
    setFormAccountType('Current Account');
    setFormBranch('Ooty Main Branch, TN');
    setActiveScreen('add');
  };

  const handleOpenEdit = (account: TohfaBankAccount) => {
    setSelectedAccountId(account.id);
    setFormBankName(account.bankName);
    setFormAccountHolder(account.accountHolderName);
    setFormAccountNumber(account.accountNumber);
    setFormConfirmAccountNumber(account.accountNumber);
    setFormIfscCode(account.ifscCode);
    setFormAccountType(account.accountType);
    setFormBranch(account.branch);
    setShowActionSheet(false);
    setActiveScreen('edit');
  };

  const handleFindIfsc = () => {
    if (!formIfscCode.trim()) {
      Alert.alert('IFSC Lookup', 'Please enter an IFSC code to search.');
      return;
    }
    const cleanIfsc = formIfscCode.trim().toUpperCase();
    setFormIfscCode(cleanIfsc);
    if (cleanIfsc.startsWith('HDFC')) {
      setFormBankName('HDFC Bank');
      setFormBranch('Ooty Branch, Nilgiris, TN');
      Alert.alert('IFSC Verified', 'Found HDFC Bank · Ooty Branch, TN');
    } else if (cleanIfsc.startsWith('SBIN')) {
      setFormBankName('State Bank of India');
      setFormBranch('Coimbatore Main Branch, TN');
      Alert.alert('IFSC Verified', 'Found State Bank of India · Coimbatore Main, TN');
    } else if (cleanIfsc.startsWith('ICIC')) {
      setFormBankName('ICICI Bank');
      setFormBranch('Coonoor Branch, Nilgiris, TN');
      Alert.alert('IFSC Verified', 'Found ICICI Bank · Coonoor Branch, TN');
    } else {
      setFormBranch('Main Commercial Branch, TN');
      Alert.alert('IFSC Verified', `Branch resolved for IFSC code: ${cleanIfsc}`);
    }
  };

  const handleSubmitForm = () => {
    if (!formBankName.trim()) {
      Alert.alert('Validation Error', 'Please select or enter the Bank Name.');
      return;
    }
    if (!formAccountHolder.trim()) {
      Alert.alert('Validation Error', 'Please enter the Account Holder Name.');
      return;
    }
    if (!formAccountNumber.trim() || formAccountNumber.length < 8) {
      Alert.alert('Validation Error', 'Please enter a valid Account Number (min 8 digits).');
      return;
    }
    if (formAccountNumber !== formConfirmAccountNumber) {
      Alert.alert('Validation Error', 'Account Number and Confirm Account Number do not match.');
      return;
    }
    if (!formIfscCode.trim() || formIfscCode.length < 6) {
      Alert.alert('Validation Error', 'Please enter a valid IFSC Code.');
      return;
    }

    if (activeScreen === 'add') {
      const newAcc: TohfaBankAccount = {
        id: `bank-${Date.now()}`,
        bankName: formBankName.trim(),
        accountHolderName: formAccountHolder.trim(),
        accountNumber: formAccountNumber.trim(),
        ifscCode: formIfscCode.trim().toUpperCase(),
        branch: formBranch || 'Main Commercial Branch, TN',
        accountType: formAccountType,
        isPrimary: accounts.length === 0,
        status: 'Pending Verification',
        addedOn: 'Today, Just Now',
      };
      setAccounts((prev) => [...prev, newAcc]);
      setSelectedAccountId(newAcc.id);
      setShowSuccessModal(true);
    } else if (activeScreen === 'edit' && selectedAccountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === selectedAccountId
            ? {
                ...acc,
                bankName: formBankName.trim(),
                accountHolderName: formAccountHolder.trim(),
                accountNumber: formAccountNumber.trim(),
                ifscCode: formIfscCode.trim().toUpperCase(),
                branch: formBranch,
                accountType: formAccountType,
              }
            : acc,
        ),
      );
      Alert.alert('Success', 'Bank details have been updated successfully.');
      setActiveScreen('hub');
    }
  };

  const handleConfirmMakePrimary = () => {
    if (!selectedAccountId) return;
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isPrimary: acc.id === selectedAccountId,
      })),
    );
    setShowMakePrimaryModal(false);
    Alert.alert('Primary Account Updated', `${selectedAccount?.bankName ?? 'Bank'} is now set as the Primary Account.`);
  };

  const handleConfirmRemove = () => {
    if (!selectedAccountId || !selectedAccount) return;
    if (selectedAccount.isPrimary && accounts.length > 1) {
      Alert.alert('Cannot Remove Primary Account', 'Please set another bank account as Primary before removing this account.');
      return;
    }
    setAccounts((prev) => prev.filter((acc) => acc.id !== selectedAccountId));
    setShowRemoveModal(false);
    if (activeScreen === 'details') {
      setActiveScreen('hub');
    }
    Alert.alert('Account Removed', `${selectedAccount.bankName} account has been removed.`);
  };

  const handleCopyIfsc = (ifsc: string) => {
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    Alert.alert('Copied to Clipboard', `IFSC Code ${ifsc} copied.`);
  };

  // ─── View 1: Account Details (M16-S13) ───────────────────────────────────────

  if (activeScreen === 'details' && selectedAccount) {
    return (
      <WalletScreen
        title="Account Details"
        subtitle="Super Admin · Bank Details"
        onBack={() => setActiveScreen('hub')}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bank Summary Card */}
          <Card>
            <View style={styles.detailsHeaderRow}>
              <BankLogoBadge bankName={selectedAccount.bankName} />
              <View style={styles.detailsHeaderInfo}>
                <Text style={styles.detailsBankTitle}>{selectedAccount.bankName}</Text>
                <View style={styles.badgeRow}>
                  {selectedAccount.isPrimary ? (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary Account</Text>
                    </View>
                  ) : null}
                  {selectedAccount.status === 'Verified' ? (
                    <View style={styles.verifiedBadge}>
                      <CheckmarkIcon size={12} color={adminColors.success.text} />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <ClockIcon size={12} color={adminColors.warning.text} />
                      <Text style={styles.pendingBadgeText}>Pending Verification</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Card>

          {/* Bank Account Information Card */}
          <Card>
            <View style={styles.infoCardHeader}>
              <BankIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.infoCardTitle}>Bank Account Information</Text>
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.fieldRow}>
              <Text style={styles.detailFieldLabel}>Account Holder Name</Text>
              <Text style={styles.detailFieldValue}>{selectedAccount.accountHolderName}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.detailFieldLabel}>Account Number</Text>
              <View style={styles.interactiveFieldRow}>
                <Text style={styles.detailFieldValue}>
                  {unmaskAccountNumber ? selectedAccount.accountNumber : shortMaskAccount(selectedAccount.accountNumber)}
                </Text>
                <TouchableOpacity
                  onPress={() => setUnmaskAccountNumber(!unmaskAccountNumber)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.fieldActionBtn}
                >
                  {unmaskAccountNumber ? (
                    <EyeOffIcon size={18} color={adminColors.muted} />
                  ) : (
                    <EyeIcon size={18} color={adminColors.brand} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.detailFieldLabel}>IFSC Code</Text>
              <View style={styles.interactiveFieldRow}>
                <Text style={styles.detailFieldValue}>{selectedAccount.ifscCode}</Text>
                <TouchableOpacity
                  onPress={() => handleCopyIfsc(selectedAccount.ifscCode)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.fieldActionBtn}
                >
                  <CopyDocumentIcon size={18} color={copyFeedback ? adminColors.success.text : adminColors.brand} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.detailFieldLabel}>Branch</Text>
              <Text style={styles.detailFieldValue}>{selectedAccount.branch}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.detailFieldLabel}>Account Type</Text>
              <Text style={styles.detailFieldValue}>{selectedAccount.accountType}</Text>
            </View>
          </Card>

          {/* Status Alert Banner */}
          {selectedAccount.status === 'Verified' ? (
            <View style={styles.verifiedBanner}>
              <View style={styles.verifiedCircleIcon}>
                <CheckmarkIcon size={14} color={adminColors.onBrand} />
              </View>
              <View style={styles.bannerTextCol}>
                <Text style={styles.verifiedBannerTitle}>Account Verified</Text>
                <Text style={styles.verifiedBannerDesc}>
                  This bank account is verified and ready to receive payouts.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.pendingBanner}>
              <View style={styles.pendingCircleIcon}>
                <ClockIcon size={14} color={adminColors.onBrand} />
              </View>
              <View style={styles.bannerTextCol}>
                <Text style={styles.pendingBannerTitle}>Pending Verification</Text>
                <Text style={styles.pendingBannerDesc}>
                  This bank account is currently under review by the finance operations team.
                </Text>
              </View>
            </View>
          )}

          {/* Dates Card */}
          <Card>
            <View style={styles.datesGridRow}>
              <View style={styles.dateCol}>
                <View style={styles.dateLabelRow}>
                  <CalendarIcon size={16} color={adminColors.muted} />
                  <Text style={styles.dateLabel}>Added On</Text>
                </View>
                <Text style={styles.dateValue}>{selectedAccount.addedOn}</Text>
              </View>
              <View style={styles.dateColDivider} />
              <View style={styles.dateCol}>
                <View style={styles.dateLabelRow}>
                  <CheckmarkIcon size={16} color={adminColors.success.text} />
                  <Text style={styles.dateLabel}>Verified On</Text>
                </View>
                <Text style={styles.dateValue}>{selectedAccount.verifiedOn ?? 'Under Review'}</Text>
              </View>
            </View>
          </Card>

          {/* Edit Bank Details Button */}
          <TouchableOpacity
            style={styles.editOutlineButton}
            onPress={() => handleOpenEdit(selectedAccount)}
            activeOpacity={0.8}
          >
            <PencilEditIcon size={18} color={adminColors.brand} />
            <Text style={styles.editOutlineButtonText}>Edit Bank Details</Text>
          </TouchableOpacity>
        </ScrollView>
      </WalletScreen>
    );
  }

  // ─── View 2: Add or Edit Bank Account (M16-S11) ──────────────────────────────

  if (activeScreen === 'add' || activeScreen === 'edit') {
    const isEditing = activeScreen === 'edit';
    return (
      <WalletScreen
        title={isEditing ? 'Edit Bank Details' : 'Add Bank Account'}
        subtitle="Super Admin · Account Configuration"
        onBack={() => setActiveScreen('hub')}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            {/* Bank Name */}
            <Text style={styles.formLabel}>Bank Name *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowBankPickerModal(true)}
              activeOpacity={0.8}
            >
              <BankIcon size={18} color={adminColors.brandDeep} />
              <Text style={formBankName ? styles.selectInputValue : styles.selectInputPlaceholder}>
                {formBankName || 'Select Bank'}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            {/* Account Holder Name */}
            <Text style={styles.formLabel}>Account Holder Name *</Text>
            <View style={styles.inputWithIcon}>
              <UserCircleIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.formTextInput}
                value={formAccountHolder}
                onChangeText={setFormAccountHolder}
                placeholder="Enter Account Holder name"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Account Number */}
            <Text style={styles.formLabel}>Account Number *</Text>
            <View style={styles.inputWithIcon}>
              <CardNumberIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.formTextInput}
                value={formAccountNumber}
                onChangeText={setFormAccountNumber}
                placeholder="Enter Account number"
                placeholderTextColor={adminColors.placeholder}
                keyboardType="numeric"
              />
            </View>

            {/* Confirm Account Number */}
            <Text style={styles.formLabel}>Confirm Account Number *</Text>
            <View style={styles.inputWithIcon}>
              <CardNumberIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.formTextInput}
                value={formConfirmAccountNumber}
                onChangeText={setFormConfirmAccountNumber}
                placeholder="Re-enter Account number"
                placeholderTextColor={adminColors.placeholder}
                keyboardType="numeric"
              />
            </View>

            {/* IFSC Code + Find IFSC */}
            <Text style={styles.formLabel}>IFSC Code *</Text>
            <View style={styles.ifscRow}>
              <View style={[styles.inputWithIcon, styles.ifscInputFlex]}>
                <HashIcon size={18} color={adminColors.muted} />
                <TextInput
                  style={styles.formTextInput}
                  value={formIfscCode}
                  onChangeText={(val) => setFormIfscCode(val.toUpperCase())}
                  placeholder="Enter IFSC code"
                  placeholderTextColor={adminColors.placeholder}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity
                style={styles.findIfscButton}
                onPress={handleFindIfsc}
                activeOpacity={0.85}
              >
                <Text style={styles.findIfscButtonText}>Find IFSC</Text>
              </TouchableOpacity>
            </View>

            {/* Account Type Radio Selector */}
            <Text style={styles.formLabel}>Account Type *</Text>
            <View style={styles.accountTypeRow}>
              <TouchableOpacity
                style={[
                  styles.accountTypeCard,
                  formAccountType === 'Savings Account' && styles.accountTypeCardActive,
                ]}
                onPress={() => setFormAccountType('Savings Account')}
                activeOpacity={0.8}
              >
                <View style={styles.radioOuter}>
                  {formAccountType === 'Savings Account' ? <View style={styles.radioInner} /> : null}
                </View>
                <Text
                  style={[
                    styles.accountTypeLabel,
                    formAccountType === 'Savings Account' && styles.accountTypeLabelActive,
                  ]}
                >
                  Savings Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accountTypeCard,
                  formAccountType === 'Current Account' && styles.accountTypeCardActive,
                ]}
                onPress={() => setFormAccountType('Current Account')}
                activeOpacity={0.8}
              >
                <View style={styles.radioOuter}>
                  {formAccountType === 'Current Account' ? <View style={styles.radioInner} /> : null}
                </View>
                <Text
                  style={[
                    styles.accountTypeLabel,
                    formAccountType === 'Current Account' && styles.accountTypeLabelActive,
                  ]}
                >
                  Current Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitOutlineButton}
              onPress={handleSubmitForm}
              activeOpacity={0.85}
            >
              <CheckmarkIcon size={18} color={adminColors.brand} />
              <Text style={styles.submitOutlineButtonText}>
                {isEditing ? 'Save Changes' : 'Add Bank Account'}
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>

        {/* Bank Picker Modal */}
        <Modal
          visible={showBankPickerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBankPickerModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Select Bank</Text>
                <TouchableOpacity
                  onPress={() => setShowBankPickerModal(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseIcon size={20} color={adminColors.ink} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.bankListScroll} showsVerticalScrollIndicator={false}>
                {POPULAR_BANKS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={styles.bankPickerItem}
                    onPress={() => {
                      setFormBankName(b);
                      setShowBankPickerModal(false);
                    }}
                  >
                    <BankLogoBadge bankName={b} />
                    <Text style={styles.bankPickerItemText}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* M16-S12: Bank Account Added Successfully Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowSuccessModal(false);
            setActiveScreen('hub');
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.successModalCard}>
              <TouchableOpacity
                style={styles.modalCloseTopRight}
                onPress={() => {
                  setShowSuccessModal(false);
                  setActiveScreen('hub');
                }}
              >
                <CloseIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>

              <View style={styles.successCircleIcon}>
                <CheckmarkIcon size={24} color={adminColors.success.text} />
              </View>

              <Text style={styles.successModalTitle}>Bank Account Added Successfully!</Text>
              <Text style={styles.successModalSubtitle}>
                Your bank account has been added and is now under verification.
              </Text>

              {/* Preview Card */}
              <View style={styles.previewAccountCard}>
                <BankLogoBadge bankName={formBankName} />
                <View style={styles.previewAccountInfo}>
                  <Text style={styles.previewBankName}>{formBankName}</Text>
                  <Text style={styles.previewAccountNo}>{maskAccount(formAccountNumber)}</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <ClockIcon size={12} color={adminColors.warning.text} />
                  <Text style={styles.pendingBadgeText}>Pending Verification</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.backToAccountsButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  setActiveScreen('hub');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.backToAccountsButtonText}>Back to Bank Accounts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </WalletScreen>
    );
  }

  // ─── View 3: Bank Account Management Hub (M16-S10) ──────────────────────────

  return (
    <WalletScreen
      title="Bank Account Management"
      subtitle="Super Admin · Payout & Bank Accounts"
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top 3 KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Accounts</Text>
            <Text style={styles.kpiValue}>{totalCount}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Verified</Text>
            <Text style={[styles.kpiValue, { color: adminColors.success.text }]}>{verifiedCount}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pending Verification</Text>
            <Text style={[styles.kpiValue, { color: adminColors.warning.text }]}>{pendingCount}</Text>
          </View>
        </View>

        {/* Primary Account Quick Card */}
        {primaryAccount ? (
          <TouchableOpacity
            style={styles.primaryQuickCard}
            onPress={() => handleOpenDetails(primaryAccount.id)}
            activeOpacity={0.8}
          >
            <BankLogoBadge bankName={primaryAccount.bankName} />
            <View style={styles.primaryQuickInfo}>
              <Text style={styles.primaryQuickTitle}>{primaryAccount.bankName} Account</Text>
              <Text style={styles.primaryQuickSubtitle}>A/c No: {shortMaskAccount(primaryAccount.accountNumber)}</Text>
            </View>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary Account</Text>
            </View>
            <ChevronRightIcon size={18} color={adminColors.muted} />
          </TouchableOpacity>
        ) : null}

        {/* Section: TOHFA Bank Accounts */}
        <SectionTitle>TOHFA Bank Accounts</SectionTitle>

        {/* Bank Account Cards List */}
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={styles.bankAccountCard}
            onPress={() => handleOpenAccountActions(account)}
            activeOpacity={0.8}
          >
            <BankLogoBadge bankName={account.bankName} />
            <View style={styles.bankCardContent}>
              <View style={styles.bankCardTopRow}>
                <Text style={styles.bankCardTitle}>{account.bankName}</Text>
                {account.isPrimary ? (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary Account</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.bankCardAccountNo}>A/c No: {maskAccount(account.accountNumber)}</Text>
              <View style={styles.bankCardBottomRow}>
                <Text style={styles.bankCardIfsc}>IFSC: {account.ifscCode}</Text>
                {account.status === 'Verified' ? (
                  <View style={styles.verifiedBadge}>
                    <CheckmarkIcon size={12} color={adminColors.success.text} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <ClockIcon size={12} color={adminColors.warning.text} />
                    <Text style={styles.pendingBadgeText}>Pending Verification</Text>
                  </View>
                )}
              </View>
            </View>
            <ChevronRightIcon size={18} color={adminColors.muted} />
          </TouchableOpacity>
        ))}

        {/* Add Bank Account Outline Button */}
        <TouchableOpacity
          style={styles.addBankButton}
          onPress={handleOpenAdd}
          activeOpacity={0.85}
        >
          <PlusIcon size={18} color={adminColors.brand} />
          <Text style={styles.addBankButtonText}>Add Bank Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Action Sheet Menu for a Selected Account */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={styles.actionSheetCard}>
            <TouchableOpacity
              style={styles.actionSheetRow}
              onPress={() => {
                setShowActionSheet(false);
                if (selectedAccountId) handleOpenDetails(selectedAccountId);
              }}
            >
              <EyeIcon size={20} color={adminColors.ink} />
              <Text style={styles.actionSheetText}>View Account Details</Text>
            </TouchableOpacity>

            <View style={styles.actionSheetDivider} />

            <TouchableOpacity
              style={styles.actionSheetRow}
              onPress={() => {
                setShowActionSheet(false);
                if (selectedAccount) handleOpenEdit(selectedAccount);
              }}
            >
              <PencilEditIcon size={20} color={adminColors.ink} />
              <Text style={styles.actionSheetText}>Edit Bank Details</Text>
            </TouchableOpacity>

            {!selectedAccount?.isPrimary ? (
              <>
                <View style={styles.actionSheetDivider} />
                <TouchableOpacity
                  style={styles.actionSheetRow}
                  onPress={() => {
                    setShowActionSheet(false);
                    setShowMakePrimaryModal(true);
                  }}
                >
                  <StarOutlineIcon size={20} color={adminColors.ink} />
                  <Text style={styles.actionSheetText}>Make Primary Account</Text>
                </TouchableOpacity>
              </>
            ) : null}

            <View style={styles.actionSheetDivider} />

            <TouchableOpacity
              style={styles.actionSheetRow}
              onPress={() => {
                setShowActionSheet(false);
                setShowRemoveModal(true);
              }}
            >
              <TrashIcon size={20} color={adminColors.danger.text} />
              <Text style={[styles.actionSheetText, { color: adminColors.danger.text }]}>
                Remove bank account
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* M16-S14: Make Primary Account Modal */}
      <Modal
        visible={showMakePrimaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMakePrimaryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <TouchableOpacity
              style={styles.modalCloseTopRight}
              onPress={() => setShowMakePrimaryModal(false)}
            >
              <CloseIcon size={20} color={adminColors.ink} />
            </TouchableOpacity>

            <View style={styles.starCircleIcon}>
              <StarOutlineIcon size={24} color={adminColors.success.text} />
            </View>

            <Text style={styles.dialogTitleCentered}>Make Primary Account?</Text>
            <Text style={styles.dialogSubtitleCentered}>
              Do you want to set this bank account as your Primary Account?
            </Text>

            {/* Preview Card */}
            {selectedAccount ? (
              <View style={styles.previewAccountCard}>
                <BankLogoBadge bankName={selectedAccount.bankName} />
                <View style={styles.previewAccountInfo}>
                  <Text style={styles.previewBankName}>{selectedAccount.bankName}</Text>
                  <Text style={styles.previewAccountNo}>A/c No: {maskAccount(selectedAccount.accountNumber)}</Text>
                  <Text style={styles.previewIfsc}>IFSC: {selectedAccount.ifscCode}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.dialogActionsRow}>
              <WalletButton
                label="Cancel"
                variant="neutral"
                flex
                onPress={() => setShowMakePrimaryModal(false)}
              />
              <WalletButton
                label="Make Primary"
                flex
                onPress={handleConfirmMakePrimary}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* M16-S15: Remove Bank Account Modal */}
      <Modal
        visible={showRemoveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemoveModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <TouchableOpacity
              style={styles.modalCloseTopRight}
              onPress={() => setShowRemoveModal(false)}
            >
              <CloseIcon size={20} color={adminColors.ink} />
            </TouchableOpacity>

            <View style={styles.trashCircleIcon}>
              <TrashIcon size={24} color={adminColors.danger.text} />
            </View>

            <Text style={styles.dialogTitleCentered}>Remove Bank Account?</Text>
            <Text style={styles.dialogSubtitleCentered}>
              Are you sure you want to remove this bank account? This action cannot be undone.
            </Text>

            {/* Preview Card */}
            {selectedAccount ? (
              <View style={styles.previewAccountCard}>
                <BankLogoBadge bankName={selectedAccount.bankName} />
                <View style={styles.previewAccountInfo}>
                  <Text style={styles.previewBankName}>{selectedAccount.bankName}</Text>
                  <Text style={styles.previewAccountNo}>A/c No: {maskAccount(selectedAccount.accountNumber)}</Text>
                  <Text style={styles.previewIfsc}>IFSC: {selectedAccount.ifscCode}</Text>
                </View>
                {selectedAccount.status === 'Verified' ? (
                  <View style={styles.verifiedBadge}>
                    <CheckmarkIcon size={12} color={adminColors.success.text} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Warning Note for Primary Account */}
            {selectedAccount?.isPrimary ? (
              <View style={styles.removeWarningBanner}>
                <WarningTriangleIcon size={18} color={adminColors.warning.text} />
                <Text style={styles.removeWarningText}>
                  Note: If this is your Primary Account, Please set another account as Primary before removing it.
                </Text>
              </View>
            ) : null}

            <View style={styles.dialogActionsRow}>
              <WalletButton
                label="Cancel"
                variant="neutral"
                flex
                onPress={() => setShowRemoveModal(false)}
              />
              <TouchableOpacity
                style={[
                  styles.removeDangerButton,
                  selectedAccount?.isPrimary && accounts.length > 1 && styles.removeButtonDisabled,
                ]}
                onPress={handleConfirmRemove}
                disabled={selectedAccount?.isPrimary && accounts.length > 1}
              >
                <Text style={styles.removeDangerButtonText}>Remove Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl * 2,
    gap: adminSpacing.md,
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'flex-start',
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },

  // Primary Quick Card
  primaryQuickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
    ...adminShadow.sm,
  },
  primaryQuickInfo: {
    flex: 1,
  },
  primaryQuickTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  primaryQuickSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Bank Account Card in List
  bankAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
    ...adminShadow.sm,
  },
  bankCardContent: {
    flex: 1,
    gap: 4,
  },
  bankCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  bankCardAccountNo: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  bankCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  bankCardIfsc: {
    ...adminType.caption,
    color: adminColors.muted,
  },

  // Badges
  primaryBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  primaryBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  verifiedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  pendingBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontWeight: '600',
  },

  // Bank Logo Box
  bankLogoBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add Bank Outline Button
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  addBankButtonText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '600',
  },

  // Action Sheet
  actionSheetCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.sm,
    width: 260,
    ...adminShadow.lg,
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  actionSheetText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },

  // Modals & Dialogs
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  dialogCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    width: '100%',
    maxWidth: 380,
    ...adminShadow.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  dialogTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  modalCloseTopRight: {
    alignSelf: 'flex-end',
    padding: adminSpacing.xs,
  },
  dialogTitleCentered: {
    ...adminType.title,
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  dialogSubtitleCentered: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: adminSpacing.lg,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
  },

  // Star Circle / Trash Circle
  starCircleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  trashCircleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  removeDangerButton: {
    flex: 1,
    backgroundColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.md,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  removeDangerButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  removeWarningBanner: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
    alignItems: 'center',
  },
  removeWarningText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    flex: 1,
    fontWeight: '500',
  },

  // Preview Card inside Modals
  previewAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
  },
  previewAccountInfo: {
    flex: 1,
  },
  previewBankName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  previewAccountNo: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  previewIfsc: {
    ...adminType.caption,
    color: adminColors.muted,
  },

  // Success Modal (M16-S12)
  successModalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  successCircleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  successModalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: adminSpacing.xs,
  },
  successModalSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: adminSpacing.lg,
  },
  backToAccountsButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
  },
  backToAccountsButtonText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '600',
  },

  // Form (M16-S11)
  formLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  selectInputValue: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
  },
  selectInputPlaceholder: {
    ...adminType.body,
    color: adminColors.placeholder,
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  formTextInput: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
    paddingVertical: adminSpacing.sm,
  },
  ifscRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    alignItems: 'center',
  },
  ifscInputFlex: {
    flex: 1,
  },
  findIfscButton: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findIfscButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  accountTypeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
  },
  accountTypeCardActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.brand,
  },
  accountTypeLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
  },
  accountTypeLabelActive: {
    color: adminColors.ink,
    fontWeight: '700',
  },
  submitOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  submitOutlineButtonText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '600',
  },
  bankListScroll: {
    maxHeight: 280,
  },
  bankPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  bankPickerItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },

  // Account Details View (M16-S13)
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  detailsHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  detailsBankTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  infoCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  fieldRow: {
    marginVertical: adminSpacing.xs,
  },
  detailFieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 2,
  },
  detailFieldValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  interactiveFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldActionBtn: {
    padding: adminSpacing.xs,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.md,
  },
  verifiedCircleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  verifiedBannerTitle: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  verifiedBannerDesc: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: 2,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.md,
  },
  pendingCircleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: adminColors.warning.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerTitle: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  pendingBannerDesc: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: 2,
  },
  datesGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCol: {
    flex: 1,
  },
  dateColDivider: {
    width: 1,
    height: 36,
    backgroundColor: adminColors.border,
    marginHorizontal: adminSpacing.md,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  dateLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  dateValue: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  editOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  editOutlineButtonText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '600',
  },
});
