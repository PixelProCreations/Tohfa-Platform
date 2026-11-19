import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import { CARD_ACTION_HIT_SLOP, farmingTypeLabel, type PersonalDetailsData } from './profileHelpers';
import { styles } from './profileStyles';

export function PersonalDetailsCard({
  personalDetails,
  onEdit,
}: {
  personalDetails: PersonalDetailsData;
  onEdit: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBox, styles.iconBoxViolet]}>
          <Icon name="person" size={18} color={P.violetAccent} />
        </View>
        <View style={styles.cardHeaderTitleBox}>
          <Text style={styles.cardTitle}>{t('farmer.profile.personal.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('farmer.profile.personal.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={CARD_ACTION_HIT_SLOP}>
          <Text style={styles.cardActionLink}>{t('farmer.common.edit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.fullName')}</Text>
        <Text style={styles.detailValue}>{personalDetails.fullName}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.dob')}</Text>
        <Text style={styles.detailValue}>{personalDetails.dob}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.mobile')}</Text>
        <Text style={styles.detailValue}>{personalDetails.mobile}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.aadhaar')}</Text>
        <Text style={styles.detailValue}>{personalDetails.aadhaar}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.yearsInOrganic')}</Text>
        <Text style={styles.detailValue}>
          {personalDetails.yearsInOrganic
            ? t('farmer.profile.yearsValue', { years: personalDetails.yearsInOrganic })
            : ''}
        </Text>
      </View>

      <View style={[styles.detailRow, styles.noBottomBorder]}>
        <Text style={styles.detailLabel}>{t('farmer.profile.farmingType')}</Text>
        <View style={styles.alignEnd}>
          <View style={styles.iconTextRow}>
            <Icon name="eco" size={13} color={colors.brandGreen} />
            <Text style={[styles.detailValue, styles.greenValue]}>
              {farmingTypeLabel(personalDetails.farmingType)}
            </Text>
          </View>
          {/* No backend field persists this yet (see handleSavePersonalDetails) --
                  say so rather than letting it look saved like the rest of the card. */}
          {personalDetails.farmingType ? (
            <Text style={styles.farmingTypeNote}>
              {t('farmer.profile.farmingType.notSavedNote')}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
