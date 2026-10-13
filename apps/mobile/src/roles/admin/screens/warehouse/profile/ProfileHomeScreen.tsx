/**
 * Profile home — `GET /auth/me` (`auth.principal.view_own`), read-only, plus
 * the menu into the settings screens this admin may use.
 *
 * Shows only what the API returns (BR-67g additive fields included):
 * name, role, warehouse, mobile and e-mail (locked, BR-33), language, account
 * status, member-since and last sign-in (`null` = never; no time invented).
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button } from '@tohfa/mobile-ui';
import { getMe } from '../../../api/profile';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { isWarehouseFeatureVisible, type WarehouseFeatureId } from '../availability';
import { AsyncStates } from '../shared/AsyncStates';
import { InfoRow, InfoSection, MenuRow } from '../shared/InfoSection';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { adminRoleLabelKey, toProfile, type ProfileModel } from './mappers';

export const PROFILE_RESOURCE = 'profile';

export type ProfileDestination = 'edit' | 'password' | 'sessions' | 'notifications' | 'help';

const MENU: readonly {
  screen: ProfileDestination;
  feature: WarehouseFeatureId;
  icon: string;
  labelKey: Parameters<typeof t>[0];
}[] = [
  { screen: 'edit', feature: 'adminProfile', icon: 'edit', labelKey: 'admin.profile.menu.edit' },
  { screen: 'password', feature: 'changePassword', icon: 'lock', labelKey: 'admin.profile.menu.password' },
  { screen: 'sessions', feature: 'activeSessions', icon: 'verified_user', labelKey: 'admin.profile.menu.sessions' },
  {
    screen: 'notifications',
    feature: 'notificationSettings',
    icon: 'notifications',
    labelKey: 'admin.profile.menu.notifications',
  },
  { screen: 'help', feature: 'helpSupport', icon: 'help', labelKey: 'admin.profile.menu.help' },
];

const { colors, spacing, typography, weights } = adminTheme;

export function ProfileHomeScreen(props: {
  onBack: () => void;
  onOpen: (screen: ProfileDestination, profile: ProfileModel) => void;
  onSignOut: () => void;
}): React.JSX.Element {
  const { scope, can } = useAdminSession();
  const query = useAdminQuery(
    adminKeys.detail(scope.warehouseId, PROFILE_RESOURCE, 'me'),
    async (signal) => toProfile(await getMe(signal)),
  );
  const state = queryViewState(query, () => false);
  const menu = MENU.filter((m) => isWarehouseFeatureVisible(m.feature, can));

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.profile.title')} subtitle={scope.warehouseName} onBack={props.onBack} />
      <AsyncStates state={state} error={query.error} onRetry={() => void query.refetch()}>
        {query.data === undefined ? null : (
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <ProfileCard profile={query.data} roleLabel={t(adminRoleLabelKey(scope.roleCode))} warehouse={scope.warehouseName} />
            {menu.length === 0 ? null : (
              <InfoSection>
                {menu.map((m) => {
                  const profile = query.data;
                  return (
                    <MenuRow
                      key={m.screen}
                      icon={m.icon}
                      label={t(m.labelKey)}
                      onPress={() => {
                        if (profile !== undefined) props.onOpen(m.screen, profile);
                      }}
                    />
                  );
                })}
              </InfoSection>
            )}
            <Button title={t('admin.profile.signOut')} variant="outline" onPress={props.onSignOut} />
          </ScrollView>
        )}
      </AsyncStates>
    </View>
  );
}

function ProfileCard(props: {
  profile: ProfileModel;
  roleLabel: string;
  warehouse: string | null;
}): React.JSX.Element {
  const { profile } = props;
  return (
    <InfoSection>
      <Text
        accessibilityRole="header"
        style={{ color: colors.onSurface, fontSize: typography.title, fontWeight: weights.bold }}
      >
        {profile.fullName}
      </Text>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.body }}>{props.roleLabel}</Text>
      {props.warehouse === null ? null : (
        <InfoRow label={t('admin.profile.field.warehouse')} value={props.warehouse} />
      )}
      <InfoRow label={t('admin.profile.field.mobile')} value={profile.mobile ?? t('admin.profile.notProvided')} />
      <InfoRow
        label={t('admin.profile.field.email')}
        value={profile.email ?? t('admin.profile.notProvided')}
        hint={t('admin.profile.lockedHint')}
      />
      <InfoRow label={t('admin.profile.field.language')} value={t(profile.localeLabelKey)} />
      <InfoRow
        label={t('admin.profile.field.status')}
        value={t(profile.status.labelKey)}
        trailing={<Badge label={t(profile.status.labelKey)} variant={profile.status.tone} />}
      />
      {profile.createdAtLabel === null ? null : (
        <InfoRow label={t('admin.profile.field.createdAt')} value={profile.createdAtLabel} />
      )}
      <InfoRow
        label={t('admin.profile.field.lastLoginAt')}
        value={profile.lastLoginAtLabel ?? t('admin.profile.never')}
      />
    </InfoSection>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
