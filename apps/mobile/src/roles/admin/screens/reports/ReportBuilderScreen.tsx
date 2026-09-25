import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const PALETTE = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#F0ECE6',
  orangePrimary: '#E85226',
  orangeLight: '#FFF1EB',
  greenSuccess: '#16A34A',
};

export type ReportType = 'pl' | 'farmer' | 'warehouse';

export interface ReportBuilderScreenProps {
  onBack: () => void;
  onGenerate?: (type: ReportType) => void;
}

interface ReportConfig {
  name: string;
  scopeLabel: string;
  defaultScope: string;
  scopeOptions: string[];
  metrics: { id: string; label: string; defaultChecked: boolean }[];
  description: string;
}

const REPORT_TYPE_CONFIG: Record<ReportType, ReportConfig> = {
  pl: {
    name: 'P&L Report',
    scopeLabel: 'Financial Revenue Stream',
    defaultScope: 'All Streams & Channels',
    scopeOptions: [
      'All Streams & Channels',
      'Online App Sales (Direct Consumer)',
      'Live Mandi & Spot Auctions',
      'Horeca & Institutional B2B Contracts',
    ],
    metrics: [
      { id: 'pl_rev', label: 'Total Platform Revenue (Online, Mandi, B2B)', defaultChecked: true },
      { id: 'pl_exp', label: 'Direct Farmer Procurement & Payouts Outflow', defaultChecked: true },
      { id: 'pl_ops', label: 'Warehouse & Cold-Chain Operating Expenses', defaultChecked: true },
      { id: 'pl_ebitda', label: 'Net Profit (EBITDA) & Operating Margin %', defaultChecked: true },
      { id: 'pl_mom', label: 'Month-over-Month (MoM) Growth Variance', defaultChecked: false },
    ],
    description: 'Generates consolidated platform financial statements and EBITDA breakdown.',
  },
  farmer: {
    name: 'Farmer Performance',
    scopeLabel: 'Regional Cluster & Farmer Tier',
    defaultScope: 'All Nilgiris Farmers (Aggregate)',
    scopeOptions: [
      'All Nilgiris Farmers (Aggregate)',
      'Kotagiri Hill Vegetable Growers (Tier A)',
      'Ooty Exotic Carrot & Organic Cluster',
      'Coonoor Tea & Spice Smallholders',
      'Gudalur Mandi Farmers & Producers',
    ],
    metrics: [
      { id: 'fm_grading', label: 'Quality Rating Score & Grade A Share %', defaultChecked: true },
      { id: 'fm_yield', label: 'Harvest Procurement Volume & Deliveries (MT)', defaultChecked: true },
      { id: 'fm_acres', label: 'Registered Acreage & Crop Distribution', defaultChecked: true },
      { id: 'fm_payouts', label: 'Direct Farmgate Payout Settlement Status', defaultChecked: true },
      { id: 'fm_cert', label: 'Organic & PGS Certification Compliance', defaultChecked: false },
    ],
    description: 'Aggregates grower scorecard ratings, harvest yields, and verification status.',
  },
  warehouse: {
    name: 'Warehouse Operations',
    scopeLabel: 'Warehouse Facility',
    defaultScope: 'All Regional Hubs & Depots',
    scopeOptions: [
      'All Regional Hubs & Depots',
      'Ooty Sub-Zero Cold Storage Facility (60 MT)',
      'Kotagiri Central Grading & Aggregation (85 MT)',
      'Coonoor Transit & Dry Storage Depot (40 MT)',
      'Gudalur Market Aggregation Center (40 MT)',
    ],
    metrics: [
      { id: 'wh_turnover', label: 'Stock Turnover Rate & Holding Time', defaultChecked: true },
      { id: 'wh_volume', label: 'Intake Receiving & Weighment Volume (MT)', defaultChecked: true },
      { id: 'wh_rejection', label: 'QC Quality Rejection & Discard Rate (%)', defaultChecked: true },
      { id: 'wh_transfers', label: 'Pending Inter-Hub Fleet Transfers', defaultChecked: true },
      { id: 'wh_temp', label: 'Sub-Zero Cold Chain Temperature Compliance', defaultChecked: false },
    ],
    description: 'Audits hub stock levels, cold storage health, and dispatch turnarounds.',
  },
};

