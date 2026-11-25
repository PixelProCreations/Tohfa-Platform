import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';
import { useAdminQuery } from '../../api/hooks';
import { getSalesReport, getCustomersReport, getInventoryReport } from '../../api/reports';
import { useFarmerSummary } from '../../api/farmerHooks';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  adminColors,
  adminOverlay,
  adminSpacing,
  adminType,
} from '../../theme';

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  greenSuccess: '#16A34A',
  greenLight: '#EAF7EE',
  greenBar: '#2E7D32',
  blueBar: '#1A6BA5',
  blueBg: '#EBF3FA',
  purpleBar: '#7E22CE',
  purpleBg: '#F3E8FF',
  amberBar: '#D97706',
  amberBg: '#FEF3E2',
};

export type AnalyticsCategory = 'Farmers' | 'Customers' | 'Warehouses' | 'Sales';
export type TimeframeOption = 'Last Month' | 'This Quarter' | 'FY 2026-27';

interface BarData {
  label: string;
  value: number;
  displayValue?: string;
}

function CustomBarChart({
  title,
  metricNumber,
  barColor,
  data,
  unit = '',
  subtitle,
}: {
  title: string;
  metricNumber: string | number;
  barColor: string;
  data: BarData[];
  unit?: string;
  subtitle?: string;
}) {
  const barMaxHeight = 120;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = data.length <= 3 ? 58 : data.length === 4 ? 48 : 36;

  const formatDisplayVal = (item: BarData) => {
    if (item.displayValue) return item.displayValue;
    if (unit === '%') return `${item.value}%`;
    if (unit === '₹') {
      if (item.value >= 1000) return `₹${(item.value / 1000).toFixed(1)}k`;
      return `₹${item.value}`;
    }
    if (unit) return `${item.value}${unit}`;
    return `${item.value}`;
  };

  return (
    <View style={styles.chartCard}>
      {/* Header with Title, Subtitle, Metric (never overlapped) */}
      <View style={styles.chartCardHeader}>
        <View style={styles.chartTitleCol}>
          <Text style={styles.chartTitle}>{title}</Text>
          {subtitle ? <Text style={styles.chartSubtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={styles.chartMetricNumber}>
          {metricNumber}
          {unit && !String(metricNumber).includes(unit) ? (
            <Text style={styles.unitText}> {unit}</Text>
          ) : null}
        </Text>
      </View>

      {/* Chart Canvas with background guide lines and covered bars */}
      <View style={styles.chartCanvas}>
        {/* Background horizontal guideline lines */}
        <View style={styles.gridLineContainer} pointerEvents="none">
          <View style={[styles.gridLine, { top: 34 }]} />
          <View style={[styles.gridLine, { top: 94 }]} />
          <View style={[styles.gridLineBaseline, { top: 154 }]} />
        </View>

        {/* Bars Container */}
        <View style={styles.barChartContainer}>
          {data.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
              <Text style={styles.chartSubtitle}>{t('wiringReports.common.noData')}</Text>
            </View>
          ) : (
            data.map((item, index) => {
              const barHeight = item.value <= 0 ? 0 : Math.max(14, (item.value / maxVal) * barMaxHeight);
              const displayVal = formatDisplayVal(item);

              return (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barValueWrapper}>
                    <Text style={styles.barValueText} numberOfLines={1}>
                      {displayVal}
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { width: barWidth, height: barMaxHeight }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

export interface AnalyticsDashboardScreenProps {
  onBack: () => void;
}

export function AnalyticsDashboardScreen({ onBack }: AnalyticsDashboardScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<AnalyticsCategory>('Farmers');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('Last Month');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const timeframes: TimeframeOption[] = ['Last Month', 'This Quarter', 'FY 2026-27'];

  const categoryOptions: {
    key: AnalyticsCategory;
    title: string;
    subtitle: string;
    tag: string;
  }[] = [
    {
      key: 'Farmers',
      title: 'Farmers Analytics',
      subtitle: 'Applications, ratings, yields & regional acreage',
      tag: ADMIN_NO_VALUE,
    },
    {
      key: 'Customers',
      title: 'Customers Analytics',
      subtitle: 'Buyer volume, retention rates & average basket',
      tag: ADMIN_NO_VALUE,
    },
    {
      key: 'Warehouses',
      title: 'Warehouses Analytics',
      subtitle: 'Stock turnover, capacity utilization & reject rates',
      tag: ADMIN_NO_VALUE,
    },
    {
      key: 'Sales',
      title: 'Sales Analytics',
      subtitle: 'Platform GMV, revenue take-rate & mandi uplift',
      tag: ADMIN_NO_VALUE,
    },
  ];

  const currentCategory = categoryOptions.find((c) => c.key === selectedCategory) ?? categoryOptions[0]!;

  const { from, to } = React.useMemo(() => {
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    if (selectedTimeframe === 'Last Month') {
      const d = new Date(now.getTime() - 30 * 86400000);
      return { from: d.toISOString().slice(0, 10), to: toStr };
    } else if (selectedTimeframe === 'This Quarter') {
      const d = new Date(now.getTime() - 90 * 86400000);
      return { from: d.toISOString().slice(0, 10), to: toStr };
    } else {
      const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return { from: `${fyStartYear}-04-01`, to: toStr };
    }
  }, [selectedTimeframe]);

  const salesQuery = useAdminQuery(
    ['admin', 'reports', 'sales', from, to],
    (signal) => getSalesReport({ from, to }, signal),
    { enabled: selectedCategory === 'Sales' },
  );

  const customersQuery = useAdminQuery(
    ['admin', 'reports', 'customers', from, to],
    (signal) => getCustomersReport({ from, to }, signal),
    { enabled: selectedCategory === 'Customers' },
  );

  const inventoryQuery = useAdminQuery(
    ['admin', 'reports', 'inventory', from, to],
    (signal) => getInventoryReport({ from, to }, signal),
    { enabled: selectedCategory === 'Warehouses' },
  );

  const { summary: farmerSummary } = useFarmerSummary(undefined);

  const finalFarmerData = {
    kpiApps: farmerSummary ? String(farmerSummary.pendingApplications) : ADMIN_NO_VALUE,
    kpiRating: ADMIN_NO_VALUE,
    kpiYield: ADMIN_NO_VALUE,
    kpiActiveFarmers: farmerSummary ? String(farmerSummary.activeFarmers) : ADMIN_NO_VALUE,
    appsData: [] as BarData[],
    ratingData: [] as BarData[],
    yieldData: [] as BarData[],
    cropBreakdown: [] as { name: string; volume: string; pct: string; color: string }[],
  };

  const finalCustomerData = {
    kpiBuyers: customersQuery.data ? String(customersQuery.data.customersWithOrders) : ADMIN_NO_VALUE,
    kpiRetention: ADMIN_NO_VALUE,
    kpiBasket: ADMIN_NO_VALUE,
    kpiNewCustomers: customersQuery.data ? String(customersQuery.data.newCustomers) : ADMIN_NO_VALUE,
    ordersData: customersQuery.data?.byDay?.length
      ? customersQuery.data.byDay.slice(-4).map((d) => ({ label: d.date.slice(5), value: d.count }))
      : ([] as BarData[]),
    retentionData: [] as BarData[],
    basketData: [] as BarData[],
  };

  const finalWarehouseData = {
    kpiItems: inventoryQuery.data ? String(inventoryQuery.data.items.length) : ADMIN_NO_VALUE,
    kpiLoad: ADMIN_NO_VALUE,
    kpiTurnaround: ADMIN_NO_VALUE,
    kpiBatches: inventoryQuery.data
      ? String(inventoryQuery.data.items.reduce((s, it) => s + it.batchCount, 0))
      : ADMIN_NO_VALUE,
    intakeData: [] as BarData[],
    coldStorageData: [] as BarData[],
    turnaroundData: [] as BarData[],
  };

  const finalSalesData = {
    kpiGmv: salesQuery.data ? `₹${Number(salesQuery.data.total).toLocaleString('en-IN')}` : ADMIN_NO_VALUE,
    kpiOrderCount: salesQuery.data ? String(salesQuery.data.count) : ADMIN_NO_VALUE,
    kpiAvgOrderValue: salesQuery.data
      ? `₹${Number(salesQuery.data.averageOrderValue).toLocaleString('en-IN')}`
      : ADMIN_NO_VALUE,
    kpiUplift: ADMIN_NO_VALUE,
    gmvData: salesQuery.data?.byDay?.length
      ? salesQuery.data.byDay.slice(-4).map((d) => ({
          label: d.date.slice(5),
          value: Math.round(Number(d.total) / 1000),
          displayValue: `₹${(Number(d.total) / 1000).toFixed(1)}k`,
        }))
      : ([] as BarData[]),
    upliftData: [] as BarData[],
    revData: [] as BarData[],
    revTotal: salesQuery.data ? `₹${Number(salesQuery.data.total).toLocaleString('en-IN')}` : ADMIN_NO_VALUE,
    farmerProcure: ADMIN_NO_VALUE,
    coldTransit: ADMIN_NO_VALUE,
    ecoPack: ADMIN_NO_VALUE,
    netMargin: ADMIN_NO_VALUE,
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Band matching Admin Standard */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to reports"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <Text style={styles.headerSubtitle}>Cross-platform visual metrics & trends</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >

        {/* ─── Category Scope Dropdown Selector ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.dropdownBox, showCategoryDropdown && styles.dropdownBoxOpen]}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownLeftCol}>
            <Text style={styles.dropdownLabel}>Selected Analytics</Text>
            <Text style={styles.dropdownText}>{currentCategory.title}</Text>
          </View>
          <View style={styles.dropdownArrowWrap}>
            <Text style={styles.dropdownArrow}>{showCategoryDropdown ? '▴' : '▾'}</Text>
          </View>
        </TouchableOpacity>

        {/* Inline Dropdown Menu (under input box with top heading only, no description) */}
        {showCategoryDropdown && (
          <View style={styles.inlineDropdownMenu}>
            {categoryOptions.map((item, index) => {
              const isSelected = selectedCategory === item.key;
              const isLast = index === categoryOptions.length - 1;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.inlineDropdownItem,
                    isSelected && styles.inlineDropdownItemActive,
                    isLast && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setSelectedCategory(item.key);
                    setShowCategoryDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.inlineDropdownText,
                      isSelected && styles.inlineDropdownTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {isSelected && <Text style={styles.inlineDropdownCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected Module Metadata Pill */}
        <View style={styles.categoryMetaRow}>
          <View style={styles.categoryMetaPill}>
            <Text style={styles.categoryMetaPillText}>{currentCategory.tag}</Text>
          </View>
          <Text style={styles.categoryMetaSub}>{currentCategory.subtitle}</Text>
        </View>

        {/* ─── Timeframe Toggle Pills (Last Month, This Quarter, FY 2026-27) ─── */}
        <View style={styles.timeframeRow}>
          {timeframes.map((tf) => {
            const isActive = selectedTimeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[styles.timeframePill, isActive && styles.timeframePillActive]}
                onPress={() => setSelectedTimeframe(tf)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeframeText, isActive && styles.timeframeTextActive]}>
                  {tf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            1. FARMERS TAB (DYNAMIC VALUES & NON-OVERLAPPING CHARTS)
           ══════════════════════════════════════════════════════════════════════ */}
        {selectedCategory === 'Farmers' && (
          <View style={styles.chartsColumn}>
            {/* KPI Overview Grid */}
            <OverviewCardsGrid style={{ marginBottom: 16 }}>
              <OverviewDashboardCard
                value={finalFarmerData.kpiApps}
                title="New Applications"
                subtitle={ADMIN_NO_VALUE}
                icon="clipboard"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalFarmerData.kpiRating}
                title="Avg Rating"
                subtitle={ADMIN_NO_VALUE}
                icon="users"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalFarmerData.kpiYield}
                title="Yield Intake"
                subtitle={ADMIN_NO_VALUE}
                icon="inventory"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalFarmerData.kpiActiveFarmers}
                title={t('wiringReports.analytics.activeFarmers')}
                subtitle={ADMIN_NO_VALUE}
                icon="box"
                titlePosition="bottom"
              />
            </OverviewCardsGrid>

            {/* Chart 1: Applications */}
            <CustomBarChart
              title="New Farmer Applications"
              metricNumber={finalFarmerData.kpiApps}
              barColor={P.orange}
              data={finalFarmerData.appsData}
              subtitle="Quarterly verification pipeline"
            />

            {/* Chart 2: Ratings */}
            <CustomBarChart
              title="Avg. Farm Rating (x100)"
              metricNumber={finalFarmerData.kpiRating}
              barColor={P.greenBar}
              data={finalFarmerData.ratingData}
              subtitle="Organic scorecard"
            />

            {/* Chart 3: Yield Output Trend */}
            <CustomBarChart
              title="Harvest Delivery Yield (MT)"
              metricNumber={finalFarmerData.kpiYield}
              barColor={P.blueBar}
              data={finalFarmerData.yieldData}
              subtitle="Aggregate farm pickup volume"
            />

            {/* Content 4: Crop Commodity Share */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Produce Commodity Share</Text>
              <Text style={styles.cardBoxSub}>{finalFarmerData.kpiYield} total harvest distribution ({selectedTimeframe})</Text>

              <View style={styles.distributionList}>
                {finalFarmerData.cropBreakdown.map((item, idx) => (
                  <View key={idx} style={styles.distRow}>
                    <View style={styles.distHeader}>
                      <Text style={styles.distName}>{item.name}</Text>
                      <Text style={styles.distVal}>{item.volume}</Text>
                    </View>
                    <View style={styles.barProgressTrack}>
                      <View style={[styles.barProgressBar, { width: item.pct as any, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Content 5: Farmer Cluster Breakdown Table */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Farmer Cluster Breakdown</Text>
              <Text style={styles.cardBoxSub}>{ADMIN_NO_VALUE}</Text>
            </View>

            {/* Content 6: Certification & Compliance Matrix */}
            <View style={styles.cardBox}>
              <View style={styles.flexRowBetween}>
                <Text style={styles.cardBoxTitle}>Organic Certification Status</Text>
                <View style={styles.badgePillGreen}>
                  <Text style={styles.badgePillTextGreen}>{ADMIN_NO_VALUE}</Text>
                </View>
              </View>

              <View style={styles.certGrid}>
                <View style={styles.certBox}>
                  <Text style={styles.certNum}>{ADMIN_NO_VALUE}</Text>
                  <Text style={styles.certLabel}>PGS Organic</Text>
                  <Text style={styles.certSubText}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.certBox}>
                  <Text style={styles.certNum}>{ADMIN_NO_VALUE}</Text>
                  <Text style={styles.certLabel}>NPOP Certified</Text>
                  <Text style={styles.certSubText}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.certBox}>
                  <Text style={styles.certNum}>{ADMIN_NO_VALUE}</Text>
                  <Text style={styles.certLabel}>Under Audit</Text>
                  <Text style={styles.certSubText}>{ADMIN_NO_VALUE}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            2. CUSTOMERS TAB (DYNAMIC VALUES & NON-OVERLAPPING CHARTS)
           ══════════════════════════════════════════════════════════════════════ */}
        {selectedCategory === 'Customers' && (
          <View style={styles.chartsColumn}>
            {customersQuery.isPending ? (
              <AdminLoadingState />
            ) : customersQuery.error ? (
              <AdminErrorState error={customersQuery.error} onRetry={customersQuery.refetch} />
            ) : (
            <>
            {/* KPI Overview Grid */}
            <OverviewCardsGrid style={{ marginBottom: 16 }}>
              <OverviewDashboardCard
                value={finalCustomerData.kpiBuyers}
                title="Active Buyers"
                subtitle={`${from} – ${to}`}
                icon="users"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalCustomerData.kpiRetention}
                title="Retention Rate"
                subtitle={ADMIN_NO_VALUE}
                icon="clipboard"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalCustomerData.kpiBasket}
                title="Avg Basket"
                subtitle={ADMIN_NO_VALUE}
                icon="wallet"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalCustomerData.kpiNewCustomers}
                title={t('wiringReports.analytics.newCustomers')}
                subtitle={`${from} – ${to}`}
                icon="orders"
                titlePosition="bottom"
              />
            </OverviewCardsGrid>

            {/* Chart 1 */}
            <CustomBarChart
              title="Active Customer Orders"
              metricNumber={finalCustomerData.kpiBuyers}
              barColor={P.blueBar}
              data={finalCustomerData.ordersData}
              subtitle={`${from} – ${to}`}
            />

            {/* Chart 2 */}
            <CustomBarChart
              title="Monthly Retention Rate %"
              metricNumber={finalCustomerData.kpiRetention}
              barColor={P.greenBar}
              data={finalCustomerData.retentionData}
              subtitle={ADMIN_NO_VALUE}
            />

            {/* Chart 3: Basket Size */}
            <CustomBarChart
              title="Average Basket Value (₹)"
              metricNumber={finalCustomerData.kpiBasket}
              barColor={P.orange}
              data={finalCustomerData.basketData}
              subtitle={ADMIN_NO_VALUE}
            />

            {/* Content 4: Demand Channels */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Demand Allocation Channels</Text>
              <Text style={styles.cardBoxSub}>{ADMIN_NO_VALUE}</Text>
            </View>

            {/* Content 5: Regional Delivery Footprint */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Buyer Geography & Delivery SLA</Text>
              <Text style={styles.cardBoxSub}>{ADMIN_NO_VALUE}</Text>
            </View>
            </>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            3. WAREHOUSES TAB (DYNAMIC VALUES & NON-OVERLAPPING CHARTS)
           ══════════════════════════════════════════════════════════════════════ */}
        {selectedCategory === 'Warehouses' && (
          <View style={styles.chartsColumn}>
            {inventoryQuery.isPending ? (
              <AdminLoadingState />
            ) : inventoryQuery.error ? (
              <AdminErrorState error={inventoryQuery.error} onRetry={inventoryQuery.refetch} />
            ) : (
            <>
            {/* KPI Overview Grid */}
            <OverviewCardsGrid style={{ marginBottom: 16 }}>
              <OverviewDashboardCard
                value={finalWarehouseData.kpiItems}
                title={t('wiringReports.analytics.inventoryItems')}
                subtitle={ADMIN_NO_VALUE}
                icon="receiving"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalWarehouseData.kpiLoad}
                title="Capacity Load"
                subtitle={ADMIN_NO_VALUE}
                icon="inventory"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalWarehouseData.kpiTurnaround}
                title="Turnaround"
                subtitle={ADMIN_NO_VALUE}
                icon="truck"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalWarehouseData.kpiBatches}
                title={t('wiringReports.analytics.inventoryBatches')}
                subtitle={ADMIN_NO_VALUE}
                icon="alert"
                tone="danger"
                titlePosition="bottom"
              />
            </OverviewCardsGrid>

            {/* Chart 1 */}
            <CustomBarChart
              title="Intake Throughput (MT)"
              metricNumber={finalWarehouseData.kpiItems}
              barColor={P.orange}
              data={finalWarehouseData.intakeData}
              subtitle="Inventory snapshot"
            />

            {/* Chart 2 */}
            <CustomBarChart
              title="Cold Storage Utilization %"
              metricNumber={finalWarehouseData.kpiLoad}
              barColor={P.greenBar}
              data={finalWarehouseData.coldStorageData}
              subtitle="Optimal climate control target (60% - 85%)"
            />

            {/* Chart 3: Turnaround Time */}
            <CustomBarChart
              title="Intake Turnaround Time (mins)"
              metricNumber={finalWarehouseData.kpiTurnaround}
              barColor={P.blueBar}
              data={finalWarehouseData.turnaroundData}
              subtitle="Dock-to-coldroom processing speed"
            />

            {/* Content 4: Facility Status Matrix */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Regional Facility Status & Climate</Text>
              <Text style={styles.cardBoxSub}>{ADMIN_NO_VALUE}</Text>
            </View>
            </>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            4. SALES TAB (DYNAMIC VALUES & NON-OVERLAPPING CHARTS)
           ══════════════════════════════════════════════════════════════════════ */}
        {selectedCategory === 'Sales' && (
          <View style={styles.chartsColumn}>
            {salesQuery.isPending ? (
              <AdminLoadingState />
            ) : salesQuery.error ? (
              <AdminErrorState error={salesQuery.error} onRetry={salesQuery.refetch} />
            ) : (
            <>
            {/* KPI Overview Grid */}
            <OverviewCardsGrid style={{ marginBottom: 16 }}>
              <OverviewDashboardCard
                value={finalSalesData.kpiGmv}
                title="Total GMV"
                subtitle={`${from} – ${to}`}
                icon="sales"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalSalesData.kpiOrderCount}
                title={t('wiringReports.analytics.salesOrderCount')}
                subtitle={`${from} – ${to}`}
                icon="wallet"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalSalesData.kpiAvgOrderValue}
                title={t('wiringReports.analytics.salesAvgOrderValue')}
                subtitle={`${from} – ${to}`}
                icon="cash"
                tone="success"
                titlePosition="bottom"
              />
              <OverviewDashboardCard
                value={finalSalesData.kpiUplift}
                title="Mandi Uplift"
                subtitle={ADMIN_NO_VALUE}
                icon="box"
                tone="success"
                titlePosition="bottom"
              />
            </OverviewCardsGrid>

            {/* Chart 1 */}
            <CustomBarChart
              title="Gross Merchandise Value (GMV)"
              metricNumber={finalSalesData.kpiGmv}
              barColor={P.blueBar}
              data={finalSalesData.gmvData}
              subtitle={`${from} – ${to}`}
            />

            {/* Chart 2 */}
            <CustomBarChart
              title="Mandi Parity Uplift %"
              metricNumber={finalSalesData.kpiUplift}
              barColor={P.greenBar}
              data={finalSalesData.upliftData}
              subtitle={ADMIN_NO_VALUE}
            />

            {/* Chart 3 */}
            <CustomBarChart
              title="Sales Orders"
              metricNumber={finalSalesData.kpiOrderCount}
              barColor={P.orange}
              data={finalSalesData.revData}
              subtitle={`${from} – ${to}`}
            />

            {/* Content 4: Financial Ledger Breakdown */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Financial Ledger & Margins</Text>
              <Text style={styles.cardBoxSub}>Consolidated platform P&L breakdown ({selectedTimeframe})</Text>

              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Total Platform Revenue</Text>
                <Text style={[styles.clusterVal, { color: P.greenSuccess, fontWeight: '700' }]}>{finalSalesData.revTotal}</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Direct Farmer Procurement Cost</Text>
                <Text style={styles.clusterVal}>{finalSalesData.farmerProcure}</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Cold Chain & Transit Freight</Text>
                <Text style={styles.clusterVal}>{finalSalesData.coldTransit}</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Eco-Packaging & Quality QC</Text>
                <Text style={styles.clusterVal}>{finalSalesData.ecoPack}</Text>
              </View>
              <View style={[styles.clusterRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.clusterName, { fontWeight: '800' }]}>Net Profit Margin</Text>
                <Text style={[styles.clusterVal, { color: P.orange, fontWeight: '800', fontSize: 14 }]}>
                  {finalSalesData.netMargin}
                </Text>
              </View>
            </View>

            {/* Content 5: Payment Channels */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Disbursement & Payment Channels</Text>
              <Text style={styles.cardBoxSub}>{ADMIN_NO_VALUE}</Text>
            </View>
            </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminOverlay.headerSubtitle,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  headerBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: P.titleBrown,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: P.subtitle,
  },

  // Dropdown Styles
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownLeftCol: {
    flex: 1,
    marginRight: 10,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: P.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  dropdownText: {
    fontSize: 15,
    color: P.ink,
    fontWeight: '700',
  },
  dropdownArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownArrow: {
    fontSize: 14,
    color: P.titleBrown,
    fontWeight: '700',
  },
  categoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  categoryMetaPill: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryMetaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.titleBrown,
  },
  categoryMetaSub: {
    fontSize: 12,
    color: P.subtitle,
    fontWeight: '500',
    flex: 1,
  },
  dropdownBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#F0EBE1',
    marginBottom: 0,
  },
  inlineDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#EFE7DE',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  inlineDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF6F0',
  },
  inlineDropdownItemActive: {
    backgroundColor: '#FFF8F4',
  },
  inlineDropdownText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.ink,
  },
  inlineDropdownTextActive: {
    color: P.orange,
    fontWeight: '700',
  },
  inlineDropdownCheckmark: {
    fontSize: 14,
    fontWeight: '800',
    color: P.orange,
  },

  // Timeframe Row
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeframePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.cardBorder,
  },
  timeframePillActive: {
    backgroundColor: '#FFF1EB',
    borderColor: P.orange,
  },
  timeframeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.textSecondary,
  },
  timeframeTextActive: {
    color: P.orange,
    fontWeight: '700',
  },

  // KPI Ribbon Strip
  kpiRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  kpiNum: {
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
    marginBottom: 2,
  },
  kpiLbl: {
    fontSize: 10,
    color: P.subtitle,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  kpiSubGreen: {
    fontSize: 9.5,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  kpiSubMuted: {
    fontSize: 9.5,
    fontWeight: '600',
    color: P.textSecondary,
  },

  // Charts Column
  chartsColumn: {
    gap: 16,
  },
  chartCard: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  chartTitleCol: {
    flex: 1,
    paddingRight: 10,
  },
  chartTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 12,
    color: P.subtitle,
    marginTop: 3,
    lineHeight: 16,
  },
  chartMetricNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: P.titleBrown,
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 13,
    color: P.subtitle,
    fontWeight: '600',
  },
  chartCanvas: {
    backgroundColor: '#FAF8F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE9DF',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLineContainer: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E0D4',
    borderStyle: 'dashed',
  },
  gridLineBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#DCD5C8',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 172,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValueWrapper: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.titleBrown,
    textAlign: 'center',
  },
  barTrack: {
    justifyContent: 'flex-end',
    backgroundColor: '#EDE8E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 12,
    color: P.titleBrown,
    marginTop: 8,
    fontWeight: '700',
    textAlign: 'center',
  },

  // General Card Box
  cardBox: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBoxTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  cardBoxSub: {
    fontSize: 12,
    color: P.subtitle,
    marginBottom: 14,
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  // Distribution Lists & Progress Bars
  distributionList: {
    gap: 12,
  },
  distRow: {},
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  distName: {
    fontSize: 13,
    fontWeight: '600',
    color: P.ink,
  },
  distVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.textSecondary,
  },
  barProgressTrack: {
    height: 7,
    backgroundColor: '#F3EFE9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barProgressBar: {
    height: '100%',
    borderRadius: 4,
  },

  // Tables
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
    marginBottom: 4,
  },
  tableCol: {
    fontSize: 11,
    fontWeight: '700',
    color: P.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  cellBold: {
    fontSize: 13,
    fontWeight: '700',
    color: P.ink,
  },
  cellText: {
    fontSize: 12.5,
    color: P.textSecondary,
  },
  cellRating: {
    fontSize: 12,
    fontWeight: '700',
    color: P.amberBar,
  },

  // Certification Matrix
  certGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  certBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  certNum: {
    fontSize: 18,
    fontWeight: '800',
    color: P.ink,
    marginBottom: 2,
  },
  certLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.titleBrown,
    textAlign: 'center',
    marginBottom: 2,
  },
  certSubText: {
    fontSize: 9.5,
    color: P.subtitle,
  },

  // Facility Cards
  facilityCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  facilityName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.ink,
  },
  facilityCap: {
    fontSize: 12,
    color: P.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  facilityTelemetry: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryText: {
    fontSize: 11,
    color: P.subtitle,
  },
  telemetryDot: {
    marginHorizontal: 6,
    color: '#CCC',
  },
  boldInk: {
    fontWeight: '700',
    color: P.ink,
  },

  // Badges
  badgePillGreen: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePillTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },

  // Cluster Rows
  clusterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  clusterName: {
    fontSize: 13,
    color: P.ink,
    fontWeight: '500',
    flex: 1,
  },
  clusterVal: {
    fontSize: 12.5,
    color: P.textSecondary,
    fontWeight: '600',
  },
});

export default AnalyticsDashboardScreen;
