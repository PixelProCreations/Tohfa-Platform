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
import Svg, { Path } from 'react-native-svg';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

function DocInvoiceIcon({ color = '#1F1714', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface B2BAccount {
  id: string;
  name: string;
  gstin: string;
  latestOrder: string;
  orderValue: string;
  gstStatus: string;
}

const B2B_ACCOUNTS: B2BAccount[] = [
  {
    id: 'b2b-1',
    name: 'Nilgiris Fresh Distributors Pvt Ltd',
    gstin: 'GSTIN: 33AABN9988M1Z5',
    latestOrder: '800kg — Carrots, Cabbage',
    orderValue: '₹28,400',
    gstStatus: 'Generated',
  },
  {
    id: 'b2b-2',
    name: 'Coimbatore Organic Wholesale Mart',
    gstin: 'GSTIN: 33AAEC4521M1Z8',
    latestOrder: '1,200kg — Potatoes, Beetroot',
    orderValue: '₹42,600',
    gstStatus: 'Generated',
  },
  {
    id: 'b2b-3',
    name: 'Kochi Central Supermarkets',
    gstin: 'GSTIN: 32AABCK9911P1Z4',
    latestOrder: '2,500kg — Mixed Hill Vegetables',
    orderValue: '₹89,200',
    gstStatus: 'Generated',
  },
];

export interface SalesB2BOrdersScreenProps {
  onBack?: () => void;
  onOpenInvoice?: (acc: B2BAccount) => void;
}

export function SalesB2BOrdersScreen({ onBack, onOpenInvoice }: SalesB2BOrdersScreenProps) {
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
          <Text style={styles.screenTitle}>B2B Bulk Orders</Text>
          <Text style={styles.screenSubtitle}>7 active business accounts</Text>
        </View>

        {/* List */}
        <FlatList
          data={B2B_ACCOUNTS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.b2bCard}>
              {/* Badge */}
              <View style={styles.badgeWrapper}>
                <View style={styles.b2bBadge}>
                  <Text style={styles.b2bBadgeText}>B2B</Text>
                </View>
              </View>

              {/* Title & GSTIN */}
              <Text style={styles.companyName}>{item.name}</Text>
              <Text style={styles.gstinText}>{item.gstin}</Text>

              {/* Order Info Rows */}
              <View style={styles.infoTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.rowLabel}>Latest bulk order</Text>
                  <Text style={styles.rowValue}>{item.latestOrder}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.rowLabel}>Order value</Text>
                  <Text style={styles.rowValueBold}>{item.orderValue}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.rowLabel}>GST invoice</Text>
                  <Text style={styles.rowValueSuccess}>{item.gstStatus}</Text>
                </View>
              </View>

              {/* View / Generate GST Invoice Button */}
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={() => onOpenInvoice?.(item)}
                activeOpacity={0.7}
              >
                <DocInvoiceIcon color="#1F1714" size={15} />
                <Text style={styles.invoiceBtnText}>View / Generate GST Invoice</Text>
              </TouchableOpacity>
            </View>
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
  b2bCard: {
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
  b2bBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF3FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  b2bBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D6399',
  },
  companyName: {
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
  infoTable: {
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 12,
    color: SALES_PALETTE.textSecondary,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '500',
    color: SALES_PALETTE.textPrimary,
  },
  rowValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
  rowValueSuccess: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E824C',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    backgroundColor: SALES_PALETTE.cardBg,
    gap: 8,
  },
  invoiceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
  },
});
