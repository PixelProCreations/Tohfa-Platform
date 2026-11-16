/**
 * The design's "Grade: …" details bottom sheet. Only the grade label is real;
 * meaning and criteria, status, pricing-record count and products have no
 * backend (owner decision D6) and are the placeholder. Mounted only while a
 * grade is selected.
 */
import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { t, type TranslationKey } from '../../../i18n';
import { frameStyles } from '../retail/pricingFrameStyles';
import { noValue } from '../retail/retailPricingLogic';
import type { GradeCardView } from './categoriesGradesLogic';
import { categoriesStyles as styles } from './categoriesGradesStyles';

export interface GradeDetailSheetProps {
  grade: GradeCardView;
  onClose: () => void;
}

function SpecRow({ label, value, last = false }: { label: TranslationKey; value: string; last?: boolean }) {
  return (
    <>
      <View style={styles.specRow}>
        <Text style={styles.specKey}>{t(label)}</Text>
        <Text style={styles.specValBold}>{value}</Text>
      </View>
      {last ? null : <View style={styles.dottedDivider} />}
    </>
  );
}

export function GradeDetailSheet({ grade, onClose }: GradeDetailSheetProps) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={frameStyles.modalOverlay} onPress={onClose}>
        <Pressable style={frameStyles.sheetContainer} onPress={(e) => e.stopPropagation()} testID="pricingCategories.sheet">
          <Text style={frameStyles.sheetHeading}>{t('pricingRetail.categories.sheet.title', { label: grade.label })}</Text>
          <View style={styles.detailCard}>
            <SpecRow label="pricingRetail.categories.sheet.grade" value={grade.label} />
            <SpecRow label="pricingRetail.categories.sheet.meaning" value={noValue()} />
            <SpecRow label="pricingRetail.categories.sheet.status" value={noValue()} />
            <SpecRow label="pricingRetail.categories.sheet.records" value={noValue()} />
            <SpecRow label="pricingRetail.categories.sheet.products" value={noValue()} last />
          </View>
          <Text style={styles.sheetFootnote}>{t('pricingRetail.categories.sheet.footnote')}</Text>
          <TouchableOpacity style={styles.sheetCloseBtn} onPress={onClose} activeOpacity={0.8} testID="pricingCategories.sheet.close">
            <Text style={frameStyles.pillBtnInkText}>{t('pricingRetail.categories.sheet.close')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
