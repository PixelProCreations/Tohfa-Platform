/**
 * Categories & Grades (Market & Pricing phase 2B): the team design's
 * CategoriesGradesScreen (origin/tofhafarmfin-rbac) as ONE shared, view-only
 * layout (the design's Tohfa layout: Categories | Grades toggle, search,
 * cards, grade details sheet). There is no role prop.
 *
 * Grades are the fixed pricing enum with i18n labels. Categories have no
 * backend (owner decision D6), so the Categories tab is an empty state and the
 * design's category detail view (reached only from a category card) is not
 * drawn. The design's filter sheet (status, linked products, pricing records)
 * filters on data that does not exist, so its button is not drawn. No request
 * is made.
 */
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors } from '../../../theme';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { SearchIcon } from '../retail/PricingIcons';
import { PricingScreenFrame } from '../retail/PricingScreenFrame';
import { frameStyles } from '../retail/pricingFrameStyles';
import { noValue } from '../retail/retailPricingLogic';
import { categoriesAccess, gradeCards, type CategoriesTab, type GradeCardView } from './categoriesGradesLogic';
import { categoriesStyles as styles } from './categoriesGradesStyles';
import { GradeDetailSheet } from './GradeDetailSheet';

export interface CategoriesGradesScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
}

function TabButton({ tab, active, onPress }: { tab: CategoriesTab; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={`pricingCategories.tab.${tab}`}
    >
      <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>
        {t(tab === 'grades' ? 'pricingRetail.categories.tab.grades' : 'pricingRetail.categories.tab.categories')}
      </Text>
    </TouchableOpacity>
  );
}

function GradeCard({ card, onPress }: { card: GradeCardView; onPress: () => void }) {
  return (
    <View style={frameStyles.card}>
      <View style={frameStyles.cardHeaderRow}>
        <Text style={frameStyles.cardTitle}>{card.label}</Text>
      </View>
      <Text style={frameStyles.cardSubtitle1}>{t('pricingRetail.categories.card.meaning', { code: card.code, meaning: noValue() })}</Text>
      <Text style={frameStyles.cardSubtitle2}>{t('pricingRetail.categories.card.products', { products: noValue() })}</Text>
      <Text style={styles.cardSubtitle3}>{t('pricingRetail.categories.card.records', { count: noValue() })}</Text>
      <TouchableOpacity
        style={styles.cardActionBtn}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        testID={`pricingCategories.grade.${card.grade}`}
      >
        <Text style={frameStyles.linkText}>{t('pricingRetail.categories.card.viewDetails')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CategoriesGradesScreen({ onBack, can }: CategoriesGradesScreenProps) {
  const access = categoriesAccess(can);
  const [tab, setTab] = useState<CategoriesTab>('categories');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GradeCardView | null>(null);

  const frame = { title: t('pricingRetail.categories.title'), onBack, testIdPrefix: 'pricingCategories' };

  if (!access.canView) {
    return (
      <PricingScreenFrame {...frame}>
        <AdminEmptyState title={t('pricingRetail.notAvailable.title')} subtitle={t('pricingRetail.notAvailable.subtitle')} />
      </PricingScreenFrame>
    );
  }

  const cards = gradeCards(search);

  return (
    <PricingScreenFrame
      {...frame}
      onHardwareBack={() => {
        if (selected === null) return false;
        setSelected(null);
        return true;
      }}
      overlay={selected ? <GradeDetailSheet grade={selected} onClose={() => setSelected(null)} /> : null}
    >
      <View style={styles.segmentedContainer}>
        <TabButton tab="categories" active={tab === 'categories'} onPress={() => setTab('categories')} />
        <TabButton tab="grades" active={tab === 'grades'} onPress={() => setTab('grades')} />
      </View>

      {tab === 'categories' ? (
        <AdminEmptyState title={t('pricingRetail.categories.empty.title')} subtitle={t('pricingRetail.categories.empty.subtitle')} />
      ) : (
        <>
          <View style={frameStyles.searchBarContainer}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={frameStyles.searchInput}
              placeholder={t('pricingRetail.categories.search.placeholder')}
              placeholderTextColor={adminColors.placeholder}
              value={search}
              onChangeText={setSearch}
              testID="pricingCategories.search"
            />
          </View>
          <Text style={frameStyles.recordCountText}>{t('pricingRetail.categories.grades.count', { count: cards.length })}</Text>
          {cards.length === 0 ? <AdminEmptyState title={t('pricingRetail.categories.grades.empty')} /> : null}
          {cards.map((card) => (
            <GradeCard key={card.grade} card={card} onPress={() => setSelected(card)} />
          ))}
        </>
      )}
    </PricingScreenFrame>
  );
}