export function ReportBuilderScreen({ onBack, onGenerate }: ReportBuilderScreenProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('pl');
  const [dateRange, setDateRange] = useState<'This Month' | 'This Quarter' | 'Custom'>('This Month');
  const [customStartDate, setCustomStartDate] = useState('01 Sep 2026');
  const [customEndDate, setCustomEndDate] = useState('25 Sep 2026');

  const [selectedScopes, setSelectedScopes] = useState<Record<ReportType, string>>({
    pl: REPORT_TYPE_CONFIG.pl.defaultScope,
    farmer: REPORT_TYPE_CONFIG.farmer.defaultScope,
    warehouse: REPORT_TYPE_CONFIG.warehouse.defaultScope,
  });
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const [selectedMetrics, setSelectedMetrics] = useState<Record<string, boolean>>({
    pl_rev: true,
    pl_exp: true,
    pl_ops: true,
    pl_ebitda: true,
    pl_mom: false,
    fm_grading: true,
    fm_yield: true,
    fm_acres: true,
    fm_payouts: true,
    fm_cert: false,
    wh_turnover: true,
    wh_volume: true,
    wh_rejection: true,
    wh_transfers: true,
    wh_temp: false,
  });
  const [format, setFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');

  const currentConfig = REPORT_TYPE_CONFIG[selectedType];
  const currentScope = selectedScopes[selectedType];

  const toggleMetric = (id: string) => {
    setSelectedMetrics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectScope = (option: string) => {
    setSelectedScopes((prev) => ({ ...prev, [selectedType]: option }));
    setShowScopeDropdown(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
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

        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Create Report</Text>
          <Text style={styles.pageSubtitle}>Mobile report builder — template-based version</Text>
        </View>

        {/* 3 Report Type Selector Cards */}
        <View style={styles.typeCardsRow}>
          <TouchableOpacity
            style={[styles.typeCard, selectedType === 'pl' && styles.typeCardActive]}
            onPress={() => {
              setSelectedType('pl');
              setShowScopeDropdown(false);
            }}
            activeOpacity={0.8}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 6 }}>
              <Line x1="18" y1="20" x2="18" y2="10" stroke={selectedType === 'pl' ? PALETTE.orangePrimary : PALETTE.textSecondary} strokeWidth="2.2" strokeLinecap="round" />
              <Line x1="12" y1="20" x2="12" y2="4" stroke={selectedType === 'pl' ? PALETTE.orangePrimary : PALETTE.textSecondary} strokeWidth="2.2" strokeLinecap="round" />
              <Line x1="6" y1="20" x2="6" y2="14" stroke={selectedType === 'pl' ? PALETTE.orangePrimary : PALETTE.textSecondary} strokeWidth="2.2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.typeCardText, selectedType === 'pl' && styles.typeCardTextActive]}>
              P&L Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeCard, selectedType === 'farmer' && styles.typeCardActive]}
            onPress={() => {
              setSelectedType('farmer');
              setShowScopeDropdown(false);
            }}
            activeOpacity={0.8}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 6 }}>
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={selectedType === 'farmer' ? PALETTE.orangePrimary : PALETTE.textSecondary} strokeWidth="2" strokeLinecap="round" />
              <Circle cx="9" cy="7" r="4" stroke={selectedType === 'farmer' ? PALETTE.orangePrimary : PALETTE.textSecondary} strokeWidth="2" />
            </Svg>
            <Text style={[styles.typeCardText, selectedType === 'farmer' && styles.typeCardTextActive]}>
              Farmer Performance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeCard, selectedType === 'warehouse' && styles.typeCardActive]}
            onPress={() => {
              setSelectedType('warehouse');
              setShowScopeDropdown(false);
            }}
            activeOpacity={0.8}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 6 }}>
              <Path d="M3 21V9L12 3L21 9V21H3Z" stroke={selectedType === 'warehouse' ? PALETTE.orangePrimary : PALETTE.textSecondary} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.typeCardText, selectedType === 'warehouse' && styles.typeCardTextActive]}>
              Warehouse Operations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Report Description Pill */}
        <View style={styles.descBox}>
          <Text style={styles.descText}>{currentConfig.description}</Text>
        </View>

        {/* Date Range Section */}
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.pillsRow}>
          {(['This Month', 'This Quarter', 'Custom'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangePill, dateRange === r && styles.rangePillActive]}
              onPress={() => setDateRange(r)}
              activeOpacity={0.8}
            >
              <Text style={[styles.rangePillText, dateRange === r && styles.rangePillTextActive]}>
                {r === 'Custom' ? 'Custom 📅' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Date Range Picker Card (Shows when 'Custom' is selected) */}
        {dateRange === 'Custom' && (
          <View style={styles.customDateCard}>
            <View style={styles.customDateInputsRow}>
              {/* Start Date */}
              <View style={styles.customDateField}>
                <Text style={styles.customDateLabel}>Start Date</Text>
                <View style={styles.customDateBox}>
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                    <Path
                      d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                      stroke={PALETTE.orangePrimary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M16 2v4M8 2v4M3 10h18" stroke={PALETTE.orangePrimary} strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                  <TextInput
                    style={styles.customDateInput}
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Arrow divider */}
              <View style={styles.customDateArrowWrap}>
                <Text style={styles.customDateArrow}>→</Text>
              </View>

              {/* End Date */}
              <View style={styles.customDateField}>
                <Text style={styles.customDateLabel}>End Date</Text>
                <View style={styles.customDateBox}>
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                    <Path
                      d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                      stroke={PALETTE.orangePrimary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M16 2v4M8 2v4M3 10h18" stroke={PALETTE.orangePrimary} strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                  <TextInput
                    style={styles.customDateInput}
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Quick Date Presets */}
            <Text style={styles.customPresetsTitle}>Quick Date Presets</Text>
            <View style={styles.customPresetsRow}>
              {[
                { label: 'Last 7 Days', start: '18 Sep 2026', end: '25 Sep 2026' },
                { label: 'Last 30 Days', start: '26 Aug 2026', end: '25 Sep 2026' },
                { label: 'Month to Date', start: '01 Sep 2026', end: '25 Sep 2026' },
                { label: 'Year to Date', start: '01 Jan 2026', end: '25 Sep 2026' },
              ].map((preset) => {
                const isActive = customStartDate === preset.start && customEndDate === preset.end;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                    onPress={() => {
                      setCustomStartDate(preset.start);
                      setCustomEndDate(preset.end);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Period Confirmation */}
            <View style={styles.periodSummary}>
              <Text style={styles.periodSummaryText}>
                Active Range:{' '}
                <Text style={styles.periodSummaryHighlight}>{customStartDate}</Text> –{' '}
                <Text style={styles.periodSummaryHighlight}>{customEndDate}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Dynamic Scope / Filter Section */}
        <Text style={styles.sectionTitle}>Scope / Filter</Text>
        <Text style={styles.fieldLabel}>{currentConfig.scopeLabel}</Text>

        {/* Dropdown trigger box */}
        <TouchableOpacity
          style={[styles.dropdownBox, showScopeDropdown && styles.dropdownBoxOpen]}
          onPress={() => setShowScopeDropdown(!showScopeDropdown)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>
            {currentScope}
          </Text>
          <Text style={styles.dropdownArrow}>{showScopeDropdown ? '▴' : '▾'}</Text>
        </TouchableOpacity>

        {/* Inline Scope Dropdown (attached directly under input box, no half screen modal) */}
        {showScopeDropdown && (
          <View style={styles.inlineDropdownMenu}>
            {currentConfig.scopeOptions.map((name) => {
              const isSelected = currentScope === name;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.inlineDropdownItem, isSelected && styles.inlineDropdownItemActive]}
                  onPress={() => handleSelectScope(name)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.inlineDropdownText, isSelected && styles.inlineDropdownTextActive]}>
                    {name}
                  </Text>
                  {isSelected && <Text style={styles.inlineDropdownCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Dynamic Metrics Checkboxes per Report Type */}
        <View style={styles.metricsHeaderRow}>
          <Text style={styles.sectionTitle}>Metrics ({currentConfig.name})</Text>
          <Text style={styles.metricsSubText}>Select data fields</Text>
        </View>

        <View style={styles.metricsBox}>
          {currentConfig.metrics.map((m) => {
            const isChecked = !!selectedMetrics[m.id];
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.checkboxRow}
                onPress={() => toggleMetric(m.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                  {isChecked && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, isChecked && styles.checkboxLabelChecked]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Format Options */}
        <Text style={styles.sectionTitle}>Format</Text>
        <View style={styles.formatRow}>
          {(['PDF', 'Excel', 'CSV'] as const).map((fmt) => (
            <TouchableOpacity
              key={fmt}
              style={styles.radioRow}
              onPress={() => setFormat(fmt)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioOuter, format === fmt && styles.radioOuterSelected]}>
                {format === fmt && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{fmt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => {
            if (onGenerate) {
              onGenerate(selectedType);
            } else {
              const rangeDesc = dateRange === 'Custom' ? `${customStartDate} to ${customEndDate}` : dateRange;
              Alert.alert(
                'Report Generated',
                `${currentConfig.name} (${currentScope}) for ${rangeDesc} generated in ${format} format.`
              );
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.generateBtnText}>Generate {currentConfig.name}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  typeCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  typeCardActive: {
    borderColor: PALETTE.orangePrimary,
    backgroundColor: PALETTE.orangeLight,
  },
  typeCardText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
  typeCardTextActive: {
    color: PALETTE.orangePrimary,
  },
  descBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  descText: {
    fontSize: 12,
    color: '#7C2D12',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rangePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: '#E6E0D8',
  },
  rangePillActive: {
    backgroundColor: PALETTE.orangePrimary,
    borderColor: PALETTE.orangePrimary,
  },
  rangePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  rangePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Custom Date Picker Card
  customDateCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  customDateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customDateField: {
    flex: 1,
  },
  customDateLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 5,
  },
  customDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  customDateInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textPrimary,
    padding: 0,
  },
  customDateArrowWrap: {
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  customDateArrow: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    fontWeight: '700',
  },
  customPresetsTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 7,
  },
  customPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: '#F5F2EC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetChipActive: {
    backgroundColor: PALETTE.orangeLight,
    borderWidth: 1,
    borderColor: PALETTE.orangePrimary,
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  presetChipTextActive: {
    color: PALETTE.orangePrimary,
    fontWeight: '700',
  },
  periodSummary: {
    backgroundColor: '#FFF8F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFE8DF',
  },
  periodSummaryText: {
    fontSize: 11.5,
    color: '#4B5563',
  },
  periodSummaryHighlight: {
    color: PALETTE.orangePrimary,
    fontWeight: '700',
  },
  // Scope Dropdown (Inline Under Input Box)
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: PALETTE.orangePrimary,
    borderBottomColor: '#F0ECE6',
    marginBottom: 0,
  },
  dropdownText: {
    fontSize: 14,
    color: PALETTE.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  dropdownArrow: {
    fontSize: 14,
    color: PALETTE.textSecondary,
  },
  inlineDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: PALETTE.orangePrimary,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 4,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inlineDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inlineDropdownItemActive: {
    backgroundColor: '#FFF1EB',
  },
  inlineDropdownText: {
    fontSize: 13.5,
    color: PALETTE.textPrimary,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  inlineDropdownTextActive: {
    color: PALETTE.orangePrimary,
    fontWeight: '700',
  },
  inlineDropdownCheckmark: {
    fontSize: 15,
    color: PALETTE.orangePrimary,
    fontWeight: '800',
  },
  metricsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsSubText: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
  },
  metricsBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: PALETTE.orangePrimary,
    borderColor: PALETTE.orangePrimary,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 13,
    color: PALETTE.textPrimary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  checkboxLabelChecked: {
    color: PALETTE.textPrimary,
    fontWeight: '600',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterSelected: {
    borderColor: PALETTE.orangePrimary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PALETTE.orangePrimary,
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  generateBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: PALETTE.orangePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  generateBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
