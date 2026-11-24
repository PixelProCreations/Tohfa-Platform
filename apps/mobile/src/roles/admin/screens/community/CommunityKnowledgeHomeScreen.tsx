import React from 'react';
import {
ScrollView,
StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components';
import {
  useLearningArticles,
  useLearningGroups,
  useLearningTrainings,
  useLearningVideos,
} from '../../api/learningHooks';
import { useCommunities } from '../../api/communitiesHooks';
import { useAdminQaQuestions } from '../../api/qaHooks';
import { countLoadedWhere } from '../../api/hookHelpers';
import { t } from '../../i18n';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import { canManageLearning, dash, joinMeta, sumTotalsText, totalText, totalWithActiveText } from './communityLogic';
import { canModerateCommunities } from './communitiesLogic';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CommunityThreeUsersIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3.2" stroke={color} strokeWidth="1.9" />
      <Path
        d="M6.5 20v-.8a5.5 5.5 0 0 1 11 0v.8"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <Circle cx="4.8" cy="9.2" r="2.2" stroke={color} strokeWidth="1.7" />
      <Path
        d="M1.5 20v-.6a4.2 4.2 0 0 1 3.8-3.7"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <Circle cx="19.2" cy="9.2" r="2.2" stroke={color} strokeWidth="1.7" />
      <Path
        d="M18.7 15.7a4.2 4.2 0 0 1 3.8 3.7v.6"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CommunityHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return <CommunityThreeUsersIcon size={size} color={color} />;
}

function PlusIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

function BookGuideIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CommunityKnowledgeHomeScreenProps {
  onBack?: () => void;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
  onNavigateCreateContent: (initialType?: 'Article' | 'Farming Guide' | 'Information' | 'Announcement') => void;
  onNavigateAddVideo?: () => void;
  onNavigateKnowledgeLibrary?: () => void;
  onNavigateCommunityDetails?: (communityId?: string) => void;
  onNavigateAllCommunities?: () => void;
  onNavigateCreateGroup?: () => void;
  onNavigateAllGroups?: () => void;
  onNavigateCreateCommunity?: () => void;
  onViewActivityDetails?: (activityId: string) => void;
}

/**
 * The Community & Knowledge overview.
 *
 * Of the eight designed tiles the Learning Hub API answers exactly one in
 * full: Groups, from the server's `total` over the whole filtered set. Its
 * "(N active)" half is a count of the LOADED rows, so it goes through
 * countLoadedWhere and shows the dash until every page is in — a number taken
 * from the first page of many would be a claim the screen cannot support.
 *
 * The other seven name things the spec has no resource for: communities,
 * announcements, discussions, reports, a review queue and crop verification.
 * They keep their tiles and carry the dash. So do the growth bar, the "most
 * viewed" card (no view, bookmark or comment counter exists anywhere) and the
 * activity feed.
 */
