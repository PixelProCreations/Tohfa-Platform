import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  peachBg:       '#FDF0EB',
  iconColor:     '#8B5E3C',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  green:         '#059669',
  greenBg:       '#DCFCE7',
  greenText:     '#15803D',
  greenBorder:   '#86EFAC',

  amberBg:       '#FEF3C7',
  amberText:     '#92400E',
  recordedBg:    '#FDF0EB',
  recordedText:  '#A0522D',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SubWarehouseVoucherDetailScreenProps {
  voucherId?: string | undefined;
  type?: 'Expense' | 'Revenue' | string | undefined;
  title?: string | undefined;
  amount?: number | string | undefined;
  referenceId?: string | undefined;
  date?: string | undefined;
  status?: 'Recorded' | 'Pending' | 'Completed' | string | undefined;
  warehouse?: string | undefined;
  createdBy?: string | undefined;
  paymentMethod?: string | undefined;
  notes?: string | undefined;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onViewReference?: ((refId: string) => void) | undefined;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function VoucherDocIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 9h10M7 13h10M7 17h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TimelineCheckIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="#DCFCE7" />
      <Circle cx="12" cy="12" r="4" fill={color} />
    </Svg>
  );
}

function LockIcon({ size = 14, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SharePrintIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="6" y="14" width="12" height="8" rx="1" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SubWarehouseVoucherDetailScreen({
  voucherId = 'VCH-000820',
  type = 'Revenue',
  title = 'Revenue Voucher · B2B Sale - Taj Hotel',
  amount = '14,500',
  referenceId = 'REV-001089',
  date = '25 Sep 2026',
  status = 'Completed',
  warehouse = 'Coonoor Warehouse',
  createdBy = 'SWA – Suresh',
  paymentMethod = 'Bank Transfer / Cash',
  notes = 'Direct settlement authorized for delivery batch.',
  onBack,
  onTabChange,
  onViewReference,
}: SubWarehouseVoucherDetailScreenProps) {
  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onBack) {
      onBack();
    }
  };

  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'Completed':
        return { bg: PALETTE.greenBg, text: PALETTE.greenText };
      case 'Pending':
        return { bg: PALETTE.amberBg, text: PALETTE.amberText };
      case 'Recorded':
      default:
        return { bg: PALETTE.recordedBg, text: PALETTE.recordedText };
    }
  };

  const badgeStyle = getStatusBadgeStyle();

  const handlePrint = () => {
    Alert.alert('Print Voucher', `Sending voucher ${voucherId} to connected warehouse printer...`);
  };

  const handleDownload = () => {
    Alert.alert('Download Complete', `Voucher PDF for ${voucherId} saved to documents.`);
  };

  const handleViewTransaction = () => {
    if (onViewReference && referenceId) {
      onViewReference(referenceId);
    } else {
      Alert.alert('Linked Transaction', `Reference transaction: ${referenceId}\nType: ${type}\nAmount: ₹${typeof amount === 'number' ? amount.toLocaleString() : amount}`);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Voucher Detail</Text>
            <Text style={styles.headerSubtitle}>
              {voucherId} · ▫ {status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section 1: Voucher Summary ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Voucher Summary</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Voucher ID</Text>
                <Text style={styles.gridValueId}>{voucherId}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Amount</Text>
                <Text style={styles.gridValueAmount}>
                  ₹{typeof amount === 'number' ? amount.toLocaleString() : amount}
                </Text>
              </View>
            </View>

            <View style={[styles.gridRow, { marginTop: 14 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Type</Text>
                <Text style={styles.gridValue}>{type} Voucher</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                    {status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Section 2: Transaction Details ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Transaction Details</Text>
          <View style={styles.card}>
            {/* Description / Title */}
            <Text style={styles.gridLabel}>Description / Title</Text>
            <Text style={styles.descriptionValue}>{title}</Text>

            {/* Row: Reference ID & Settlement Method */}
            <View style={[styles.gridRow, { marginTop: 14 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Reference ID</Text>
                <Text style={styles.gridValue}>{referenceId}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValue}>{date}</Text>
              </View>
            </View>

            {/* Row: Warehouse & Created By */}
            <View style={[styles.gridRow, { marginTop: 14 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Warehouse</Text>
                <Text style={styles.gridValue}>{warehouse}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Created By</Text>
                <Text style={styles.gridValue}>{createdBy}</Text>
              </View>
            </View>

            {/* Row: Settlement */}
            <View style={[styles.gridRow, { marginTop: 14 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Settlement / Payment</Text>
                <Text style={styles.gridValue}>{paymentMethod}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Section 3: Voucher Document ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Voucher Document</Text>
          <View style={styles.card}>
            <View style={styles.docRow}>
              <View style={styles.docIconBox}>
                <VoucherDocIcon size={24} color={PALETTE.iconColor} />
              </View>

              <View style={styles.docInfoCol}>
                <Text style={styles.docTitle}>Official Digital Voucher PDF</Text>
                <Text style={styles.docSub}>{voucherId} · Signed & Sealed</Text>
                <View style={styles.docActionsRow}>
                  <TouchableOpacity onPress={handlePrint} activeOpacity={0.7}>
                    <Text style={styles.docActionText}>Print</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleDownload} activeOpacity={0.7}>
                    <Text style={[styles.docActionText, { marginLeft: 16 }]}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Section 4: Timeline / Verification ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Verification Timeline</Text>
          <View style={styles.card}>
            {/* Step 1 */}
            <View style={styles.timelineItemRow}>
              <TimelineCheckIcon size={18} color="#059669" />
              <Text style={styles.timelineItemText}>Voucher Generated</Text>
            </View>

            {/* Stepper Connector Line */}
            <View style={styles.timelineConnector} />

            {/* Step 2 */}
            <View style={styles.timelineItemRow}>
              <TimelineCheckIcon size={18} color="#059669" />
              <Text style={styles.timelineItemText}>Recorded in Warehouse Ledger</Text>
            </View>

            {/* Stepper Connector Line */}
            <View style={styles.timelineConnector} />

            {/* Step 3 */}
            <View style={styles.timelineItemRow}>
              <TimelineCheckIcon
                size={18}
                color={status === 'Completed' ? '#059669' : '#D97706'}
              />
              <Text style={styles.timelineItemText}>
                {status === 'Completed' ? 'Voucher Settled & Closed' : 'Pending Verification'}
              </Text>
            </View>

            {/* Role Matrix Lock Notice */}
            <View style={styles.lockNoticeCard}>
              <View style={styles.lockIconBox}>
                <LockIcon size={14} color="#7A726C" />
              </View>
              <Text style={styles.lockNoticeText}>
                Vouchers provide tamper-evident records reconciled automatically with the central finance ledger.
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Section 5: Actions ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Actions</Text>
          <View style={styles.actionsRow}>
            {/* Print */}
            <TouchableOpacity
              style={styles.actionBtnCard}
              onPress={handlePrint}
              activeOpacity={0.75}
            >
              <SharePrintIcon size={18} color={PALETTE.iconColor} />
              <Text style={styles.actionBtnLabel}>Print</Text>
            </TouchableOpacity>

            {/* Download */}
            <TouchableOpacity
              style={styles.actionBtnCard}
              onPress={handleDownload}
              activeOpacity={0.75}
            >
              <DownloadIcon size={18} color={PALETTE.iconColor} />
              <Text style={styles.actionBtnLabel}>Download PDF</Text>
            </TouchableOpacity>

            {/* View Transaction */}
            <TouchableOpacity
              style={styles.actionBtnCard}
              onPress={handleViewTransaction}
              activeOpacity={0.75}
            >
              <EyeIcon size={18} color={PALETTE.iconColor} />
              <Text style={styles.actionBtnLabel}>Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen Footer Code */}
        <Text style={styles.screenFooterCode}>M11-S08 · Voucher Detail</Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.7}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.7}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.7}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.7}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 8,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  // Grid
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  gridValueId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B44516',
  },
  gridValueAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  descriptionValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
    lineHeight: 20,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Document Section
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  docIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: PALETTE.peachBg,
    borderWidth: 1,
    borderColor: '#F5DCD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
    marginBottom: 2,
  },
  docSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  docActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.iconColor,
  },

  // Timeline
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineItemText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  timelineConnector: {
    width: 2,
    height: 16,
    backgroundColor: PALETTE.border,
    marginLeft: 8,
    marginVertical: 2,
  },
  lockNoticeCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE6D8',
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lockIconBox: {
    marginTop: 1,
  },
  lockNoticeText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textDark,
  },

  // Screen Footer
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
