import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminSalesFinanceOverviewScreenProps {
  onBack?: () => void;
  onExportReports?: () => void;
  onNavigateCustomers?: () => void;
  onNavigatePricing?: () => void;
  onNavigateFinance?: () => void;
}

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AdminSalesFinanceOverviewScreen({
  onBack,
  onExportReports,
  onNavigateCustomers,
  onNavigatePricing,
  onNavigateFinance,
}: AdminSalesFinanceOverviewScreenProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Channels');

  const filterOptions = [
    'All Channels',
    'Online Orders Only',
    'Live Market Only',
    'Horeca Only',
    'B2B Only',
    'Past 7 Days',
    'Past 30 Days',
    'Past 90 Days',
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner matching Image 4 */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <BackArrowWhiteIcon />
            <Text style={styles.headerTitle}>Sales & Finance Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerFilterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filter sales and finance"
          >
            <FilterSlidersWhiteIcon />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section A: Sales overview ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>A · Sales overview</Text>

          <View style={styles.card}>
            <View style={styles.salesOverviewRow}>
              <View style={styles.salesOverviewHeader}>
                <Text style={styles.rowLabel}>Order value</Text>
                <Text style={styles.boldValue}>₹71,190</Text>
              </View>
              <Text style={styles.subNote}>
                Gross value of orders placed in the period, excluding cancelled and returned.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.salesOverviewRow}>
              <View style={styles.salesOverviewHeader}>
                <Text style={styles.rowLabel}>Invoiced amount</Text>
                <Text style={styles.boldValue}>₹69,570</Text>
              </View>
              <Text style={styles.subNote}>
                Value of B2B and Horeca orders with a generated invoice.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.salesOverviewRow}>
              <View style={styles.salesOverviewHeader}>
                <Text style={styles.rowLabel}>Collected amount</Text>
                <Text style={styles.boldValue}>₹69,570</Text>
              </View>
              <Text style={styles.subNote}>
                Value of orders whose payment is Paid.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.salesOverviewRow}>
              <View style={styles.salesOverviewHeader}>
                <Text style={styles.rowLabel}>Refunded amount</Text>
                <Text style={styles.boldValue}>₹0</Text>
              </View>
              <Text style={styles.subNote}>
                Refund cases completed in the period.
              </Text>
            </View>
          </View>

          {/* Orders by status (7) */}
          <Text style={styles.subHeading}>Orders by status (7)</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>2</Text>
              <Text style={styles.metricLabel}>Placed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Packed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Ready for Pickup</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>5</Text>
              <Text style={styles.metricLabel}>Delivered</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Returned</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Cancelled</Text>
            </View>
          </View>

          {/* Sales by channel */}
          <Text style={styles.subHeading}>Sales by channel</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Online</Text>
              <Text style={styles.rowValue}>₹0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Live Market</Text>
              <Text style={styles.rowValue}>₹1,620</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Horeca</Text>
              <Text style={styles.rowValue}>₹20,130</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>B2B</Text>
              <Text style={styles.rowValue}>₹49,440</Text>
            </View>
          </View>

          {/* B2B and Horeca */}
          <Text style={styles.subHeading}>B2B and Horeca</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Orders</Text>
              <Text style={styles.rowValue}>5</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Invoices generated / pending</Text>
              <Text style={styles.rowValue}>5 / 0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Cancelled orders</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Returned orders</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
          </View>
          <Text style={styles.footerNote}>
            Filters applied here: Date range, Sales channel, Warehouse, Customer type, Payment status.
          </Text>
        </View>

        {/* ── Section B: Farmer payouts ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>B · Farmer payouts</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>3</Text>
              <Text style={styles.metricLabel}>Awaiting processing</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>1</Text>
              <Text style={styles.metricLabel}>Pending approval</Text>
            </View>
          </View>
        </View>

        {/* ── Section C: Customers and refunds ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>C · Customers and refunds</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Failed</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Unresolved complaints</Text>
              <Text style={styles.rowValue}>2</Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            Refund statuses are current; the date range applies only to the refunded amount above.
          </Text>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={onNavigateCustomers}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>Customers</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section D: Finance and reconciliation ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>D · Finance and reconciliation</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>2</Text>
              <Text style={styles.metricLabel}>Vouchers awaiting approval</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>1</Text>
              <Text style={styles.metricLabel}>Reconciliation mismatches</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>3</Text>
              <Text style={styles.metricLabel}>Salary payouts to process</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>3</Text>
              <Text style={styles.metricLabel}>Records awaiting approval</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Reconciliation: matched / pending review / mismatch</Text>
              <Text style={styles.rowValue}>1 / 1 / 1</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Voucher value awaiting approval</Text>
              <Text style={styles.rowValue}>₹11,000</Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            Wallet and ledger figures come from the Accounts & Finance records. Filters other than the vouchers listed do not apply.
          </Text>
        </View>

        {/* ── Section E: Price compliance ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>E · Price compliance</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Retail prices needing action</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Retail prices above the ceiling</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
          </View>

          <Text style={styles.subHeading}>Fair-price ceiling (reference only)</Text>
          <View style={styles.card}>
            {[
              { crop: 'Tomato · Grade A', info: 'Ceiling Rs. 60 · Retail Rs. 55', status: 'within', label: 'Within ceiling' },
              { crop: 'Carrot · Grade A', info: 'Ceiling Rs. 70 · Retail Rs. 74', status: 'above', label: 'Above ceiling' },
              { crop: 'Cabbage · Grade B', info: 'Ceiling Rs. 35 · Retail Rs. 32', status: 'needs_action', label: 'Needs action' },
              { crop: 'Beans · Grade A', info: 'Ceiling Rs. 90 · Retail Rs. 84', status: 'within', label: 'Within ceiling' },
              { crop: 'Potato · Grade B', info: 'Ceiling Rs. 40 · Retail Rs. 38', status: 'within', label: 'Within ceiling' },
              { crop: 'Garlic · Grade A', info: 'Ceiling Rs. 210 · Retail Rs. 198', status: 'within', label: 'Within ceiling' },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.crop}>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceCropText}>{item.crop}</Text>
                    <Text style={styles.priceInfoText}>{item.info}</Text>
                  </View>
                  <View
                    style={[
                      styles.priceBadge,
                      item.status === 'within' && styles.priceBadgeWithin,
                      item.status === 'above' && styles.priceBadgeAbove,
                      item.status === 'needs_action' && styles.priceBadgeAction,
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceBadgeText,
                        item.status === 'within' && styles.priceBadgeTextWithin,
                        item.status === 'above' && styles.priceBadgeTextAbove,
                        item.status === 'needs_action' && styles.priceBadgeTextAction,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Export Reports Bottom Button */}
        <TouchableOpacity
          style={styles.primaryExportBtn}
          onPress={onExportReports || (() => Alert.alert('Export Reports', 'Reports exported successfully in PDF and Excel formats.'))}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryExportBtnText}>Export reports</Text>
        </TouchableOpacity>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sales & Finance Filter</Text>
            {filterOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.modalOption,
                  selectedFilter === opt && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedFilter(opt);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedFilter === opt && styles.modalOptionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionContainer: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5835',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  salesOverviewRow: {
    paddingVertical: 10,
  },
  salesOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  rowValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  boldValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1412',
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  subNote: {
    fontSize: 11,
    color: '#8A827B',
    marginTop: 3,
    lineHeight: 15,
  },
  footerNote: {
    fontSize: 11,
    color: '#8A827B',
    marginTop: 8,
    lineHeight: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: adminSpacing.xs,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2DC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1412',
  },
  metricLabel: {
    fontSize: 11,
    color: '#8A827B',
    marginTop: 4,
    fontWeight: '500',
  },
  outlineBtn: {
    marginTop: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8A37E',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  priceCropText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1412',
  },
  priceInfoText: {
    fontSize: 11,
    color: '#8A827B',
    marginTop: 3,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceBadgeWithin: {
    backgroundColor: '#E8F5E9',
  },
  priceBadgeAbove: {
    backgroundColor: '#FFEBEE',
  },
  priceBadgeAction: {
    backgroundColor: '#FFF8E1',
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priceBadgeTextWithin: {
    color: '#2E7D32',
  },
  priceBadgeTextAbove: {
    color: '#C62828',
  },
  priceBadgeTextAction: {
    color: '#F57F17',
  },
  primaryExportBtn: {
    marginTop: adminSpacing.lg,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: 14,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  primaryExportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalContent: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    width: '100%',
    maxWidth: 340,
    ...adminShadow.lg,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  modalOption: {
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  modalOptionSelected: {
    backgroundColor: adminColors.highlight,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: adminColors.brand,
  },
});

