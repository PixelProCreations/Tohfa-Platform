// Design id: M3S07
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockAllocationDashboardScreenProps extends InventoryScreenBaseProps {
  role?: string | undefined;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M9 11.5l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StepperArrowsIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 15l5 5 5-5M7 9l5-5 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StockAllocationDashboardScreen({
  scope,
  can,
  role,
  onNavigate,
  onBack,
}: StockAllocationDashboardScreenProps) {
  // Check RBAC grant for channel split management (fail-closed when `can` is provided)
  const isSuperAdmin = can
    ? can('allocation.channel_percentage.set')
    : role === 'SUPER_ADMIN';

  // Sub-view state: 'dashboard' | 'edit_split' | 'adjust_produce' | 'override_split'
  const [subView, setSubView] = useState<'dashboard' | 'edit_split' | 'adjust_produce' | 'override_split'>('dashboard');
  const [selectedWarehouse, setSelectedWarehouse] = useState('Ooty');
  const [selectedProduce, setSelectedProduce] = useState('Beans - Grade 1');

  // Channel split values
  const [splitOnline, setSplitOnline] = useState('0');
  const [splitLiveMarket, setSplitLiveMarket] = useState('0');
  const [splitHoreca, setSplitHoreca] = useState('0');
  const [splitB2B, setSplitB2B] = useState('0');
  const [splitReserve, setSplitReserve] = useState('0');
  const [splitBuffer, setSplitBuffer] = useState('0');

  const cycleWarehouse = () => {
    const names = warehouseTable.map((w) => w.name);
    const nextIdx = (names.indexOf(selectedWarehouse) + 1) % names.length;
    setSelectedWarehouse(names[nextIdx] ?? 'Ooty');
  };

  const renderSplitFormFields = () => (
    <>
      <Text style={styles.formFieldLabel}>Select Warehouse *</Text>
      <TouchableOpacity
        style={styles.dropdownInputRow}
        onPress={cycleWarehouse}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Select Warehouse"
      >
        <Text style={styles.dropdownInputText}>{selectedWarehouse}</Text>
        <ChevronDownIcon size={18} color={adminColors.muted} />
      </TouchableOpacity>

      {[
        { label: 'Online (%)', val: splitOnline, setVal: setSplitOnline },
        { label: 'Live Market (%)', val: splitLiveMarket, setVal: setSplitLiveMarket },
        { label: 'HORECA (%)', val: splitHoreca, setVal: setSplitHoreca },
        { label: 'B2B (%)', val: splitB2B, setVal: setSplitB2B },
        { label: 'Reserve (%)', val: splitReserve, setVal: setSplitReserve },
        { label: 'Buffer (%)', val: splitBuffer, setVal: setSplitBuffer },
      ].map((f) => (
        <View key={f.label} style={styles.channelInputWrap}>
          <Text style={styles.formFieldLabel}>{f.label}</Text>
          <View style={styles.stepperInputRow}>
            <TextInput
              style={styles.stepperTextInput}
              value={f.val}
              onChangeText={f.setVal}
              keyboardType="numeric"
            />
            <StepperArrowsIcon />
          </View>
        </View>
      ))}
    </>
  );

  const allocations = [
    {
      channel: 'ONLINE',
      pct: '30%',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.brand,
      allocated: '420 KG',
      consumed: '180 KG',
      reserved: '120 KG',
      available: '120 KG',
    },
    {
      channel: 'LIVE MARKET',
      pct: '20%',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.success.border,
      allocated: '120 KG',
      consumed: '40 KG',
      reserved: '30 KG',
      available: '50 KG',
    },
    {
      channel: 'HORECA',
      pct: '30%',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.purple.border,
      allocated: '80 KG',
      consumed: '20 KG',
      reserved: '20 KG',
      available: '40 KG',
    },
    {
      channel: 'B2B',
      pct: '30%',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.danger.border,
      allocated: '60 KG',
      consumed: '10 KG',
      reserved: '10 KG',
      available: '40 KG',
    },
    {
      channel: 'RESERVE',
      pct: '30%',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.info.border,
      allocated: '80 KG',
      consumed: '20 KG',
      reserved: '20 KG',
      available: '40 KG',
    },
    {
      channel: 'BUFFER',
      pct: '30%',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.brand,
      allocated: '60 KG',
      consumed: '10 KG',
      reserved: '10 KG',
      available: '40 KG',
    },
  ];

  const warehouseTable = [
    { name: 'Ooty', online: '30%', live: '20%', horeca: '30%', b2b: '30%', reserve: '30%', buffer: '10%' },
    { name: 'Coonoor', online: '30%', live: '20%', horeca: '30%', b2b: '30%', reserve: '30%', buffer: '10%' },
    { name: 'Nilgiri', online: '30%', live: '20%', horeca: '30%', b2b: '30%', reserve: '30%', buffer: '10%' },
    { name: 'Kotagiri', online: '30%', live: '20%', horeca: '30%', b2b: '30%', reserve: '30%', buffer: '10%' },
  ];

  const produceList = [
    { id: 'p1', name: 'Beans - Grade 1', stock: '175 kg', split: 'Online 30% · Live market 20% · Reserve 20% · Buffer 30%' },
    { id: 'p2', name: 'Cabbage - Grade 1', stock: '175 kg', split: 'Online 30% · Live market 20% · Reserve 20% · Buffer 30%' },
    { id: 'p3', name: 'Cabbage - Grade 2', stock: '175 kg', split: 'Online 30% · Live market 20% · Reserve 20% · Buffer 30%' },
    { id: 'p4', name: 'Carrot - Grade 2', stock: '175 kg', split: 'Online 30% · Live market 20% · Reserve 20% · Buffer 30%' },
  ];

  // ─── Sub-View 2: Set Channel Split ──────────────────────────────────────────
  if (isSuperAdmin && subView === 'edit_split') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => setSubView('dashboard')}
                activeOpacity={0.7}
              >
                <BackArrowWhiteIcon />
              </TouchableOpacity>
              <Text style={styles.headerBannerTitle}>Set Channel Split</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Total Stock Split Header & Bar */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Total Stock Split ({selectedWarehouse})</Text>
              <Text style={styles.sectionSubtitle}>Values from config</Text>
            </View>

            <View style={styles.multiSplitBar}>
              <View style={[styles.splitSegment, { flex: 420, backgroundColor: adminColors.brand }]} />
              <View style={[styles.splitSegment, { flex: 120, backgroundColor: adminColors.success.text }]} />
              <View style={[styles.splitSegment, { flex: 80, backgroundColor: adminColors.purple.text }]} />
              <View style={[styles.splitSegment, { flex: 60, backgroundColor: adminColors.danger.text }]} />
              <View style={[styles.splitSegment, { flex: 80, backgroundColor: adminColors.info.text }]} />
              <View style={[styles.splitSegment, { flex: 60, backgroundColor: adminColors.warning.text }]} />
            </View>

            {/* Split Form Card */}
            <View style={styles.formCard}>
              {renderSplitFormFields()}

              <TouchableOpacity
                style={styles.saveChannelBtn}
                onPress={() => Alert.alert('Saved', 'Channel split saved for warehouse.')}
                activeOpacity={0.8}
              >
                <Text style={styles.saveChannelBtnText}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Total Row */}
            <View style={styles.totalRowWrap}>
              <Text style={styles.totalRowLabel}>Total</Text>
              <View style={styles.totalPill}>
                <Text style={styles.totalPillText}>100%</Text>
              </View>
            </View>

            {/* Adjust by Produce Section */}
            <View style={styles.adjustSectionWrap}>
              <Text style={styles.adjustSectionTitle}>Adjust by Produce (optional)</Text>
              <TouchableOpacity
                style={styles.adjustProduceBtn}
                onPress={() => setSubView('adjust_produce')}
                activeOpacity={0.8}
              >
                <Text style={styles.adjustProduceBtnText}>Adjust by Produce</Text>
              </TouchableOpacity>
            </View>

            {/* Warehouse Allocation Table */}
            <Text style={styles.tableSectionTitle}>Warehouse allocation</Text>
            <View style={styles.tableCard}>
              {warehouseTable.map((w, idx) => (
                <View key={w.name} style={[styles.warehouseTableRow, idx > 0 && styles.tableRowBorder]}>
                  <Text style={styles.warehouseNameText}>{w.name}</Text>
                  <View style={styles.warehousePillGrid}>
                    <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.online}</Text> Online</Text>
                    <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.live}</Text> Live Market</Text>
                    <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.horeca}</Text> HORECA</Text>
                    <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.b2b}</Text> B2B</Text>
                    <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.reserve}</Text> Reserve</Text>
                    <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.buffer}</Text> Buffer</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Bottom Actions */}
            <View style={styles.splitBottomActions}>
              <TouchableOpacity
                style={styles.splitResetBtn}
                onPress={() => {
                  setSplitOnline('0');
                  setSplitLiveMarket('0');
                  setSplitHoreca('0');
                  setSplitB2B('0');
                  setSplitReserve('0');
                  setSplitBuffer('0');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.splitResetBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.splitConfirmBtn}
                onPress={() => {
                  Alert.alert('Updated', 'Allocation split confirmed across warehouses.', [
                    { text: 'OK', onPress: () => setSubView('dashboard') },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.splitConfirmBtnText}>Confirm & Update →</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: adminSpacing.xxxl + 60 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Sub-View 3: Adjust by Produce ──────────────────────────────────────────
  if (isSuperAdmin && subView === 'adjust_produce') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => setSubView('edit_split')}
                activeOpacity={0.7}
              >
                <BackArrowWhiteIcon />
              </TouchableOpacity>
              <Text style={styles.headerBannerTitle}>Adjust by Produce</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={styles.produceCountHeader}>8 Types</Text>

            {/* Produce Cards */}
            {produceList.map((p) => (
              <View key={p.id} style={styles.produceCard}>
                <View style={styles.produceCardTop}>
                  <Text style={styles.produceCardName}>{p.name}</Text>
                  <View style={styles.defaultSplitBadge}>
                    <Text style={styles.defaultSplitBadgeText}>Default Split</Text>
                  </View>
                </View>
                <Text style={styles.produceCardMeta}>{p.split}</Text>

                <View style={styles.produceCardActionsRow}>
                  <TouchableOpacity
                    style={styles.setDefaultSplitBtn}
                    onPress={() => Alert.alert('Default Split', `Default split applied for ${p.name}.`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.setDefaultSplitBtnText}>Set default Split</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.overrideSplitBtn}
                    onPress={() => {
                      setSelectedProduce(p.name);
                      setSubView('override_split');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.overrideSplitBtnText}>Override split</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: adminSpacing.xxxl + 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Sub-View 4: Override the split ─────────────────────────────────────────
  if (isSuperAdmin && subView === 'override_split') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => setSubView('adjust_produce')}
                activeOpacity={0.7}
              >
                <BackArrowWhiteIcon />
              </TouchableOpacity>
              <Text style={styles.headerBannerTitle}>Override the split</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Produce Info Card */}
            <View style={styles.overrideInfoCard}>
              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>Produce</Text>
                <Text style={styles.overrideInfoValue}>{selectedProduce}</Text>
              </View>
              <View style={styles.overrideInfoDivider} />

              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>Stock</Text>
                <Text style={styles.overrideInfoValue}>175 kg</Text>
              </View>
              <View style={styles.overrideInfoDivider} />

              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>Default split</Text>
                <Text style={styles.overrideInfoValueSmall}>Online 30%, Live Market 20%, Reserve 20%, Buffer 30%</Text>
              </View>
              <View style={styles.overrideInfoDivider} />

              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>Before</Text>
                <Text style={styles.overrideInfoValue}>-</Text>
              </View>
            </View>

            {/* Override Form Card */}
            <View style={styles.formCard}>
              {renderSplitFormFields()}
            </View>

            {/* Total Row */}
            <View style={styles.totalRowWrap}>
              <Text style={styles.totalRowLabel}>Total</Text>
              <View style={styles.totalPill}>
                <Text style={styles.totalPillText}>100%</Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.splitBottomActions}>
              <TouchableOpacity
                style={styles.splitConfirmBtn}
                onPress={() => {
                  Alert.alert('Saved', `Override split saved for ${selectedProduce}.`, [
                    { text: 'OK', onPress: () => setSubView('adjust_produce') },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.splitConfirmBtnText}>Save Override</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.splitResetBtn}
                onPress={() => {
                  setSplitOnline('0');
                  setSplitLiveMarket('0');
                  setSplitHoreca('0');
                  setSplitB2B('0');
                  setSplitReserve('0');
                  setSplitBuffer('0');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.splitResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: adminSpacing.xxxl + 60 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Sub-View 1: Main Allocation Dashboard ──────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Stock Allocation"
          onBack={onBack}
          showWarehouse={true}
          warehouseName={scope.warehouseName}
          rightAction={
            isSuperAdmin ? (
              <TouchableOpacity
                style={styles.headerEditBtn}
                onPress={() => setSubView('edit_split')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Edit Channel Split"
              >
                <PencilWhiteIcon size={18} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* 4 Rounded Tab Cards */}
        <View style={styles.tabCardsRow}>
          {/* Stock Tab */}
          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S02')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Stock</Text>
          </TouchableOpacity>

          {/* Ledger Tab */}
          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S06')}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Ledger</Text>
          </TouchableOpacity>

          {/* Allocation Tab (Active) */}
          <TouchableOpacity
            style={[styles.tabCard, styles.activeTabCard]}
            activeOpacity={0.85}
          >
            <AllocationTabIcon color={adminColors.onBrand} />
            <Text style={[styles.tabCardText, styles.activeTabCardText]}>Allocation</Text>
          </TouchableOpacity>

          {/* Verify Tab */}
          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S10')}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Stock Split Header & Multi-color Progress Bar */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Total Stock Split</Text>
            <Text style={styles.sectionSubtitle}>Values from config</Text>
          </View>

          {/* Multi-color Split Bar matching Reference Design */}
          <View style={styles.multiSplitBar}>
            <View style={[styles.splitSegment, { flex: 420, backgroundColor: adminColors.brand }]} />
            <View style={[styles.splitSegment, { flex: 120, backgroundColor: adminColors.success.text }]} />
            <View style={[styles.splitSegment, { flex: 80, backgroundColor: adminColors.purple.text }]} />
            <View style={[styles.splitSegment, { flex: 60, backgroundColor: adminColors.danger.text }]} />
            <View style={[styles.splitSegment, { flex: 80, backgroundColor: adminColors.info.text }]} />
            <View style={[styles.splitSegment, { flex: 60, backgroundColor: adminColors.warning.text }]} />
          </View>

          {/* 6 Allocation Cards with curved left colored accent */}
          {allocations.map((alloc, index) => (
            <View key={index} style={styles.allocationCard}>
              <View style={[styles.leftAccentStripe, { backgroundColor: alloc.borderColor }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.channelName, { color: alloc.titleColor }]}>
                    {alloc.channel}
                  </Text>
                  {isSuperAdmin && (
                    <View style={styles.pctBadge}>
                      <Text style={styles.pctBadgeText}>{alloc.pct}</Text>
                    </View>
                  )}
                </View>

                {/* 4 Stat Boxes Row */}
                <View style={styles.statsBoxRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.allocated}</Text>
                    <Text style={styles.statLabel}>ALLOCATED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.consumed}</Text>
                    <Text style={styles.statLabel}>CONSUMED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.reserved}</Text>
                    <Text style={styles.statLabel}>RESERVED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.available}</Text>
                    <Text style={styles.statLabel}>AVAILABLE</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Warehouse Allocation Section (Only on Super Admin / with Allocation Config Grant) */}
          {isSuperAdmin && (
            <View style={styles.warehouseAllocationSection}>
              <Text style={styles.tableSectionTitle}>Warehouse allocation</Text>
              <View style={styles.tableCard}>
                {warehouseTable.map((w, idx) => (
                  <View key={w.name} style={[styles.warehouseTableRow, idx > 0 && styles.tableRowBorder]}>
                    <Text style={styles.warehouseNameText}>{w.name}</Text>
                    <View style={styles.warehousePillGrid}>
                      <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.online}</Text> Online</Text>
                      <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.live}</Text> Live Market</Text>
                      <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.horeca}</Text> HORECA</Text>
                      <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.b2b}</Text> B2B</Text>
                      <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.reserve}</Text> Reserve</Text>
                      <Text style={styles.warehousePctText}><Text style={styles.pctBold}>{w.buffer}</Text> Buffer</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: adminSpacing.xxxl + 60 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBannerTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  headerEditBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  tabCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...adminShadow.sm,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 12,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: adminColors.muted,
  },
  multiSplitBar: {
    height: 14,
    borderRadius: adminRadius.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: adminSpacing.md,
  },
  splitSegment: {
    height: '100%',
  },
  allocationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    position: 'relative',
    ...adminShadow.sm,
  },
  leftAccentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: adminRadius.xl,
    borderBottomLeftRadius: adminRadius.xl,
  },
  cardContent: {
    paddingVertical: adminSpacing.md,
    paddingLeft: adminSpacing.lg,
    paddingRight: adminSpacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  channelName: {
    ...adminType.sectionHead,
    fontSize: 13,
    fontWeight: '700',
  },
  pctBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  statsBoxRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...adminType.sectionHead,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  warehouseAllocationSection: {
    marginTop: adminSpacing.sm,
  },
  tableSectionTitle: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.rustDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  warehouseTableRow: {
    paddingVertical: adminSpacing.sm,
  },
  tableRowBorder: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  warehouseNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.rustDeep,
    marginBottom: adminSpacing.xs,
  },
  warehousePillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  warehousePctText: {
    fontSize: 11,
    color: adminColors.muted,
  },
  pctBold: {
    fontWeight: '700',
    color: adminColors.ink,
  },
  // Form Card in edit_split & override_split
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  formFieldLabel: {
    ...adminType.rowTitle,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
    marginTop: adminSpacing.xs,
  },
  dropdownInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
    marginBottom: adminSpacing.sm,
  },
  dropdownInputText: {
    fontSize: 14,
    color: adminColors.ink,
  },
  channelInputWrap: {
    marginBottom: adminSpacing.xs,
  },
  stepperInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  stepperTextInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  saveChannelBtn: {
    height: 44,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  saveChannelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  totalRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  totalRowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  totalPill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 4,
  },
  totalPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  adjustSectionWrap: {
    marginBottom: adminSpacing.md,
  },
  adjustSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.rustDeep,
    marginBottom: adminSpacing.xs,
  },
  adjustProduceBtn: {
    height: 44,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  adjustProduceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  splitBottomActions: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  splitResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  splitResetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  splitConfirmBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  // Adjust by Produce Screen
  searchBarWrap: {
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchBarInput: {
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    fontSize: 14,
    color: adminColors.ink,
  },
  produceCountHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  produceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  produceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  produceCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  defaultSplitBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  defaultSplitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  produceCardMeta: {
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    lineHeight: 16,
  },
  produceCardActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  setDefaultSplitBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  setDefaultSplitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  overrideSplitBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  overrideSplitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brand,
  },
  // Override Screen Info Card
  overrideInfoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  overrideInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
  },
  overrideInfoDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  overrideInfoLabel: {
    fontSize: 12,
    color: adminColors.muted,
  },
  overrideInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  overrideInfoValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.ink,
    maxWidth: '65%',
    textAlign: 'right',
  },
});
