import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { CustomerItem } from './CustomerListScreen';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#5F5E5A',
  orangeDeep: '#7A2E14',
  linkOrange: '#F0562A',
  disclaimerBg: '#FAF8F5',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function TriangleLeftIcon({ size = 8, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <Path d="M6 1.5L2 4L6 6.5V1.5Z" fill={color} />
    </Svg>
  );
}

function TriangleRightIcon({ size = 8, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <Path d="M2 1.5L6 4L2 6.5V1.5Z" fill={color} />
    </Svg>
  );
}

export interface CustomerDetailScreenProps {
  customer?: CustomerItem;
  onBack?: () => void;
  onNavigateOrders?: () => void;
  onNavigatePurchases?: () => void;
  onNavigateWallet?: () => void;
  onNavigateIssues?: () => void;
  onNavigateSupport?: () => void;
}

export function CustomerDetailScreen({
  customer = {
    id: 'CUS-001245',
    name: 'Rajesh Kumar',
    phone: '+91 XXXXX XXXXX',
    status: 'Active',
    ordersCount: 12,
    purchasesAmount: '₹8,450',
    warehouse: 'Coonoor Warehouse',
  },
  onBack,
  onNavigateOrders,
  onNavigatePurchases,
  onNavigateWallet,
  onNavigateIssues,
  onNavigateSupport,
}: CustomerDetailScreenProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  const TABS = [
    { key: 'Overview', label: 'Overview', action: () => setActiveTab('Overview') },
    { key: 'Orders', label: 'Orders', action: onNavigateOrders },
    { key: 'Purchases', label: 'Purchases', action: onNavigatePurchases },
    { key: 'Wallet', label: 'Wallet', action: onNavigateWallet },
    { key: 'Issues', label: 'Issues', action: onNavigateIssues },
    { key: 'Support', label: 'Support', action: onNavigateSupport },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Customer Detail</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {customer.name} · {customer.id}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 KPI Cards in a Row */}
        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateOrders}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiValue}>12</Text>
            <Text style={styles.kpiLabel}>ORDERS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigatePurchases}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiValue}>₹8,450</Text>
            <Text style={styles.kpiLabel}>PURCHASES</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateWallet}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiValue}>₹1,250</Text>
            <Text style={styles.kpiLabel}>WALLET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateIssues}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiValue}>2</Text>
            <Text style={styles.kpiLabel}>ISSUES</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Navigation Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={tab.action}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Scroll Indicator Bar matching target design ◀ [══════] ▶ */}
        <View style={styles.scrollIndicatorRow}>
          <TriangleLeftIcon size={8} color="#7A726C" />
          <View style={styles.indicatorTrack}>
            <View style={styles.indicatorThumb} />
          </View>
          <TriangleRightIcon size={8} color="#7A726C" />
        </View>

        {/* ─── Basic Information ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer Name</Text>
              <Text style={styles.fieldValue}>{customer.name}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValue}>{customer.id}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Mobile</Text>
              <Text style={styles.fieldValue}>{customer.phone}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{customer.status}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Primary Warehouse</Text>
            <Text style={styles.fieldValue}>{customer.warehouse || 'Coonoor Warehouse'}</Text>
          </View>
        </View>

        {/* ─── Recent Orders ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={onNavigateOrders} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onNavigateOrders}
          activeOpacity={0.8}
        >
          <Text style={styles.actionCardTitle}>ORD-00251 · 3 Items</Text>
          <Text style={styles.statusPill}>Ready for Pickup</Text>
        </TouchableOpacity>

        {/* ─── Recent Issues ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Issues</Text>
          <TouchableOpacity onPress={onNavigateIssues} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onNavigateIssues}
          activeOpacity={0.8}
        >
          <Text style={styles.actionCardTitle}>ISSUE-00231 · Quality</Text>
          <Text style={styles.statusPill}>In Review</Text>
        </TouchableOpacity>

        {/* Notice Box matching target screenshot */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            No Edit, Disable or Delete Customer anywhere on this hub — Module 7 is view-only throughout.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  backBtn: {
    marginRight: 10,
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 34,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
  },
  tabScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 2,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  tabTextActive: {
    fontWeight: '800',
    color: PALETTE.primary,
  },
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 16,
  },
  indicatorTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0DCD6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorThumb: {
    width: '40%',
    height: 4,
    backgroundColor: '#8E8A85',
    borderRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  viewLink: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.linkOrange,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  actionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusPill: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  disclaimerBox: {
    backgroundColor: PALETTE.disclaimerBg,
    borderColor: PALETTE.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    color: PALETTE.textMuted,
  },
});
