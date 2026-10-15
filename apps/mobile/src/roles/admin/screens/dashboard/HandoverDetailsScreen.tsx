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
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { HandoverHistoryScreen } from './HandoverHistoryScreen';

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

// 1. Handover prepared (Clipboard with lines/check)
function ClipboardStepIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
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
function SquareCheckStepIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3.5" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 3. Dispatch recorded (Delivery truck)
function TruckStepIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
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
function OpenBoxStepIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
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
function CircleCheckStepIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Prohibited Circle Slash Icon
function ProhibitedSlashIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface HandoverDetailsScreenProps {
  handoverId?: string | undefined;
  status?: string | undefined;
  onBack: () => void;
  onViewReceivingResult?: () => void;
  onViewHistory?: () => void;
}

export function HandoverDetailsScreen({
  handoverId,
  status,
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('handoverDetails.backLabel')}
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{handoverId}</Text>
        </View>
        <Text style={styles.headerSubtitle}>{t('handoverDetails.subtitle')}</Text>
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Details Card */}
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.handoverId')}</Text>
              <Text style={styles.valTitleBold}>{handoverId}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.status')}</Text>
              <Text style={styles.valTitleBold}>{status}</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: adminSpacing.md }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.handoverDate')}</Text>
              <Text style={styles.valBold}>6 Oct 2026</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.destination')}</Text>
              <Text style={styles.valBold}>Main Warehouse</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: adminSpacing.md }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.totalQuantity')}</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.sourceCollections')}</Text>
              <Text style={styles.valBold}>1</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.labelMuted}>{t('handoverDetails.lastUpdated')}</Text>
            <Text style={styles.valBold}>10 Oct 2026, 10:00</Text>
          </View>
        </View>

        {/* Handover Manifest Section */}
        <Text style={styles.sectionTitle}>{t('handoverDetails.section.manifest')}</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.valManifestName}>Carrot · Grade 1</Text>
            <Text style={styles.valBold}>30 KG</Text>
          </View>

          <View style={[styles.rowBetween, { marginTop: adminSpacing.sm }]}>
            <Text style={styles.labelMuted}>{t('handoverDetails.sourceCollections')}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sourceCollectionLink}>COL-0006</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline Section */}
        <Text style={styles.sectionTitle}>{t('handoverDetails.section.timeline')}</Text>
        <View style={styles.timelineContainer}>
          {/* Step 1: Handover prepared */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <ClipboardStepIcon size={22} color={adminColors.brand} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('handoverDetails.step.prepared.title')}</Text>
              <Text style={styles.timelineDesc}>{t('handoverDetails.step.prepared.desc')}</Text>
              <Text style={styles.timelineMeta}>Suresh Kumar · 6 Oct 2026, 09:00</Text>
            </View>
          </View>

          {/* Step 2: Marked ready for handover */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <SquareCheckStepIcon size={22} color={adminColors.brand} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('handoverDetails.step.ready.title')}</Text>
              <Text style={styles.timelineDesc}>{t('handoverDetails.step.ready.desc')}</Text>
              <Text style={styles.timelineMeta}>Suresh Kumar · 6 Oct 2026, 09:20</Text>
            </View>
          </View>

          {/* Step 3: Dispatch recorded */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <TruckStepIcon size={22} color={adminColors.brand} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('handoverDetails.step.dispatch.title')}</Text>
              <Text style={styles.timelineDesc}>{t('handoverDetails.step.dispatch.desc')}</Text>
              <Text style={styles.timelineMeta}>Suresh Kumar · 6 Oct 2026, 15:00</Text>
            </View>
          </View>

          {/* Step 4: Main Warehouse acknowledgement recorded */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <OpenBoxStepIcon size={22} color={adminColors.brand} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('handoverDetails.step.acknowledgement.title')}</Text>
              <Text style={styles.timelineDesc}>{t('handoverDetails.step.acknowledgement.desc')}</Text>
              <Text style={styles.timelineMeta}>Main Warehouse · 10 Oct 2026, 10:00</Text>
            </View>
          </View>

          {/* Step 5: Handover completed */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <CircleCheckStepIcon size={22} color={adminColors.brand} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('handoverDetails.step.completed.title')}</Text>
              <Text style={styles.timelineDesc}>{t('handoverDetails.step.completed.desc')}</Text>
              <Text style={styles.timelineMeta}>System · 10 Oct 2026, 10:00</Text>
            </View>
          </View>
        </View>

        {/* Main Warehouse Acknowledgement Section */}
        <Text style={styles.sectionTitle}>{t('handoverDetails.section.acknowledgement')}</Text>
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.receivingReference')}</Text>
              <Text style={styles.valBold}>MWA-RCV-0010</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.receivedDate')}</Text>
              <Text style={styles.valBold}>10 Oct 2026</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: adminSpacing.md }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.receivedQuantity')}</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.acceptedQuantity')}</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.labelMuted}>{t('handoverDetails.outcome')}</Text>
            <Text style={styles.valBold}>Accepted</Text>
          </View>
        </View>

        <Text style={styles.subCardNote}>
          {t('handoverDetails.subCardNote')}
        </Text>

        {/* Actions Section */}
        <Text style={styles.sectionTitle}>{t('handoverDetails.section.actions')}</Text>
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
            accessibilityLabel={t('handoverDetails.action.viewReceivingResult')}
          >
            <Text style={styles.actionBtnText}>{t('handoverDetails.action.viewReceivingResult')}</Text>
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
            accessibilityLabel={t('handoverDetails.action.viewHistory')}
          >
            <Text style={styles.actionBtnText}>{t('handoverDetails.action.viewHistory')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xxl ?? 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: adminSpacing.xs,
    paddingLeft: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.lg,
    ...adminShadow.sm,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.rustDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
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
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  valTitleBold: {
    ...adminType.title,
    color: adminColors.ink,
  },
  valBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  valManifestName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  sourceCollectionLink: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    textDecorationLine: 'underline',
  },

  // Timeline
  timelineContainer: {
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: adminSpacing.lg,
  },
  timelineIconCol: {
    width: 32,
    paddingTop: 2,
    alignItems: 'flex-start',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: adminSpacing.xs,
  },
  timelineTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineDesc: {
    ...adminType.body,
    color: adminColors.ink,
    marginTop: 2,
  },
  timelineMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Sub card note
  subCardNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  actionBtnOutline: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.xs,
  },
  actionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    textAlign: 'center',
  },

  // Notice box
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginTop: 2,
  },
  noticeText: {
    ...adminType.body,
    flex: 1,
    color: adminColors.muted,
  },
});
