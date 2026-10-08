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

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SubWarehouseExpenseDetailScreenProps {
  expenseId?: string | undefined;
  amount?: number | string | undefined;
  category?: string | undefined;
  date?: string | undefined;
  description?: string | undefined;
  paymentMethod?: string | undefined;
  vendorPayee?: string | undefined;
  warehouse?: string | undefined;
  createdBy?: string | undefined;
  status?: string | undefined;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onEdit?: (() => void) | undefined;
  isReceiptView?: boolean;
  onViewReceipt?: () => void;
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

function DocumentIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function PencilIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CancelCircleIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export function SubWarehouseExpenseDetailScreen({
  expenseId = 'EXP-001245',
  amount = '2,400',
  category = 'Transport',
  date = '25 Sep 2026',
  description = 'Transport from Coonoor collection point to warehouse',
  paymentMethod = 'Cash',
  vendorPayee = 'Coonoor Transport Co.',
  warehouse = 'Coonoor',
  createdBy = 'SWA – Suresh',
  status = 'Recorded',
  onBack,
  onTabChange,
  onEdit,
  isReceiptView = false,
  onViewReceipt,
}: SubWarehouseExpenseDetailScreenProps) {
  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onBack) {
      onBack();
    }
  };

  const handleEditExpense = () => {
    if (onEdit) {
      onEdit();
    } else {
      Alert.alert('Edit Expense', 'Expense editing is accessible for authorized supervisor roles.');
    }
  };

  const handleCancelExpense = () => {
    Alert.alert(
      'Cancel Expense',
      `Are you sure you want to cancel expense ${expenseId}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Expense Cancelled', `${expenseId} has been marked as cancelled.`);
            if (onBack) onBack();
          },
        },
      ]
    );
  };

  const handleViewReceipt = () => {
    Alert.alert('Receipt Viewer', `Opening supporting document for ${expenseId}...`);
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Download Complete', `Receipt for ${expenseId} downloaded successfully.`);
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
            <Text style={styles.headerTitle}>Expense Detail</Text>
            <Text style={styles.headerSubtitle}>
              {expenseId} · ▫ {status}
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
        {/* ─── Section 1: Expense Summary ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Expense Summary</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Expense ID</Text>
                <Text style={styles.gridValue}>{expenseId}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Amount</Text>
                <Text style={styles.gridValue}>₹{typeof amount === 'number' ? amount.toLocaleString() : amount}</Text>
              </View>
            </View>

            <View style={[styles.gridRow, { marginTop: 14 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Category</Text>
                <Text style={styles.gridValue}>{category}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValue}>{date}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Section 2: Expense Details ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Expense Details</Text>
          <View style={styles.card}>
            {/* Description */}
            <Text style={styles.gridLabel}>Description</Text>
            <Text style={styles.descriptionValue}>{description}</Text>

            {/* Row 1: Payment Method & Vendor */}
            <View style={[styles.gridRow, { marginTop: 14 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Payment Method</Text>
                <Text style={styles.gridValue}>{paymentMethod}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Vendor / Payee</Text>
                <Text style={styles.gridValue}>{vendorPayee}</Text>
              </View>
            </View>

            {/* Row 2: Warehouse & Created By */}
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
          </View>
        </View>

        {/* ─── Section 3: Receipt ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Receipt</Text>
          <View style={styles.card}>
            <View style={styles.receiptRow}>
              <View style={styles.receiptIconBox}>
                <DocumentIcon size={22} color={PALETTE.iconColor} />
              </View>

              <View style={styles.receiptInfoCol}>
                <Text style={styles.receiptTitle}>Supporting Document</Text>
                <View style={styles.receiptActionsRow}>
                  <TouchableOpacity onPress={handleViewReceipt} activeOpacity={0.7}>
                    <Text style={styles.receiptActionText}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleDownloadReceipt} activeOpacity={0.7}>
                    <Text style={[styles.receiptActionText, { marginLeft: 16 }]}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Section 4: Timeline ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Timeline</Text>
          <View style={styles.card}>
            {/* Step 1 */}
            <View style={styles.timelineItemRow}>
              <TimelineCheckIcon size={18} color="#059669" />
              <Text style={styles.timelineItemText}>Expense Created</Text>
            </View>

            {/* Stepper Connector Line */}
            <View style={styles.timelineConnector} />

            {/* Step 2 */}
            <View style={styles.timelineItemRow}>
              <TimelineCheckIcon size={18} color="#059669" />
              <Text style={styles.timelineItemText}>Recorded</Text>
            </View>

            {/* Role Matrix Lock Notice */}
            <View style={styles.lockNoticeCard}>
              <View style={styles.lockIconBox}>
                <LockIcon size={14} color="#7A726C" />
              </View>
              <Text style={styles.lockNoticeText}>
                Approve/Reject is not automatically given to SWA on this screen — the role matrix marks "Approve expense claims" as not granted.
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Section 5: Actions ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Actions</Text>
          <View style={styles.actionsRow}>
            {/* Edit */}
            <TouchableOpacity
              style={styles.actionBtnCard}
              onPress={handleEditExpense}
              activeOpacity={0.75}
            >
              <PencilIcon size={18} color={PALETTE.iconColor} />
              <Text style={styles.actionBtnLabel}>Edit</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.actionBtnCard}
              onPress={handleCancelExpense}
              activeOpacity={0.75}
            >
              <CancelCircleIcon size={18} color={PALETTE.iconColor} />
              <Text style={styles.actionBtnLabel}>Cancel</Text>
            </TouchableOpacity>

            {/* View Receipt */}
            <TouchableOpacity
              style={styles.actionBtnCard}
              onPress={handleViewReceipt}
              activeOpacity={0.75}
            >
              <EyeIcon size={18} color={PALETTE.iconColor} />
              <Text style={styles.actionBtnLabel}>View Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen Footer Code */}
        <Text style={styles.screenFooterCode}>M11-S05 · Expense Detail</Text>

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
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  descriptionValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
    lineHeight: 20,
  },

  // Receipt Section
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  receiptIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: PALETTE.peachBg,
    borderWidth: 1,
    borderColor: '#F5DCD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptInfoCol: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
    marginBottom: 6,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptActionText: {
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
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  timelineConnector: {
    width: 2,
    height: 18,
    backgroundColor: PALETTE.border,
    marginLeft: 8,
    marginVertical: 3,
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
