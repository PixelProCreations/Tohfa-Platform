/**
 * The design's "Filters" bottom sheet for the retail list, reduced to the one
 * field the API takes: Grade (GET /retail-prices `grade`). The design's
 * Category and Status dropdowns are not drawn: a retail price has no category
 * and no review status from the server. Draft values are applied on Apply;
 * Reset clears and applies.
 *
 * Mounted only while open (the caller decides), so the closed sheet adds no
 * text to the screen.
 */
import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { PRICING_GRADES } from '../../../api/pricing';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ChevronDownIcon } from './PricingIcons';
import { ALL_GRADES, gradeChoiceLabel, INITIAL_RETAIL_FILTERS, type GradeChoice, type RetailFilterValues } from './retailPricingLogic';
import { frameStyles as styles } from './pricingFrameStyles';

const GRADE_CHOICES: readonly GradeChoice[] = [ALL_GRADES, ...PRICING_GRADES];

export interface RetailFilterSheetProps {
  values: RetailFilterValues;
  onApply: (values: RetailFilterValues) => void;
  onClose: () => void;
}

export function RetailFilterSheet({ values, onApply, onClose }: RetailFilterSheetProps) {
  const [draftGrade, setDraftGrade] = useState<GradeChoice>(values.grade);
  const [gradeOpen, setGradeOpen] = useState(false);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetHeading}>{t('pricingRetail.filter.heading')}</Text>

          <Text style={styles.filterFieldLabel}>{t('pricingRetail.filter.grade')}</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setGradeOpen(!gradeOpen)}
            activeOpacity={0.8}
            accessibilityRole="button"
            testID="pricingRetail.filter.gradeBox"
          >
            <Text style={styles.dropdownSelectedText}>{gradeChoiceLabel(draftGrade)}</Text>
            <ChevronDownIcon size={18} color={adminColors.ink} />
          </TouchableOpacity>
          {gradeOpen ? (
            <View style={styles.dropdownMenu}>
              {GRADE_CHOICES.map((choice) => {
                const selected = draftGrade === choice;
                return (
                  <TouchableOpacity
                    key={choice}
                    style={[styles.dropdownOption, selected && styles.dropdownOptionSelected]}
                    onPress={() => {
                      setDraftGrade(choice);
                      setGradeOpen(false);
                    }}
                    activeOpacity={0.7}
                    testID={`pricingRetail.filter.grade.${choice}`}
                  >
                    <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionTextSelected]}>{gradeChoiceLabel(choice)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.sheetActionsRow}>
            <TouchableOpacity
              style={styles.pillBtn}
              onPress={() => onApply({ grade: draftGrade })}
              activeOpacity={0.8}
              testID="pricingRetail.filter.apply"
            >
              <Text style={styles.pillBtnBrandText}>{t('pricingRetail.filter.apply')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pillBtn}
              onPress={() => onApply(INITIAL_RETAIL_FILTERS)}
              activeOpacity={0.8}
              testID="pricingRetail.filter.reset"
            >
              <Text style={styles.pillBtnInkText}>{t('pricingRetail.filter.reset')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
