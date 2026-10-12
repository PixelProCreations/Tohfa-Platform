import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { formatSafeDate } from '../../../polyfills';
import { listFarmAssets, type FarmAssetResponse } from '../../../api/farmAssets';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={P.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ToolsHeaderIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      stroke={P.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDown = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FilterIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" />
    <Line x1="10" y1="18" x2="14" y2="18" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CalendarIcon = ({ color = P.twRed600 }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ClockIcon = ({ color = P.twOrange700 }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M12 7V12L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const EditPencilIcon = ({ size = 15, color = P.twGray600 }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Types & real-data mapping ─────────────────────────────────────────────────

type ItemStatus = 'Overdue' | 'Due soon' | 'OK';

export interface ToolItem {
  id?: string;
  name: string;
  purchaseDate: string;
  dueDate: string;
  dueNote: string;
  status: ItemStatus;
  serviceInterval?: string | undefined;
}

const API_STATUS_TO_ITEM_STATUS: Record<FarmAssetResponse['status'], ItemStatus> = {
  OK: 'OK',
  DUE_SOON: 'Due soon',
  OVERDUE: 'Overdue',
};

/**
 * Maps a real farm_assets row onto this screen's card shape. `purchaseDate`/
 * `dueDate` stay pre-formatted display strings (as the mock had them) so
 * App.tsx's existing `.replace('Purchased ', '')` handoff to EditTool keeps
 * working unchanged; `status`/`dueNote` are used exactly as the API computed
 * them, never recomputed here.
 */
function toToolItem(asset: FarmAssetResponse): ToolItem {
  return {
    id: asset.id,
    name: asset.name,
    purchaseDate: asset.purchasedOn
      ? t('farmer.farmAssets.purchasedPrefix', { date: formatSafeDate(asset.purchasedOn) })
      : t('farmer.farmAssets.purchaseDateUnknown'),
    dueDate: asset.nextServiceDueOn
      ? t('farmer.farmAssets.dueDatePrefix', { date: formatSafeDate(asset.nextServiceDueOn) })
      : t('farmer.farmAssets.notYetScheduled'),
    dueNote: asset.dueNote ?? '',
    status: API_STATUS_TO_ITEM_STATUS[asset.status],
    serviceInterval: asset.serviceIntervalDays !== null ? String(asset.serviceIntervalDays) : undefined,
  };
}

function statusStyle(status: ItemStatus) {
  switch (status) {
    case 'Overdue':
      return {
        badgeBg: P.twRed100,
        badgeText: P.twRed600,
        borderColor: P.twRed500,
        dueColor: P.twRed600,
        icon: <CalendarIcon color={P.twRed600} />,
      };
    case 'Due soon':
      return {
        badgeBg: P.twOrange100,
        badgeText: P.twOrange700,
        borderColor: P.twOrange500,
        dueColor: P.twOrange700,
        icon: <ClockIcon color={P.twOrange700} />,
      };
    case 'OK':
      return {
        badgeBg: P.twGreen100,
        badgeText: P.twGreen700,
        borderColor: P.twGreen500,
        dueColor: P.twGreen700,
        icon: <CalendarIcon color={P.twGreen700} />,
      };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export interface ToolsListScreenProps {
  onNavigateBack: () => void;
  onNavigateToAddTool?: () => void;
  onNavigateToEditTool?: (tool: ToolItem) => void;
}

export function ToolsListScreen({
  onNavigateBack,
  onNavigateToAddTool,
  onNavigateToEditTool,
}: ToolsListScreenProps): React.JSX.Element {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const loadTools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await listFarmAssets({ category: 'TOOL', limit: 100 });
      setTools(items.map(toToolItem));
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={56} borderRadius={12} />
          <Skeleton width="100%" height={100} borderRadius={14} />
          <Skeleton width="100%" height={100} borderRadius={14} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorContainer}>
          <ErrorState error={error} onRetry={loadTools} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerIconCircle}>
          <ToolsHeaderIcon />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Tools</Text>
          <Text style={styles.headerSubtitle}>{tools.length} items</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Dropdown */}
        <TouchableOpacity style={styles.filterDropdown} activeOpacity={0.7}>
          <FilterIcon />
          <Text style={styles.filterText}>All statuses</Text>
          <View style={{ flex: 1 }} />
          <ChevronDown />
        </TouchableOpacity>

        {/* Tool Cards */}
        {tools.map((tool) => {
          const cfg = statusStyle(tool.status);
          return (
            <TouchableOpacity
              key={tool.id ?? tool.name}
              style={[styles.card, { borderLeftColor: cfg.borderColor }]}
              activeOpacity={0.7}
              onPress={() => onNavigateToEditTool?.(tool)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{tool.name}</Text>
                <View style={styles.cardHeaderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: cfg.badgeText }]}>{tool.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onNavigateToEditTool?.(tool)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${tool.name}`}
                  >
                    <EditPencilIcon size={14} color={P.twGray600} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Purchase Date */}
              <Text style={styles.cardSubtitle}>{tool.purchaseDate}</Text>

              {/* Due Row */}
              <View style={styles.dueRow}>
                {cfg.icon}
                <Text style={[styles.dueText, { color: cfg.dueColor }]}>
                  {tool.dueNote ? `${tool.dueDate} · ${tool.dueNote}` : tool.dueDate}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {tools.length === 0 && (
          <Text style={styles.emptyText}>{t('farmer.farmAssets.emptyTools')}</Text>
        )}
      </ScrollView>

      {/* Sticky Add Button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={onNavigateToAddTool}>
          <PlusIcon />
          <Text style={styles.addButtonText}>Add tool</Text>
        </TouchableOpacity>
      </View>
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
    marginRight: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    paddingBottom: 100,
  },

  // Filter
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: P.border,
    marginBottom: 16,
    gap: 8,
  },
  filterText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray700,
  },

  // Card
  card: {
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: P.border,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.paleMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGreen100,
  },
  cardSubtitle: {
    fontSize: typography.body,
    fontWeight: '400',
    color: P.muted,
    marginBottom: 10,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueText: {
    fontSize: typography.body,
    fontWeight: '600',
  },

  emptyText: {
    fontSize: typography.body,
    color: P.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Sticky Bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingBottom: 20,
    paddingTop: 12,
    paddingRight: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
});
