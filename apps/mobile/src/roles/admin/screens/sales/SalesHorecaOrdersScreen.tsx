import React from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

export interface HorecaAccount {
  id: string;
  name: string;
  gstin: string;
  recurringOrder: string;
  nextDelivery: string;
}

const HORECA_ACCOUNTS: HorecaAccount[] = [
  {
    id: 'horeca-1',
    name: 'Savoy Heritage Hotel — Ooty',
    gstin: 'GSTIN: 33AACH1234K1Z1',
    recurringOrder: '120kg mixed veg / week',
    nextDelivery: 'Sep 12, 2026',
  },
  {
    id: 'horeca-2',
    name: 'Green Valley Restaurant — Coonoor',
    gstin: 'GSTIN: 33AACG5678L1Z2',
    recurringOrder: '45kg mixed veg / week',
    nextDelivery: 'Sep 13, 2026',
  },
  {
    id: 'horeca-3',
    name: 'Sterling Fern Hill Resort — Ooty',
    gstin: 'GSTIN: 33AAAC8912K1Z9',
    recurringOrder: '200kg premium organic / week',
    nextDelivery: 'Sep 14, 2026',
  },
  {
    id: 'horeca-4',
    name: 'Hilltop Cafe & Bakery — Kotagiri',
    gstin: 'GSTIN: 33AADCH7812L1Z3',
    recurringOrder: '30kg salad greens / week',
    nextDelivery: 'Sep 15, 2026',
  },
];

export interface SalesHorecaOrdersScreenProps {
  onBack?: () => void;
  onSelectAccount?: (acc: HorecaAccount) => void;
}

export function SalesHorecaOrdersScreen({ onBack, onSelectAccount }: SalesHorecaOrdersScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Horeca Orders</Text>
          <Text style={styles.screenSubtitle}>
            Hotel / Restaurant / Catering · 19 active accounts
          </Text>
        </View>

        {/* List of Horeca Accounts */}
        <FlatList
          data={HORECA_ACCOUNTS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.horecaCard}
              onPress={() => onSelectAccount?.(item)}
              activeOpacity={0.7}
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
                  <Text style={styles.infoLabel}>Next delivery</Text>
                  <Text style={styles.infoValue}>{item.nextDelivery}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 32,
  },
  horecaCard: {
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  badgeWrapper: {
    marginBottom: 10,
  },
  horecaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  horecaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B2C0D',
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 3,
  },
  gstinText: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F0E8',
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
});
