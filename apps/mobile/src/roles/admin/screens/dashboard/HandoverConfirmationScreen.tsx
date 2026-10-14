import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors } from '../../theme';
import { HandoverHistoryScreen } from './HandoverHistoryScreen';
import { HandoverDetailsScreen } from './HandoverDetailsScreen';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 — App canvas soft cream
  card: adminColors.card, // #FFFFFF — Card surface
  border: adminColors.border, // #EEDCD3 — Border stroke
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink, // Dark ink
  muted: adminColors.muted, // Secondary gray

  // Buttons & Actions
  orangeBtn: adminColors.brand,

  // Notice box
  noticeBg: '#F9F6F0',
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

function CircleSlashIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface HandoverConfirmationScreenProps {
  handoverId?: string;
  status?: string;
  onBack: () => void;
  onViewHistory?: () => void;
  onViewHandoverDetails?: () => void;
}

export function HandoverConfirmationScreen({
  handoverId = 'HO-2026-0002',
  status = 'Completed',
  onBack,
  onViewHistory,
  onViewHandoverDetails,
}: HandoverConfirmationScreenProps) {
  const [activeSubView, setActiveSubView] = useState<'none' | 'history' | 'details'>('none');

  if (activeSubView === 'history') {
    return (
      <HandoverHistoryScreen
        onBack={() => setActiveSubView('none')}
        onNavigateToHandover={() => setActiveSubView('none')}
      />
    );
  }

  if (activeSubView === 'details') {
    return (
      <HandoverDetailsScreen
        handoverId={handoverId}
        status={status}
        onBack={() => setActiveSubView('none')}
        onViewHistory={() => setActiveSubView('history')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Handover Confirmation</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {handoverId} · {status}
        </Text>
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Handover Details Card (Screenshot 3) */}
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Handover ID</Text>
              <Text style={styles.valBold}>{handoverId}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Destination</Text>
              <Text style={styles.valBold}>Main Warehouse</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: 14 }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Dispatch quantity</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Dispatch date</Text>
              <Text style={styles.valBold}>6 Oct 2026</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.labelMuted}>Acknowledgement status</Text>
            <Text style={styles.valBold}>Acknowledged by the Main Warehouse</Text>
          </View>
        </View>

        {/* Product-wise manifest */}
        <Text style={styles.sectionTitle}>Product-wise manifest</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.manifestText}>Carrot · Grade 1</Text>
            <Text style={styles.manifestQty}>30 KG</Text>
          </View>
        </View>

        {/* Warehouse acknowledgement */}
        <Text style={styles.sectionTitle}>Warehouse acknowledgement</Text>
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

          <View style={[styles.rowTwoCol, { marginTop: 14 }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Received quantity</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>Accepted quantity</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.labelMuted}>Outcome</Text>
            <Text style={styles.valBold}>Accepted</Text>
          </View>
        </View>
        <Text style={styles.captionUnder}>
          Recorded by the Main Warehouse receiving workflow.
        </Text>

        {/* Final status */}
        <Text style={styles.sectionTitle}>Final status</Text>
        <View style={styles.card}>
          <Text style={styles.labelMuted}>Handover status</Text>
          <Text style={styles.valBold}>{status}</Text>
        </View>
        <Text style={styles.captionUnder}>
          Completed under the proposed rule: received in full with no discrepancy.
        </Text>

        {/* Action Buttons Row: View Handover Details & View History */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              if (onViewHandoverDetails) onViewHandoverDetails();
              else setActiveSubView('details');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>View Handover Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              if (onViewHistory) onViewHistory();
              else setActiveSubView('history');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>View History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    paddingLeft: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 18,
    marginBottom: 8,
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colHalf: {
    width: '48%',
  },
  labelMuted: {
    fontSize: 11.5,
    color: THEME.muted,
    marginBottom: 3,
  },
  valBold: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manifestText: {
    fontSize: 13.5,
    color: THEME.ink,
    fontWeight: '600',
  },
  manifestQty: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  captionUnder: {
    fontSize: 11.5,
    color: THEME.muted,
    marginTop: 6,
    lineHeight: 16,
  },
  noticeBox: {
    backgroundColor: THEME.noticeBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.noticeBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  outlineBtn: {
    flex: 1,
    height: 48,
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
});
