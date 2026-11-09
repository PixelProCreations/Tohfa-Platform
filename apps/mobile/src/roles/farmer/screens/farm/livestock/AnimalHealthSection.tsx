/**
 * Health tab of AnimalDetailScreen: Dev's design (organic notice, withdrawal
 * banner, VACCINATIONS / DEWORMING / CHECKUP & TREATMENT cards) filled from
 * GET /farmers/me/livestock/animals/{id}/health-records instead of sample rows.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { authPalette as P, colors } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import type { AnimalResponse } from '../../../api/livestock';
import { AnimalRecordFormModal } from './AnimalRecordFormModal';
import { changesWithdrawal } from './animalRecordForms';
import {
  DewormingBottleIcon,
  LeafIcon,
  ProhibitedCircleIcon,
  StethoscopeIcon,
  VaccineVialsIcon,
} from './animalDetailIcons';
import { AddRecordButton, SectionState, ShowMoreRow, type SectionProps } from './animalDetailSectionParts';
import { daysBetween, formatDayMonth, splitHealthRecords, type HealthRow } from './animalRecordView';
import { todayInKolkata } from '../../certifications/certificationForm';
import { useAnimalHealthRecords } from './useAnimalRecords';

export interface AnimalHealthSectionProps extends SectionProps {
  animal: AnimalResponse;
  withdrawalActive: boolean;
  /**
   * Re-reads the animal after a treatment that carried a withdrawal window:
   * the server moved `withdrawalUntil` (BR-138), and the banner is driven by it.
   */
  onAnimalChanged?: (() => void) | undefined;
}

/** Stands in for the date while translating, so the date can be bolded wherever the language puts it. */
const DATE_MARK = '\u0001';

/** "Clears <b>12 Jul</b> · 6 days left." as text runs, from one translated sentence. */
function withdrawalBodyParts(withdrawalUntil: string): Array<{ text: string; bold: boolean }> {
  const sentence = t('farmer.livestock.detail.health.withdrawalBody', {
    date: DATE_MARK,
    // withdrawalUntil is an Asia/Kolkata date (the server's "today"), so count from the IST date.
    count: Math.max(0, daysBetween(todayInKolkata(), withdrawalUntil)),
  });
  const date = formatDayMonth(withdrawalUntil);
  return sentence
    .split(DATE_MARK)
    .flatMap((text, idx) => (idx === 0 ? [{ text, bold: false }] : [{ text: date, bold: true }, { text, bold: false }]))
    .filter((part) => part.text.length > 0);
}

function DueRows({
  rows,
  styles,
  kind,
}: SectionProps & { rows: HealthRow[]; kind: 'vaccination' | 'deworming' }): React.JSX.Element {
  return (
    <>
      {rows.map((row, idx) => (
        <React.Fragment key={row.id}>
          {idx > 0 && <View style={styles.dividerLine} />}
          <View style={styles.itemRow} testID={`animalDetail.health.${kind}:${row.id}`}>
            <View style={styles.greenIconSquare}>
              {kind === 'vaccination' ? (
                <VaccineVialsIcon size={17} color={colors.brandGreen} />
              ) : (
                <DewormingBottleIcon size={17} color={colors.brandGreen} />
              )}
            </View>
            <View style={styles.itemMainCol}>
              <Text style={styles.itemTitle}>{row.title}</Text>
              <Text style={styles.itemSubtitle}>{row.subtitle}</Text>
            </View>
            {row.nextBadge ? (
              <View style={styles.dueDateBadge}>
                <Text style={styles.dueDateBadgeText}>{row.nextBadge}</Text>
              </View>
            ) : null}
          </View>
        </React.Fragment>
      ))}
    </>
  );
}

