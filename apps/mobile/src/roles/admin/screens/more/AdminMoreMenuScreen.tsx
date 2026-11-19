/**
 * The shared admin "More" menu: one screen for every admin role.
 *
 * Ported from the design (origin/tofhafarmfin-rbac AdminMoreMenuScreen): the
 * brand header with a back arrow, then one card row per destination with the
 * design's icon, label and chevron. The design chose between two row lists by
 * role name; here the rows come from moreMenuRows.ts, gated by rbac.json
 * codes (`can`), by what the host can open (`handlers`), and by what the host
 * already shows as a bottom tab (`hiddenRows`). See visibleMoreRows.
 *
 * The host owns navigation: this screen never decides where a row goes, it
 * calls the handler the host passed for that row.
 */
import React, { useEffect } from 'react';
import { Alert, BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { BackArrowWhiteIcon, ChevronRightIcon, MORE_ROW_ICONS } from './moreMenuIcons';
import { moreRowDef, visibleMoreRows, type MoreRowHandlers, type MoreRowId } from './moreMenuRows';
import { moreMenuStyles as styles } from './moreMenuStyles';

export type { MoreRowId } from './moreMenuRows';
export { visibleMoreRows } from './moreMenuRows';

export interface AdminMoreMenuScreenProps {
  onBack: () => void;
  /** Permission check from /auth/me. Missing means no code-gated rows (fail closed). */
  can: Can;
  /** What each row opens. A row with no handler still shows; it toasts "Not available yet" on press. */
  handlers: MoreRowHandlers;
  /** Rows the host already offers elsewhere (e.g. a bottom tab). */
  hiddenRows?: MoreRowId[];
  /** True when /auth/me says the user holds more than one role. */
  canSwitchRole?: boolean;
  onLogout: () => void;
}

export function AdminMoreMenuScreen({
  onBack,
  can,
  handlers,
  hiddenRows,
  canSwitchRole,
  onLogout,
}: AdminMoreMenuScreenProps) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const confirmLogout = () => {
    Alert.alert(t('moreMenu.logout.confirmTitle'), t('moreMenu.logout.confirmMessage'), [
      { text: t('moreMenu.logout.cancel'), style: 'cancel' },
      { text: t('moreMenu.logout.confirm'), style: 'destructive', onPress: onLogout },
    ]);
  };

  const rows = visibleMoreRows({ can, handlers, hiddenRows, canSwitchRole, onLogout });

  const onPressRow = (id: MoreRowId) => {
    if (id === 'logout') {
      confirmLogout();
      return;
    }
    const opener = handlers[id];
    if (opener) {
      opener();
    } else {
      Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <TouchableOpacity
          testID="moreMenu.back"
          style={styles.headerBackBtn}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('moreMenu.back')}
        >
          <BackArrowWhiteIcon />
          <Text style={styles.headerTitle}>{t('moreMenu.title')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {rows.map((id) => {
            const Icon = MORE_ROW_ICONS[id];
            const label = t(moreRowDef(id).labelKey);
            return (
              <TouchableOpacity
                key={id}
                testID={`moreMenu.row.${id}`}
                style={styles.menuItemCard}
                onPress={() => onPressRow(id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconBox}>
                    <Icon />
                  </View>
                  <Text style={[styles.menuItemLabel, id === 'logout' && styles.menuItemLabelDanger]}>{label}</Text>
                </View>
                <ChevronRightIcon />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
