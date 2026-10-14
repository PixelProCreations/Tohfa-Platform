import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

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
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FarmerHandoverScreenProps {
  orderId?: string;
  farmerName?: string;
  farmerPhone?: string;
  expectedQty?: number;
  onBack: () => void;
  onConfirmHandover: (receivedQty: number, qualityStatus: string, notes: string) => void;
  onReportIssue?: () => void;
}

export function FarmerHandoverScreen({
  orderId = '',
  farmerName = '',
  farmerPhone = '',
  expectedQty = 0,
  onBack,
  onConfirmHandover,
}: FarmerHandoverScreenProps) {
  const [receivedQtyInput, setReceivedQtyInput] = useState(expectedQty.toString());
  const [quality, setQuality] = useState<'Accepted' | 'Quality Issue'>('Accepted');
  const [notes, setNotes] = useState('');

  const receivedQtyNum = parseFloat(receivedQtyInput) || 0;
  const difference = receivedQtyNum - expectedQty;

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

          <Text style={styles.headerTitle}>{t('farmerHandover.title')}</Text>
        </View>

        <Text style={styles.headerSubtitle}>{t('farmerHandover.status.awaiting')}</Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Farmer & Phone */}
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('farmerHandover.label.farmer')}</Text>
              <Text style={styles.fieldValue}>{farmerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('farmerHandover.label.phone')}</Text>
              <Text style={styles.fieldValue}>{farmerPhone}</Text>
            </View>
          </View>
        </View>

        {/* Card 2: PO ID & Agreed Quantity */}
        <View style={[styles.card, styles.spacedCard]}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('farmerHandover.label.poId')}</Text>
              <Text style={styles.fieldValue}>{orderId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('farmerHandover.label.agreedQty')}</Text>
              <Text style={styles.fieldValue}>{expectedQty} kg</Text>
            </View>
          </View>
        </View>

        {/* Section: Actual Handover Quantity */}
        <Text style={styles.sectionHeading}>{t('farmerHandover.section.actualQty')}</Text>

        {/* Card 3: 3-column KPI */}
        <View style={styles.card}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>{t('farmerHandover.kpi.expected')}</Text>
              <Text style={styles.kpiValue}>{expectedQty} kg</Text>
            </View>

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>{t('farmerHandover.kpi.received')}</Text>
              <Text style={styles.kpiValue}>{receivedQtyNum} kg</Text>
            </View>

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>{t('farmerHandover.kpi.difference')}</Text>
              <Text
                style={[
                  styles.kpiValue,
                  difference === 0
                    ? styles.kpiDiffNeutral
                    : difference < 0
                    ? styles.kpiDiffNegative
                    : styles.kpiDiffPositive,
                ]}
              >
                {difference > 0 ? `+${difference}` : difference} kg
              </Text>
            </View>
          </View>
        </View>

        {/* Input: Received Quantity */}
        <Text style={styles.inputLabel}>{t('farmerHandover.label.receivedQty')}</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            value={receivedQtyInput}
            onChangeText={setReceivedQtyInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={adminColors.muted}
          />
        </View>

        {/* Section: Handover Verification */}
        <Text style={styles.sectionHeading}>{t('farmerHandover.section.verification')}</Text>

        <Text style={styles.subLabel}>{t('farmerHandover.label.quality')}</Text>
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, quality === 'Accepted' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setQuality('Accepted')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                quality === 'Accepted' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {t('farmerHandover.quality.accepted')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, quality === 'Quality Issue' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setQuality('Quality Issue')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                quality === 'Quality Issue' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {t('farmerHandover.quality.issue')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subLabel, styles.notesSubLabel]}>{t('farmerHandover.label.notes')}</Text>
        <View style={[styles.inputCard, styles.notesCard]}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('farmerHandover.placeholder.notes')}
            placeholderTextColor={adminColors.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onConfirmHandover(receivedQtyNum, quality, notes)}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>{t('farmerHandover.action.confirm')}</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    ...adminType.caption,
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
    marginLeft: 38,
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
  spacedCard: {
    marginTop: adminSpacing.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
    fontWeight: '500',
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
    textTransform: 'uppercase',
  },
  kpiValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  kpiDiffNeutral: {
    color: adminColors.success.text,
  },
  kpiDiffNegative: {
    color: adminColors.danger.text,
  },
  kpiDiffPositive: {
    color: adminColors.ink,
  },

  inputLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  inputCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  textInput: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    padding: 0,
  },

  subLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  notesSubLabel: {
    marginTop: adminSpacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  chip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipInactive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  chipText: {
    ...adminType.body,
    fontWeight: '700',
  },
  chipTextActive: {
    color: adminColors.onBrand,
  },
  chipTextInactive: {
    color: adminColors.muted,
  },

  notesCard: {
    minHeight: 88,
  },
  notesInput: {
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
    minHeight: 68,
  },

  confirmBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
  },
  confirmBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