export function AnimalHealthSection({
  animal,
  withdrawalActive,
  onAnimalChanged,
  styles,
}: AnimalHealthSectionProps): React.JSX.Element {
  const healthList = useAnimalHealthRecords(animal.id, true);
  const sections = splitHealthRecords(healthList.items);
  const [adding, setAdding] = useState(false);

  return (
    <View style={styles.tabContentContainer}>
      {/* Notice 1: Organic Standard */}
      <View style={styles.organicNoticeCard}>
        <View style={styles.organicNoticeIconCol}>
          <LeafIcon size={18} color={colors.brandGreen} />
        </View>
        <Text style={styles.organicNoticeText}>{t('farmer.livestock.detail.health.organicNotice')}</Text>
      </View>

      {/* Notice 2: Milk not sellable withdrawal alert — real, from animal.withdrawalUntil */}
      {withdrawalActive && animal.withdrawalUntil && (
        <View style={styles.withdrawalAlertCard} testID="animalDetail.withdrawalBanner">
          <View style={styles.withdrawalLeftAccentBar} />
          <View style={styles.withdrawalCardInner}>
            <View style={styles.withdrawalHeaderRow}>
              <ProhibitedCircleIcon size={19} color={P.twOrange700} />
              <Text style={styles.withdrawalTitle}>{t('farmer.livestock.detail.health.withdrawalTitle')}</Text>
            </View>
            <Text style={styles.withdrawalBody}>
              {withdrawalBodyParts(animal.withdrawalUntil).map((part, idx) =>
                part.bold ? (
                  <Text key={idx} style={styles.boldText}>
                    {part.text}
                  </Text>
                ) : (
                  <React.Fragment key={idx}>{part.text}</React.Fragment>
                ),
              )}
            </Text>
          </View>
        </View>
      )}

      <AddRecordButton
        label={t('farmer.livestock.detail.form.addHealth')}
        onPress={() => setAdding(true)}
        testID="animalDetail.health.add"
        styles={styles}
      />
      {adding ? (
        <AnimalRecordFormModal
          kind="health"
          animalId={animal.id}
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false);
            healthList.refresh();
            if (changesWithdrawal(saved.record)) onAnimalChanged?.();
          }}
        />
      ) : null}

      {healthList.state !== 'ready' ? (
        <SectionState list={healthList} testID="animalDetail.health" styles={styles} />
      ) : (
        <>
          {/* Section: VACCINATIONS */}
          <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.health.vaccinations')}</Text>
          <View style={styles.whiteCardContainer}>
            {sections.vaccinations.length === 0 ? (
              <Text style={styles.itemSubtitle} testID="animalDetail.health.empty.vaccinations">
                {t('farmer.livestock.detail.health.emptyVaccinations')}
              </Text>
            ) : (
              <DueRows rows={sections.vaccinations} kind="vaccination" styles={styles} />
            )}
          </View>

          {/* Section: DEWORMING */}
          <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.health.deworming')}</Text>
          <View style={styles.whiteCardContainer}>
            {sections.dewormings.length === 0 ? (
              <Text style={styles.itemSubtitle} testID="animalDetail.health.empty.deworming">
                {t('farmer.livestock.detail.health.emptyDeworming')}
              </Text>
            ) : (
              <DueRows rows={sections.dewormings} kind="deworming" styles={styles} />
            )}
          </View>

          {/* Section: CHECKUP & TREATMENT */}
          <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.health.checkupTreatment')}</Text>
          <View style={styles.whiteCardContainer}>
            {sections.checkups.length === 0 ? (
              <Text style={styles.itemSubtitle} testID="animalDetail.health.empty.checkups">
                {t('farmer.livestock.detail.health.emptyCheckups')}
              </Text>
            ) : (
              sections.checkups.map((chk, idx) => (
                <React.Fragment key={chk.id}>
                  {idx > 0 && <View style={styles.dividerLine} />}
                  <View style={styles.checkupCardContent} testID={`animalDetail.health.checkup:${chk.id}`}>
                    <View style={styles.checkupHeaderRow}>
                      <View style={styles.checkupTitleWithIcon}>
                        <StethoscopeIcon size={18} color={P.twBlue700} />
                        <Text style={styles.checkupTitle}>{chk.title}</Text>
                      </View>
                      {chk.doctor ? <Text style={styles.checkupDoctor}>{chk.doctor}</Text> : null}
                    </View>
                    {chk.description ? <Text style={styles.checkupDescription}>{chk.description}</Text> : null}
                  </View>
                </React.Fragment>
              ))
            )}
          </View>
          <ShowMoreRow list={healthList} testID="animalDetail.health.showMore" styles={styles} />
        </>
      )}
    </View>
  );
}
