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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { HandoverHistoryScreen } from './HandoverHistoryScreen';
import { HandoverDetailsScreen } from './HandoverDetailsScreen';

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

function CircleSlashIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface HandoverConfirmationScreenProps {
  handoverId?: string | undefined;
  status?: string | undefined;
  onBack: () => void;
  onViewHistory?: () => void;
  onViewHandoverDetails?: () => void;
}

export function HandoverConfirmationScreen({
  handoverId,
  status,
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('handoverConfirmation.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('handoverConfirmation.title')}</Text>
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
        {/* Top Handover Details Card */}
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverDetails.handoverId')}</Text>
              <Text style={styles.valBold}>{handoverId}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.destination')}</Text>
              <Text style={styles.valBold}>Main Warehouse</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: adminSpacing.md }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.dispatchQuantity')}</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.dispatchDate')}</Text>
              <Text style={styles.valBold}>6 Oct 2026</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.labelMuted}>{t('handoverConfirmation.acknowledgementStatus')}</Text>
            <Text style={styles.valBold}>{t('handoverConfirmation.acknowledgedByWarehouse')}</Text>
          </View>
        </View>

        {/* Product-wise manifest */}
        <Text style={styles.sectionTitle}>{t('handoverConfirmation.section.manifest')}</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.manifestText}>Carrot · Grade 1</Text>
            <Text style={styles.manifestQty}>30 KG</Text>
          </View>
        </View>

        {/* Warehouse acknowledgement */}
        <Text style={styles.sectionTitle}>{t('handoverConfirmation.section.acknowledgement')}</Text>
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.receivingReference')}</Text>
              <Text style={styles.valBold}>MWA-RCV-0010</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.receivedDate')}</Text>
              <Text style={styles.valBold}>10 Oct 2026</Text>
            </View>
          </View>

          <View style={[styles.rowTwoCol, { marginTop: adminSpacing.md }]}>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.receivedQuantity')}</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.labelMuted}>{t('handoverConfirmation.acceptedQuantity')}</Text>
              <Text style={styles.valBold}>30 KG</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.labelMuted}>{t('handoverConfirmation.outcome')}</Text>
            <Text style={styles.valBold}>Accepted</Text>
          </View>
        </View>
        <Text style={styles.captionUnder}>
          {t('handoverConfirmation.caption.recorded')}
        </Text>

        {/* Final status */}
        <Text style={styles.sectionTitle}>{t('handoverConfirmation.section.finalStatus')}</Text>
        <View style={styles.card}>
          <Text style={styles.labelMuted}>{t('handoverConfirmation.handoverStatus')}</Text>
          <Text style={styles.valBold}>{status}</Text>
        </View>
        <Text style={styles.captionUnder}>
          {t('handoverConfirmation.caption.completed')}
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
            <Text style={styles.outlineBtnText}>{t('handoverConfirmation.action.details')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              if (onViewHistory) onViewHistory();
              else setActiveSubView('history');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>{t('handoverConfirmation.action.history')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xl }} />
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
    paddingBottom: adminSpacing.md,
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
    paddingLeft: 42,
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
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
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
  labelMuted: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  valBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manifestText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  manifestQty: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  captionUnder: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  noticeBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
  },
  noticeText: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  outlineBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
});
