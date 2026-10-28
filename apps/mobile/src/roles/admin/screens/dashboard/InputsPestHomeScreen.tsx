import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
} from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';

// ─── Header & Action Icons ───────────────────────────────────────────────────

function LeafIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8L2 22M17.5 15H9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

// 1. Add Input: Circle with plus
function AddInputCircleIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 2. Open Catalog: Box with horizontal drawer slot
function OpenCatalogBoxIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="9" y="13" width="6" height="3" rx="1" fill={color} />
    </Svg>
  );
}

// 3. Pest/Disease Library: Bug / Beetle icon
function PestBugIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="8" width="10" height="12" rx="5" stroke={color} strokeWidth="2" />
      <Path d="M12 8V4M8 5l8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M4 11h3M17 11h3M4 16h3M17 16h3M5 7l2.5 2M19 7l-2.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// 4. Create Application Guide: Book / Guide icon
function GuideBookIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 7h7M9 11h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// 5. View Pest Incidents: Warning / Triangle with exclamation
function PestIncidentIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M12 7v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="16.5" r="1" fill={color} />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface InputsPestHomeScreenProps {
  onBack?: () => void;
  onNavigateApprovedInputs: () => void;
  onNavigatePestLibrary?: () => void;
  onNavigateApplicationGuides?: () => void;
  onNavigatePestIncidents?: () => void;
  onViewRecentIncident?: () => void;
  onOpenNotifications?: () => void;
  onAddInput?: () => void;
}

export function InputsPestHomeScreen({
  onBack,
  onNavigateApprovedInputs,
  onNavigatePestLibrary,
  onNavigateApplicationGuides,
  onNavigatePestIncidents,
  onViewRecentIncident,
  onOpenNotifications,
  onAddInput,
}: InputsPestHomeScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
          ) : null}

          <LeafIcon size={24} color={adminColors.onBrand} />
          <Text style={styles.headerTitle}>Inputs & Pest Management</Text>
        </View>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 6 Metric Cards in 3x2 Grid (Calling OverviewDashboardCard & OverviewCardsGrid) ─── */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            value="18"
            title="Total Inputs"
            icon="inventory"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="14"
            title="Approved Inputs"
            icon="receiving"
            tone="success"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="2"
            title="Pending Review"
            icon="orders"
            tone="warning"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="2"
            title="Inactive / Expired"
            icon="alert"
            tone="danger"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="11"
            title="Pest & Disease Records"
            icon="box"
            titlePosition="bottom"
            onPress={onNavigatePestLibrary}
          />
          <OverviewDashboardCard
            value="9"
            title="Application Guides"
            icon="clipboard"
            titlePosition="bottom"
            onPress={onNavigateApplicationGuides}
          />
        </OverviewCardsGrid>

        {/* ─── Footnote ─── */}
        <Text style={styles.footnote}>
          Inactive / Expired follows the configured status and expiry rules. Where a rule is not defined, the record count is shown without an inferred status.
        </Text>

        {/* ─── Section 1: Input Catalog Activity ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Input Catalog Activity</Text>
          <TouchableOpacity onPress={onNavigateApprovedInputs} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>

        {/* Card 1: Neem Oil Concentrate */}
        <TouchableOpacity
          style={styles.activityCard}
          onPress={onNavigateApprovedInputs}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Neem Oil Concentrate</Text>
            <View style={styles.badgeApproved}>
              <Text style={styles.badgeApprovedText}>Approved</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Updated 11 Oct 2026 · Priya Nair</Text>
        </TouchableOpacity>

        {/* Card 2: Panchagavya Mix */}
        <TouchableOpacity
          style={styles.activityCard}
          onPress={onNavigateApprovedInputs}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Panchagavya Mix</Text>
            <View style={styles.badgePending}>
              <Text style={styles.badgePendingText}>Pending Review</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Submitted 10 Oct 2026 · Priya Nair</Text>
        </TouchableOpacity>

        {/* ─── Section 2: Pest & Disease Libray ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pest & Disease Libray</Text>
          <TouchableOpacity
            onPress={onNavigatePestLibrary ?? onNavigateApprovedInputs}
            activeOpacity={0.7}
          >
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>

        {/* Card 1: Late Blight (Tomato) */}
        <TouchableOpacity
          style={styles.activityCard}
          onPress={onNavigatePestLibrary ?? onNavigateApprovedInputs}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Late Blight (Tomato)</Text>
            <View style={styles.badgePublished}>
              <Text style={styles.badgePublishedText}>Published</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Updated 9 Oct 2026 · Agronomy team</Text>
        </TouchableOpacity>

        {/* ─── Section 3: Attention Required ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Attention Required</Text>
        </View>

        {/* Card 1: Bio-NPK Liquid */}
        <View style={styles.activityCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Bio-NPK Liquid</Text>
            <View style={styles.badgeDanger}>
              <Text style={styles.badgeDangerText}>Missing composition data</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            Cannot be published until Composition & Usage is complete
          </Text>
        </View>

        {/* ─── Section 4: Quick Actions (5 cards) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickGrid}>
          {/* Row 1: 3 cards */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onAddInput ?? onNavigateApprovedInputs}
              activeOpacity={0.8}
            >
              <AddInputCircleIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Add Input</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateApprovedInputs}
              activeOpacity={0.8}
            >
              <OpenCatalogBoxIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Open Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigatePestLibrary ?? onNavigateApprovedInputs}
              activeOpacity={0.8}
            >
              <PestBugIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Pest/Disease Library</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: 2 cards (3-card width ratio) */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateApplicationGuides ?? onNavigateApprovedInputs}
              activeOpacity={0.8}
            >
              <GuideBookIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Create Application Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigatePestIncidents ?? onNavigateApprovedInputs}
              activeOpacity={0.8}
            >
              <PestIncidentIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>View Pest Incidents</Text>
            </TouchableOpacity>

            {/* Invisible placeholder for 3-column alignment */}
            <View style={styles.quickCardPlaceholder} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles Strictly Derived from Admin Theme ─────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // 6 KPI Metric Cards
  kpiGrid: {
    marginBottom: adminSpacing.xs,
  },
  footnote: {
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 16,
    marginHorizontal: 4,
    marginTop: 6,
    marginBottom: adminSpacing.md,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Cards
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Badges
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeApprovedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePendingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  badgePublished: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePublishedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeDanger: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDangerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.danger.text,
  },

  // Quick Actions Grid (5 cards: 3 in row 1, 2 in row 2)
  quickGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    paddingVertical: 18,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 105,
    ...adminShadow.sm,
  },
  quickCardPlaceholder: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  quickCardLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 15,
  },
});
