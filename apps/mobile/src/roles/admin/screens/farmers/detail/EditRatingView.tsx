/**
 * Edit Farm Rating (team design, images 3 & 4): the accordion of categories
 * with 1-10 score buttons and a notes box, behind `farmer.rating.edit` (the
 * shell opens it only for access.canEditRating).
 *
 * It starts from the API's category scores (editRatingDraft), never from
 * fixtures. The selections are local only.
 */
// DESIGN-ONLY: no endpoint yet, owner decision pending. Rating edit was removed
// server-side by BR-06e and the owner is reversing it; until the backend lands,
// Save Rating stays disabled and shows the not-available note. It must never
// write, never pretend to succeed and never change the displayed rating.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import type { FarmerDetailView, FarmerRatingView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { HeaderBanner, ProfileSummaryCard } from './DetailHeader';
import { ChevronIcon } from './icons';
import { EDIT_RATING_SAVE_AVAILABLE, editRatingDraft, ratingCategoryLabel } from './model';
import { EmptyCard } from './parts';
import { detailStyles as s } from './styles';

const SCORE_ROWS: readonly (readonly number[])[] = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];

export function EditRatingView({
  farmer,
  rating,
  onBack,
}: {
  farmer: FarmerDetailView;
  rating: FarmerRatingView | undefined;
  onBack: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number | null>>(() => (rating === undefined ? {} : editRatingDraft(rating)));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const codes = rating?.categories.map((c) => c.code) ?? [];
  const [expanded, setExpanded] = useState<string | null>(codes[0] ?? null);

  return (
    <>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <HeaderBanner title={t('farmerDetail.rating.editTitle')} onBack={onBack} />
      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, s.scrollContentWithBar]} showsVerticalScrollIndicator={false}>
        <ProfileSummaryCard farmer={farmer} />
        <Text style={e.sectionTitle}>{t('farmerDetail.rating.edit')}</Text>
        {codes.length === 0 ? <EmptyCard text={t('farmerDetail.rating.categoriesEmpty')} /> : null}
        {rating?.categories.map((cat) => {
          const isExpanded = expanded === cat.code;
          const score = scores[cat.code] ?? null;
          return (
            <View key={cat.code} style={e.accordionCard}>
              <TouchableOpacity style={e.accordionHeader} onPress={() => setExpanded(isExpanded ? null : cat.code)} activeOpacity={0.7}>
                <Text style={e.accordionTitle}>{ratingCategoryLabel(cat.code)}</Text>
                <View style={e.scorePill}>
                  <Text style={e.scorePillText}>
                    {t('farmerDetail.rating.categoryScore', { score: score ?? t('farmerDetail.noValue'), max: cat.maxScore })}
                  </Text>
                </View>
                <ChevronIcon up={isExpanded} />
              </TouchableOpacity>
              {isExpanded ? (
                <View style={e.accordionBody}>
                  {SCORE_ROWS.map((row) => (
                    <View key={row.join('-')} style={e.scoreRow}>
                      {row.map((n) => {
                        const selected = score === n;
                        return (
                          <TouchableOpacity
                            key={n}
                            style={[e.scoreButton, selected && e.scoreButtonSelected]}
                            onPress={() => setScores((prev) => ({ ...prev, [cat.code]: n }))}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                          >
                            <Text style={[e.scoreButtonText, selected && e.scoreButtonTextSelected]}>{String(n)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                  <TextInput
                    style={e.notesInput}
                    placeholder={t('farmerDetail.rating.notes')}
                    placeholderTextColor={adminColors.placeholder}
                    multiline
                    value={notes[cat.code] ?? ''}
                    onChangeText={(value) => setNotes((prev) => ({ ...prev, [cat.code]: value }))}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={s.bottomBar}>
        {/* DESIGN-ONLY: no endpoint yet, owner decision pending. */}
        <Text style={s.bottomBarNote}>{t('farmerDetail.designOnly.ratingSave')}</Text>
        <TouchableOpacity
          style={[s.bottomBarButton, !EDIT_RATING_SAVE_AVAILABLE && s.bottomBarButtonDisabled]}
          disabled={!EDIT_RATING_SAVE_AVAILABLE}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !EDIT_RATING_SAVE_AVAILABLE }}
        >
          <Text style={s.bottomBarButtonText}>{t('farmerDetail.rating.save')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const e = StyleSheet.create({
  sectionTitle: { ...adminType.title, color: adminColors.brandDeep, marginTop: adminSpacing.sm, marginBottom: adminSpacing.md },
  accordionCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    marginBottom: adminSpacing.smMd,
    overflow: 'hidden',
  },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: adminSpacing.lg, paddingVertical: adminSpacing.mdLg },
  accordionTitle: { ...adminType.rowTitle, flex: 1, color: adminColors.ink },
  scorePill: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.smMd,
    paddingVertical: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  scorePillText: { ...adminType.rowTitle, color: adminColors.ink },
  accordionBody: { paddingHorizontal: adminSpacing.mdLg, paddingBottom: adminSpacing.mdLg, paddingTop: adminSpacing.xs },
  scoreRow: { flexDirection: 'row', gap: adminSpacing.xsSm, marginBottom: adminSpacing.xsSm },
  scoreButton: {
    flex: 1,
    height: adminSpacing.largeSection + adminSpacing.xs / 2,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonSelected: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  scoreButtonText: { ...adminType.sectionHead, color: adminColors.ink },
  scoreButtonTextSelected: { color: adminColors.onBrand },
  notesInput: {
    ...adminType.body,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    minHeight: adminSpacing.modalGap,
    textAlignVertical: 'top',
    marginTop: adminSpacing.sm,
    color: adminColors.ink,
  },
});
