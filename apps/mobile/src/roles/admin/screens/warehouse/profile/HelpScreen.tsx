/**
 * Help & support — `GET /admin/help` (`help.article.view`, BR-82).
 *
 * Published plain-text FAQ articles for the admin's preferred locale (server
 * default `en` when unset; no ta->en fall-back server-side), with category
 * chips from the response, and the contact card. Phone and e-mail are `null`
 * until a Super/TOHFA Admin sets them — shown as "not set up", never invented.
 *
 * HIDDEN — support tickets: not built server-side (BR-82 rule 3); see
 * availability `helpTickets`. Article management (`help.article.manage`) is
 * Super/TOHFA Admin only and not part of this app.
 */
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAdminHelp } from '../../../api/help';
import { useAdminQuery } from '../../../api/hooks';
import type { LocaleDto } from '../../../api/profile';
import { adminKeys } from '../../../api/queryKeys';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { FilterChips } from '../shared/FilterChips';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { toHelpModel, type HelpArticle, type HelpModel } from './mappers';

const ALL = '';
const { colors, spacing, typography, weights, minTouchTarget } = adminTheme;

export function HelpScreen(props: { locale: LocaleDto | null; onBack: () => void }): React.JSX.Element {
  const { scope } = useAdminSession();
  const [category, setCategory] = useState<string>(ALL);
  const locale = props.locale ?? undefined;
  const fetchHelp = (cat: string) => async (signal: AbortSignal): Promise<HelpModel> =>
    toHelpModel(await getAdminHelp({ locale, category: cat === ALL ? undefined : cat }, signal));
  // The unfiltered read supplies the chips, so they stay put once one is
  // selected; a selected category is a second, filtered read.
  const all = useAdminQuery(adminKeys.list(scope.warehouseId, 'help', { locale }), fetchHelp(ALL));
  const filtered = useAdminQuery(
    adminKeys.list(scope.warehouseId, 'help', { locale, category }),
    fetchHelp(category),
    { enabled: category !== ALL },
  );
  const query = category === ALL ? all : filtered;
  const knownCategories = all.data?.categories ?? [];
  const state = queryViewState(query, () => false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.help.title')} onBack={props.onBack} />
      {knownCategories.length === 0 ? null : (
        <FilterChips<string>
          accessibilityLabel={t('admin.help.filterLabel')}
          options={[
            { key: ALL, value: ALL, label: t('admin.common.all') },
            ...knownCategories.map((c) => ({ key: c, value: c, label: c })),
          ]}
          selectedKey={category}
          onSelect={setCategory}
        />
      )}
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
            <InfoSection title={t('admin.help.articles')}>
              {query.data.articles.length === 0 ? (
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.onSurface, fontSize: typography.body }}>
                    {t('admin.help.emptyTitle')}
                  </Text>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
                    {t('admin.help.emptyMessage')}
                  </Text>
                </View>
              ) : (
                query.data.articles.map((a) => <ArticleItem key={a.id} article={a} />)
              )}
            </InfoSection>
            <InfoSection title={t('admin.help.contact')}>
              {query.data.hasContact ? (
                <>
                  {query.data.contact.phone === null ? null : (
                    <InfoRow label={t('admin.help.phone')} value={query.data.contact.phone} />
                  )}
                  {query.data.contact.email === null ? null : (
                    <InfoRow label={t('admin.help.email')} value={query.data.contact.email} />
                  )}
                </>
              ) : (
                <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
                  {t('admin.help.noContact')}
                </Text>
              )}
            </InfoSection>
          </ScrollView>
        )}
      </AsyncStates>
    </View>
  );
}

function ArticleItem(props: { article: HelpArticle }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.row, { minHeight: minTouchTarget }]}
      >
        <Text style={[styles.flex, { color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }]}>
          {props.article.title}
        </Text>
      </Pressable>
      {open ? (
        <Text selectable style={{ color: colors.onSurfaceVariant, fontSize: typography.body }}>
          {props.article.body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
