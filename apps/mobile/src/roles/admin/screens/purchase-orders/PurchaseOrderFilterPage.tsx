/**
 * The design's full-page filter ("Filter Purchase Orders" / "Filter History").
 * As in the design, a chip applies at once and Apply closes the page.
 *
 * Chips the API cannot serve are kept and drawn disabled with a note:
 *  - "Collection Scheduled": the API has no such purchase-order status.
 */
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { t, type TranslationKey } from '../../i18n';
import { PurchaseOrdersFrame } from './PurchaseOrdersFrame';
import { chipStatusParam, PERIOD_CHIPS, PRODUCE_CHIPS, type PeriodChip, type ProduceChip, type StatusChip } from './purchaseOrdersLogic';
import { styles } from './purchaseOrdersStyles';

const STATUS_KEYS: Readonly<Record<StatusChip, TranslationKey>> = {
  ALL: 'purchaseOrders.filter.all',
  AWAITING_HANDOVER: 'purchaseOrders.filter.status.AWAITING_HANDOVER',
  COLLECTION_SCHEDULED: 'purchaseOrders.filter.status.COLLECTION_SCHEDULED',
  COMPLETED: 'purchaseOrders.filter.status.COMPLETED',
};

const PERIOD_KEYS: Readonly<Record<PeriodChip, TranslationKey>> = {
  ALL: 'purchaseOrders.filter.all',
  LAST_7: 'purchaseOrders.filter.period.LAST_7',
  LAST_30: 'purchaseOrders.filter.period.LAST_30',
};

interface ChipProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID: string;
}

function FilterChip({ label, active, disabled = false, onPress, testID }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive, disabled && styles.filterChipDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      testID={testID}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export interface PurchaseOrderFilterPageProps {
  title: string;
  statusChips: readonly StatusChip[];
  status: StatusChip;
  onStatus: (chip: StatusChip) => void;
  produce: ProduceChip;
  onProduce: (chip: ProduceChip) => void;
  /** The history page also has the period section. */
  showPeriod: boolean;
  period: PeriodChip;
  onPeriod: (chip: PeriodChip) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function PurchaseOrderFilterPage({
  title,
  statusChips,
  status,
  onStatus,
  produce,
  onProduce,
  showPeriod,
  period,
  onPeriod,
  onClearAll,
  onClose,
}: PurchaseOrderFilterPageProps) {
  const hasUnavailableStatus = statusChips.some((chip) => !chipStatusParam(chip).available);
  return (
    <PurchaseOrdersFrame title={title} onBack={onClose}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.filterScrollPad} showsVerticalScrollIndicator={false}>
        <View style={styles.filterCard}>
          <Text style={styles.filterSectionTitle}>{t('purchaseOrders.filter.status')}</Text>
          <View style={styles.chipRow}>
            {statusChips.map((chip) => (
              <FilterChip
                key={chip}
                label={t(STATUS_KEYS[chip])}
                active={status === chip}
                disabled={!chipStatusParam(chip).available}
                onPress={() => onStatus(chip)}
                testID={`purchaseOrders.filter.status.${chip}`}
              />
            ))}
          </View>
          {hasUnavailableStatus ? <Text style={styles.notAvailableNote}>{t('purchaseOrders.filter.statusNotAvailable')}</Text> : null}

          <Text style={[styles.filterSectionTitle, styles.filterSectionSpacing]}>{t('purchaseOrders.filter.produce')}</Text>
          <View style={styles.chipRow}>
            {PRODUCE_CHIPS.map((chip) => (
              <FilterChip
                key={chip}
                label={chip === 'ALL' ? t('purchaseOrders.filter.all') : chip}
                active={produce === chip}
                onPress={() => onProduce(chip)}
                testID={`purchaseOrders.filter.produce.${chip}`}
              />
            ))}
          </View>

          {showPeriod ? (
            <>
              <Text style={[styles.filterSectionTitle, styles.filterSectionSpacing]}>{t('purchaseOrders.filter.period')}</Text>
              <View style={styles.chipRow}>
                {PERIOD_CHIPS.map((chip) => (
                  <FilterChip
                    key={chip}
                    label={t(PERIOD_KEYS[chip])}
                    active={period === chip}
                    onPress={() => onPeriod(chip)}
                    testID={`purchaseOrders.filter.period.${chip}`}
                  />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={onClearAll}
              activeOpacity={0.7}
              accessibilityRole="button"
              testID="purchaseOrders.filter.clearAll"
            >
              <Text style={styles.modalResetText}>{t('purchaseOrders.filter.clearAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              testID="purchaseOrders.filter.apply"
            >
              <Text style={styles.modalApplyText}>{t('purchaseOrders.filter.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </PurchaseOrdersFrame>
  );
}
