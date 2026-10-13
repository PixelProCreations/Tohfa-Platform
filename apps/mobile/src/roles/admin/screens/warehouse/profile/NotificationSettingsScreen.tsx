/**
 * Admin notification settings — `GET /notification-preferences/admin` and
 * `PATCH /notification-preferences/admin/{category}`
 * (`notification.own.admin_preferences`, BR-82).
 *
 * All 14 categories in screen order, grouped as the spec describes. When
 * `IN_APP_MASTER` is off the other toggles are greyed (spec: "the client
 * greys the rest") but keep their stored values. One toggle writes at a time;
 * the switch shows the requested value while its write is pending and the
 * list is re-read on success. No "reset to default" button: there is no bulk
 * endpoint, and 14 sequential writes are not worth the partial-failure UX.
 *
 * Contradiction 28: these are stored preferences; no admin event is mapped
 * to them yet server-side.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { adminErrorKey } from '../../../api/errors';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import {
  listAdminNotificationPreferences,
  setAdminNotificationPreference,
  type AdminNotificationCategoryDto,
} from '../../../api/notificationPreferences';
import { adminKeys } from '../../../api/queryKeys';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { InfoSection } from '../shared/InfoSection';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { groupAdminPreferences, type PreferenceItem } from './mappers';

const RESOURCE = 'notificationPreferences';
const { colors, spacing, typography, minTouchTarget } = adminTheme;

interface ToggleVars {
  category: AdminNotificationCategoryDto;
  enabled: boolean;
}

export function NotificationSettingsScreen(props: { onBack: () => void }): React.JSX.Element {
  const { scope } = useAdminSession();
  const query = useAdminQuery(adminKeys.list(scope.warehouseId, RESOURCE), async (signal) =>
    groupAdminPreferences((await listAdminNotificationPreferences(signal)).items),
  );
  const mutation = useAdminMutation(
    (vars: ToggleVars) => setAdminNotificationPreference(vars.category, vars.enabled),
    { invalidate: [adminKeys.resource(scope.warehouseId, RESOURCE)] },
  );
  const state = queryViewState(query, () => false);
  const pending = mutation.isPending ? mutation.variables : undefined;
  const masterOff =
    query.data?.[0]?.items.find((i) => i.category === 'IN_APP_MASTER')?.enabled === false;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.notifications.title')} onBack={props.onBack} />
      <AsyncStates state={state} error={query.error} onRetry={() => void query.refetch()}>
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
          {mutation.isError ? (
            <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
              {t('admin.notifications.saveError', { reason: t(adminErrorKey(mutation.error)) })}
            </Text>
          ) : null}
          {masterOff ? (
            <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
              {t('admin.notifications.masterOffHint')}
            </Text>
          ) : null}
          {(query.data ?? []).map((group) => (
            <InfoSection key={group.titleKey} title={t(group.titleKey)}>
              {group.items.map((item) => (
                <ToggleRow
                  key={item.category}
                  item={item}
                  value={pending?.category === item.category ? pending.enabled : item.enabled}
                  busy={mutation.isPending}
                  onChange={(enabled) => mutation.mutate({ category: item.category, enabled })}
                />
              ))}
            </InfoSection>
          ))}
        </ScrollView>
      </AsyncStates>
    </View>
  );
}

function ToggleRow(props: {
  item: PreferenceItem;
  value: boolean;
  busy: boolean;
  onChange: (enabled: boolean) => void;
}): React.JSX.Element {
  const label = t(props.item.labelKey);
  const disabled = props.item.disabled || props.busy;
  return (
    <View style={[styles.row, { minHeight: minTouchTarget, gap: spacing.md }]}>
      <Text
        style={[
          styles.flex,
          {
            color: props.item.disabled ? colors.onSurfaceVariant : colors.onSurface,
            fontSize: typography.body,
          },
        ]}
      >
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={props.value}
        disabled={disabled}
        onValueChange={props.onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
