import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (TOHFA Admin App — Design System PDF) ─────────────────────
const PALETTE = {
  primary:       '#F0562A', // Orange: primary actions
  orangeDeep:    '#7A2E14', // Orange Deep: section headings
  orangeTint:    '#FDF3F0', // Orange Tint
  pageBg:        '#F3EFE9', // App canvas
  cardBg:        '#FFFFFF', // Card surfaces
  textInk:       '#1A1A1A', // Ink: primary text
  textSecondary: '#5F5E5A', // Muted: secondary text
  border:        '#EEDCD3', // Border: card and input borders
  lineGreen:     '#10B981',
  tabInactive:   '#5F5E5A',
  tabBorder:     '#EEDCD3',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

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

function CheckCircleDotIcon({ size = 20, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        fill={color}
      />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
        fill={color}
      />
    </Svg>
  );
}

export interface SubWarehouseCustomerSupportDetailScreenProps {
  customerName?: string | undefined;
  ticket?: {
    id?: string | undefined;
    ticketNo?: string | undefined;
    orderRef?: string | undefined;
    subject?: string | undefined;
    dateText?: string | undefined;
    status?: string | undefined;
    resolvedBy?: string | undefined;
  } | undefined;
  onBack: () => void;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
}

export function SubWarehouseCustomerSupportDetailScreen({
  customerName = 'Rajesh Kumar',
  ticket,
  onBack,
  onTabChange,
}: SubWarehouseCustomerSupportDetailScreenProps) {
  const ticketNo = ticket?.ticketNo || 'SUP-00182';
  const orderRef = ticket?.orderRef || 'ORD-00251';
  const subject = ticket?.subject || 'Pickup Issue';
  const createdDate = ticket?.dateText || '24 Sep 2026';
  const status = ticket?.status || 'Resolved';
  const resolvedBy = ticket?.resolvedBy || 'Admin';

  const activities = [
    'Customer message',
    'Admin response',
    'Support action',
    'Resolution',
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Support Detail</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Main Support Info Card ─── */}
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Support ID</Text>
              <Text style={styles.metaValueBold}>{ticketNo}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.metaValueBold}>{customerName}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Order</Text>
              <Text style={styles.metaValueBold}>{orderRef}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Subject</Text>
              <Text style={styles.metaValueBold}>{subject}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Created</Text>
              <Text style={styles.metaValueBold}>{createdDate}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValueBold}>{status}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Activity Section ─── */}
        <Text style={styles.sectionHeading}>Activity</Text>
        <View style={styles.timelineCard}>
          {activities.map((act, index) => {
            const isLast = index === activities.length - 1;

            return (
              <View key={act} style={styles.timelineRow}>
                {/* Stepper Dot & Vertical Line */}
                <View style={styles.dotLineCol}>
                  <CheckCircleDotIcon size={20} color={PALETTE.lineGreen} />
                  {!isLast && (
                    <View style={[styles.timelineLine, { backgroundColor: PALETTE.lineGreen }]} />
                  )}
                </View>

                {/* Step Title */}
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>{act}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── 3. Resolution Section ─── */}
        <Text style={styles.sectionHeading}>Resolution</Text>
        <View style={styles.resolutionCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValueBold}>{status}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Resolved Date</Text>
              <Text style={styles.metaValueBold}>{createdDate}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Resolved By</Text>
              <Text style={styles.metaValueBold}>{resolvedBy}</Text>
            </View>
            <View style={styles.gridCol} />
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },

  /* Main Card */
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  metaValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Headings */
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.1,
  },

  /* Timeline */
  timelineCard: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotLineCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineLine: {
    width: 2,
    height: 28,
    marginVertical: 2,
  },
  stepTextWrap: {
    marginLeft: 10,
    justifyContent: 'center',
    height: 20,
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  /* Resolution Card */
  resolutionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
