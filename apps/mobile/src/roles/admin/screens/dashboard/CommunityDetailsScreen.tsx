import React, { useRef, useState } from 'react';
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
import Svg, {
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

export interface CommunityDetailsScreenProps {
  onBack: () => void;
  communityId?: string;
  onNavigateMemberDetail?: (memberId: string) => void;
  onNavigateGroupDetail?: (groupId: string) => void;
  onNavigateKnowledgeDetail?: (knowledgeId: string) => void;
  onNavigateDiscussionDetail?: (discussionId: string) => void;
  onNavigateAnnouncementDetail?: (announcementId: string) => void;
}

export function CommunityDetailsScreen({
  onBack,
  communityId: _communityId = 'comm-1',
  onNavigateMemberDetail,
  onNavigateGroupDetail,
  onNavigateKnowledgeDetail,
  onNavigateDiscussionDetail,
  onNavigateAnnouncementDetail,
}: CommunityDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<CommunityTabType>('Overview');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchived, setIsArchived] = useState(false);

  const tabScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);

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

  const handleArchiveConfirm = () => {
    if (!archiveReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for archiving this community.');
      return;
    }
    setIsArchived(true);
    setShowArchiveModal(false);
    Alert.alert('Community Archived', 'The community has been archived. New member registrations are stopped.');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshots 1-4) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
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
              <Text style={styles.bannerTitle} numberOfLines={1}>
                Nilgiris Organic Growers (demo)
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  isArchived && { backgroundColor: adminColors.danger.bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isArchived && { color: adminColors.danger.text },
                  ]}
                >
                  {isArchived ? 'Archived' : 'Active'}
                </Text>
              </View>
            </View>
            <Text style={styles.bannerSubtitle} numberOfLines={1}>
              Discoverable · Open membership · 142 members
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
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Members</Text>
            <Text style={styles.summaryValue}>142</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Groups</Text>
            <Text style={styles.summaryValue}>3</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Knowledge posts</Text>
            <Text style={styles.summaryValue}>12</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Open discussions</Text>
            <Text style={styles.summaryValue}>5</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Announcements</Text>
            <Text style={styles.summaryValue}>2</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Created</Text>
            <Text style={styles.summaryValueBold}>1 Feb 2026 · Demo TOHFA Admin</Text>
          </View>
        </View>

        {/* Footnote text matching Screenshots 1 & 2 */}
        <Text style={styles.footnoteText}>
          Request to join is not built. An invitation-only community cannot be set Open. Archiving needs a reason and stops new members.
        </Text>

        {/* ─── Members Section (Screenshots 1 & 2) ─── */}
        <View
          onLayout={(e) => {
            membersY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Members</Text>

          {/* Member 1: Ramesh Kumar */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => onNavigateMemberDetail && onNavigateMemberDetail('FMR-00124')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Ramesh Kumar (FMR-00124)</Text>
              <Text style={styles.itemCardSubtitle}>Joined 1 Feb 2026 · Active</Text>
            </View>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          </TouchableOpacity>

          {/* Member 2: Selvi */}
          <TouchableOpacity
            style={[styles.itemCard, { marginTop: 10 }]}
            onPress={() => onNavigateMemberDetail && onNavigateMemberDetail('FMR-00131')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Selvi (FMR-00131)</Text>
              <Text style={styles.itemCardSubtitle}>Joined 10 Mar 2026 · Active</Text>
            </View>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Member</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Groups Section (Screenshots 1, 2, 3) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            groupsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Groups</Text>

          {/* Group 1: Tomato Growers Circle */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => onNavigateGroupDetail && onNavigateGroupDetail('grp-1')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Tomato Growers Circle</Text>
              <Text style={styles.itemCardSubtitle}>24 farmers</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          </TouchableOpacity>

          {/* Group 2: Organic Certification Prep */}
          <TouchableOpacity
            style={[styles.itemCard, { marginTop: 10 }]}
            onPress={() => onNavigateGroupDetail && onNavigateGroupDetail('grp-2')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Organic Certification Prep</Text>
              <Text style={styles.itemCardSubtitle}>18 farmers</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Knowledge Section (Screenshot 3) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            knowledgeY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Knowledge</Text>

          {/* Knowledge 1: Tomato leaf curl management */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => onNavigateKnowledgeDetail && onNavigateKnowledgeDetail('art-1')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Tomato leaf curl management</Text>
              <Text style={styles.itemCardSubtitle}>Published · Expert verified</Text>
            </View>
            <View style={styles.articleBadge}>
              <Text style={styles.articleBadgeText}>Article</Text>
            </View>
          </TouchableOpacity>

          {/* Knowledge 2: Mulching for water retention */}
          <TouchableOpacity
            style={[styles.itemCard, { marginTop: 10 }]}
            onPress={() => onNavigateKnowledgeDetail && onNavigateKnowledgeDetail('art-2')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Mulching for water retention</Text>
              <Text style={styles.itemCardSubtitle}>Pending Review</Text>
            </View>
            <View style={styles.articleBadge}>
              <Text style={styles.articleBadgeText}>Article</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Discussions Section (Screenshots 3 & 4) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            discussionsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Discussions</Text>

          {/* Discussion 1 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => onNavigateDiscussionDetail && onNavigateDiscussionDetail('disc-1')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>How often should mulch be replaced?</Text>
              <Text style={styles.itemCardSubtitle}>Started by Selvi · 3 replies · Open</Text>
            </View>
          </TouchableOpacity>

          {/* Discussion 2 */}
          <TouchableOpacity
            style={[styles.itemCard, { marginTop: 10 }]}
            onPress={() => onNavigateDiscussionDetail && onNavigateDiscussionDetail('disc-2')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>NPOP renewal timelines</Text>
              <Text style={styles.itemCardSubtitle}>Started by Ramesh Kumar · 1 reply · Open</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Announcements Section (Screenshots 3 & 4) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            announcementsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Announcements</Text>

          {/* Announcement 1 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => onNavigateAnnouncementDetail && onNavigateAnnouncementDetail('ann-1')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>New fair-price ceiling for Q4</Text>
              <Text style={styles.itemCardSubtitle}>Posted 5 Oct 2026 · Demo TOHFA Admin</Text>
            </View>
          </TouchableOpacity>

          {/* Announcement 2 */}
          <TouchableOpacity
            style={[styles.itemCard, { marginTop: 10 }]}
            onPress={() => onNavigateAnnouncementDetail && onNavigateAnnouncementDetail('ann-2')}
            activeOpacity={0.7}
          >
            <View style={styles.itemCardLeft}>
              <Text style={styles.itemCardTitle}>Audit season starts 15 Oct</Text>
              <Text style={styles.itemCardSubtitle}>Posted 28 Sep 2026 · Demo TOHFA Admin</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Settings Section (Screenshots 3 & 4) ─── */}
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            settingsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>Settings</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discoverability</Text>
              <Text style={styles.summaryValueBold}>Discoverable</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Membership</Text>
              <Text style={styles.summaryValueBold}>Open</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text
                style={[
                  styles.summaryValueActive,
                  isArchived && { color: adminColors.danger.text },
                ]}
              >
                {isArchived ? 'Archived' : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Archive Community Button (Screenshot 4) ─── */}
        <TouchableOpacity
          style={styles.archiveBtn}
          onPress={() => setShowArchiveModal(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.archiveBtnText}>
            {isArchived ? 'Community is Archived' : 'Archive community'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Archive Confirmation Modal ─── */}
      <Modal
        visible={showArchiveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowArchiveModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowArchiveModal(false)}
        >
          <TouchableOpacity
            style={styles.modalDialogCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalDialogTitle}>Archive Community</Text>
            <Text style={styles.modalDialogSubtitle}>
              Archiving needs a reason and will stop new member registrations.
            </Text>

            <Text style={styles.modalFieldLabel}>Reason for archiving *</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g., Inactivity, merged into Nilgiris West, or seasonal closure"
              placeholderTextColor={adminColors.placeholder}
              value={archiveReason}
              onChangeText={setArchiveReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalDialogButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowArchiveModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmArchiveBtn}
                onPress={handleArchiveConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmArchiveBtnText}>Confirm Archive</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
    gap: 12,
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
});
