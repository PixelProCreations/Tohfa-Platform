/**
 * Minimal admin navigation: a home list of the entries this admin may use,
 * and the selected entry's flow. Deliberately no navigation library — each
 * flow owns its own small stack (see billing-invoices/BillingFlow.tsx).
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, Icon } from '@tohfa/mobile-ui';
import { t } from '../i18n';
import { isWarehouseFeatureVisible } from '../screens/warehouse/availability';
import { ScreenHeader } from '../screens/warehouse/shared/ScreenHeader';
import { useAdminSession } from '../session/AdminSession';
import type { AdminSignOut } from '../session/signOut';
import { adminTheme } from '../theme';
import { ADMIN_ENTRIES, type AdminEntry } from './adminEntries';

const { colors, spacing, typography, weights, radius, minTouchTarget } = adminTheme;

export function AdminHome(props: { signOut: AdminSignOut }): React.JSX.Element {
  const { scope, can } = useAdminSession();
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = ADMIN_ENTRIES.filter((e) => isWarehouseFeatureVisible(e.feature, can));
  const open = entries.find((e) => e.id === openId);

  if (open !== undefined) {
    return <open.Flow onExit={() => setOpenId(null)} signOut={props.signOut} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.home.title')} subtitle={scope.warehouseName} />
      {entries.length === 0 ? (
        <EmptyState title={t('admin.home.empty')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onPress={() => setOpenId(entry.id)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EntryCard(props: { entry: AdminEntry; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        {
          minHeight: minTouchTarget,
          padding: spacing.lg,
          gap: spacing.md,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.white,
        },
      ]}
    >
      <Icon name={props.entry.icon} color={colors.primary} size={typography.headline} />
      <View style={styles.flex}>
        <Text style={{ color: colors.onSurface, fontSize: typography.bodyLarge, fontWeight: weights.semibold }}>
          {t(props.entry.titleKey)}
        </Text>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t(props.entry.hintKey)}
        </Text>
      </View>
      <Icon name="chevron_right" color={colors.onSurfaceVariant} size={typography.title} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
});
