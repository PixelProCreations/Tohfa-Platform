import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
} from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { useArchiveCommunity, useCommunity, useCommunityGroups, useCommunityMembers } from '../../api/communitiesHooks';
import { useAdminQaQuestions } from '../../api/qaHooks';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { canManageLearning, dash } from './communityLogic';
import { canModerateCommunities, communityDetailView, communityGroupRow, memberRow } from './communitiesLogic';
import { questionRow } from './qaLogic';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SmallArrowLeftIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SmallArrowRightIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Rich Tea Plantation / Green Hills Landscape Thumbnail matching screenshots */
function MountainLandscapeThumbnail({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Defs>
        <ClipPath id="thumbClip">
          <Rect width="56" height="56" rx="8" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#thumbClip)">
        {/* Sky */}
        <Rect width="56" height="56" fill={adminColors.info.bg} />
        {/* Distant Blue/Purple Hills */}
        <Path d="M-6 32 Q 12 18, 28 26 T 62 20 L 62 56 L -6 56 Z" fill={adminColors.purple.bg} opacity="0.6" />
        {/* Mid Hills */}
        <Path d="M-4 38 Q 16 26, 34 32 T 60 28 L 60 56 L -4 56 Z" fill={adminColors.success.border} opacity="0.5" />
        {/* Foreground Lush Green Mountain Rows */}
        <Path d="M-2 44 Q 14 34, 30 40 T 58 36 L 58 56 L -2 56 Z" fill={adminColors.success.text} opacity="0.85" />
        <Path d="M0 48 Q 20 42, 40 46 L 56 44 L 56 56 L 0 56 Z" fill={adminColors.success.text} />
        {/* Tea plantation contour streaks */}
        <Path d="M4 47 Q 20 41, 38 45" stroke={adminColors.card} strokeWidth="0.8" opacity="0.4" fill="none" />
        <Path d="M6 51 Q 24 45, 48 49" stroke={adminColors.card} strokeWidth="0.8" opacity="0.4" fill="none" />
      </G>
    </Svg>
  );
}


function ThreeDotsVerticalIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
  );
}

function EyeIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilEditIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusMiniIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Tabs List ───────────────────────────────────────────────────────────────

type CommunityTabType =
  | 'Overview'
  | 'Members'
  | 'Groups'
  | 'Knowledge'
  | 'Discussions'
  | 'Announcements'
  | 'Settings';

const TABS: CommunityTabType[] = [
  'Overview',
  'Members',
  'Groups',
  'Knowledge',
  'Discussions',
  'Announcements',
  'Settings',
];

// ─── Component Props ──────────────────────────────────────────────────────────

/**
 * The menu rows with no endpoint behind them: a community can be archived and
 * nothing else (no block, no deactivate, no activate). Drawn, never wired.
 */
const BLOCKED_MENU_ITEMS = [
  { id: 'blockChat', label: '🚫  Block Chat', color: adminColors.danger.text },
  { id: 'blockCommunity', label: '⊗  Block Community', color: adminColors.danger.text },
  { id: 'deactivate', label: '⏸  Deactivate Community', color: adminColors.warning.text },
] as const;

