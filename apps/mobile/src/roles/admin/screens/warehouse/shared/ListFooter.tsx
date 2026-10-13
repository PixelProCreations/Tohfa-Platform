/**
 * Footer for paged lists: loading-more spinner, a retry after a failed
 * load-more (rows already shown stay), or an explicit "Load more" button.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { adminTheme } from '../../../theme';

const { colors, spacing, typography } = adminTheme;

export function ListFooter(props: {
  isLoadingMore: boolean;
  loadMoreFailed: boolean;
  hasMore: boolean;
  shown: number;
  onLoadMore: () => void;
}): React.JSX.Element | null {
  if (props.isLoadingMore) {
    return (
      <ActivityIndicator
        style={{ padding: spacing.lg }}
        color={colors.primary}
        accessibilityLabel={t('admin.common.loading')}
      />
    );
  }
  if (props.loadMoreFailed) {
    return (
      <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
        <Text style={[styles.center, { color: colors.error, fontSize: typography.bodySmall }]}>
          {t('admin.common.loadMoreError', { count: props.shown })}
        </Text>
        <Button title={t('admin.common.retry')} variant="outline" onPress={props.onLoadMore} />
      </View>
    );
  }
  if (props.hasMore) {
    return <Button title={t('admin.common.loadMore')} variant="outline" onPress={props.onLoadMore} />;
  }
  return null;
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
