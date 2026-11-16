import React, { useState } from 'react';
import {
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

export interface CustomerSendMoneyScreenProps {
  walletBalance?: number | undefined;
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onSendSuccess?: ((amount: number) => void) | undefined;
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

const ContactBookSvg = ({ color = '#676767', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path d="M2 7h2M2 12h2M2 17h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={1.5} />
    <Path d="M8 17a4 4 0 0 1 8 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
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

const LockSvg = ({ color = '#1A1A1A', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={10} width={16} height={11} rx={2} stroke={color} strokeWidth={1.8} />
    <Path d="M8 10V6a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const EyeOffSvg = ({ color = '#9CA3AF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
      stroke={color}
      strokeWidth={1.8}
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

// ── MOCK UPI CONTACTS MATCHING FIGMA SCREEN (IMAGE 2) ─────────────────────────

interface UpiContact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
}

const ALL_PEOPLE_ON_UPI: UpiContact[] = [
  { id: '1', name: 'Ramesh Kumar', phone: '+91 98765 43210', initials: 'RK', avatarBg: '#DCFCE7', avatarText: '#15803D' },
  { id: '2', name: 'Sathish kumar', phone: '+91 99944 44999', initials: 'SK', avatarBg: '#FEF3C7', avatarText: '#B45309' },
  { id: '3', name: 'Raja', phone: '+91 99944 44999', initials: 'R', avatarBg: '#FCE7F3', avatarText: '#BE185D' },
  { id: '4', name: 'Ravi', phone: '+91 99944 44999', initials: 'R', avatarBg: '#DBEAFE', avatarText: '#1D4ED8' },
  { id: '5', name: 'Mohan', phone: '+91 99944 44999', initials: 'M', avatarBg: '#CCFBF1', avatarText: '#0F766E' },
];

export const CustomerSendMoneyScreen: React.FC<CustomerSendMoneyScreenProps> = ({
  walletBalance = 1250,
  onBack,
  onNavigate: _onNavigate,
  onSendSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const [sendMethod, setSendMethod] = useState<'mobile' | 'wallet_id'>('mobile');
  const [recipientInput, setRecipientInput] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<UpiContact | null>({
    id: '1',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    initials: 'RK',
    avatarBg: '#DCFCE7',
    avatarText: '#15803D',
  });
  const [amountInput, setAmountInput] = useState<string>('500.00');
  const [noteInput, setNoteInput] = useState<string>('');

  // Modals
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const [showOtp, setShowOtp] = useState<boolean>(false);

  const parsedAmount = parseFloat(amountInput) || 0;
  const canSend = parsedAmount > 0 && parsedAmount <= walletBalance;

  const handleSelectContact = (contact: UpiContact) => {
    setSelectedContact(contact);
    setRecipientInput(contact.phone);
    setShowContactsModal(false);
  };

  const handleOpenPaymentDetails = () => {
    if (!canSend) return;
    setShowPaymentDetailsModal(true);
  };

  const handleConfirmTransfer = () => {
    setShowPaymentDetailsModal(false);
    setShowSuccessModal(true);
    onSendSuccess?.(parsedAmount);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    onBack?.();
  };

  const filteredContacts = ALL_PEOPLE_ON_UPI.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.circleIconButton}
          accessibilityLabel="Back"
        >
          <BackArrowSvg color="#1A1A1A" size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── FROM SECTION ────────────────────────────────────────────────────── */}
        <Text style={styles.fieldLabel}>From</Text>
        <View style={styles.fromCard}>
          <View style={styles.fromIconBox}>
            <WalletBookSvg color="#2E7D32" size={20} />
          </View>
          <View style={styles.fromTextWrap}>
            <Text style={styles.fromTitle}>TOHFA Wallet</Text>
            <Text style={styles.fromSubtitle}>
              Balance: ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* ── SEND TO SECTION ─────────────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Send to</Text>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSendMethod('mobile');
              if (selectedContact) {
                setRecipientInput(selectedContact.phone);
              }
            }}
            style={[styles.tabButton, sendMethod === 'mobile' && styles.tabButtonActive]}
          >
            <PhoneCallSvg color={sendMethod === 'mobile' ? '#2E7D32' : '#676767'} size={17} />
            <Text style={[styles.tabText, sendMethod === 'mobile' && styles.tabTextActive]}>
              Mobile Number
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSendMethod('wallet_id');
              setRecipientInput('TOHFA123456789');
            }}
            style={[styles.tabButton, sendMethod === 'wallet_id' && styles.tabButtonActive]}
          >
            <WalletIdCardSvg color={sendMethod === 'wallet_id' ? '#2E7D32' : '#676767'} size={17} />
            <Text style={[styles.tabText, sendMethod === 'wallet_id' && styles.tabTextActive]}>
              Wallet ID
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── RECIPIENT INPUT ─────────────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
          {sendMethod === 'mobile' ? 'Mobile Number' : 'Wallet ID'}
        </Text>
        <View style={styles.inputWrap}>
          {sendMethod === 'mobile' ? (
            <PhoneCallSvg color="#676767" size={18} />
          ) : (
            <WalletIdCardSvg color="#676767" size={18} />
          )}

          <TextInput
            style={styles.textInput}
            value={recipientInput || (sendMethod === 'mobile' ? '+91 98765 43210' : 'TOHFA123456789')}
            placeholder={sendMethod === 'mobile' ? 'Pay any on UPI' : 'Enter Wallet ID'}
            placeholderTextColor="#9CA3AF"
            onChangeText={setRecipientInput}
          />

          {sendMethod === 'mobile' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowContactsModal(true)}
              style={styles.rightIconPress}
              accessibilityLabel="Select from contacts"
            >
              <ContactBookSvg color="#676767" size={18} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setRecipientInput('')}
              style={styles.rightIconPress}
              accessibilityLabel="Clear"
            >
              <CloseCrossSvg color="#9CA3AF" size={14} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── VERIFIED RECIPIENT BADGE ───────────────────────────────────────── */}
        <View style={styles.verifiedCard}>
          <View style={[styles.avatarCircle, { backgroundColor: selectedContact?.avatarBg || '#DCFCE7' }]}>
            <Text style={[styles.avatarText, { color: selectedContact?.avatarText || '#15803D' }]}>
              {selectedContact?.initials || 'RK'}
            </Text>
          </View>
          <View style={styles.verifiedTextWrap}>
            <Text style={styles.verifiedName}>{selectedContact?.name || 'Ramesh Kumar'}</Text>
            <Text style={styles.verifiedDetail}>
              {sendMethod === 'mobile'
                ? selectedContact?.phone || '+91 98765 43210'
                : 'TOHFA Wallet • TOHFA123456789'}
            </Text>
          </View>
          <GreenCheckmarkSvg size={20} />
        </View>

        {/* ── AMOUNT SECTION ─────────────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Amount</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.amountUnderline} />

        {/* ── NOTE (OPTIONAL) SECTION ────────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Describe your issue or question... 0/500"
          placeholderTextColor="#9CA3AF"
          value={noteInput}
          onChangeText={setNoteInput}
          maxLength={500}
        />
        <View style={styles.noteUnderline} />

        {/* ── SEND MONEY BUTTON ──────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!canSend}
          onPress={handleOpenPaymentDetails}
          style={[styles.sendMoneyMainBtn, !canSend && styles.sendMoneyMainBtnDisabled]}
          accessibilityLabel="Send Money"
        >
          <SendPaperPlaneSvg color={canSend ? '#FFFFFF' : '#9CA3AF'} size={18} />
          <Text style={[styles.sendMoneyMainBtnText, !canSend && styles.sendMoneyMainBtnTextDisabled]}>
            Send Money
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── CONTACTS PICKER MODAL (MIDDLE SCREEN IN FIGMA IMAGE 2) ─────────────── */}
      <Modal visible={showContactsModal} animationType="slide" transparent={false}>
        <View style={[styles.contactsModalContainer, { paddingTop: headerTopPadding }]}>
          <View style={styles.contactsSearchRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowContactsModal(false)}
              style={styles.circleIconButton}
            >
              <BackArrowSvg color="#1A1A1A" size={18} />
            </TouchableOpacity>
            <View style={styles.contactsSearchInputWrap}>
              <TextInput
                style={styles.contactsSearchInput}
                placeholder="Pay any on UPI"
                placeholderTextColor="#9CA3AF"
                value={contactSearch}
                onChangeText={setContactSearch}
                autoFocus={true}
              />
              <ContactBookSvg color="#676767" size={18} />
            </View>
          </View>

          <Text style={styles.contactsSectionHeading}>All people on UPI</Text>

          <ScrollView style={styles.contactsList} showsVerticalScrollIndicator={false}>
            {filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                activeOpacity={0.7}
                onPress={() => handleSelectContact(contact)}
                style={styles.contactRow}
              >
                <View style={[styles.contactAvatar, { backgroundColor: contact.avatarBg }]}>
                  <Text style={[styles.contactAvatarText, { color: contact.avatarText }]}>
                    {contact.initials}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── PAYMENT DETAILS MODAL (MIDDLE SCREEN IN FIGMA IMAGE 3) ─────────────── */}
      <Modal visible={showPaymentDetailsModal} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.paymentModalCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPaymentDetailsModal(false)}
              style={styles.modalCloseBtn}
              accessibilityLabel="Close"
            >
              <CloseCrossSvg color="#676767" size={14} />
            </TouchableOpacity>

            <View style={styles.modalRecipientBadge}>
              <View style={[styles.avatarCircle, { backgroundColor: selectedContact?.avatarBg || '#DCFCE7' }]}>
                <Text style={[styles.avatarText, { color: selectedContact?.avatarText || '#15803D' }]}>
                  {selectedContact?.initials || 'RK'}
                </Text>
              </View>
              <View style={styles.verifiedTextWrap}>
                <Text style={styles.verifiedName}>{selectedContact?.name || 'Ramesh Kumar'}</Text>
                <Text style={styles.verifiedDetail}>TOHFA Wallet • TOHFA123456789</Text>
              </View>
              <GreenCheckmarkSvg size={18} />
            </View>

            <Text style={styles.modalSectionTitle}>Payment Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>₹{parsedAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Fee</Text>
              <Text style={styles.detailValue}>₹0.00</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{parsedAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.otpHeaderRow}>
              <LockSvg color="#1A1A1A" size={16} />
              <Text style={styles.otpHeading}>Enter OTP</Text>
            </View>
            <Text style={styles.otpSubtext}>
              Enter the OTP sent to your registered mobile number to complete the payment.
            </Text>

            <View style={styles.otpInputWrap}>
              <PhoneCallSvg color="#9CA3AF" size={16} />
              <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP"
                placeholderTextColor="#9CA3AF"
                value={otpValue}
                onChangeText={setOtpValue}
                secureTextEntry={!showOtp}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowOtp(!showOtp)}>
                <EyeOffSvg color="#9CA3AF" size={18} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmTransfer}
              style={styles.confirmTransferBtn}
              accessibilityLabel="Confirm Transfer"
            >
              <Text style={styles.confirmTransferBtnText}>Confirm Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MONEY SENT SUCCESSFULLY MODAL (RIGHT SCREEN IN FIGMA IMAGE 3) ──────── */}
      <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCloseSuccess}
              style={styles.modalCloseBtn}
              accessibilityLabel="Close"
            >
              <CloseCrossSvg color="#676767" size={14} />
            </TouchableOpacity>

            <CelebrationPlaneSvg />

            <Text style={styles.successTitle}>Money Send successfully!</Text>

            <Text style={styles.successSubtext}>
              ₹{parsedAmount.toFixed(0)} Has been sent to{'\n'}
              <Text style={styles.boldText}>{selectedContact?.name || 'Ramesh Kumar'}</Text>
              {'\n'}({selectedContact?.phone || '+91 98765 43210'}).
            </Text>

            <View style={styles.successSummaryCard}>
              <View style={styles.summaryItemRow}>
                <View style={styles.summaryItemLeft}>
                  <ReceiptDocSvg color="#2E7D32" size={15} />
                  <Text style={styles.summaryItemLabel}>Transaction ID</Text>
                </View>
                <Text style={styles.summaryItemValueBold}>#TXN764392</Text>
              </View>

              <View style={styles.summaryItemRow}>
                <View style={styles.summaryItemLeft}>
                  <CalendarSvg color="#2E7D32" size={15} />
                  <Text style={styles.summaryItemLabel}>Date & Time</Text>
                </View>
                <Text style={styles.summaryItemValue}>13 Oct 2026, 09:41 AM</Text>
              </View>

              <View style={styles.summaryItemRow}>
                <View style={styles.summaryItemLeft}>
                  <WalletIdCardSvg color="#2E7D32" size={15} />
                  <Text style={styles.summaryItemLabel}>Updated Balance</Text>
                </View>
                <Text style={styles.summaryItemValueBold}>
                  ₹{(walletBalance - parsedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCloseSuccess}
              style={styles.closeOutlineBtn}
              accessibilityLabel="Close"
            >
              <Text style={styles.closeOutlineBtnText}>Close</Text>
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
