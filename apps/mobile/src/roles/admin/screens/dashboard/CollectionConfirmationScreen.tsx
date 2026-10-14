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
import Svg, { Path } from 'react-native-svg';

import { t } from '../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

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

function CheckmarkIcon({ size = 12, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CollectionConfirmationScreenProps {
  orderId?: string;
  farmerName?: string;
  expectedQty?: string;
  receivedQty?: string;
  totalValue?: string;
  collectionDate?: string;
  collectedBy?: string;
  qualityResult?: string;
  onBack: () => void;
  onConfirmCollection: () => void;
}

export function CollectionConfirmationScreen({
  orderId,
  farmerName,
  expectedQty,
  receivedQty,
  totalValue,
  collectionDate,
  collectedBy,
  qualityResult,
  onBack,
  onConfirmCollection,
}: CollectionConfirmationScreenProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

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
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('collectionConfirmation.title')}</Text>
        </View>

        <Text style={styles.headerSubtitle}>{t('collectionConfirmation.subtitle')}</Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Purchase Summary */}
        <Text style={styles.sectionHeading}>{t('collectionConfirmation.section.orderSummary')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('collectionConfirmation.orderId')}</Text>
              <Text style={styles.fieldValue}>{orderId || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('collectionConfirmation.farmer')}</Text>
              <Text style={styles.fieldValue}>{farmerName || '—'}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, styles.rowSpacing]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('collectionConfirmation.expectedQty')}</Text>
              <Text style={styles.fieldValue}>{expectedQty || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('collectionConfirmation.receivedQty')}</Text>
              <Text style={styles.fieldValue}>{receivedQty || '—'}</Text>
            </View>
          </View>

          <View style={styles.rowSpacing}>
            <Text style={styles.fieldLabel}>{t('collectionConfirmation.totalValue')}</Text>
            <Text style={styles.fieldValue}>{totalValue || '—'}</Text>
          </View>
        </View>

        {/* Section: Collection Details */}
        <Text style={styles.sectionHeading}>{t('collectionConfirmation.title')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('collectionConfirmation.collectionDate')}</Text>
              <Text style={styles.fieldValue}>{collectionDate || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('collectionConfirmation.collectedBy')}</Text>
              <Text style={styles.fieldValue}>{collectedBy || '—'}</Text>
            </View>
          </View>

          <View style={styles.rowSpacing}>
            <Text style={styles.fieldLabel}>{t('collectionConfirmation.qualityResult')}</Text>
            <Text style={styles.fieldValue}>{qualityResult || '—'}</Text>
          </View>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsConfirmed(!isConfirmed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, isConfirmed && styles.checkboxBoxChecked]}>
            {isConfirmed && <CheckmarkIcon size={12} color={adminColors.onBrand} />}
          </View>
          <Text style={styles.checkboxLabel}>
            {t('collectionConfirmation.acknowledgement')}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, isConfirmed ? styles.confirmBtnActive : styles.confirmBtnDisabled]}
          onPress={() => {
            if (isConfirmed) {
              onConfirmCollection();
            }
          }}
          activeOpacity={0.85}
          disabled={!isConfirmed}
        >
          <Text style={styles.confirmBtnText}>{t('collectionConfirmation.confirmBtn')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.md,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
    marginLeft: adminSpacing.xxl,
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },

  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
  },
  rowSpacing: {
    marginTop: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: adminSpacing.xl,
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: adminRadius.xs,
    borderWidth: 1.8,
    borderColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: adminColors.card,
  },
  checkboxBoxChecked: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxLabel: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  confirmBtn: {
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnActive: {
    backgroundColor: adminColors.brand,
  },
  confirmBtnDisabled: {
    backgroundColor: adminColors.brandTint,
  },
  confirmBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  bottomSpacer: {
    height: 100,
  },
});
