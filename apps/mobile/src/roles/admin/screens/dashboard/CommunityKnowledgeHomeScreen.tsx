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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

export function CommunityKnowledgeHomeScreen({
  onBack,
  onNavigateCreateContent,
  onNavigateAddVideo,
  onNavigateKnowledgeLibrary,
  onNavigateCommunityDetails,
  onNavigateAllCommunities,
  onNavigateCreateGroup,
  onNavigateAllGroups,
  onNavigateCreateCommunity: _onNavigateCreateCommunity,
  onViewActivityDetails,
}: CommunityKnowledgeHomeScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
        {/* ─── 8 Metrics Grid (2 columns, 4 rows) ─── */}
        <View style={styles.metricsGrid}>
          {/* Row 1 */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => (onNavigateAllCommunities ? onNavigateAllCommunities() : onNavigateCommunityDetails?.('nilgiris'))}
            activeOpacity={0.7}
          >
            <Text style={styles.metricValue}>5 (4 active)</Text>
            <Text style={styles.metricLabel}>Communities</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => (onNavigateAllGroups ? onNavigateAllGroups() : onNavigateCreateGroup?.())}
            activeOpacity={0.7}
          >
            <Text style={styles.metricValue}>8 (7 active)</Text>
            <Text style={styles.metricLabel}>Groups</Text>
          </TouchableOpacity>

          {/* Row 2 */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => (onNavigateKnowledgeLibrary ? onNavigateKnowledgeLibrary() : onNavigateAddVideo?.())}
            activeOpacity={0.7}
          >
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>Content items (5 articles, 3 guides, 4 videos)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => onNavigateCreateContent('Announcement')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricValue}>5</Text>
            <Text style={styles.metricLabel}>Announcements</Text>
          </TouchableOpacity>

          {/* Row 3 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>8</Text>
            <Text style={styles.metricLabel}>Discussions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>6</Text>
            <Text style={styles.metricLabel}>Open reports</Text>
          </View>

          {/* Row 4 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>Not enabled</Text>
            <Text style={styles.metricLabel}>Pending review</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>2</Text>
            <Text style={styles.metricLabel}>Unverified crop content</Text>
          </View>
        </View>

        {/* Footnote text matching Screenshot 1 */}
        <Text style={styles.footnoteText}>
          Only supported metrics are shown: views, bookmarks and comments. Likes and shares are not tracked.
        </Text>

        {/* ─── Community growth (30 days) ─── */}
        <Text style={styles.sectionHeading}>Community growth (30 days)</Text>
        <View style={styles.growthRow}>
          <Text style={styles.growthLabel}>New members</Text>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.growthValue}>14</Text>
        </View>

        {/* ─── Most viewed ─── */}
        <Text style={styles.sectionHeading}>Most viewed</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tomato leaf curl management</Text>
          <Text style={styles.cardMeta}>
            Guide · Verified · 214 views · 12 bookmarks · 5 comments
          </Text>
        </View>

        {/* ─── Recent activity ─── */}
        <Text style={styles.sectionHeading}>Recent activity</Text>

        {/* Activity 1 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Article submitted for review</Text>
          <Text style={styles.cardMeta}>
            "Mulching for water retention" · Demo TOHFA Admin · 13 Oct 2026
          </Text>
          <TouchableOpacity
            onPress={() => onViewActivityDetails && onViewActivityDetails('act-1')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardActionLink}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Activity 2 */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.cardTitle}>Coonoor Organic Farmers</Text>
          <Text style={styles.cardMeta}>
            "Mulching for water retention" · Demo TOHFA Admin · 13 Oct 2026
          </Text>
          <TouchableOpacity
            onPress={() => onViewActivityDetails && onViewActivityDetails('act-2')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardActionLink}>View post</Text>
          </TouchableOpacity>
        </View>

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
    backgroundColor: adminColors.headerIcon.bg,
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
