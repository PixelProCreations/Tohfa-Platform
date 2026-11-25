/**
 * The design's "Filters" bottom sheet (FairPriceCeiling and PriceHistory
 * share the same pattern): dropdown fields, an optional "In force on" date,
 * Apply and Reset.
 *
 * Only fields the API can filter by are live: Grade (both lists) and In force
 * on (the ceiling list's effectiveOn). The design's Category, Records
 * (Current / Scheduled / Historical) and history Status fields have no API
 * filter, so they are drawn disabled with the dash and a "Not available yet"
 * hint instead of fake options.
 *
 * Edits stay in a draft until Apply; an invalid date keeps the sheet open
 * with a message and changes nothing.
 */
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import {
  GRADE_FILTER_OPTIONS,
  gradeFilterLabel,
  noValue,
  parseInForceDate,
  type CeilingFilterState,
  type GradeFilter,
} from './pricingLogic';
import { PricingSheet } from './PricingParts';
import { CalendarEventIcon, ChevronDownIcon } from './PricingIcons';
import { styles } from './pricingStyles';

export interface PricingFilterSheetProps {
  visible: boolean;
  applied: CeilingFilterState;
  /** Show the "In force on" date field (ceiling list only). */
  showDate: boolean;
  /** Labels of the design fields that have no API filter (drawn disabled). */
  unavailableFields: readonly string[];
  onApply: (next: CeilingFilterState) => void;
  onReset: () => void;
  onClose: () => void;
}

export function PricingFilterSheet({ visible, applied, showDate, unavailableFields, onApply, onReset, onClose }: PricingFilterSheetProps) {
  const [draft, setDraft] = useState<CeilingFilterState>(applied);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Each opening starts from what is applied, as in the design.
  useEffect(() => {
    if (visible) {
      setDraft(applied);
      setGradeOpen(false);
      setDateError(false);
    }
  }, [visible, applied]);

  const apply = () => {
    if (showDate && parseInForceDate(draft.inForceOn).kind === 'invalid') {
      setDateError(true);
      return;
    }
    onApply(draft);
  };

  const pickGrade = (grade: GradeFilter) => {
    setDraft((d) => ({ ...d, grade }));
    setGradeOpen(false);
  };

  return (
    <PricingSheet visible={visible} title={t('pricingCeiling.filter.title')} onClose={onClose} closeTestID="pricingCeiling.filter.close">
      {unavailableFields.slice(0, 1).map((label) => (
        <UnavailableField key={label} label={label} />
      ))}

      <Text style={styles.filterFieldLabel}>{t('pricingCeiling.filter.grade')}</Text>
      <TouchableOpacity
        style={styles.dropdownBox}
        onPress={() => setGradeOpen((open) => !open)}
        activeOpacity={0.8}
        accessibilityRole="button"
        testID="pricingCeiling.filter.gradeBox"
      >
        <Text style={styles.dropdownSelectedText}>{gradeFilterLabel(draft.grade)}</Text>
        <ChevronDownIcon />
      </TouchableOpacity>
      {gradeOpen ? (
        <View style={styles.dropdownMenu}>
          {GRADE_FILTER_OPTIONS.map((grade) => {
            const selected = draft.grade === grade;
            return (
              <TouchableOpacity
                key={grade}
                style={[styles.dropdownOption, selected && styles.dropdownOptionSelected]}
                onPress={() => pickGrade(grade)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`pricingCeiling.filter.grade.${grade}`}
              >
                <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionTextSelected]}>{gradeFilterLabel(grade)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {showDate ? (
        <>
          <Text style={styles.filterFieldLabel}>{t('pricingCeiling.filter.inForceOn')}</Text>
          <View style={styles.dateInputBox}>
            <TextInput
              style={styles.dateTextInput}
              placeholder={t('pricingCeiling.filter.datePlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={draft.inForceOn}
              onChangeText={(inForceOn) => {
                setDraft((d) => ({ ...d, inForceOn }));
                setDateError(false);
              }}
              keyboardType="numbers-and-punctuation"
              testID="pricingCeiling.filter.date"
            />
            <CalendarEventIcon />
          </View>
          {dateError ? <Text style={styles.fieldError}>{t('pricingCeiling.filter.dateInvalid')}</Text> : null}
        </>
      ) : null}

      {unavailableFields.slice(1).map((label) => (
        <UnavailableField key={label} label={label} />
      ))}

      <View style={styles.filterActionsRow}>
        <TouchableOpacity style={styles.pillBtn} onPress={apply} activeOpacity={0.8} accessibilityRole="button" testID="pricingCeiling.filter.apply">
          <Text style={styles.applyBtnText}>{t('pricingCeiling.filter.apply')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillBtn} onPress={onReset} activeOpacity={0.8} accessibilityRole="button" testID="pricingCeiling.filter.reset">
          <Text style={styles.resetBtnText}>{t('pricingCeiling.filter.reset')}</Text>
        </TouchableOpacity>
      </View>
    </PricingSheet>
  );
}

/** A design field with no API filter: the dash, disabled, with a hint. */
function UnavailableField({ label }: { label: string }) {
  return (
    <>
      <Text style={styles.filterFieldLabel}>{label}</Text>
      <View style={[styles.dropdownBox, styles.dropdownBoxDisabled]} accessibilityState={{ disabled: true }}>
        <Text style={styles.dropdownSelectedText}>{noValue()}</Text>
        <Text style={styles.dropdownHint}>{t('pricingCeiling.filter.notAvailable')}</Text>
      </View>
    </>
  );
}
