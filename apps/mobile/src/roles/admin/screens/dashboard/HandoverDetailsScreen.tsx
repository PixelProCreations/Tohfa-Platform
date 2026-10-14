import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { HandoverHistoryScreen } from './HandoverHistoryScreen';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  headerGradientEnd: adminColors.brandDeep,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#6B7280',

  // Buttons & Highlights
  orangeBtn: adminColors.brand,
  orangeBorder: '#E27D60',
  orangeText: adminColors.brandDeep,
  orangeLink: adminColors.brand,

  // Disclaimer
  noticeBg: '#FAF7F2',
  noticeBorder: adminColors.border,
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// 1. Handover prepared (Clipboard with lines/check)
function ClipboardStepIcon({ size = 22, color = '#E27D60' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 2. Marked ready for handover (Square checkbox with checkmark)
function SquareCheckStepIcon({ size = 22, color = '#E27D60' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3.5" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 3. Dispatch recorded (Delivery truck)
function TruckStepIcon({ size = 22, color = '#E27D60' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 5h13v10H2zM15 9h4.5l2.5 3v3h-7V9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="6" cy="18" r="2.2" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="18" r="2.2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// 4. Main Warehouse acknowledgement recorded (Open storage crate / box)
function OpenBoxStepIcon({ size = 22, color = '#E27D60' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM2 5h20v4H2zM10 13h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 5. Handover completed (Circle with checkmark)
function CircleCheckStepIcon({ size = 22, color = '#E27D60' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Prohibited Circle Slash Icon
function ProhibitedSlashIcon({ size = 20, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface HandoverDetailsScreenProps {
  handoverId?: string;
  status?: string;
  onBack: () => void;
  onViewReceivingResult?: () => void;
  onViewHistory?: () => void;
}

export function HandoverDetailsScreen({
  handoverId = 'HO-2026-0002',
  status = 'Completed',
  onBack,
  onViewReceivingResult,
  onViewHistory,
}: HandoverDetailsScreenProps) {
  const [internalSubView, setInternalSubView] = useState<'none' | 'confirmation' | 'history'>('none');

  if (internalSubView === 'confirmation') {
    return (
      <HandoverConfirmationScreen
        handoverId={handoverId}
        status={status}
        onBack={() => setInternalSubView('none')}
        onViewHistory={() => setInternalSubView('history')}
        onViewHandoverDetails={() => setInternalSubView('none')}
      />
    );
  }

  if (internalSubView === 'history') {
    return (
      <HandoverHistoryScreen
        onBack={() => setInternalSubView('none')}
        onNavigateToHandover={() => setInternalSubView('confirmation')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Exact Match to Screenshot 1 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{handoverId}</Text>
        </View>
        <Text style={styles.headerSubtitle}>Completed - Main warehouse</Text>
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Details Card (Exact UI Screenshot 1) */}
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Handover ID</Text>
              <Text style={styles.valTitleBold}>{handoverId}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Status</Text>
              <Text style={styles.valTitleBold}>Completed</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Handover date</Text>
              <Text style={styles.valBold}>6 Oct 2026</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Destination</Text>
              <Text style={styles.valBold}>Main Warehouse</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Total quantity</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Source collections</Text>
              <Text style={styles.valBold}>1</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.labelMuted}>Last updated</Text>
            <Text style={styles.valBold}>10 Oct 2026, 10:00</Text>
          </View>
        </View>

        {/* Handover Manifest Section */}
        <Text style={styles.sectionTitle}>Handover manifest</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.valManifestName}>Carrot · Grade 1</Text>
            <Text style={styles.valBold}>30 KG</Text>
          </View>

          <View style={[styles.rowBetween, { marginTop: 10 }]}>
            <Text style={styles.labelMuted}>Source collections</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sourceCollectionLink}>COL-0006</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline Section with Exact 5 Steps */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timelineContainer}>
          {/* Step 1: Handover prepared */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <ClipboardStepIcon size={22} color="#E27D60" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Handover prepared</Text>
              <Text style={styles.timelineDesc}>Prepared from 1 collection.</Text>
              <Text style={styles.timelineMeta}>Suresh Kumar · 6 Oct 2026, 09:00</Text>
            </View>
          </View>

          {/* Step 2: Marked ready for handover */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <SquareCheckStepIcon size={22} color="#E27D60" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Marked ready for handover</Text>
              <Text style={styles.timelineDesc}>The manifest is ready.</Text>
              <Text style={styles.timelineMeta}>Suresh Kumar · 6 Oct 2026, 09:20</Text>
            </View>
          </View>

          {/* Step 3: Dispatch recorded */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <TruckStepIcon size={22} color="#E27D60" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Dispatch recorded</Text>
              <Text style={styles.timelineDesc}>Handed over for the Main Warehouse.</Text>
              <Text style={styles.timelineMeta}>Suresh Kumar · 6 Oct 2026, 15:00</Text>
            </View>
          </View>

          {/* Step 4: Main Warehouse acknowledgement recorded */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <OpenBoxStepIcon size={22} color="#E27D60" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Main Warehouse acknowledgement recorded</Text>
              <Text style={styles.timelineDesc}>Received 30 KG.</Text>
              <Text style={styles.timelineMeta}>Main Warehouse · 10 Oct 2026, 10:00</Text>
            </View>
          </View>

          {/* Step 5: Handover completed */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <CircleCheckStepIcon size={22} color="#E27D60" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Handover completed</Text>
              <Text style={styles.timelineDesc}>Received in full.</Text>
              <Text style={styles.timelineMeta}>System · 10 Oct 2026, 10:00</Text>
            </View>
          </View>
        </View>

        {/* Main Warehouse Acknowledgement Section */}
        <Text style={styles.sectionTitle}>Main Warehouse acknowledgement</Text>
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Receiving reference</Text>
              <Text style={styles.valBold}>MWA-RCV-0010</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Received date</Text>
              <Text style={styles.valBold}>10 Oct 2026</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Received quantity</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Accepted quantity</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.labelMuted}>Outcome</Text>
            <Text style={styles.valBold}>Accepted</Text>
          </View>
        </View>

        <Text style={styles.subCardNote}>
          Recorded by the Main Warehouse receiving workflow.
        </Text>

        {/* Actions Section — ONLY View Receiving Result and View History (View Manifest & View Source Collections removed) */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => {
              if (onViewReceivingResult) {
                onViewReceivingResult();
              } else {
                setInternalSubView('confirmation');
              }
            }}
            activeOpacity={0.8}
            accessibilityLabel="View Receiving Result"
          >
            <Text style={styles.actionBtnText}>View Receiving Result</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => {
              if (onViewHistory) {
                onViewHistory();
              } else {
                setInternalSubView('history');
              }
            }}
            activeOpacity={0.8}
            accessibilityLabel="View History"
          >
            <Text style={styles.actionBtnText}>View History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Screenshot 1 & 2 Exactly ────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 4,
    paddingLeft: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 22,
    marginBottom: 10,
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colHalf: {
    width: '48%',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelMuted: {
    fontSize: 12,
    color: THEME.labelMuted,
    marginBottom: 4,
  },
  valTitleBold: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
  },
  valBold: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
  },
  valManifestName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
  sourceCollectionLink: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.orangeLink,
    textDecorationLine: 'underline',
  },

  // Timeline
  timelineContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineIconCol: {
    width: 32,
    paddingTop: 2,
    alignItems: 'flex-start',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    lineHeight: 18,
  },
  timelineDesc: {
    fontSize: 12.5,
    color: THEME.ink,
    marginTop: 2,
    lineHeight: 17,
  },
  timelineMeta: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 2,
  },

  // Sub card note
  subCardNote: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 8,
    marginBottom: 4,
  },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  actionBtnOutline: {
    flex: 1,
    height: 48,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: THEME.orangeBorder,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.orangeText,
    textAlign: 'center',
  },

  // Notice box
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.noticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.noticeBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },
});
