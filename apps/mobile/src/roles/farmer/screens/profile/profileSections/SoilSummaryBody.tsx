import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import type { SoilTestRecord } from '../../../api/soil';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P } from '../../../theme';
import { formatShortDate } from './profileHelpers';
import { styles } from './profileStyles';

/** Real latest-soil-test summary -- shared by the Soil Test card and its modal.
 *  `null` renders the same honest "no test yet" state SoilTestScreen uses;
 *  every field left null by a real record shows a dash, never a sample value. */
export function SoilSummaryBody({ test }: { test: SoilTestRecord | null }): React.JSX.Element {
  if (test === null) {
    return (
      <View>
        <Text style={styles.soilDateValue}>{t('farmer.profile.soil.noTestYet')}</Text>
        <Text style={[styles.soilDateLabel, styles.noTestYetHint]}>
          {t('farmer.profile.soil.noTestYetHint')}
        </Text>
      </View>
    );
  }

  const isAcidic = test.ph < 6.0;
  const isAlkaline = test.ph > 7.5;

  return (
    <>
      <View style={styles.soilDateStrip}>
        <View>
          <Text style={styles.soilDateLabel}>{t('farmer.profile.soil.lastTested')}</Text>
          <Text style={styles.soilDateValue}>{formatShortDate(test.testDate)}</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={styles.soilDateLabel}>{t('farmer.profile.soil.nextDue')}</Text>
          <Text style={styles.soilDateValue}>{formatShortDate(test.nextDueDate)}</Text>
        </View>
      </View>

      <View style={styles.soilGridContainer}>
        <View style={styles.soilGridTile}>
          <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.organicCarbon')}</Text>
          <Text style={styles.soilTileValue}>{test.organicCarbonPct}%</Text>
          <View style={[styles.soilBadge, styles.soilBadgeGreen]}>
            <Text style={[styles.soilBadgeText, styles.soilBadgeTextGreen]}>
              {test.organicCarbonLabel}
            </Text>
          </View>
        </View>

        <View style={styles.soilGridTile}>
          <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.ph')}</Text>
          <Text style={styles.soilTileValue}>{test.ph}</Text>
          <View
            style={[styles.soilBadge, isAcidic ? styles.soilBadgeAlert : styles.soilBadgeGreen]}
          >
            <Text
              style={[
                styles.soilBadgeText,
                isAcidic ? styles.soilBadgeTextAlert : styles.soilBadgeTextGreen,
              ]}
            >
              {test.phLabel}
            </Text>
          </View>
        </View>

        <View style={styles.soilGridTile}>
          <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.ec')}</Text>
          <Text style={styles.soilTileValue}>{test.ecDsPerM}</Text>
          <View style={[styles.soilBadge, styles.soilBadgeGreen]}>
            <Text style={[styles.soilBadgeText, styles.soilBadgeTextGreen]}>{test.ecLabel}</Text>
          </View>
        </View>

        <View style={styles.soilGridTile}>
          <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.tds')}</Text>
          <Text style={styles.soilTileValue}>
            {test.tdsPpm != null ? `${test.tdsPpm} ppm` : '—'}
          </Text>
          {test.tdsLabel ? (
            <View style={[styles.soilBadge, styles.soilBadgeWarn]}>
              <Text style={[styles.soilBadgeText, styles.soilBadgeTextWarn]}>{test.tdsLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.soilAdvisoryBox}>
        <Icon name="warning" size={16} color={P.red800} />
        <Text style={styles.soilAdvisoryText}>
          {isAcidic
            ? t('farmer.profile.soil.advisory')
            : isAlkaline
              ? t('farmer.profile.soil.advisoryAlkaline')
              : t('farmer.profile.soil.advisoryOptimal')}
        </Text>
      </View>
    </>
  );
}
