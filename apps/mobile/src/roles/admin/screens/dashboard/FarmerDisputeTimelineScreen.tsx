import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  type DisputeItem,
  type DisputeTimelineEvent,
  INITIAL_DISPUTES,
} from './fixtures';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function TargetBullseyeIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" fill={color} />
    </Svg>
  );
}

function PaperclipIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SwitchArrowsIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h15M15 4l4 4-4 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 16H5M9 12l-4 4 4 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NoteLinesIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h12M4 18h8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentModalIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Filter Category Type ───────────────────────────────────────────────────

export type TimelineFilterType =
  | 'All Activity'
  | 'Notes'
  | 'Evidence Updates'
  | 'Status Changes';

// ─── Props Interface ────────────────────────────────────────────────────────

export interface FarmerDisputeTimelineScreenProps {
  dispute?: DisputeItem | undefined;
  onBack: () => void;
  onViewDisputeDetail?: (() => void) | undefined;
}

export function FarmerDisputeTimelineScreen({
  dispute: propDispute,
  onBack,
  onViewDisputeDetail,
}: FarmerDisputeTimelineScreenProps) {
  const dispute = propDispute ?? INITIAL_DISPUTES[0]!;

  const [activeFilter, setActiveFilter] = useState<TimelineFilterType>('All Activity');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  // Full timeline list from dispute fixture or fallback defaults matching screenshots
  const allTimelineEvents: DisputeTimelineEvent[] = useMemo(() => {
    if (dispute.detailedTimeline && dispute.detailedTimeline.length > 0) {
      return dispute.detailedTimeline;
    }

    return [
      {
        id: 'tle-1',
        type: 'status',
        title: 'Dispute submitted',
        description: `${dispute.raisedBy} submitted a dispute about a payment.`,
        author: dispute.raisedBy,
        timestamp: `${dispute.createdDate}, 09:12`,
      },
      {
        id: 'tle-2',
        type: 'evidence',
        title: 'Evidence added',
        description: 'Payment statement was attached.',
        author: dispute.raisedBy,
        timestamp: `${dispute.createdDate}, 09:14`,
        attachmentTitle: 'Payment statement',
      },
      {
        id: 'tle-3',
        type: 'evidence',
        title: 'Evidence added',
        description: 'Carrot batch photo was attached.',
        author: dispute.raisedBy,
        timestamp: `${dispute.createdDate}, 09:15`,
        attachmentTitle: 'Carrot batch photo',
      },
      {
        id: 'tle-4',
        type: 'status',
        title: `Status changed to ${dispute.status}`,
        description: 'The Farmer Admin started reviewing the dispute.',
        author: dispute.assignedAdmin || 'Suresh Kumar',
        timestamp: `${dispute.lastActivityDate}, 10:05`,
      },
      {
        id: 'tle-5',
        type: 'note',
        title: 'Mediation note added',
        description: 'Mediation note recorded (internal).',
        author: dispute.assignedAdmin || 'Suresh Kumar',
        timestamp: `${dispute.lastActivityDate}, 10:30`,
      },
    ];
  }, [dispute]);

  // Filtered timeline events matching the 4 screenshots
  const filteredEvents = useMemo(() => {
    switch (activeFilter) {
      case 'Notes':
        return allTimelineEvents.filter((item) => item.type === 'note');
      case 'Evidence Updates':
        return allTimelineEvents.filter((item) => item.type === 'evidence');
      case 'Status Changes':
        return allTimelineEvents.filter((item) => item.type === 'status');
      case 'All Activity':
      default:
        return allTimelineEvents;
    }
  }, [activeFilter, allTimelineEvents]);

  // Icon renderer based on event type
  const renderEventIcon = (event: DisputeTimelineEvent) => {
    if (event.type === 'evidence') {
      return <PaperclipIcon size={17} color={adminColors.brand} />;
    }
    if (event.type === 'note') {
      return <NoteLinesIcon size={17} color={adminColors.brand} />;
    }
    if (event.title.toLowerCase().includes('submitted')) {
      return <TargetBullseyeIcon size={18} color={adminColors.brand} />;
    }
    return <SwitchArrowsIcon size={17} color={adminColors.brand} />;
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header matching M10-S03 screenshot ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Dispute Timeline</Text>
            <Text style={styles.headerSubtitle}>
              {dispute.id} · {dispute.status}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Chips (2 rows as shown in screenshots) ─── */}
        <View style={styles.filterSection}>
          {/* Row 1: All Activity | Notes | Evidence Updates */}
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[
                styles.chipButton,
                activeFilter === 'All Activity' && styles.chipButtonActive,
              ]}
              onPress={() => setActiveFilter('All Activity')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Show all activity"
            >
              <Text
                style={[
                  styles.chipButtonText,
                  activeFilter === 'All Activity' && styles.chipButtonTextActive,
                ]}
              >
                All Activity
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chipButton,
                activeFilter === 'Notes' && styles.chipButtonActive,
              ]}
              onPress={() => setActiveFilter('Notes')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Show notes only"
            >
              <Text
                style={[
                  styles.chipButtonText,
                  activeFilter === 'Notes' && styles.chipButtonTextActive,
                ]}
              >
                Notes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chipButton,
                activeFilter === 'Evidence Updates' && styles.chipButtonActive,
              ]}
              onPress={() => setActiveFilter('Evidence Updates')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Show evidence updates only"
            >
              <Text
                style={[
                  styles.chipButtonText,
                  activeFilter === 'Evidence Updates' && styles.chipButtonTextActive,
                ]}
              >
                Evidence Updates
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Status Changes */}
          <View style={styles.chipRowSecond}>
            <TouchableOpacity
              style={[
                styles.chipButton,
                activeFilter === 'Status Changes' && styles.chipButtonActive,
              ]}
              onPress={() => setActiveFilter('Status Changes')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Show status changes only"
            >
              <Text
                style={[
                  styles.chipButtonText,
                  activeFilter === 'Status Changes' && styles.chipButtonTextActive,
                ]}
              >
                Status Changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Vertical Connected Timeline ─── */}
        <View style={styles.timelineContainer}>
          {filteredEvents.map((event, index) => {
            const isLast = index === filteredEvents.length - 1;
            return (
              <View key={event.id} style={styles.timelineRow}>
                {/* Left Column: Icon Badge & Vertical Connecting Line */}
                <View style={styles.timelineLeftCol}>
                  <View style={styles.iconCircleBadge}>{renderEventIcon(event)}</View>
                  {!isLast && <View style={styles.verticalConnectingLine} />}
                </View>

                {/* Right Column: Event Details */}
                <View style={[styles.timelineBody, isLast && styles.timelineBodyLast]}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  <Text style={styles.eventMeta}>
                    {event.author} · {event.timestamp}
                  </Text>

                  {/* Attachment Card if present */}
                  {event.attachmentTitle && (
                    <View style={styles.attachmentCard}>
                      <View style={styles.attachmentLeft}>
                        <PaperclipIcon size={18} color={adminColors.ink} />
                        <Text style={styles.attachmentCardTitle}>
                          {event.attachmentTitle}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.viewAttachmentBtn}
                        onPress={() => setViewingAttachment(event.attachmentTitle ?? null)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`View attachment ${event.attachmentTitle}`}
                      >
                        <Text style={styles.viewAttachmentBtnText}>View Attachment</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Bottom Recorded Notice from screenshot ─── */}
        <Text style={styles.recordedNotice}>
          Only events that were actually recorded are shown. Opening this screen adds nothing to the record.
        </Text>

        {/* ─── M10-S03 Footer Caption ─── */}
        <Text style={styles.screenCaption}>M10-S03 · Dispute Timeline</Text>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Attachment Viewer Modal ─── */}
      <Modal
        visible={!!viewingAttachment}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingAttachment(null)}
      >
        <TouchableWithoutFeedback onPress={() => setViewingAttachment(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalTitleBox}>
                    <DocumentModalIcon size={22} color={adminColors.brand} />
                    <Text style={styles.modalTitleText}>{viewingAttachment}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setViewingAttachment(null)}
                    accessibilityLabel="Close attachment viewer"
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.attachmentPreviewBox}>
                  <DocumentModalIcon size={44} color={adminColors.brand} />
                  <Text style={styles.previewMetaTitle}>{viewingAttachment}</Text>
                  <Text style={styles.previewMetaDesc}>
                    Verified dispute attachment uploaded by {dispute.raisedBy}.
                  </Text>
                  <Text style={styles.previewMetaNotice}>
                    Official record for {dispute.id} · Protected by TOHFA Mediation Audit.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setViewingAttachment(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalDismissBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -adminSpacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // Filter Chips
  filterSection: {
    paddingHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  chipRowSecond: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipButton: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipButtonActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipButtonText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
  },
  chipButtonTextActive: {
    color: adminColors.onBrand,
  },

  // Timeline list & nodes
  timelineContainer: {
    paddingHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineLeftCol: {
    width: 32,
    alignItems: 'center',
  },
  iconCircleBadge: {
    width: 26,
    height: 26,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalConnectingLine: {
    position: 'absolute',
    top: 26,
    bottom: 0,
    width: 1.5,
    backgroundColor: adminColors.border,
    zIndex: 1,
  },
  timelineBody: {
    flex: 1,
    marginLeft: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  timelineBodyLast: {
    paddingBottom: adminSpacing.md,
  },
  eventTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    lineHeight: 18,
  },
  eventDescription: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  eventMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
    marginTop: 4,
  },

  // Attachment Card
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
    ...adminShadow.sm,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  attachmentCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
  },
  viewAttachmentBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: adminColors.card,
  },
  viewAttachmentBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontSize: 12,
  },

  // Bottom Notice & Caption
  recordedNotice: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
    lineHeight: 16,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  screenCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    fontSize: 11,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  modalTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  modalTitleText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: adminColors.muted,
    fontWeight: '700',
  },
  attachmentPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    marginVertical: adminSpacing.md,
  },
  previewMetaTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15,
    marginTop: adminSpacing.sm,
  },
  previewMetaDesc: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
    fontSize: 13,
    marginTop: adminSpacing.xs,
  },
  previewMetaNotice: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
    fontSize: 11,
    marginTop: adminSpacing.sm,
  },
  modalDismissBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    marginTop: adminSpacing.sm,
  },
  modalDismissBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 14,
  },
});
