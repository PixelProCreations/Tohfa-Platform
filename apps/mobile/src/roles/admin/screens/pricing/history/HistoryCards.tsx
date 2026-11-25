/**
 * One price-change record card, its details sheet, and the counter-offer
 * section, after the team design's PriceHistoryScreen (Tohfa layout).
 *
 * Records are ceiling windows (CeilingHistoryRowView): previous -> new
 * ceiling as Money strings, effective date, window status. The design's
 * Valid / Failed badge, changed-by name, change reason, recorded time,
 * validation text and audit-log reference have no API source and show the
 * dash; the setter's uuid is never shown.
 *
 * The design's "This record cannot be edited or deleted" lock notice is not
 * drawn: fair_prices has no append-only guard in the database (unlike the
 * ledgers), so the claim would be unbacked.
 *
 * Counter-offers: there is no admin counter-offer history endpoint, so the
 * section is an empty state (owner decision).
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { CeilingHistoryRowView } from '../../../api/pricingTypes';
import { t, type TranslationKey } from '../../../i18n';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { cropGradeTitle, dayText, noValue, priceText, windowStatusLabel, windowStatusTone } from '../ceiling/pricingLogic';
import { PricingBadge, PricingSheet, SpecTable, type SpecEntry } from '../ceiling/PricingParts';
import { styles } from '../ceiling/pricingStyles';

function priceTypeLabel(row: CeilingHistoryRowView): string {
  return t(`pricingCeiling.history.priceType.${row.priceType}` as TranslationKey);
}

function changeLine(row: CeilingHistoryRowView): string {
  return t('pricingCeiling.history.change', {
    previous: priceText(row.previousCeiling),
    next: priceText(row.newCeiling),
    date: dayText(row.effectiveFrom),
  });
}

export function HistoryCard({ row, onPress }: { row: CeilingHistoryRowView; onPress: (row: CeilingHistoryRowView) => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(row)} activeOpacity={0.85} accessibilityRole="button" testID={`pricingHistory.card.${row.id}`}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{`${cropGradeTitle(row.cropName, row.grade)} · ${priceTypeLabel(row)}`}</Text>
        <PricingBadge label={windowStatusLabel(row.windowStatus)} tone={windowStatusTone(row.windowStatus)} />
      </View>
      <Text style={styles.cardSubtitle1}>{changeLine(row)}</Text>
      <Text style={styles.cardSubtitle2}>{t('pricingCeiling.history.changedByLine', { name: noValue() })}</Text>
    </TouchableOpacity>
  );
}

function detailEntries(row: CeilingHistoryRowView): SpecEntry[] {
  const dash = noValue();
  const entries: SpecEntry[] = [
    { key: 'productGrade', label: t('pricingCeiling.history.details.productGrade'), value: cropGradeTitle(row.cropName, row.grade) },
    { key: 'priceType', label: t('pricingCeiling.history.details.priceType'), value: priceTypeLabel(row) },
    { key: 'previous', label: t('pricingCeiling.history.details.previous'), value: priceText(row.previousCeiling) },
    { key: 'next', label: t('pricingCeiling.history.details.next'), value: priceText(row.newCeiling) },
    { key: 'reason', label: t('pricingCeiling.history.details.changeReason'), value: dash },
    { key: 'changedBy', label: t('pricingCeiling.history.details.changedBy'), value: dash },
    { key: 'recorded', label: t('pricingCeiling.history.details.recorded'), value: dash },
    { key: 'effective', label: t('pricingCeiling.history.details.effectiveDate'), value: dayText(row.effectiveFrom) },
    {
      key: 'until',
      label: t('pricingCeiling.history.details.effectiveUntil'),
      value: row.effectiveTo === null ? t('pricingCeiling.details.noEndDate') : dayText(row.effectiveTo),
    },
    { key: 'status', label: t('pricingCeiling.history.details.status'), value: windowStatusLabel(row.windowStatus) },
    { key: 'validation', label: t('pricingCeiling.history.details.validation'), value: dash },
    { key: 'auditRef', label: t('pricingCeiling.history.details.auditRef'), value: dash },
  ];
  // The API's free-text notes are real data (not a structured reason), so they are shown when present.
  if (row.notes !== null && row.notes.trim() !== '') {
    entries.push({ key: 'notes', label: t('pricingCeiling.details.notes'), value: row.notes });
  }
  return entries;
}

export function HistoryDetailsSheet({ row, onClose }: { row: CeilingHistoryRowView | null; onClose: () => void }) {
  if (row === null) return null;
  return (
    <PricingSheet visible title={t('pricingCeiling.history.details.title')} onClose={onClose} closeTestID="pricingHistory.details.close">
      <SpecTable entries={detailEntries(row)} />
      <Text style={styles.sheetNoteText}>{t('pricingCeiling.history.details.lockNotice')}</Text>
    </PricingSheet>
  );
}

/** The design's counter-offer list: no admin endpoint exists, so an empty state. */
export function CounterOffersSection() {
  return (
    <View>
      <Text style={styles.sectionHeaderTitle}>{t('pricingCeiling.history.counterOffers.title')}</Text>
      <View style={styles.emptyCard}>
        <AdminEmptyState title={t('pricingCeiling.history.counterOffers.empty')} />
      </View>
    </View>
  );
}
