import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function GavelHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 13l5 5M6 6l4-4 5 5-4 4-5-5zM2 22l6-6M13 21h8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellHeaderIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.2" fill={adminColors.card} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="12" r="2.2" fill={adminColors.card} stroke={color} strokeWidth="2" />
      <Circle cx="10" cy="18" r="2.2" fill={adminColors.card} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function TrendingLineIcon({ size = 20, color = '#B85D19' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 16l6-6 4 4 8-8"
        stroke={color}
        strokeWidth="2.4"
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

import {
  type DisputeCategory,
  type DisputeItem,
  type DisputeStatus,
  INITIAL_DISPUTES,
} from './fixtures';

export type { DisputeCategory, DisputeItem, DisputeStatus };
export { INITIAL_DISPUTES };

// Helper for status badge styling
function getStatusBadgeStyle(status: DisputeStatus) {
  switch (status) {
    case 'Under Review':
      return { bg: '#E0EBF7', text: '#1D5A8A' };
    case 'Awaiting TOHFA':
      return { bg: '#FEF3C7', text: '#B45309' };
    case 'Open':
      return { bg: '#FEF3C7', text: '#B45309' };
    case 'Escalated':
      return { bg: '#FEE2E2', text: '#DC2626' };
    case 'Resolved':
      return { bg: '#D1FAE5', text: '#059669' };
    default:
      return { bg: '#F3EFEA', text: '#6C6258' };
  }
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerDisputesMediationScreenProps {
  onBack?: (() => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onViewDetails?: ((dispute: DisputeItem) => void) | undefined;
  onViewTimeline?: ((dispute: DisputeItem) => void) | undefined;
}

export function FarmerDisputesMediationScreen({
  onBack,
  onOpenNotifications,
  onViewDetails,
  onViewTimeline,
}: FarmerDisputesMediationScreenProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'All' | DisputeStatus>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DisputeCategory>('All');
  const [activeDispute, setActiveDispute] = useState<DisputeItem | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  const filteredDisputes = useMemo(() => {
    return disputes.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery =
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.raisedBy.toLowerCase().includes(q) ||
          item.otherParty.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (selectedStatus !== 'All' && item.status !== selectedStatus) {
        return false;
      }

      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [disputes, searchQuery, selectedStatus, selectedCategory]);

  const handleUpdateStatus = (disputeId: string, newStatus: DisputeStatus, resolutionNote?: string) => {
    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id !== disputeId) return d;
        const updated: DisputeItem = {
          ...d,
          status: newStatus,
          lastActivityDate: '15 Oct 2026',
        };
        if (resolutionNote !== undefined) {
          updated.resolutionNote = resolutionNote;
        }
        return updated;
      })
    );
    if (activeDispute?.id === disputeId) {
      setActiveDispute((prev) => {
        if (!prev) return null;
        const updated: DisputeItem = {
          ...prev,
          status: newStatus,
          lastActivityDate: '15 Oct 2026',
        };
        if (resolutionNote !== undefined) {
          updated.resolutionNote = resolutionNote;
        }
        return updated;
      });
    }
    showToast(`Dispute ${disputeId} status updated to ${newStatus}.`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            )}
            <GavelHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Disputes & Mediation</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellHeaderIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? adminSpacing.xl : 0 }]}>
          Review farmer disputes and coordinate resolutions
        </Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Dispute ID, farmer name, or keyword"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Button */}
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.75}
          accessibilityLabel="Filter disputes"
        >
          <FilterSlidersIcon size={18} color={adminColors.ink} />
          <Text style={styles.filterBtnText}>Filters</Text>
          {(selectedStatus !== 'All' || selectedCategory !== 'All') && (
            <View style={styles.filterActiveBadge}>
              <Text style={styles.filterActiveBadgeText}>Active</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Active Filter Chips Row (if any filter active) */}
        {(selectedStatus !== 'All' || selectedCategory !== 'All') && (
          <View style={styles.activeFiltersRow}>
            {selectedStatus !== 'All' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => setSelectedStatus('All')}
              >
                <Text style={styles.activeFilterChipText}>Status: {selectedStatus} ✕</Text>
              </TouchableOpacity>
            )}
            {selectedCategory !== 'All' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => setSelectedCategory('All')}
              >
                <Text style={styles.activeFilterChipText}>Category: {selectedCategory} ✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setSelectedStatus('All');
                setSelectedCategory('All');
              }}
              style={styles.clearAllBtn}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dispute Count */}
        <Text style={styles.disputeCount}>
          {filteredDisputes.length} {filteredDisputes.length === 1 ? 'dispute' : 'disputes'}
        </Text>

        {/* Dispute Cards */}
        {filteredDisputes.map((item) => {
          const statusStyle = getStatusBadgeStyle(item.status);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.disputeCard}
              activeOpacity={0.85}
              onPress={() => {
                if (onViewDetails) {
                  onViewDetails(item);
                } else {
                  setActiveDispute(item);
                }
              }}
            >
              {/* Card Top Row: ID & Trending Icon */}
              <View style={styles.cardTopRow}>
                <Text style={styles.cardId}>{item.id}</Text>
                <TrendingLineIcon size={20} color="#B85D19" />
              </View>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={[styles.badgePill, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                    {item.status}
                  </Text>
                </View>
                <View style={[styles.badgePill, styles.categoryPill]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.disputeTitle}>{item.title}</Text>

              {/* Metadata */}
              <Text style={styles.metaText}>Raised by: {item.raisedBy}</Text>
              <Text style={styles.metaText}>Other party: {item.otherParty}</Text>
              <Text style={styles.dateMetaText}>
                Created {item.createdDate} · Last activity {item.lastActivityDate}
              </Text>

              {/* Action Links */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => {
                    if (onViewDetails) {
                      onViewDetails(item);
                    } else {
                      setActiveDispute(item);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsBtnText}>View Details</Text>
                </TouchableOpacity>

                {onViewTimeline && (
                  <TouchableOpacity
                    style={styles.timelineLinkBtn}
                    onPress={() => onViewTimeline(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timelineLinkBtnText}>Timeline →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredDisputes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No disputes match your filter</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search terms or clearing the status/category filters.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedStatus('All');
                setSelectedCategory('All');
              }}
            >
              <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.screenIdCaption}>M10-S01 · Dispute List</Text>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Filter Selection Modal ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.filterModalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Filter Disputes</Text>
                  <TouchableOpacity
                    onPress={() => setShowFilterModal(false)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Status Options */}
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.chipWrap}>
                  {(
                    ['All', 'Under Review', 'Awaiting TOHFA', 'Open', 'Escalated', 'Resolved'] as const
                  ).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.filterChip,
                        selectedStatus === st && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedStatus(st)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedStatus === st && styles.filterChipTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Category Options */}
                <Text style={[styles.filterSectionTitle, { marginTop: adminSpacing.md }]}>
                  Category
                </Text>
                <View style={styles.chipWrap}>
                  {(
                    [
                      'All',
                      'Payment & Payout',
                      'Purchase & Collection',
                      'Produce Quality & Rejection',
                      'Audit & Documentation',
                    ] as const
                  ).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        selectedCategory === cat && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategory === cat && styles.filterChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Modal Footer Buttons */}
                <View style={styles.modalFooterRow}>
                  <TouchableOpacity
                    style={styles.modalResetBtn}
                    onPress={() => {
                      setSelectedStatus('All');
                      setSelectedCategory('All');
                    }}
                  >
                    <Text style={styles.modalResetText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalApplyBtn}
                    onPress={() => setShowFilterModal(false)}
                  >
                    <Text style={styles.modalApplyText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Detail Case Modal ─── */}
      <Modal
        visible={activeDispute !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDispute(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActiveDispute(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.detailModalCard}>
                {activeDispute && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHeaderRow}>
                      <View>
                        <Text style={styles.detailDisputeId}>{activeDispute.id}</Text>
                        <Text style={styles.detailTitle}>{activeDispute.title}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setActiveDispute(null)}
                        style={styles.closeBtn}
                      >
                        <Text style={styles.closeBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Badges */}
                    <View style={[styles.badgesRow, { marginTop: adminSpacing.sm }]}>
                      <View
                        style={[
                          styles.badgePill,
                          { backgroundColor: getStatusBadgeStyle(activeDispute.status).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: getStatusBadgeStyle(activeDispute.status).text },
                          ]}
                        >
                          {activeDispute.status}
                        </Text>
                      </View>
                      <View style={[styles.badgePill, styles.categoryPill]}>
                        <Text style={styles.categoryText}>{activeDispute.category}</Text>
                      </View>
                    </View>

                    {/* Parties Section */}
                    <View style={styles.detailInfoBox}>
                      <Text style={styles.detailInfoRow}>
                        <Text style={styles.detailInfoLabel}>Raised By: </Text>
                        <Text style={styles.detailInfoValue}>{activeDispute.raisedBy}</Text>
                      </Text>
                      <Text style={styles.detailInfoRow}>
                        <Text style={styles.detailInfoLabel}>Other Party: </Text>
                        <Text style={styles.detailInfoValue}>{activeDispute.otherParty}</Text>
                      </Text>
                      <Text style={styles.detailInfoRow}>
                        <Text style={styles.detailInfoLabel}>Filing Date: </Text>
                        <Text style={styles.detailInfoValue}>{activeDispute.createdDate}</Text>
                      </Text>
                      <Text style={styles.detailInfoRow}>
                        <Text style={styles.detailInfoLabel}>Last Activity: </Text>
                        <Text style={styles.detailInfoValue}>{activeDispute.lastActivityDate}</Text>
                      </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.detailSectionHeading}>Case Overview</Text>
                    <Text style={styles.detailDescriptionText}>{activeDispute.description}</Text>

                    {activeDispute.resolutionNote && (
                      <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionTitle}>Resolution Note</Text>
                        <Text style={styles.resolutionBody}>{activeDispute.resolutionNote}</Text>
                      </View>
                    )}

                    {/* Mediation Timeline */}
                    {activeDispute.timeline && activeDispute.timeline.length > 0 && (
                      <View style={styles.timelineSection}>
                        <Text style={styles.detailSectionHeading}>Mediation Log & Timeline</Text>
                        {activeDispute.timeline.map((step, idx) => (
                          <View key={idx} style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                              <Text style={styles.timelineDate}>
                                {step.date} · {step.actor}
                              </Text>
                              <Text style={styles.timelineAction}>{step.action}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Mediation Actions */}
                    <Text style={[styles.detailSectionHeading, { marginTop: adminSpacing.md }]}>
                      Mediation Actions
                    </Text>
                    <View style={styles.actionBtnGroup}>
                      {activeDispute.status !== 'Resolved' && (
                        <TouchableOpacity
                          style={styles.resolveActionBtn}
                          onPress={() =>
                            handleUpdateStatus(
                              activeDispute.id,
                              'Resolved',
                              'Settlement confirmed by farmer and TOHFA administration.'
                            )
                          }
                        >
                          <Text style={styles.resolveActionBtnText}>Mark as Resolved</Text>
                        </TouchableOpacity>
                      )}

                      {activeDispute.status !== 'Escalated' && activeDispute.status !== 'Resolved' && (
                        <TouchableOpacity
                          style={styles.escalateActionBtn}
                          onPress={() =>
                            handleUpdateStatus(
                              activeDispute.id,
                              'Escalated',
                              'Escalated to PGS Regional Council and Senior TOHFA Ombudsperson.'
                            )
                          }
                        >
                          <Text style={styles.escalateActionBtnText}>Escalate Dispute</Text>
                        </TouchableOpacity>
                      )}

                      {activeDispute.status === 'Open' && (
                        <TouchableOpacity
                          style={styles.reviewActionBtn}
                          onPress={() => handleUpdateStatus(activeDispute.id, 'Under Review')}
                        >
                          <Text style={styles.reviewActionBtnText}>Move to Under Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.closeModalBtn}
                      onPress={() => setActiveDispute(null)}
                    >
                      <Text style={styles.closeModalBtnText}>Close Case View</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Feedback Toast ─── */}
      {feedbackToast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  headerTitleWrap: {
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
    letterSpacing: -0.2,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.onBrand,
    opacity: 0.92,
    letterSpacing: -0.1,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingLeft: adminSpacing.sm,
    paddingVertical: 0,
  },
  clearSearchText: {
    color: adminColors.muted,
    fontSize: 16,
    paddingHorizontal: adminSpacing.xs,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    gap: adminSpacing.sm,
  },
  filterBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  filterActiveBadge: {
    backgroundColor: adminColors.brand,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  filterActiveBadgeText: {
    ...adminType.caption,
    fontSize: 9,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  activeFilterChip: {
    backgroundColor: '#F3EFEA',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
  },
  activeFilterChipText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.ink,
  },
  clearAllBtn: {
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: 4,
  },
  clearAllText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  disputeCount: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  disputeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardId: {
    ...adminType.rowTitle,
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  badgePill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
  },
  categoryPill: {
    backgroundColor: '#F3EFEA',
  },
  categoryText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6C6258',
  },
  disputeTitle: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 6,
  },
  metaText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 3,
  },
  dateMetaText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  detailsBtnText: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '800',
    color: '#B85D19',
  },
  timelineLinkBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  timelineLinkBtnText: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.brand,
  },
  emptyContainer: {
    padding: adminSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: adminSpacing.md,
  },
  emptyTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  emptySubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: adminSpacing.md,
  },
  resetFilterBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  resetFilterBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  screenIdCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.md,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },

  // ─── Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.title,
    fontSize: 17,
    color: adminColors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.muted,
  },
  filterSectionTitle: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 7,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  filterChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: '#FFF1E8',
  },
  filterChipText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xl,
  },
  modalResetBtn: {
    flex: 1,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalResetText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.muted,
  },
  modalApplyBtn: {
    flex: 2,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalApplyText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  // Detail Modal
  detailModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  detailDisputeId: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  detailTitle: {
    ...adminType.title,
    fontSize: 16.5,
    color: adminColors.ink,
    marginTop: 2,
  },
  detailInfoBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginVertical: adminSpacing.md,
    gap: 4,
  },
  detailInfoRow: {
    ...adminType.caption,
    fontSize: 12,
  },
  detailInfoLabel: {
    fontWeight: '700',
    color: adminColors.muted,
  },
  detailInfoValue: {
    fontWeight: '600',
    color: adminColors.ink,
  },
  detailSectionHeading: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.muted,
    textTransform: 'uppercase',
    marginBottom: adminSpacing.xs,
  },
  detailDescriptionText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 19,
    marginBottom: adminSpacing.md,
  },
  resolutionBox: {
    backgroundColor: '#E6F7ED',
    borderWidth: 1,
    borderColor: '#A3E3B9',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  resolutionTitle: {
    ...adminType.caption,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  resolutionBody: {
    ...adminType.caption,
    fontSize: 12,
    color: '#047857',
  },
  timelineSection: {
    marginBottom: adminSpacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.muted,
  },
  timelineAction: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.ink,
    marginTop: 1,
  },
  actionBtnGroup: {
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  resolveActionBtn: {
    backgroundColor: '#059669',
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resolveActionBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  escalateActionBtn: {
    backgroundColor: '#DC2626',
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  escalateActionBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  reviewActionBtn: {
    backgroundColor: '#1E6091',
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewActionBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  closeModalBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  closeModalBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: adminSpacing.lg,
    right: adminSpacing.lg,
    backgroundColor: adminColors.ink,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  toastText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.onBrand,
    textAlign: 'center',
  },
});
