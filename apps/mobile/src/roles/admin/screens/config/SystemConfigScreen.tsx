import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const CONFIG_PALETTE = {
  primaryOrange: '#F0562A',
  primaryOrangeLight: '#FFF1EB',
  primaryOrangeBorder: '#FAD9CC',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#1F1714',
  textSecondary: '#786F68',
  textMuted: '#9C938C',
  borderSoft: '#EDE7DE',
  greenBg: '#DCFCE7',
  greenText: '#15803D',
  blueBg: '#EBF3FA',
  blueText: '#1D6399',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
export function ConfigBackChevronIcon({ color = '#1F1714', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilEditIcon({ color = CONFIG_PALETTE.primaryOrange, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PayoutTruckIcon({ color = '#4B5563', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="11" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M15 8h4.2a1 1 0 0 1 .8.4l2.5 3.3a1 1 0 0 1 .2.6V15h-7.7V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="5.5" cy="18" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="18" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function MailSmsIcon({ color = '#4B5563', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M22 7l-10 7L2 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CloudStorageIcon({ color = '#4B5563', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingDetailsIcon({ color = CONFIG_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 22v-4h6v4M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldLogsIcon({ color = CONFIG_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ color = '#B5ACA4', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SystemConfigScreenProps {
  onBack?: () => void;
  onOpenChannelAllocation?: () => void;
  onOpenIntegration?: (integrationId: string) => void;
  onOpenCompanyDetails?: () => void;
  onOpenAuditLogs?: () => void;
}

export function SystemConfigScreen({
  onBack,
  onOpenChannelAllocation,
  onOpenIntegration,
  onOpenCompanyDetails,
  onOpenAuditLogs,
}: SystemConfigScreenProps) {
  // Config state values
  const [channelSplit, setChannelSplit] = useState('70/10/10/10');
  const [subscriptionFee, setSubscriptionFee] = useState('₹500/yr');
  const [sessionTimeout, setSessionTimeout] = useState('30 min');
  const [ratingThresholds, setRatingThresholds] = useState('650/700/750');

  // Quick Edit modal states
  const [editModalField, setEditModalField] = useState<
    'fee' | 'timeout' | 'thresholds' | null
  >(null);
  const [editInputValue, setEditInputValue] = useState('');

  const handleOpenEdit = (field: 'fee' | 'timeout' | 'thresholds', initialVal: string) => {
    setEditModalField(field);
    setEditInputValue(initialVal);
  };

  const handleSaveEdit = () => {
    if (editModalField === 'fee') {
      setSubscriptionFee(editInputValue);
    } else if (editModalField === 'timeout') {
      setSessionTimeout(editInputValue);
    } else if (editModalField === 'thresholds') {
      setRatingThresholds(editInputValue);
    }
    setEditModalField(null);
    Alert.alert('Configuration Saved', 'System parameter updated successfully.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={CONFIG_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ConfigBackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>System Configuration</Text>
          <Text style={styles.screenSubtitle}>Super Admin only</Text>
        </View>

        {/* ─── SECTION 1: BUSINESS & PRODUCT CONFIGURATION ─── */}
        <Text style={styles.sectionHeader}>BUSINESS & PRODUCT CONFIGURATION</Text>
        <View style={styles.cardGroup}>
          {/* Row 1: Channel Allocation */}
          <TouchableOpacity
            style={styles.configRow}
            onPress={onOpenChannelAllocation}
            activeOpacity={0.7}
          >
            <View style={styles.configRowLeft}>
              <Text style={styles.configRowTitle}>Channel Allocation</Text>
              <Text style={styles.configRowSubtitle}>
                Online / Market / Reserve / Buffer split
              </Text>
            </View>
            <View style={styles.configRowRight}>
              <Text style={styles.configRowValue}>{channelSplit}</Text>
              <PencilEditIcon />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Row 2: Farmer Subscription Fee */}
          <TouchableOpacity
            style={styles.configRow}
            onPress={() => handleOpenEdit('fee', subscriptionFee)}
            activeOpacity={0.7}
          >
            <View style={styles.configRowLeft}>
              <Text style={styles.configRowTitle}>Farmer Subscription Fee</Text>
              <Text style={styles.configRowSubtitle}>Annual, free tier available</Text>
            </View>
            <View style={styles.configRowRight}>
              <Text style={styles.configRowValue}>{subscriptionFee}</Text>
              <PencilEditIcon />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Row 3: Session Timeout */}
          <TouchableOpacity
            style={styles.configRow}
            onPress={() => handleOpenEdit('timeout', sessionTimeout)}
            activeOpacity={0.7}
          >
            <View style={styles.configRowLeft}>
              <Text style={styles.configRowTitle}>Session Timeout</Text>
              <Text style={styles.configRowSubtitle}>Auto-logout after inactivity</Text>
            </View>
            <View style={styles.configRowRight}>
              <Text style={styles.configRowValue}>{sessionTimeout}</Text>
              <PencilEditIcon />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Row 4: Rating Tier Thresholds */}
          <TouchableOpacity
            style={styles.configRow}
            onPress={() => handleOpenEdit('thresholds', ratingThresholds)}
            activeOpacity={0.7}
          >
            <View style={styles.configRowLeft}>
              <Text style={styles.configRowTitle}>Rating Tier Thresholds</Text>
              <Text style={styles.configRowSubtitle}>Poor / Moderate / Good / Excellent</Text>
            </View>
            <View style={styles.configRowRight}>
              <Text style={styles.configRowValue}>{ratingThresholds}</Text>
              <PencilEditIcon />
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── SECTION 2: TECHNICAL INTEGRATIONS & INFRASTRUCTURE ─── */}
        <Text style={styles.sectionHeader}>TECHNICAL INTEGRATIONS & INFRASTRUCTURE</Text>
        <View style={styles.integrationsStack}>
          {/* Item 1: Razorpay */}
          <TouchableOpacity
            style={styles.integrationCard}
            onPress={() => onOpenIntegration?.('razorpay')}
            activeOpacity={0.7}
          >
            <View style={styles.integrationLeft}>
              <View style={styles.integrationIconBox}>
                <PayoutTruckIcon />
              </View>
              <Text style={styles.integrationTitle}>
                Razorpay + RazorpayX Payouts
              </Text>
            </View>
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedBadgeText}>EXT · Connected</Text>
            </View>
          </TouchableOpacity>

          {/* Item 2: Twilio / MSG91 */}
          <TouchableOpacity
            style={styles.integrationCard}
            onPress={() => onOpenIntegration?.('sms')}
            activeOpacity={0.7}
          >
            <View style={styles.integrationLeft}>
              <View style={styles.integrationIconBox}>
                <MailSmsIcon />
              </View>
              <Text style={styles.integrationTitle}>Twilio / MSG91 (SMS)</Text>
            </View>
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedBadgeText}>EXT · Connected</Text>
            </View>
          </TouchableOpacity>

          {/* Item 3: AWS S3 */}
          <TouchableOpacity
            style={styles.integrationCard}
            onPress={() => onOpenIntegration?.('aws')}
            activeOpacity={0.7}
          >
            <View style={styles.integrationLeft}>
              <View style={styles.integrationIconBox}>
                <CloudStorageIcon />
              </View>
              <Text style={styles.integrationTitle}>AWS S3 / Cloudinary</Text>
            </View>
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedBadgeText}>EXT · Connected</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── SECTION 3: COMPANY SETTINGS ─── */}
        <Text style={styles.sectionHeader}>COMPANY SETTINGS</Text>
        <View style={styles.companyStack}>
          {/* Item 1: Company Details */}
          <TouchableOpacity
            style={styles.companyCard}
            onPress={onOpenCompanyDetails}
            activeOpacity={0.7}
          >
            <View style={styles.companyCardLeft}>
              <View style={styles.peachIconBox}>
                <BuildingDetailsIcon />
              </View>
              <View style={styles.companyCardTexts}>
                <Text style={styles.companyCardTitle}>Company Details</Text>
                <Text style={styles.companyCardSubtitle}>
                  GSTIN, registered address
                </Text>
              </View>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Item 2: System Audit Logs */}
          <TouchableOpacity
            style={styles.companyCard}
            onPress={onOpenAuditLogs}
            activeOpacity={0.7}
          >
            <View style={styles.companyCardLeft}>
              <View style={styles.peachIconBox}>
                <ShieldLogsIcon />
              </View>
              <View style={styles.companyCardTexts}>
                <Text style={styles.companyCardTitle}>System Audit Logs</Text>
                <Text style={styles.companyCardSubtitle}>
                  View immutable admin activity
                </Text>
              </View>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Quick Edit Modal */}
        <Modal
          visible={editModalField !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalField(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editModalField === 'fee'
                  ? 'Edit Subscription Fee'
                  : editModalField === 'timeout'
                  ? 'Edit Session Timeout'
                  : 'Edit Rating Thresholds'}
              </Text>
              <TextInput
                style={styles.modalInput}
                value={editInputValue}
                onChangeText={setEditInputValue}
                placeholder="Enter value"
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditModalField(null)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalSaveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CONFIG_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: CONFIG_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
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
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CONFIG_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: CONFIG_PALETTE.textSecondary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8179',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 8,
  },
  cardGroup: {
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  configRowLeft: {
    flex: 1,
    marginRight: 10,
  },
  configRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 2,
  },
  configRowSubtitle: {
    fontSize: 11,
    color: CONFIG_PALETTE.textSecondary,
  },
  configRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E8',
  },
  integrationsStack: {
    gap: 10,
    marginBottom: 22,
  },
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  integrationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  integrationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
    flex: 1,
  },
  connectedBadge: {
    backgroundColor: CONFIG_PALETTE.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: CONFIG_PALETTE.greenText,
  },
  companyStack: {
    gap: 10,
    marginBottom: 20,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  companyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  peachIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CONFIG_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyCardTexts: {
    flex: 1,
  },
  companyCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 2,
  },
  companyCardSubtitle: {
    fontSize: 11,
    color: CONFIG_PALETTE.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CONFIG_PALETTE.textHeading,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: CONFIG_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    fontSize: 14,
    color: CONFIG_PALETTE.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: CONFIG_PALETTE.primaryOrange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
