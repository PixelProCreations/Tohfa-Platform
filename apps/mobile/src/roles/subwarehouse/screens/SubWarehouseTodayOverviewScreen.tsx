import React, { useState, useMemo } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  iconBoxBg: '#FEF1EC',
  iconBoxBorder: '#FCD9CE',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function DeliveryTruckIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function OrdersIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryBoxIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 9h18M3 15h18M9 9v6M15 9v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SalesRegisterIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 3h10v4H7zM3 11h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zM7 15h2M11 15h2M15 15h2M7 18h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashTopUpIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Data Types ─────────────────────────────────────────────────────────────

type OperationCategory = 'All' | 'Receiving' | 'Orders' | 'Inventory' | 'Sales' | 'Cash Top-Up';

interface OverviewCardData {
  id: string;
  category: OperationCategory;
  title: string;
  renderIcon: () => React.ReactNode;
  metrics: { label: string; value: string }[];
}

const OVERVIEW_CARDS: OverviewCardData[] = [
  {
    id: 'receiving',
    category: 'Receiving',
    title: 'Receiving',
    renderIcon: () => <DeliveryTruckIcon size={18} color={PALETTE.primary} />,
    metrics: [
      { value: '03', label: 'total' },
      { value: '01', label: 'pending QC' },
      { value: '02', label: 'completed' },
    ],
  },
  {
    id: 'orders',
    category: 'Orders',
    title: 'Orders',
    renderIcon: () => <OrdersIcon size={18} color={PALETTE.primary} />,
    metrics: [
      { value: '12', label: 'pending' },
      { value: '08', label: 'ready' },
      { value: '27', label: 'completed' },
    ],
  },
  {
    id: 'inventory',
    category: 'Inventory',
    title: 'Inventory',
    renderIcon: () => <InventoryBoxIcon size={18} color={PALETTE.primary} />,
    metrics: [
      { value: '05', label: 'low stock' },
      { value: '02', label: 'verification pending' },
    ],
  },
  {
    id: 'sales',
    category: 'Sales',
    title: 'Sales',
    renderIcon: () => <SalesRegisterIcon size={18} color={PALETTE.primary} />,
    metrics: [
      { value: '42', label: 'transactions' },
      { value: '₹24,850', label: "today's total" },
    ],
  },
  {
    id: 'cash-top-up',
    category: 'Cash Top-Up',
    title: 'Cash Top-Up',
    renderIcon: () => <CashTopUpIcon size={18} color={PALETTE.primary} />,
    metrics: [
      { value: '12', label: 'transactions' },
      { value: '₹18,500', label: "today's total" },
    ],
  },
];

export interface SubWarehouseTodayOverviewScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
  onNavigateToSection?: ((section: string) => void) | undefined;
}

export function SubWarehouseTodayOverviewScreen({
  onBack,
  onTabChange,
  onNavigateToSection,
}: SubWarehouseTodayOverviewScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<OperationCategory>('All');

  const categories: OperationCategory[] = ['All', 'Receiving', 'Orders', 'Inventory', 'Sales', 'Cash Top-Up'];

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'All') return OVERVIEW_CARDS;
    return OVERVIEW_CARDS.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const handleCardPress = (card: OverviewCardData) => {
    if (onNavigateToSection) {
      onNavigateToSection(card.category);
    } else {
      Alert.alert(card.title, `Showing detailed logs for ${card.title}.`);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header (#F0562A) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.75}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitlesCol}>
              <Text style={styles.headerTitleText}>Today's Overview</Text>
              <Text style={styles.headerSubtitleText}>24 September · Coonoor Warehouse</Text>
            </View>
          </View>
        </View>

        {/* ─── Main Content Container ─── */}
        <View style={styles.mainContainer}>
          {/* Category Filter Chips Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filterScroll}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    if (cat !== 'All' && onNavigateToSection) {
                      onNavigateToSection(cat);
                    } else {
                      setSelectedCategory(cat);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cards List */}
          <View style={styles.cardList}>
            {filteredCards.map((card) => {
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.operationCard}
                  onPress={() => handleCardPress(card)}
                  activeOpacity={0.75}
                >
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconBox}>
                      {card.renderIcon()}
                    </View>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>

                  {/* Metrics Row */}
                  <View style={styles.metricsRow}>
                    {card.metrics.map((metric, idx) => (
                      <View key={idx} style={styles.metricItem}>
                        <Text style={styles.metricValue}>{metric.value}</Text>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={false} />
          <Text style={styles.tabLabel}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    marginLeft: -4,
  },
  headerTitlesCol: {
    flex: 1,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitleText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },

  // ─── Main Container ────────────────────────────────────────────────────────
  mainContainer: {
    paddingTop: 14,
  },

  // ─── Filter Chips Scroll ───────────────────────────────────────────────────
  filterScroll: {
    marginBottom: 14,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ─── Cards List ────────────────────────────────────────────────────────────
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  operationCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: PALETTE.iconBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.iconBoxBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Metrics Row ───────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },

  // ─── Bottom Navigation Bar ─────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
