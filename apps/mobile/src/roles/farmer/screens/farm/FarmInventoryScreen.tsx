import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../theme';
import { listFarmAssets } from '../../api/farmAssets';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={P.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Wrench icon for alert banner (Green Theme)
const WrenchAlertIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      stroke={P.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Category Icons (Farmer Green Palette)
const ToolsIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      stroke={P.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EquipmentIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M15 12L12 3" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
    <Path d="M9 12L12 3" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 12H18" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
    <Path
      d="M7 12V16C7 18.2091 8.79086 20 11 20H13C15.2091 20 17 18.2091 17 16V12"
      stroke={P.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="12" y1="16" x2="12" y2="20" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const TreesIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L6 13H10L7 21H17L14 13H18L12 3Z"
      stroke={P.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const MachineryIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={P.primary} strokeWidth="1.8" />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={P.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Data ─────────────────────────────────────────────────────────────────────

interface CategoryData {
  name: string;
  count: string;
  dueCount: number;
  icon: React.JSX.Element;
  iconBg: string;
}

/**
 * Real farm_assets-backed counts for Tools/Equipment/Machinery (fetched
 * below). "Trees" has no backend (TreesListScreen.tsx is a separate
 * plantings concept — see farm-assets migration's header comment) so it
 * stays exactly the hardcoded row the mock always showed.
 */
const TREES_CATEGORY: CategoryData = {
  name: 'Trees',
  count: '3 plantings',
  dueCount: 2,
  icon: <TreesIcon />,
  iconBg: P.paleMintBg,
};

// ── Component ────────────────────────────────────────────────────────────────

interface FarmInventoryScreenProps {
  onNavigateBack: () => void;
  onNavigateToCategory?: (category: string) => void;
}

export function FarmInventoryScreen({ onNavigateBack, onNavigateToCategory }: FarmInventoryScreenProps): React.JSX.Element {
  const [toolsCategory, setToolsCategory] = useState<CategoryData | null>(null);
  const [equipmentCategory, setEquipmentCategory] = useState<CategoryData | null>(null);
  const [machineryCategory, setMachineryCategory] = useState<CategoryData | null>(null);
  const [servicingSummary, setServicingSummary] = useState<{
    dueSoonCount: number;
    overdueCount: number;
    totalNeedService: number;
  }>({ dueSoonCount: 0, overdueCount: 0, totalNeedService: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const loadCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tools, equipment, machinery] = await Promise.all([
        listFarmAssets({ category: 'TOOL', limit: 100 }),
        listFarmAssets({ category: 'EQUIPMENT', limit: 100 }),
        listFarmAssets({ category: 'MACHINERY', limit: 100 }),
      ]);

      const allAssets = [...tools.items, ...equipment.items, ...machinery.items];
      const overdue = allAssets.filter((item) => item.status === 'OVERDUE').length;
      const dueSoon = allAssets.filter((item) => item.status === 'DUE_SOON').length;
      setServicingSummary({
        dueSoonCount: dueSoon,
        overdueCount: overdue,
        totalNeedService: overdue + dueSoon,
      });

      setToolsCategory({
        name: 'Tools',
        count: `${tools.items.length} items`,
        dueCount: tools.items.filter((item) => item.status !== 'OK').length,
        icon: <ToolsIcon />,
        iconBg: P.twGreen100,
      });
      setEquipmentCategory({
        name: 'Equipment',
        count: `${equipment.items.length} items`,
        dueCount: equipment.items.filter((item) => item.status !== 'OK').length,
        icon: <EquipmentIcon />,
        iconBg: P.lightGreen,
      });
      setMachineryCategory({
        name: 'Machinery',
        count: `${machinery.items.length} items`,
        dueCount: machinery.items.filter((item) => item.status !== 'OK').length,
        icon: <MachineryIcon />,
        iconBg: P.sageTintBg,
      });
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onNavigateBack) {
        onNavigateBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onNavigateBack]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={72} borderRadius={14} />
          <Skeleton width="100%" height={140} borderRadius={16} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorContainer}>
          <ErrorState error={error} onRetry={loadCounts} />
        </View>
      </SafeAreaView>
    );
  }

  // Real Tools/Equipment/Machinery categories are guaranteed non-null once
  // loading finishes without an error (loadCounts always sets all three
  // together); Trees stays the hardcoded row.
  const categories: CategoryData[] = [
    toolsCategory ?? { name: 'Tools', count: '0 items', dueCount: 0, icon: <ToolsIcon />, iconBg: P.twGreen100 },
    equipmentCategory ?? { name: 'Equipment', count: '0 items', dueCount: 0, icon: <EquipmentIcon />, iconBg: P.lightGreen },
    TREES_CATEGORY,
    machineryCategory ?? { name: 'Machinery', count: '0 items', dueCount: 0, icon: <MachineryIcon />, iconBg: P.sageTintBg },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Farm Inventory</Text>
          <Text style={styles.headerSubtitle}>Tools, equipment, trees & machinery</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Banner (Green Theme) */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <WrenchAlertIcon />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>
              {servicingSummary.totalNeedService > 0
                ? `${servicingSummary.totalNeedService} ${servicingSummary.totalNeedService === 1 ? 'item needs' : 'items need'} servicing`
                : 'All items up to date'}
            </Text>
            <Text style={styles.alertSubtitle}>
              {servicingSummary.totalNeedService > 0
                ? `${servicingSummary.dueSoonCount} due soon · ${servicingSummary.overdueCount} overdue across all categories`
                : 'No servicing overdue or due soon'}
            </Text>
          </View>
        </View>

        {/* Categories Label */}
        <Text style={styles.sectionLabel}>CATEGORIES</Text>

        {/* Category Cards Grid */}
        <View style={styles.grid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.name} style={styles.categoryCard} activeOpacity={0.7} onPress={() => onNavigateToCategory?.(cat.name)}>
              {/* Due Badge */}
              {cat.dueCount > 0 && (
                <View style={styles.dueBadge}>
                  <Text style={styles.dueBadgeText}>{cat.dueCount} due</Text>
                </View>
              )}

              {/* Icon */}
              <View style={[styles.categoryIconCircle, { backgroundColor: cat.iconBg }]}>
                {cat.icon}
              </View>

              {/* Name & Count */}
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryCount}>{cat.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.bg,
  },
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.paleMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: typography.body,
    fontWeight: '400',
    color: P.muted,
    marginTop: 1,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Alert Banner (Green Theme)
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: P.lightGreen,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGreen700,
  },

  // Section Label
  sectionLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.muted,
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Category Card
  categoryCard: {
    width: '47.5%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
    position: 'relative',
    minHeight: 140,
  },
  dueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: P.twGreen100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGreen700,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: typography.body,
    fontWeight: '400',
    color: P.muted,
  },
});
