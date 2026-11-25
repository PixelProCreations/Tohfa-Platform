/**
 * One fair price ceiling card and its details sheet, after the team design
 * (FairPriceCeilingScreen: the Tohfa card with its status badge and
 * View / History / Retail Price Management links, plus the FA card's
 * Ceiling | Frequency | Effective From columns).
 *
 * Every value is the live row (FairPriceRowView). BR-08: the frequency is the
 * stored DAILY / WEEKLY, never the design's literal "Weekly". What the API
 * does not send (category, updated by, last updated, reason, recent changes)
 * shows the dash or a short note; the setter's uuid is never shown.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { FairPriceRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import {
  cropGradeTitle,
  dayText,
  frequencyLabel,
  gradeLabel,
  noValue,
  priceText,
  windowStatusLabel,
  windowStatusTone,
} from './pricingLogic';
import { PricingBadge, PricingSheet, SpecTable, type SpecEntry } from './PricingParts';
import { styles } from './pricingStyles';

export interface CeilingCardProps {
  row: FairPriceRowView;
  onView: (row: FairPriceRowView) => void;
  onHistory: (row: FairPriceRowView) => void;
  /** Shown only when the caller may read retail prices and the host can open them. */
  onRetail?: (() => void) | undefined;
}

export function CeilingCard({ row, onView, onHistory, onRetail }: CeilingCardProps) {
  const until = row.effectiveTo === null ? t('pricingCeiling.ceiling.ongoing') : dayText(row.effectiveTo);
  return (
    <View style={styles.card} testID={`pricingCeiling.card.${row.id}`}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{cropGradeTitle(row.cropName, row.grade)}</Text>
        <PricingBadge label={windowStatusLabel(row.windowStatus)} tone={windowStatusTone(row.windowStatus)} />
      </View>
      <Text style={styles.cardSubtitle2}>{t('pricingCeiling.ceiling.effectiveRange', { from: dayText(row.effectiveFrom), to: until })}</Text>

      <View style={styles.priceColsRow}>
        <View style={styles.priceCol}>
          <Text style={styles.priceColLabel}>{t('pricingCeiling.ceiling.col.ceiling')}</Text>
          <Text style={styles.priceColValue}>{priceText(row.ceilingPrice)}</Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.priceColLabel}>{t('pricingCeiling.ceiling.col.frequency')}</Text>
          <Text style={styles.priceColValue}>{frequencyLabel(row.frequency)}</Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.priceColLabel}>{t('pricingCeiling.ceiling.col.effectiveFrom')}</Text>
          <Text style={styles.priceColValue}>{dayText(row.effectiveFrom)}</Text>
        </View>
      </View>

      <View style={styles.cardActionsRow}>
        <CardAction label={t('pricingCeiling.ceiling.action.view')} onPress={() => onView(row)} testID={`pricingCeiling.card.${row.id}.view`} />
        <CardAction label={t('pricingCeiling.ceiling.action.history')} onPress={() => onHistory(row)} testID={`pricingCeiling.card.${row.id}.history`} />
        {onRetail ? (
          <CardAction label={t('pricingCeiling.ceiling.action.retail')} onPress={onRetail} testID={`pricingCeiling.card.${row.id}.retail`} />
        ) : null}
      </View>
    </View>
  );
}

function CardAction({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.cardActionBtn} accessibilityRole="button" testID={testID}>
      <Text style={styles.cardActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function detailEntries(row: FairPriceRowView): SpecEntry[] {
  const dash = noValue();
  const entries: SpecEntry[] = [
    { key: 'product', label: t('pricingCeiling.details.product'), value: row.cropName ?? dash },
    { key: 'category', label: t('pricingCeiling.details.category'), value: dash },
    { key: 'grade', label: t('pricingCeiling.details.grade'), value: gradeLabel(row.grade) },
    { key: 'ceiling', label: t('pricingCeiling.details.ceiling'), value: priceText(row.ceilingPrice) },
    { key: 'frequency', label: t('pricingCeiling.details.frequency'), value: frequencyLabel(row.frequency) },
    { key: 'from', label: t('pricingCeiling.details.effectiveFrom'), value: dayText(row.effectiveFrom) },
    {
      key: 'until',
      label: t('pricingCeiling.details.effectiveUntil'),
      value: row.effectiveTo === null ? t('pricingCeiling.details.noEndDate') : dayText(row.effectiveTo),
    },
    { key: 'status', label: t('pricingCeiling.details.status'), value: windowStatusLabel(row.windowStatus) },
    { key: 'updatedBy', label: t('pricingCeiling.details.updatedBy'), value: dash },
    { key: 'lastUpdated', label: t('pricingCeiling.details.lastUpdated'), value: dash },
    { key: 'reason', label: t('pricingCeiling.details.reason'), value: dash },
  ];
  // The API's free-text notes are real data, so they are shown when present.
  if (row.notes !== null && row.notes.trim() !== '') {
    entries.push({ key: 'notes', label: t('pricingCeiling.details.notes'), value: row.notes });
  }
  return entries;
}

export function CeilingDetailsSheet({ row, onClose }: { row: FairPriceRowView | null; onClose: () => void }) {
  if (row === null) return null;
  return (
    <PricingSheet visible title={cropGradeTitle(row.cropName, row.grade)} onClose={onClose} closeTestID="pricingCeiling.details.close">
      <SpecTable entries={detailEntries(row)} />
      <Text style={styles.sheetSubheading}>{t('pricingCeiling.details.recentChanges')}</Text>
      <View style={styles.sheetNoteBlock}>
        <Text style={styles.sheetNoteText}>{t('pricingCeiling.details.recentChangesUnavailable')}</Text>
      </View>
    </PricingSheet>
  );
}
