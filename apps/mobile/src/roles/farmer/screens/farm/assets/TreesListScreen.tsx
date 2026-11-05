import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState, ErrorState, SafeAreaView, ScreenStatusBar, Skeleton } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors, radius, spacing, typography } from '../../../theme';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import {
  listAllTreePlantings,
  toTreePlantingItem,
  type TreePlantingItem,
  type TreeStatus,
} from '../../../api/treePlantings';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Tree icon for header square
function TreeHeaderIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L6 13h4l-3 8h10l-3-8h4L12 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterLinesIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Mini Cake / Age Calendar Icon
function AgeMiniIcon({ size = 13, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 8V5M12 8V5M17 8V5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="13" x2="21" y2="13" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// Windbreak / Double Tree Icon
function WindbreakMiniIcon({ size = 14, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 4L5 12h2.5L5.5 19h7l-2-7H13L9 4z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 8l-3 6h2l-1.5 5h5l-1.5-5H19l-3-6z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Pruning droplet / check icon
function PruningDropIcon({ size = 14, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="14" r="2" fill={color} />
    </Svg>
  );
}

// Fruit / Harvest Icon
function FruitYieldMiniIcon({ size = 13, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="7" stroke={color} strokeWidth="2" />
      <Path d="M12 6c0-2 2-3 4-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 6a3 3 0 0 1 3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditPencilIcon({ size = 14, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
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
}

// ── Types & Data ─────────────────────────────────────────────────────────────

// The list item and its mapping live with the API client; re-exported here
// because App.tsx imports the item type from this screen.
export type { TreePlantingItem, TreeStatus };

/** Filter choices, in display order; only statuses present in the data are offered. */
const FILTER_ORDER: ('All plantings' | TreeStatus)[] = ['All plantings', 'Mature', 'Young', 'Fruit-bearing'];

/** Display label for a filter choice / status badge, from the i18n catalogue. */
const FILTER_LABEL_KEY: Record<'All plantings' | TreeStatus, TranslationKey> = {
  'All plantings': 'farmer.trees.filter.all',
  Mature: 'farmer.trees.status.mature',
  Young: 'farmer.trees.status.young',
  'Fruit-bearing': 'farmer.trees.status.fruitBearing',
};

function filterLabel(option: 'All plantings' | TreeStatus): string {
  return t(FILTER_LABEL_KEY[option]);
}

/** Placeholder card height while the list loads. */
const SKELETON_CARD_HEIGHT = spacing.xxxl * 2;

export interface TreesListScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToAddPlanting?: (() => void) | undefined;
  onNavigateToPlantingDetail?: ((item: TreePlantingItem) => void) | undefined;
  onNavigateToEditPlanting?: ((item: TreePlantingItem) => void) | undefined;
}

export function TreesListScreen({
  onBack,
  onNavigateToAddPlanting,
  onNavigateToPlantingDetail,
  onNavigateToEditPlanting,
}: TreesListScreenProps): React.JSX.Element {
  const [plantings, setPlantings] = useState<TreePlantingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'All plantings' | TreeStatus>('All plantings');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const loadPlantings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAllTreePlantings();
      setPlantings(items.map((item) => toTreePlantingItem(item)));
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlantings();
  }, [loadPlantings]);

  // The API records no status, so only "All plantings" is offered until it does
  // (see TreeStatus in api/treePlantings.ts).
  const filterOptions = FILTER_ORDER.filter(
    (opt) => opt === 'All plantings' || plantings.some((item) => item.status === opt),
  );

  const filteredItems =
    selectedFilter === 'All plantings'
      ? plantings
      : plantings.filter((item) => item.status === selectedFilter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.trees.backA11y')}
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerIconContainer}>
            <TreeHeaderIcon size={22} color={colors.brandGreen} />
          </View>

          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{t('farmer.trees.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {loading || error ? '' : t('farmer.trees.plantingsCount', { count: plantings.length })}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Filter Dropdown ── */}
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => setFilterModalOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.trees.filterA11y')}
          >
            <View style={styles.filterLeftRow}>
              <FilterLinesIcon size={16} color={P.twGray600} />
              <Text style={styles.filterText}>{filterLabel(selectedFilter)}</Text>
            </View>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>

          {/* ── Plantings List (or its loading / error / empty state) ── */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Skeleton width="100%" height={SKELETON_CARD_HEIGHT} borderRadius={radius.xl} />
              <Skeleton width="100%" height={SKELETON_CARD_HEIGHT} borderRadius={radius.xl} />
              <Skeleton width="100%" height={SKELETON_CARD_HEIGHT} borderRadius={radius.xl} />
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={() => void loadPlantings()} />
          ) : filteredItems.length === 0 ? (
            plantings.length === 0 ? (
              <EmptyState title={t('farmer.trees.emptyTitle')} message={t('farmer.trees.emptyMessage')} />
            ) : (
              <EmptyState title={t('farmer.trees.noMatchTitle')} message={t('farmer.trees.noMatchMessage')} />
            )
          ) : (
          <View style={styles.plantingsListContainer}>
            {filteredItems.map((item) => {
              const isYoung = item.status === 'Young';
              const isMature = item.status === 'Mature';
              const isFruit = item.status === 'Fruit-bearing';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardWrapper}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onNavigateToEditPlanting) {
                      onNavigateToEditPlanting(item);
                    } else if (onNavigateToPlantingDetail) {
                      onNavigateToPlantingDetail(item);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.plantingCard,
                      item.hasPruningAlert && styles.cardBorderAlert,
                    ]}
                  >
                    {/* Top Row: Name, Status Badge and Edit Button */}
                    <View style={styles.cardTopRow}>
                      <Text style={styles.plantingName}>{item.name}</Text>

                      <View style={styles.cardTopRowRight}>
                        {isMature && (
                          <View style={styles.badgeMature}>
                            <Text style={styles.badgeTextMature}>{filterLabel('Mature')}</Text>
                          </View>
                        )}

                        {isYoung && (
                          <View style={styles.badgeYoung}>
                            <Text style={styles.badgeTextYoung}>{filterLabel('Young')}</Text>
                          </View>
                        )}

                        {isFruit && (
                          <View style={styles.badgeFruit}>
                            <Text style={styles.badgeTextFruit}>{filterLabel('Fruit-bearing')}</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.editIconButton}
                          onPress={() => onNavigateToEditPlanting?.(item)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={t('farmer.trees.editA11y', { name: item.name })}
                        >
                          <EditPencilIcon size={14} color={P.twGray600} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Planted Date & Zone */}
                    <Text style={styles.plantedSubtitle}>
                      {item.plantedDate}
                      {item.zoneInfo ? ` · ${item.zoneInfo}` : null}
                    </Text>

                    {/* Alert Line for Young / Pruning check */}
                    {item.hasPruningAlert && item.alertText ? (
                      <View style={styles.alertLineRow}>
                        <PruningDropIcon size={14} color={P.twAmber800} />
                        <Text style={styles.alertText}>{item.alertText}</Text>
                      </View>
                    ) : (
                      /* Multi-detail metadata row */
                      <View style={styles.metaDetailsRow}>
                        {item.ageText && (
                          <View style={styles.metaChip}>
                            <AgeMiniIcon size={13} color={P.twGray400} />
                            <Text style={styles.metaChipText}>{item.ageText}</Text>
                          </View>
                        )}

                        {item.purposeText && (
                          <View style={styles.metaChip}>
                            {item.isFruitBearing ? (
                              <FruitYieldMiniIcon size={13} color={P.twGray400} />
                            ) : (
                              <WindbreakMiniIcon size={14} color={P.twGray400} />
                            )}
                            <Text style={styles.metaChipText}>{item.purposeText}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          )}
        </ScrollView>

        {/* ── Bottom Right Floating Action Button ── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={onNavigateToAddPlanting}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.trees.add')}
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>{t('farmer.trees.add')}</Text>
        </TouchableOpacity>

        {/* ── Filter Modal ── */}
        <Modal
          visible={filterModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('farmer.trees.filterTitle')}</Text>
              {filterOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    selectedFilter === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFilter(opt);
                    setFilterModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedFilter === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {filterLabel(opt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  container: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Filter dropdown
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  filterLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },

  // Loading state (new; token values only)
  loadingContainer: {
    gap: spacing.md,
  },

  // Plantings List
  plantingsListContainer: {
    gap: 12,
  },
  cardWrapper: {
    backgroundColor: P.white,
    borderRadius: 18,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  plantingCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
  },
  cardBorderAlert: {
    borderLeftWidth: 4,
    borderLeftColor: P.twAmber800,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  plantingName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    flex: 1,
  },
  cardTopRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.paleMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGreen100,
  },

  // Badges
  badgeMature: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextMature: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  badgeYoung: {
    backgroundColor: P.twAmber100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextYoung: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twAmber800,
  },
  badgeFruit: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextFruit: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  plantedSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 10,
  },

  // Meta details row
  metaDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaChipText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },

  // Alert line
  alertLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twAmber800,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionSelected: {
    borderBottomColor: colors.brandGreen,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
