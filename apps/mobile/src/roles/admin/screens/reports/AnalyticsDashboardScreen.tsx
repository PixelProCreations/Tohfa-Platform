import React, { useState } from 'react';
import {
  Dimensions,
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
          {data.map((item, index) => {
            const barHeight = Math.max(14, (item.value / maxVal) * barMaxHeight);
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
          })}
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

  const categories: AnalyticsCategory[] = ['Farmers', 'Customers', 'Warehouses', 'Sales'];
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
      tag: '42 Active / 420 Acres',
    },
    {
      key: 'Customers',
      title: 'Customers Analytics',
      subtitle: 'Buyer volume, retention rates & average basket',
      tag: '1,240 Buyers / 95% Retention',
    },
    {
      key: 'Warehouses',
      title: 'Warehouses Analytics',
      subtitle: 'Stock turnover, capacity utilization & reject rates',
      tag: '4.2 Turnover / 2.1% Rejections',
    },
    {
      key: 'Sales',
      title: 'Sales Analytics',
      subtitle: 'Platform GMV, revenue take-rate & mandi uplift',
      tag: '₹38.4L GMV / +8.8% Uplift',
    },
  ];

  const currentCategory = categoryOptions.find((c) => c.key === selectedCategory) ?? categoryOptions[0]!;

  // ─── Dynamic Data for Timeframes ───────────────────────────────────────────
  // 1. Farmers
  const farmerDataMap = {
    'Last Month': {
      kpiApps: '42',
      kpiRating: '7.12',
      kpiYield: '98 MT',
      kpiAcres: '420',
      appsData: [
        { label: 'W1', value: 8 },
        { label: 'W2', value: 12 },
        { label: 'W3', value: 10 },
        { label: 'W4', value: 12 },
      ],
      ratingData: [
        { label: 'W1', value: 68 },
        { label: 'W2', value: 70 },
        { label: 'W3', value: 71 },
        { label: 'W4', value: 72 },
      ],
      yieldData: [
        { label: 'W1', value: 20 },
        { label: 'W2', value: 24 },
        { label: 'W3', value: 26 },
        { label: 'W4', value: 28 },
      ],
      cropBreakdown: [
        { name: 'Carrots', volume: '48 MT (49%)', pct: '49%', color: P.orange },
        { name: 'Hill Potatoes', volume: '28 MT (29%)', pct: '29%', color: P.amberBar },
        { name: 'Specialty Tea Leaf', volume: '14 MT (14%)', pct: '14%', color: P.greenBar },
        { name: 'Exotic Herbs & Greens', volume: '8 MT (8%)', pct: '8%', color: P.purpleBar },
      ],
    },
    'This Quarter': {
      kpiApps: '128',
      kpiRating: '7.45',
      kpiYield: '284 MT',
      kpiAcres: '510',
      appsData: [
        { label: 'Jul', value: 38 },
        { label: 'Aug', value: 44 },
        { label: 'Sep', value: 46 },
      ],
      ratingData: [
        { label: 'Jul', value: 72 },
        { label: 'Aug', value: 74 },
        { label: 'Sep', value: 76 },
      ],
      yieldData: [
        { label: 'Jul', value: 82 },
        { label: 'Aug', value: 96 },
        { label: 'Sep', value: 106 },
      ],
      cropBreakdown: [
        { name: 'Carrots', volume: '138 MT (48%)', pct: '48%', color: P.orange },
        { name: 'Hill Potatoes', volume: '82 MT (29%)', pct: '29%', color: P.amberBar },
        { name: 'Specialty Tea Leaf', volume: '42 MT (15%)', pct: '15%', color: P.greenBar },
        { name: 'Exotic Herbs & Greens', volume: '22 MT (8%)', pct: '8%', color: P.purpleBar },
      ],
    },
    'FY 2026-27': {
      kpiApps: '340',
      kpiRating: '7.82',
      kpiYield: '860 MT',
      kpiAcres: '680',
      appsData: [
        { label: 'Q1', value: 92 },
        { label: 'Q2', value: 118 },
        { label: 'Q3', value: 130 },
      ],
      ratingData: [
        { label: 'Q1', value: 70 },
        { label: 'Q2', value: 75 },
        { label: 'Q3', value: 78 },
      ],
      yieldData: [
        { label: 'Q1', value: 240 },
        { label: 'Q2', value: 295 },
        { label: 'Q3', value: 325 },
      ],
      cropBreakdown: [
        { name: 'Carrots', volume: '420 MT (49%)', pct: '49%', color: P.orange },
        { name: 'Hill Potatoes', volume: '248 MT (29%)', pct: '29%', color: P.amberBar },
        { name: 'Specialty Tea Leaf', volume: '128 MT (15%)', pct: '15%', color: P.greenBar },
        { name: 'Exotic Herbs & Greens', volume: '64 MT (7%)', pct: '7%', color: P.purpleBar },
      ],
    },
  }[selectedTimeframe];

  // 2. Customers
  const customerDataMap = {
    'Last Month': {
      kpiBuyers: '1,240',
      kpiRetention: '95%',
      kpiBasket: '₹1,850',
      kpiRepeat: '3.4x',
      ordersData: [
        { label: 'W1', value: 38 },
        { label: 'W2', value: 46 },
        { label: 'W3', value: 48 },
        { label: 'W4', value: 52 },
      ],
      retentionData: [
        { label: 'W1', value: 92 },
        { label: 'W2', value: 93 },
        { label: 'W3', value: 94 },
        { label: 'W4', value: 95 },
      ],
      basketData: [
        { label: 'W1', value: 1520, displayValue: '₹1,520' },
        { label: 'W2', value: 1650, displayValue: '₹1,650' },
        { label: 'W3', value: 1780, displayValue: '₹1,780' },
        { label: 'W4', value: 1850, displayValue: '₹1,850' },
      ],
    },
    'This Quarter': {
      kpiBuyers: '2,850',
      kpiRetention: '96.5%',
      kpiBasket: '₹2,150',
      kpiRepeat: '4.1x',
      ordersData: [
        { label: 'Jul', value: 160 },
        { label: 'Aug', value: 185 },
        { label: 'Sep', value: 195 },
      ],
      retentionData: [
        { label: 'Jul', value: 94 },
        { label: 'Aug', value: 95 },
        { label: 'Sep', value: 96.5, displayValue: '96.5%' },
      ],
      basketData: [
        { label: 'Jul', value: 1850, displayValue: '₹1,850' },
        { label: 'Aug', value: 1980, displayValue: '₹1,980' },
        { label: 'Sep', value: 2150, displayValue: '₹2,150' },
      ],
    },
    'FY 2026-27': {
      kpiBuyers: '6,400',
      kpiRetention: '97.2%',
      kpiBasket: '₹2,400',
      kpiRepeat: '4.8x',
      ordersData: [
        { label: 'Q1', value: 480 },
        { label: 'Q2', value: 620 },
        { label: 'Q3', value: 720 },
      ],
      retentionData: [
        { label: 'Q1', value: 93 },
        { label: 'Q2', value: 95 },
        { label: 'Q3', value: 97.2, displayValue: '97.2%' },
      ],
      basketData: [
        { label: 'Q1', value: 2050, displayValue: '₹2,050' },
        { label: 'Q2', value: 2200, displayValue: '₹2,200' },
        { label: 'Q3', value: 2400, displayValue: '₹2,400' },
      ],
    },
  }[selectedTimeframe];

  // 3. Warehouses
  const warehouseDataMap = {
    'Last Month': {
      kpiIntake: '142 MT',
      kpiLoad: '78.4%',
      kpiTurnaround: '38m',
      kpiLoss: '0.28%',
      intakeData: [
        { label: 'W1', value: 30 },
        { label: 'W2', value: 35 },
        { label: 'W3', value: 38 },
        { label: 'W4', value: 39 },
      ],
      coldStorageData: [
        { label: 'W1', value: 72 },
        { label: 'W2', value: 75 },
        { label: 'W3', value: 76 },
        { label: 'W4', value: 78 },
      ],
      turnaroundData: [
        { label: 'W1', value: 44 },
        { label: 'W2', value: 41 },
        { label: 'W3', value: 39 },
        { label: 'W4', value: 38 },
      ],
    },
    'This Quarter': {
      kpiIntake: '412 MT',
      kpiLoad: '82.0%',
      kpiTurnaround: '34m',
      kpiLoss: '0.24%',
      intakeData: [
        { label: 'Jul', value: 125 },
        { label: 'Aug', value: 138 },
        { label: 'Sep', value: 149 },
      ],
      coldStorageData: [
        { label: 'Jul', value: 76 },
        { label: 'Aug', value: 80 },
        { label: 'Sep', value: 82 },
      ],
      turnaroundData: [
        { label: 'Jul', value: 37 },
        { label: 'Aug', value: 35 },
        { label: 'Sep', value: 34 },
      ],
    },
    'FY 2026-27': {
      kpiIntake: '1,240 MT',
      kpiLoad: '85.2%',
      kpiTurnaround: '31m',
      kpiLoss: '0.20%',
      intakeData: [
        { label: 'Q1', value: 360 },
        { label: 'Q2', value: 420 },
        { label: 'Q3', value: 460 },
      ],
      coldStorageData: [
        { label: 'Q1', value: 78 },
        { label: 'Q2', value: 82 },
        { label: 'Q3', value: 85 },
      ],
      turnaroundData: [
        { label: 'Q1', value: 36 },
        { label: 'Q2', value: 33 },
        { label: 'Q3', value: 31 },
      ],
    },
  }[selectedTimeframe];

  // 4. Sales
  const salesDataMap = {
    'Last Month': {
      kpiGmv: '₹38.4L',
      kpiRev: '₹4.82L',
      kpiNet: '₹1.72L',
      kpiUplift: '+8.8%',
      gmvData: [
        { label: 'W1', value: 82 },
        { label: 'W2', value: 94 },
        { label: 'W3', value: 101 },
        { label: 'W4', value: 107 },
      ],
      upliftData: [
        { label: 'W1', value: 80 },
        { label: 'W2', value: 83 },
        { label: 'W3', value: 85 },
        { label: 'W4', value: 88 },
      ],
      revData: [
        { label: 'W1', value: 70 },
        { label: 'W2', value: 80 },
        { label: 'W3', value: 88 },
        { label: 'W4', value: 95 },
      ],
      revTotal: '₹4,82,000',
      farmerProcure: '₹3,10,000',
      coldTransit: '₹62,000',
      ecoPack: '₹24,000',
      netMargin: '₹1,72,000 (17.9%)',
    },
    'This Quarter': {
      kpiGmv: '₹1.14 Cr',
      kpiRev: '₹14.2L',
      kpiNet: '₹5.18L',
      kpiUplift: '+9.4%',
      gmvData: [
        { label: 'Jul', value: 34 },
        { label: 'Aug', value: 38 },
        { label: 'Sep', value: 42 },
      ],
      upliftData: [
        { label: 'Jul', value: 86 },
        { label: 'Aug', value: 90 },
        { label: 'Sep', value: 94 },
      ],
      revData: [
        { label: 'Jul', value: 75 },
        { label: 'Aug', value: 85 },
        { label: 'Sep', value: 96 },
      ],
      revTotal: '₹14,20,000',
      farmerProcure: '₹9,12,000',
      coldTransit: '₹1,80,000',
      ecoPack: '₹68,000',
      netMargin: '₹5,18,000 (18.2%)',
    },
    'FY 2026-27': {
      kpiGmv: '₹3.42 Cr',
      kpiRev: '₹42.8L',
      kpiNet: '₹15.6L',
      kpiUplift: '+10.2%',
      gmvData: [
        { label: 'Q1', value: 98 },
        { label: 'Q2', value: 118 },
        { label: 'Q3', value: 126 },
      ],
      upliftData: [
        { label: 'Q1', value: 88 },
        { label: 'Q2', value: 95 },
        { label: 'Q3', value: 102 },
      ],
      revData: [
        { label: 'Q1', value: 82 },
        { label: 'Q2', value: 90 },
        { label: 'Q3', value: 98 },
      ],
      revTotal: '₹42,80,000',
      farmerProcure: '₹27,45,000',
      coldTransit: '₹5,40,000',
      ecoPack: '₹1,95,000',
      netMargin: '₹15,60,000 (18.6%)',
    },
  }[selectedTimeframe];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to reports"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Page Title Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.pageSubtitle}>Cross-platform visual metrics & trends</Text>
        </View>

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
            {/* KPI Ribbon Strip */}
            <View style={styles.kpiRibbon}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{farmerDataMap.kpiApps}</Text>
                <Text style={styles.kpiLbl}>New Applications</Text>
                <Text style={styles.kpiSubGreen}>↑ Pipeline</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{farmerDataMap.kpiRating}</Text>
                <Text style={styles.kpiLbl}>Avg Rating</Text>
                <Text style={styles.kpiSubGreen}>★ 10-Cat SLA</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{farmerDataMap.kpiYield}</Text>
                <Text style={styles.kpiLbl}>Yield Intake</Text>
                <Text style={styles.kpiSubGreen}>91% Grade A</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{farmerDataMap.kpiAcres}</Text>
                <Text style={styles.kpiLbl}>Total Acres</Text>
                <Text style={styles.kpiSubMuted}>100% Geotagged</Text>
              </View>
            </View>

            {/* Chart 1: Applications */}
            <CustomBarChart
              title="New Farmer Applications"
              metricNumber={farmerDataMap.kpiApps}
              barColor={P.orange}
              data={farmerDataMap.appsData}
              subtitle="Quarterly verification pipeline"
            />

            {/* Chart 2: Ratings */}
            <CustomBarChart
              title="Avg. Farm Rating (x100)"
              metricNumber={Math.round(parseFloat(farmerDataMap.kpiRating) * 100)}
              barColor={P.greenBar}
              data={farmerDataMap.ratingData}
              subtitle="Nilgiris 10-category organic scorecard"
            />

            {/* Chart 3: Yield Output Trend */}
            <CustomBarChart
              title="Harvest Delivery Yield (MT)"
              metricNumber={farmerDataMap.kpiYield}
              barColor={P.blueBar}
              data={farmerDataMap.yieldData}
              subtitle="Aggregate farm pickup volume"
            />

            {/* Content 4: Crop Commodity Share */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Produce Commodity Share</Text>
              <Text style={styles.cardBoxSub}>{farmerDataMap.kpiYield} total harvest distribution ({selectedTimeframe})</Text>

              <View style={styles.distributionList}>
                {farmerDataMap.cropBreakdown.map((item, idx) => (
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
              <Text style={styles.cardBoxSub}>Performance & volume across regional supply hubs</Text>

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCol, { flex: 2 }]}>Cluster</Text>
                <Text style={[styles.tableCol, { flex: 1.2, textAlign: 'center' }]}>Farmers</Text>
                <Text style={[styles.tableCol, { flex: 1.2, textAlign: 'center' }]}>Yield</Text>
                <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Rating</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.cellBold, { flex: 2 }]}>Kotagiri Ridge</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>18</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>42 MT</Text>
                <Text style={[styles.cellRating, { flex: 1, textAlign: 'right' }]}>8.9 ★</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.cellBold, { flex: 2 }]}>Coonoor Valley</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>16</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>34 MT</Text>
                <Text style={[styles.cellRating, { flex: 1, textAlign: 'right' }]}>7.8 ★</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.cellBold, { flex: 2 }]}>Ooty Highlands</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>14</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>22 MT</Text>
                <Text style={[styles.cellRating, { flex: 1, textAlign: 'right' }]}>8.5 ★</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.cellBold, { flex: 2 }]}>Gudalur Valley</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>8</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center' }]}>12 MT</Text>
                <Text style={[styles.cellRating, { flex: 1, textAlign: 'right' }]}>7.5 ★</Text>
              </View>
            </View>

            {/* Content 6: Certification & Compliance Matrix */}
            <View style={styles.cardBox}>
              <View style={styles.flexRowBetween}>
                <Text style={styles.cardBoxTitle}>Organic Certification Status</Text>
                <View style={styles.badgePillGreen}>
                  <Text style={styles.badgePillTextGreen}>92% Verified</Text>
                </View>
              </View>

              <View style={styles.certGrid}>
                <View style={styles.certBox}>
                  <Text style={styles.certNum}>142</Text>
                  <Text style={styles.certLabel}>PGS Organic</Text>
                  <Text style={styles.certSubText}>Peer verified</Text>
                </View>
                <View style={styles.certBox}>
                  <Text style={styles.certNum}>28</Text>
                  <Text style={styles.certLabel}>NPOP Certified</Text>
                  <Text style={styles.certSubText}>Third party</Text>
                </View>
                <View style={styles.certBox}>
                  <Text style={styles.certNum}>14</Text>
                  <Text style={styles.certLabel}>Under Audit</Text>
                  <Text style={styles.certSubText}>In pipeline</Text>
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
            {/* KPI Ribbon Strip */}
            <View style={styles.kpiRibbon}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{customerDataMap.kpiBuyers}</Text>
                <Text style={styles.kpiLbl}>Verified Buyers</Text>
                <Text style={styles.kpiSubGreen}>↑ Active</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{customerDataMap.kpiRetention}</Text>
                <Text style={styles.kpiLbl}>Retention Rate</Text>
                <Text style={styles.kpiSubGreen}>Recurring SLA</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{customerDataMap.kpiBasket}</Text>
                <Text style={styles.kpiLbl}>Avg Basket</Text>
                <Text style={styles.kpiSubGreen}>Organic B2C</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{customerDataMap.kpiRepeat}</Text>
                <Text style={styles.kpiLbl}>Repeat Orders</Text>
                <Text style={styles.kpiSubMuted}>Per Month</Text>
              </View>
            </View>

            {/* Chart 1 */}
            <CustomBarChart
              title="Active Customer Orders"
              metricNumber={customerDataMap.ordersData.reduce((acc, cur) => acc + cur.value, 0)}
              barColor={P.blueBar}
              data={customerDataMap.ordersData}
              subtitle="Verified retail & B2B buyers"
            />

            {/* Chart 2 */}
            <CustomBarChart
              title="Monthly Retention Rate %"
              metricNumber={customerDataMap.kpiRetention}
              barColor={P.greenBar}
              data={customerDataMap.retentionData}
              subtitle="Recurring weekly delivery subscribers"
            />

            {/* Chart 3: Basket Size */}
            <CustomBarChart
              title="Average Basket Value (₹)"
              metricNumber={customerDataMap.kpiBasket}
              barColor={P.orange}
              data={customerDataMap.basketData}
              subtitle="Direct harvest consumer baskets"
            />

            {/* Content 4: Demand Channels */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Demand Allocation Channels</Text>
              <Text style={styles.cardBoxSub}>Fulfillment spread across sales streams</Text>

              <View style={styles.distributionList}>
                <View style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>Online Consumer Baskets (Doorstep)</Text>
                    <Text style={styles.distVal}>70%</Text>
                  </View>
                  <View style={styles.barProgressTrack}>
                    <View style={[styles.barProgressBar, { width: '70%', backgroundColor: P.orange }]} />
                  </View>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>Horeca & Premium Restaurants</Text>
                    <Text style={styles.distVal}>20%</Text>
                  </View>
                  <View style={styles.barProgressTrack}>
                    <View style={[styles.barProgressBar, { width: '20%', backgroundColor: P.blueBar }]} />
                  </View>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>Physical Hill Produce Markets</Text>
                    <Text style={styles.distVal}>10%</Text>
                  </View>
                  <View style={styles.barProgressTrack}>
                    <View style={[styles.barProgressBar, { width: '10%', backgroundColor: P.greenBar }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Content 5: Regional Delivery Footprint */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Buyer Geography & Delivery SLA</Text>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Bangalore Metro Cluster</Text>
                <Text style={styles.clusterVal}>48% volume · 18h SLA</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Chennai Metro Corridor</Text>
                <Text style={styles.clusterVal}>32% volume · 24h SLA</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Coimbatore & Tirupur Belt</Text>
                <Text style={styles.clusterVal}>14% volume · 12h SLA</Text>
              </View>
              <View style={[styles.clusterRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.clusterName}>Local Nilgiris Delivery</Text>
                <Text style={styles.clusterVal}>6% volume · 4h SLA</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            3. WAREHOUSES TAB (DYNAMIC VALUES & NON-OVERLAPPING CHARTS)
           ══════════════════════════════════════════════════════════════════════ */}
        {selectedCategory === 'Warehouses' && (
          <View style={styles.chartsColumn}>
            {/* KPI Ribbon Strip */}
            <View style={styles.kpiRibbon}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{warehouseDataMap.kpiIntake}</Text>
                <Text style={styles.kpiLbl}>Total Intake</Text>
                <Text style={styles.kpiSubGreen}>Volume</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{warehouseDataMap.kpiLoad}</Text>
                <Text style={styles.kpiLbl}>Capacity Load</Text>
                <Text style={styles.kpiSubGreen}>Optimal 60-85%</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{warehouseDataMap.kpiTurnaround}</Text>
                <Text style={styles.kpiLbl}>Turnaround</Text>
                <Text style={styles.kpiSubGreen}>Dock to Cold</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{warehouseDataMap.kpiLoss}</Text>
                <Text style={styles.kpiLbl}>Loss/Spoilage</Text>
                <Text style={styles.kpiSubGreen}>Below 1.5% SLA</Text>
              </View>
            </View>

            {/* Chart 1 */}
            <CustomBarChart
              title="Intake Throughput (MT)"
              metricNumber={warehouseDataMap.kpiIntake}
              barColor={P.orange}
              data={warehouseDataMap.intakeData}
              subtitle="Nilgiris regional grading hubs"
            />

            {/* Chart 2 */}
            <CustomBarChart
              title="Cold Storage Utilization %"
              metricNumber={warehouseDataMap.kpiLoad}
              barColor={P.greenBar}
              data={warehouseDataMap.coldStorageData}
              subtitle="Optimal climate control target (60% - 85%)"
            />

            {/* Chart 3: Turnaround Time */}
            <CustomBarChart
              title="Intake Turnaround Time (mins)"
              metricNumber={warehouseDataMap.kpiTurnaround}
              barColor={P.blueBar}
              data={warehouseDataMap.turnaroundData}
              subtitle="Dock-to-coldroom processing speed"
            />

            {/* Content 4: Facility Status Matrix */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Regional Facility Status & Climate</Text>
              <Text style={styles.cardBoxSub}>Real-time sensor logs across storage centers</Text>

              <View style={styles.facilityCard}>
                <View style={styles.flexRowBetween}>
                  <Text style={styles.facilityName}>Kotagiri Central Aggregation</Text>
                  <View style={styles.badgePillGreen}>
                    <Text style={styles.badgePillTextGreen}>Optimal</Text>
                  </View>
                </View>
                <Text style={styles.facilityCap}>Storage: 68.4 MT / 85 MT (80%)</Text>
                <View style={styles.facilityTelemetry}>
                  <Text style={styles.telemetryText}>Temp: <Text style={styles.boldInk}>18.4°C</Text></Text>
                  <Text style={styles.telemetryDot}>•</Text>
                  <Text style={styles.telemetryText}>Humidity: <Text style={styles.boldInk}>65% RH</Text></Text>
                  <Text style={styles.telemetryDot}>•</Text>
                  <Text style={styles.telemetryText}>Turnaround: <Text style={styles.boldInk}>34m</Text></Text>
                </View>
              </View>

              <View style={styles.facilityCard}>
                <View style={styles.flexRowBetween}>
                  <Text style={styles.facilityName}>Ooty Sub-Zero Cold Hub</Text>
                  <View style={styles.badgePillGreen}>
                    <Text style={styles.badgePillTextGreen}>Compliant</Text>
                  </View>
                </View>
                <Text style={styles.facilityCap}>Storage: 44.8 MT / 60 MT (74%)</Text>
                <View style={styles.facilityTelemetry}>
                  <Text style={styles.telemetryText}>Temp: <Text style={styles.boldInk}>2.1°C</Text></Text>
                  <Text style={styles.telemetryDot}>•</Text>
                  <Text style={styles.telemetryText}>Humidity: <Text style={styles.boldInk}>85% RH</Text></Text>
                  <Text style={styles.telemetryDot}>•</Text>
                  <Text style={styles.telemetryText}>Turnaround: <Text style={styles.boldInk}>42m</Text></Text>
                </View>
              </View>

              <View style={[styles.facilityCard, { marginBottom: 0 }]}>
                <View style={styles.flexRowBetween}>
                  <Text style={styles.facilityName}>Coonoor Fast Transit Depot</Text>
                  <View style={styles.badgePillGreen}>
                    <Text style={styles.badgePillTextGreen}>Active</Text>
                  </View>
                </View>
                <Text style={styles.facilityCap}>Storage: 29.6 MT / 40 MT (74%)</Text>
                <View style={styles.facilityTelemetry}>
                  <Text style={styles.telemetryText}>Temp: <Text style={styles.boldInk}>19.0°C</Text></Text>
                  <Text style={styles.telemetryDot}>•</Text>
                  <Text style={styles.telemetryText}>Humidity: <Text style={styles.boldInk}>60% RH</Text></Text>
                  <Text style={styles.telemetryDot}>•</Text>
                  <Text style={styles.telemetryText}>Turnaround: <Text style={styles.boldInk}>28m</Text></Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            4. SALES TAB (DYNAMIC VALUES & NON-OVERLAPPING CHARTS)
           ══════════════════════════════════════════════════════════════════════ */}
        {selectedCategory === 'Sales' && (
          <View style={styles.chartsColumn}>
            {/* KPI Ribbon Strip */}
            <View style={styles.kpiRibbon}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{salesDataMap.kpiGmv}</Text>
                <Text style={styles.kpiLbl}>Total GMV</Text>
                <Text style={styles.kpiSubGreen}>↑ Volume</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{salesDataMap.kpiRev}</Text>
                <Text style={styles.kpiLbl}>Platform Rev</Text>
                <Text style={styles.kpiSubGreen}>Take Rate</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{salesDataMap.kpiNet}</Text>
                <Text style={styles.kpiLbl}>Net Profit</Text>
                <Text style={styles.kpiSubGreen}>↑ Margins</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiNum}>{salesDataMap.kpiUplift}</Text>
                <Text style={styles.kpiLbl}>Mandi Uplift</Text>
                <Text style={styles.kpiSubGreen}>Farmer Bonus</Text>
              </View>
            </View>

            {/* Chart 1 */}
            <CustomBarChart
              title="Gross Merchandise Value (GMV)"
              metricNumber={salesDataMap.kpiGmv}
              barColor={P.blueBar}
              data={salesDataMap.gmvData}
              subtitle="Direct harvest exchange trading"
            />

            {/* Chart 2 */}
            <CustomBarChart
              title="Mandi Parity Uplift %"
              metricNumber={salesDataMap.kpiUplift}
              barColor={P.greenBar}
              data={salesDataMap.upliftData}
              subtitle="Fair farmer price discovery bonus"
            />

            {/* Chart 3 */}
            <CustomBarChart
              title="Net Revenue Growth (₹L)"
              metricNumber={salesDataMap.kpiRev}
              barColor={P.orange}
              data={salesDataMap.revData}
              subtitle="Platform commission & service fee"
            />

            {/* Content 4: Financial Ledger Breakdown */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Financial Ledger & Margins</Text>
              <Text style={styles.cardBoxSub}>Consolidated platform P&L breakdown ({selectedTimeframe})</Text>

              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Total Platform Revenue</Text>
                <Text style={[styles.clusterVal, { color: P.greenSuccess, fontWeight: '700' }]}>{salesDataMap.revTotal}</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Direct Farmer Procurement Cost</Text>
                <Text style={styles.clusterVal}>{salesDataMap.farmerProcure}</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Cold Chain & Transit Freight</Text>
                <Text style={styles.clusterVal}>{salesDataMap.coldTransit}</Text>
              </View>
              <View style={styles.clusterRow}>
                <Text style={styles.clusterName}>Eco-Packaging & Quality QC</Text>
                <Text style={styles.clusterVal}>{salesDataMap.ecoPack}</Text>
              </View>
              <View style={[styles.clusterRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.clusterName, { fontWeight: '800' }]}>Net Profit Margin</Text>
                <Text style={[styles.clusterVal, { color: P.orange, fontWeight: '800', fontSize: 14 }]}>
                  {salesDataMap.netMargin}
                </Text>
              </View>
            </View>

            {/* Content 5: Payment Channels */}
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>Disbursement & Payment Channels</Text>
              <View style={styles.distributionList}>
                <View style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>Instant UPI Auto-Disburse</Text>
                    <Text style={styles.distVal}>74%</Text>
                  </View>
                  <View style={styles.barProgressTrack}>
                    <View style={[styles.barProgressBar, { width: '74%', backgroundColor: P.greenBar }]} />
                  </View>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>Escrow Bank Transfers (NEFT/IMPS)</Text>
                    <Text style={styles.distVal}>20%</Text>
                  </View>
                  <View style={styles.barProgressTrack}>
                    <View style={[styles.barProgressBar, { width: '20%', backgroundColor: P.blueBar }]} />
                  </View>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>Institutional Corporate Ledger</Text>
                    <Text style={styles.distVal}>6%</Text>
                  </View>
                  <View style={styles.barProgressTrack}>
                    <View style={[styles.barProgressBar, { width: '6%', backgroundColor: P.purpleBar }]} />
                  </View>
                </View>
              </View>
            </View>
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
    backgroundColor: P.bg,
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