export function CommunityKnowledgeHomeScreen({
  onBack,
  can,
  onNavigateCreateContent,
  onNavigateAddVideo,
  onNavigateKnowledgeLibrary,
  onNavigateCommunityDetails,
  onNavigateAllCommunities,
  onNavigateCreateGroup,
  onNavigateAllGroups,
  onNavigateCreateCommunity: _onNavigateCreateCommunity,
  onViewActivityDetails: _onViewActivityDetails,
}: CommunityKnowledgeHomeScreenProps) {
  const allowed = canManageLearning(can);
  // One row per page is enough for `total`; the groups list is also walked for
  // the active sub-count, which stays a dash until every page has arrived.
  const groups = useLearningGroups({}, { enabled: allowed });
  const articles = useLearningArticles({}, { enabled: allowed });
  const videos = useLearningVideos({}, { enabled: allowed });
  // Server-reported totals only (one row per page is enough for `total`).
  const communities = useCommunities({ limit: 1 }, { enabled: canModerateCommunities(can) });
  const discussions = useAdminQaQuestions({ limit: 1 }, { enabled: allowed });
  // BR-59t: "Pending review" is the sum of the four resources' own totals for
  // reviewStatus=PENDING_REVIEW, and is the dash until every one has answered.
  const pending = { reviewStatus: 'PENDING_REVIEW', limit: 1 } as const;
  const pendingArticles = useLearningArticles(pending, { enabled: allowed });
  const pendingVideos = useLearningVideos(pending, { enabled: allowed });
  const pendingTrainings = useLearningTrainings(pending, { enabled: allowed });
  const pendingGroups = useLearningGroups(pending, { enabled: allowed });

  const activeGroups = countLoadedWhere(groups.items, (g) => g.isArchived === false, groups.allPagesLoaded);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <BackArrowWhiteIcon size={20} />
              </TouchableOpacity>
            )}
            <CommunityHeaderIcon size={22} />
            <Text style={styles.headerTitle}>Community & Knowledge</Text>
          </View>

          {/* Top Right (+) Button matching Screenshot 1: Create Content */}
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => onNavigateCreateContent('Article')}
            activeOpacity={0.8}
            accessibilityLabel="Create content"
          >
            <PlusIcon size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 8 Metrics Grid (using reusable OverviewDashboardCard) ─── */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
          {/* Row 1 */}
          <OverviewDashboardCard
            value={totalText(communities.total)}
            title="Communities"
            icon="users"
            titlePosition="bottom"
            onPress={() => (onNavigateAllCommunities ? onNavigateAllCommunities() : onNavigateCommunityDetails?.())}
          />
          <OverviewDashboardCard
            value={totalWithActiveText(groups.total, activeGroups)}
            title="Groups"
            icon="users"
            titlePosition="bottom"
            onPress={() => (onNavigateAllGroups ? onNavigateAllGroups() : onNavigateCreateGroup?.())}
          />

          {/* Row 2: the design's breakdown also counted "guides", a content
              type that was never built (no resource in the Learning Hub API).
              Owner decision 2026-11-23: drop it from the label rather than
              dash it forever. With articles and videos the only content types,
              both server totals are known, so the tile's own total is real. */}
          <OverviewDashboardCard
            value={sumTotalsText(articles.total, videos.total)}
            title={t('community.home.contentItems', {
              articles: totalText(articles.total),
              videos: totalText(videos.total),
            })}
            icon="clipboard"
            titlePosition="bottom"
            onPress={() => (onNavigateKnowledgeLibrary ? onNavigateKnowledgeLibrary() : onNavigateAddVideo?.())}
          />
          <OverviewDashboardCard
            value={dash()}
            title="Announcements"
            icon="orders"
            titlePosition="bottom"
            onPress={() => onNavigateCreateContent('Announcement')}
          />

          {/* Row 3 */}
          <OverviewDashboardCard
            value={totalText(discussions.total)}
            title="Discussions"
            icon="clipboard"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={dash()}
            title="Open reports"
            icon="alert"
            tone="warning"
            titlePosition="bottom"
          />

          {/* Row 4: the review queue (BR-59t), an axis separate from isPublished. */}
          <OverviewDashboardCard
            value={sumTotalsText(pendingArticles.total, pendingVideos.total, pendingTrainings.total, pendingGroups.total)}
            title="Pending review"
            icon="clipboard"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={dash()}
            title="Unverified crop content"
            icon="alert"
            tone="danger"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

        {/* Footnote text matching Screenshot 1 */}
        <Text style={styles.footnoteText}>
          Only supported metrics are shown: views, bookmarks and comments. Likes and shares are not tracked.
        </Text>

        {/* ─── Community growth (30 days) ─── */}
        {/* No membership-history endpoint exists, so the figure is the dash and
            the bar draws empty rather than at a made-up fraction. */}
        <Text style={styles.sectionHeading}>Community growth (30 days)</Text>
        <View style={styles.growthRow}>
          <Text style={styles.growthLabel}>New members</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
          </View>
          <Text style={styles.growthValue} testID="community.home.growth">{dash()}</Text>
        </View>

        {/* ─── Most viewed ─── */}
        {/* View, bookmark and comment counters do not exist in the spec, and
            nothing ranks content by them, so the card carries dashes. */}
        <Text style={styles.sectionHeading}>Most viewed</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{dash()}</Text>
          <Text style={styles.cardMeta}>{joinMeta([dash(), dash(), dash(), dash(), dash()])}</Text>
        </View>

        {/* ─── Recent activity ─── */}
        <Text style={styles.sectionHeading}>Recent activity</Text>
        {!allowed ? (
          <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
        ) : (
          <AdminEmptyState title={t('community.gap.activity.title')} />
        )}

        {/* ─── Quick actions (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Quick actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* Action 1: Knowledge Library */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateKnowledgeLibrary}
            activeOpacity={0.8}
          >
            <BookGuideIcon size={26} color={adminColors.brand} />
            <Text style={styles.actionCardText}>Knowledge Library</Text>
          </TouchableOpacity>

          {/* Action 2: View All Groups */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateAllGroups}
            activeOpacity={0.8}
          >
            <CommunityThreeUsersIcon size={26} color={adminColors.brand} />
            <Text style={styles.actionCardText}>View All Groups</Text>
          </TouchableOpacity>
        </View>

        {/* Action 3: Community (Full width matching Screenshot 1) */}
        <View style={styles.quickActionSingleRow}>
          <TouchableOpacity
            style={styles.actionCardSingle}
            onPress={onNavigateAllCommunities}
            activeOpacity={0.8}
          >
            <CommunityThreeUsersIcon size={26} color={adminColors.brand} />
            <Text style={styles.actionCardText}>Community</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived From Admin Theme ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginRight: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: 100,
  },

  // ─── Metrics Grid ───
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    minHeight: 74,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  metricValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15.5,
    fontWeight: '800',
  },
  metricLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 14.5,
  },

  // ─── Footnote ───
  footnoteText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 12,
    marginBottom: 6,
  },

  // ─── Headings ───
  sectionHeading: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },

  // ─── Growth Row ───
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...adminShadow.sm,
  },
  growthLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    fontWeight: '600',
    marginRight: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '58%',
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 4,
  },
  growthValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 12,
  },

  // ─── Standard White Cards ───
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 14,
    ...adminShadow.sm,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '800',
  },
  cardMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  cardActionLink: {
    ...adminType.caption,
    color: adminColors.brand,
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 8,
  },

  // ─── Quick Actions ───
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  quickActionSingleRow: {
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
  },
  actionCardSingle: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  actionCardText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
