/**
 * Signed-in devices — `GET /auth/me/sessions` (`auth.principal.view_own`, BR-67).
 *
 * Read-only and limited to exactly the API fields: platform, user agent,
 * signed-in / last-active / expiry times and last IP. Deliberately NOT shown:
 *  - a "this device" marker — the API returns no `isCurrent` (the access
 *    token carries no session id), so the app cannot know it honestly;
 *  - a terminate / sign-out-this-device action — no endpoint ends one of the
 *    caller's own sessions (`/auth/sessions/{id}/terminate` is Super Admin's
 *    for ANOTHER admin, SUB_WH_ADMIN `none`); see availability
 *    `terminateOwnSession`. Changing the password ends all of them;
 *  - location or failed-login history — not in the API.
 */
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { listMySessions } from '../../../api/profile';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { toSessionRow, type SessionRow } from './mappers';

const { colors, spacing, typography, weights } = adminTheme;

export function SessionsScreen(props: { onBack: () => void }): React.JSX.Element {
  const { scope } = useAdminSession();
  const query = useAdminQuery(adminKeys.list(scope.warehouseId, 'sessions'), async (signal) =>
    (await listMySessions(signal)).map(toSessionRow),
  );
  const state = queryViewState(query);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.profile.sessions.title')} onBack={props.onBack} />
      <AsyncStates
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitleKey="admin.profile.sessions.emptyTitle"
        emptyMessageKey="admin.profile.sessions.emptyMessage"
      >
        <FlatList
          data={query.data ?? []}
          keyExtractor={(row) => row.id}
          renderItem={({ item }) => <SessionCard row={item} />}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListHeaderComponent={
            <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
              {t('admin.profile.sessions.intro')}
            </Text>
          }
          ListFooterComponent={
            <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>
              {t('admin.profile.sessions.signOutHint')}
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </AsyncStates>
    </View>
  );
}

function SessionCard(props: { row: SessionRow }): React.JSX.Element {
  const { row } = props;
  const notRecorded = t('admin.profile.sessions.notRecorded');
  return (
    <InfoSection>
      <Text style={{ color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }}>
        {t(row.platformLabelKey)}
      </Text>
      {row.userAgent === null ? null : (
        <Text numberOfLines={2} style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {row.userAgent}
        </Text>
      )}
      <InfoRow label={t('admin.profile.sessions.issuedAt')} value={row.issuedAtLabel} />
      <InfoRow label={t('admin.profile.sessions.lastSeenAt')} value={row.lastSeenAtLabel ?? notRecorded} />
      <InfoRow label={t('admin.profile.sessions.lastSeenIp')} value={row.lastSeenIp ?? notRecorded} />
      <InfoRow label={t('admin.profile.sessions.expiresAt')} value={row.expiresAtLabel} />
    </InfoSection>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
