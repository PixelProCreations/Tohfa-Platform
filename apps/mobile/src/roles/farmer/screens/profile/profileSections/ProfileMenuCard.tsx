import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import { styles } from './profileStyles';

export function ProfileMenuCard({
  onBankPress,
  onHelpPress,
}: {
  onBankPress: () => void;
  onHelpPress: () => void;
}): React.JSX.Element {
  return (
    <View style={[styles.cardContainer, styles.menuCardTight]}>
      <TouchableOpacity style={styles.menuItemRow} onPress={onBankPress} activeOpacity={0.7}>
        <View style={[styles.menuIconBox, styles.iconBoxGreen]}>
          <Icon name="credit_card" size={18} color={colors.brandGreen} />
        </View>
        <View style={styles.menuTitleBox}>
          <Text style={styles.menuTitle}>{t('farmer.profile.menu.bank')}</Text>
          <Text style={styles.menuSubtitle}>{t('farmer.profile.menu.bankSubtitle')}</Text>
        </View>
        <Icon name="chevron_right" size={18} color={P.slate400} />
      </TouchableOpacity>

      <View style={styles.menuDivider} />

      <TouchableOpacity style={styles.menuItemRow} onPress={onHelpPress} activeOpacity={0.7}>
        <View style={[styles.menuIconBox, styles.iconBoxOrange]}>
          <Icon name="help" size={18} color={P.twOrange600} />
        </View>
        <View style={styles.menuTitleBox}>
          <Text style={styles.menuTitle}>{t('farmer.profile.menu.help')}</Text>
          <Text style={styles.menuSubtitle}>{t('farmer.profile.menu.helpSubtitle')}</Text>
        </View>
        <Icon name="chevron_right" size={18} color={P.slate400} />
      </TouchableOpacity>
    </View>
  );
}
