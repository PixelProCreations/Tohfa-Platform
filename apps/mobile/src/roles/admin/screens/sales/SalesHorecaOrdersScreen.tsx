import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { BackChevronIcon, SALES_PALETTE } from './SalesChannelOverviewScreen';
import { useChannelOrders } from '../warehouse/sales-direct/useSalesData';
import { AdminEmptyState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { formatPaise } from '../../money/paise';

export interface HorecaAccount {
  id: string;
  name: string;
  gstin: string;
  recurringOrder: string;
  nextDelivery: string;
}

export interface SalesHorecaOrdersScreenProps {
  onBack?: () => void;
  onSelectAccount?: (acc: HorecaAccount) => void;
  accounts?: HorecaAccount[];
}

export function SalesHorecaOrdersScreen({ onBack, onSelectAccount, accounts }: SalesHorecaOrdersScreenProps) {
  const { items, isLoading } = useChannelOrders('HORECA');

  const displayAccounts: HorecaAccount[] = accounts ?? items.map((r) => ({
    id: r.id,
    name: r.businessName ?? ADMIN_NO_VALUE,
    gstin: ADMIN_NO_VALUE,
    recurringOrder: ADMIN_NO_VALUE,
    nextDelivery: ADMIN_NO_VALUE,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevronIcon color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Horeca Orders</Text>
          <Text style={styles.screenSubtitle}>
            {t('wiringSales.horeca.subtitle', { shown: displayAccounts.length })}
          </Text>
        </View>

        {/* List of Horeca Accounts */}
        {isLoading && displayAccounts.length === 0 ? (
          <AdminLoadingState label="Loading HoReCa orders..." />
        ) : displayAccounts.length === 0 ? (
          <AdminEmptyState title="No HoReCa Orders" subtitle="No HoReCa accounts or orders found." />
        ) : (
          <FlatList
            data={displayAccounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.horecaCard}
                onPress={() => onSelectAccount?.(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                {/* Badge */}
                <View style={styles.badgeWrapper}>
                  <View style={styles.horecaBadge}>
                    <Text style={styles.horecaBadgeText}>Horeca</Text>
                  </View>
                </View>

                {/* Title & GSTIN */}
                <Text style={styles.hotelName}>{item.name}</Text>
                <Text style={styles.gstinText}>{item.gstin}</Text>

                {/* Info 2-Column Grid */}
                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Recurring order</Text>
                    <Text style={styles.infoValue}>{item.recurringOrder}</Text>
                  </View>

                  <View style={styles.infoColRight}>
                    <Text style={styles.infoLabel}>Delivery date</Text>
                    <Text style={styles.infoValue}>{item.nextDelivery}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  titleBlock: {
    marginBottom: adminSpacing.md,
  },
  screenTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: adminSpacing.xxl * 2,
  },
  horecaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  badgeWrapper: {
    marginBottom: adminSpacing.sm,
  },
  horecaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: 3,
    borderRadius: adminRadius.xs,
  },
  horecaBadgeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brand,
  },
  hotelName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 3,
  },
  gstinText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 2,
  },
  infoValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