export interface CommunityDetailsScreenProps {
  onBack: () => void;
  role?: string | undefined;
  communityId?: string | undefined;
  onNavigateMemberDetail?: (memberId: string) => void;
  onNavigateGroupDetail?: (groupId: string) => void;
  onNavigateKnowledgeDetail?: (knowledgeId: string) => void;
  onNavigateDiscussionDetail?: (discussionId: string) => void;
  onNavigateAnnouncementDetail?: (announcementId: string) => void;
  onNavigateEditCommunity?: (communityId?: string) => void;
  onNavigateCreatePost?: (communityId?: string) => void;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/** One list inside the screen: the five states a section can be in, drawn distinctly. */
function SectionList<T>({
  allowed,
  list,
  emptyTitle,
  renderItem,
}: {
  allowed: boolean;
  list: {
    items: T[];
    isLoading: boolean;
    error: unknown;
    refresh: () => void;
    hasMore: boolean;
    loadMore: () => void;
  };
  emptyTitle: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (!allowed) return <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />;
  if (list.items.length === 0 && list.isLoading) return <AdminLoadingState />;
  if (list.items.length === 0 && list.error !== null && list.error !== undefined) {
    return <AdminErrorState error={list.error} onRetry={list.refresh} />;
  }
  if (list.items.length === 0) return <AdminEmptyState title={emptyTitle} />;
  return (
    <View style={{ gap: adminSpacing.sm }}>
      {list.items.map(renderItem)}
      {list.hasMore ? (
        <TouchableOpacity style={styles.modalCancelBtn} onPress={list.loadMore} activeOpacity={0.8}>
          <Text style={styles.modalCancelBtnText}>{t('community.loadMore')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/**
 * One community (GET /admin/communities/{id}, BR-59s, community.group.moderate)
 * with its groups, its derived members and the discussions asked in it.
 *
 * What the API supplies is filled in: the name, the archived/active status, the
 * server's own member and group counts and the created date. What it does not
 * — discoverability, membership method, per-community knowledge posts and
 * announcements, "open" discussions — stays drawn and carries the dash.
 * Knowledge and Announcements have no link to a community to list by, so those
 * two sections still say they are not built.
 *
 * Archive is the one lifecycle change a community has. It asks first, sends
 * POST .../archive only when confirmed, and reports success only once the
 * request settled; there is no unarchive, so an archived community's button is
 * unavailable. Block chat, block community and deactivate have no endpoint and
 * stay drawn, disabled.
 */
export function CommunityDetailsScreen({
  onBack,
  role,
  communityId: _communityId,
  onNavigateMemberDetail,
  onNavigateGroupDetail,
  onNavigateKnowledgeDetail: _onNavigateKnowledgeDetail,
  onNavigateDiscussionDetail,
  onNavigateAnnouncementDetail: _onNavigateAnnouncementDetail,
  onNavigateEditCommunity,
  onNavigateCreatePost,
  can,
}: CommunityDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<CommunityTabType>('Overview');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const allowed = canModerateCommunities(can);
  const community = useCommunity(_communityId, { enabled: allowed });
  const members = useCommunityMembers(_communityId, { enabled: allowed });
  const groups = useCommunityGroups(_communityId, { enabled: allowed });
  // Discussions are read through the learning permission, a different grant.
  const discussionsAllowed = canManageLearning(can);
  const discussions = useAdminQaQuestions(
    _communityId === undefined ? {} : { communityId: _communityId },
    { enabled: discussionsAllowed && _communityId !== undefined },
  );
  const archive = useArchiveCommunity();
  const dto = community.data;
  const view = communityDetailView(dto);
  const archiveDisabled = !allowed || dto === undefined || dto.isArchived || archive.isPending;

  const handleArchive = () => {
    if (archiveDisabled || dto === undefined) return;
    // A genuine confirmation: archiving cannot be undone from here.
    Alert.alert(t('community.archive.confirm.title'), t('community.archive.confirm.message'), [
      { text: t('community.action.cancel'), style: 'cancel' },
      {
        text: t('community.archive.confirm.action'),
        style: 'destructive',
        onPress: () => {
          // Only a settled request reports anything; a failure renders archive.error.
          archive.mutate(dto.id, {
            onSuccess: () => {
              Alert.alert(t('community.publish.success.title'), t('community.community.archived'));
            },
          });
        },
      },
    ]);
  };

  const tabScrollRef = useRef<ScrollViewInstance>(null);
  const mainScrollRef = useRef<ScrollViewInstance>(null);

  // Section references for direct scroll
  const membersY = useRef(0);
  const groupsY = useRef(0);
  const knowledgeY = useRef(0);
  const discussionsY = useRef(0);
  const announcementsY = useRef(0);
  const settingsY = useRef(0);

  const handleSelectTab = (tab: CommunityTabType) => {
    setActiveTab(tab);
    if (tab === 'Overview') {
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (tab === 'Members') {
      mainScrollRef.current?.scrollTo({ y: membersY.current - 12, animated: true });
    } else if (tab === 'Groups') {
      mainScrollRef.current?.scrollTo({ y: groupsY.current - 12, animated: true });
    } else if (tab === 'Knowledge') {
      mainScrollRef.current?.scrollTo({ y: knowledgeY.current - 12, animated: true });
    } else if (tab === 'Discussions') {
      mainScrollRef.current?.scrollTo({ y: discussionsY.current - 12, animated: true });
    } else if (tab === 'Announcements') {
      mainScrollRef.current?.scrollTo({ y: announcementsY.current - 12, animated: true });
    } else if (tab === 'Settings') {
      mainScrollRef.current?.scrollTo({ y: settingsY.current - 12, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshots 1-4) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon size={20} />
            </TouchableOpacity>
            {/* Exact screen title matching screenshots */}
            <Text style={styles.headerTitle}>Communitie details</Text>
          </View>

          <TouchableOpacity
            style={styles.headerMenuBtn}
            onPress={() => setShowHeaderMenu(true)}
            activeOpacity={0.8}
            accessibilityLabel="Community actions"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ThreeDotsVerticalIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Community Banner Card (Screenshot 1 & 2) ─── */}
        <View style={styles.bannerCard}>
          <MountainLandscapeThumbnail size={56} />
          <View style={styles.bannerContent}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerTitle} numberOfLines={1} testID="community.details.name">
                {view.name}
              </Text>
              {/* The server's archived flag; a community that has not loaded is the dash, not "Active". */}
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText} testID="community.details.status">
                  {view.statusText}
                </Text>
              </View>
            </View>
            {/* discoverability · membership · members: only the member count is a field. */}
            <Text style={styles.bannerSubtitle} numberOfLines={1}>
              {view.bannerSubtitle}
            </Text>
          </View>
        </View>

        {/* ─── Horizontal Tabs Bar (Screenshots 1 & 2) ─── */}
        <View style={styles.tabBarContainer}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabPill, isActive ? styles.tabPillActive : styles.tabPillInactive]}
                  onPress={() => handleSelectTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabPillText, isActive ? styles.tabPillTextActive : styles.tabPillTextInactive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Progress / Scroll Indicator with arrows matching Screenshots 1 & 2 */}
          <View style={styles.tabScrollIndicatorRow}>
            <TouchableOpacity
              onPress={() => tabScrollRef.current?.scrollTo({ x: 0, animated: true })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SmallArrowLeftIcon size={12} color={adminColors.muted} />
            </TouchableOpacity>
            <View style={styles.tabScrollTrack}>
              <View
                style={[
                  styles.tabScrollThumb,
                  {
                    left:
                      activeTab === 'Overview'
                        ? '0%'
                        : activeTab === 'Members'
                        ? '16%'
                        : activeTab === 'Groups'
                        ? '32%'
                        : activeTab === 'Knowledge'
                        ? '48%'
                        : activeTab === 'Discussions'
                        ? '64%'
                        : activeTab === 'Announcements'
                        ? '78%'
                        : '85%',
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              onPress={() => tabScrollRef.current?.scrollToEnd({ animated: true })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SmallArrowRightIcon size={12} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Overview Summary Card (Screenshots 1 & 2) ─── */}
        {/* Members and groups are the server's counts and Created is the date.
            Knowledge posts, open discussions and announcements have no
            per-community figure, so those rows stay drawn with the dash. */}
        <View style={styles.summaryCard}>
          {view.summary.map((row, index) => (
            <React.Fragment key={row.label}>
              {index > 0 ? <View style={styles.dottedDivider} /> : null}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summaryValue}>{row.value}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ─── Members Section (Screenshots 1 & 2) ─── */}
        <View
          onLayout={(e) => {
            membersY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Members</Text>
          <SectionList
            allowed={allowed}
            list={members}
            emptyTitle={t('community.empty.members')}
            renderItem={(dtoItem) => {
              const row = memberRow(dtoItem);
              return (
                <TouchableOpacity
                  key={row.id}
                  style={styles.itemCard}
                  onPress={() => onNavigateMemberDetail?.(row.id)}
                  activeOpacity={0.7}
                  testID={`community.details.member.${row.id}`}
                >
                  <View style={styles.itemCardLeft}>
                    <Text style={styles.itemCardTitle} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                      {row.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ─── Groups Section (Screenshots 1, 2, 3) ─── */}
        {/* GET /admin/communities/{id}/groups: only this community's groups. */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            groupsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Groups</Text>
          <SectionList
            allowed={allowed}
            list={groups}
            emptyTitle={t('community.empty.communityGroups')}
            renderItem={(groupDto) => {
              const row = communityGroupRow(groupDto);
              return (
                <TouchableOpacity
                  key={row.id}
                  style={styles.itemCard}
                  onPress={() => onNavigateGroupDetail?.(row.id)}
                  activeOpacity={0.7}
                  testID={`community.details.group.${row.id}`}
                >
                  <View style={styles.itemCardLeft}>
                    <Text style={styles.itemCardTitle} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                      {row.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ─── Knowledge Section (Screenshot 3) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            knowledgeY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Knowledge</Text>
          <AdminEmptyState title={t('community.gap.knowledge.title')} />
        </View>

        {/* ─── Discussions Section (Screenshots 3 & 4) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            discussionsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Discussions</Text>
          <SectionList
            allowed={discussionsAllowed}
            list={discussions}
            emptyTitle={t('community.empty.discussions')}
            renderItem={(questionDto) => {
              const row = questionRow(questionDto);
              return (
                <TouchableOpacity
                  key={row.id}
                  style={styles.itemCard}
                  onPress={() => onNavigateDiscussionDetail?.(row.id)}
                  activeOpacity={0.7}
                  testID={`community.details.discussion.${row.id}`}
                >
                  <View style={styles.itemCardLeft}>
                    <Text style={styles.itemCardTitle} numberOfLines={1}>
                      {row.title}
                    </Text>
                    <Text style={styles.itemCardSubtitle} numberOfLines={1}>
                      {row.meta}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ─── Announcements Section (Screenshots 3 & 4) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            announcementsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Announcements</Text>
          <AdminEmptyState title={t('community.gap.announcements.title')} />
        </View>

        {/* ─── Settings Section (Screenshots 3 & 4) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            settingsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Settings</Text>

          {/* Discoverability and membership are not stored on a community; the
              status is its archived flag. */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discoverability</Text>
              <Text style={styles.summaryValueBold}>{dash()}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Membership</Text>
              <Text style={styles.summaryValueBold}>{dash()}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValueBold}>{view.statusText}</Text>
            </View>
          </View>
        </View>

        {/* ─── Archive Community Button (Screenshot 4) ─── */}
        <TouchableOpacity
          style={[styles.archiveBtn, archiveDisabled && styles.actionUnavailable]}
          onPress={archiveDisabled ? undefined : handleArchive}
          disabled={archiveDisabled}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityState={{ disabled: archiveDisabled, busy: archive.isPending }}
          testID="community.details.archive"
        >
          <Text style={styles.archiveBtnText}>{archive.isPending ? t('community.action.saving') : 'Archive community'}</Text>
        </TouchableOpacity>
        {archive.error !== null && archive.error !== undefined ? (
          <Text style={styles.footnoteText} testID="community.details.archiveError">
            {t(adminErrorKey(archive.error))}
          </Text>
        ) : null}
      </ScrollView>

      {/* ─── Header Dropdown Popup Menu (Image 2) ─── */}
      <Modal
        visible={showHeaderMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHeaderMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowHeaderMenu(false)}
        >
          <View style={styles.menuPopupCard}>
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setShowHeaderMenu(false);
                handleSelectTab('Overview');
              }}
              activeOpacity={0.7}
            >
              <EyeIcon size={16} color={adminColors.ink} />
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setShowHeaderMenu(false);
                if (onNavigateEditCommunity) onNavigateEditCommunity(_communityId);
              }}
              activeOpacity={0.7}
            >
              <PencilEditIcon size={16} color={adminColors.ink} />
              <Text style={styles.menuItemText}>Edit Community</Text>
            </TouchableOpacity>

            {role === 'SUPER_ADMIN' ? (
              <>
                {/* Block chat, block community and deactivate have no endpoint, so
                    each stays in the menu, disabled, with one note. Archive is the
                    one real lifecycle change. */}
                {BLOCKED_MENU_ITEMS.map((item) => (
                  <React.Fragment key={item.id}>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={[styles.menuItemRow, styles.actionUnavailable]}
                      disabled
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: true }}
                      testID={`community.details.menu.${item.id}`}
                    >
                      <Text style={[styles.menuItemText, { color: item.color }]}>{item.label}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={[styles.menuItemRow, archiveDisabled && styles.actionUnavailable]}
                  onPress={
                    archiveDisabled
                      ? undefined
                      : () => {
                          setShowHeaderMenu(false);
                          handleArchive();
                        }
                  }
                  disabled={archiveDisabled}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: archiveDisabled }}
                  testID="community.details.menu.archive"
                >
                  <Text style={[styles.menuItemText, { color: adminColors.brand }]}>{'🗑  Archive community'}</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <Text style={styles.menuNote}>{t('community.gap.community.actions')}</Text>
              </>
            ) : (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setShowHeaderMenu(false);
                    if (onNavigateCreatePost) onNavigateCreatePost(_communityId);
                  }}
                  activeOpacity={0.7}
                >
                  <PlusMiniIcon size={16} color={adminColors.ink} />
                  <Text style={styles.menuItemText}>Create post</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Stylesheet (Theme tokens compliant, zero raw hex/rgba) ───────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Terracotta Header ───
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
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 40,
  },

  // ─── Community Banner Card ───
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  bannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerTitle: {
    ...adminType.rowTitle,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  bannerSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 3,
  },

  // ─── Badges ───
  statusBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  adminBadge: {
    backgroundColor: adminColors.brandSoft.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  adminBadgeText: {
    color: adminColors.brandSoft.text,
    fontSize: 11,
    fontWeight: '700',
  },
  memberBadge: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  memberBadgeText: {
    color: adminColors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  articleBadge: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  articleBadgeText: {
    color: adminColors.info.text,
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Tab Bar & Scroll Indicators ───
  tabBarContainer: {
    marginTop: adminSpacing.md,
    marginBottom: 4,
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: adminRadius.md,
  },
  tabPillActive: {
    backgroundColor: adminColors.brand,
  },
  tabPillInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabPillText: {
    fontSize: 13,
  },
  tabPillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  tabPillTextInactive: {
    color: adminColors.ink,
    fontWeight: '600',
  },
  tabScrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  tabScrollTrack: {
    width: 140,
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  tabScrollThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 34,
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.full,
  },

  // ─── Summary Card ───
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 6,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  summaryValueBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  summaryValueActive: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 1,
  },

  // ─── Footnote ───
  footnoteText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 16,
    marginVertical: 10,
    paddingHorizontal: 2,
  },

  // ─── Section Headings ───
  sectionHeading: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 8,
    marginTop: 4,
  },

  // ─── Item Cards (Members, Groups, Knowledge, Discussions, Announcements) ───
  itemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  itemCardLeft: {
    flex: 1,
    marginRight: 10,
  },
  itemCardTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  itemCardSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
  },

  // ─── Archive Button (Screenshot 4) ───
  archiveBtn: {
    height: 46,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  archiveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.danger.text,
  },

  // ─── Modal Dialog ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalDialogCard: {
    width: '94%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalDialogTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  modalDialogSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 17,
  },
  modalFieldLabel: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 76,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: 'top',
    fontSize: 13,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
    marginBottom: 16,
  },
  modalDialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalConfirmArchiveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.text,
  },
  modalConfirmArchiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuPopupCard: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    width: 220,
    ...adminShadow.md,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  /** The designed control, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  subCaption: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 4,
  },
  menuNote: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminColors.border,
    marginHorizontal: 12,
  },
  modalCenteredOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 22,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalCloseTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  pauseIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  banIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionModalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  actionModalDesc: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  actionModalBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  modalOrangeBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOrangeBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalRedBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRedBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});