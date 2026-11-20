import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';
import {
  BackArrowIcon,
  LeafIcon,
  AddInputCircleIcon,
  OpenCatalogBoxIcon,
  PestBugIcon,
  GuideBookIcon,
  PestIncidentIcon,
} from './inputsIcons';

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
  onViewRecentIncident: _onViewRecentIncident,
  onOpenNotifications: _onOpenNotifications,
  onAddInput,
}: InputsPestHomeScreenProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
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

      {/* Scroll Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 Metric Cards in 3x2 Grid */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            value="—"
            title="Total Inputs"
            icon="inventory"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="—"
            title="Approved Inputs"
            icon="receiving"
            tone="success"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="—"
            title="Pending Review"
            icon="orders"
            tone="warning"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="—"
            title="Inactive / Expired"
            icon="alert"
            tone="danger"
            titlePosition="bottom"
            onPress={onNavigateApprovedInputs}
          />
          <OverviewDashboardCard
            value="—"
            title="Pest & Disease Records"
            icon="box"
            titlePosition="bottom"
            onPress={onNavigatePestLibrary}
          />
          <OverviewDashboardCard
            value="—"
            title="Application Guides"
            icon="clipboard"
            titlePosition="bottom"
            onPress={onNavigateApplicationGuides}
          />
        </OverviewCardsGrid>

        {/* Footnote */}
        <Text style={styles.footnote}>
          Inactive / Expired follows the configured status and expiry rules. Where a rule is not defined, the record count is shown without an inferred status.
        </Text>

        {/* Section 1: Input Catalog Activity */}
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

        {/* Section 2: Pest & Disease Library */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pest & Disease Library</Text>
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

        {/* Section 3: Attention Required */}
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

        {/* Section 4: Quick Actions (5 cards) */}
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

          {/* Row 2: 2 cards */}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
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
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  kpiGrid: {
    marginBottom: adminSpacing.xs,
  },
  footnote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginHorizontal: 4,
    marginTop: 6,
    marginBottom: adminSpacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  viewLink: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  cardSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: 3,
  },
  badgeApprovedText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: 3,
  },
  badgePendingText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  badgePublished: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: 3,
  },
  badgePublishedText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  badgeDanger: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: 3,
  },
  badgeDangerText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },
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
    borderColor: adminColors.border,
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
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 10,
  },
});
