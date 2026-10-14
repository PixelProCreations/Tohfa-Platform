import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getPlots } from '../../../api/farms';
import { listSoilAmendments, type SoilAmendment } from '../../../api/soil';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafSproutIcon({ size = 20, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-7M12 14c-2.5-3-6-2.5-7-2 0 4 3 6 7 2zM12 12c2.5-3 6-2.5 7-2 0 4-3 6-7 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Sample Data
// ─────────────────────────────────────────────

export interface AmendmentItem {
  id: string;
  name: string;
  zoneInfo: string;
  quantity: string;
}

function toTimeAgo(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return dateStr;
  const days = Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
  if (days < 1) return 'today';
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 60) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export interface SoilAmendmentsLogScreenProps {
  /** The farm whose plots' amendments are shown, threaded from SoilManagementScreen. */
  farmId: string;
  onBack?: (() => void) | undefined;
  onLogAmendment?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilAmendmentsLogScreen({
  farmId,
  onBack,
  onLogAmendment,
}: SoilAmendmentsLogScreenProps): React.JSX.Element {
  // Android hardware back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const [items, setItems] = useState<AmendmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAmendments = useCallback(async () => {
    if (!farmId) {
      setLoading(false);
      setLoadError('No farm selected. Go back and choose a farm first.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const plots = await getPlots(farmId);
      const perPlot = await Promise.all(
        plots.map(async (plot) => {
          const amendments = await listSoilAmendments(farmId, plot.id);
          return amendments.map((a: SoilAmendment) => ({ amendment: a, plotName: plot.name }));
        }),
      );
      const merged = perPlot
        .flat()
        .sort((a, b) => (a.amendment.appliedDate < b.amendment.appliedDate ? 1 : -1))
        .map(
          ({ amendment, plotName }): AmendmentItem => ({
            id: amendment.id,
            name: amendment.amendmentType,
            zoneInfo: `${plotName} · ${toTimeAgo(amendment.appliedDate)}`,
            quantity: `${amendment.quantityKg} kg`,
          }),
        );
      setItems(merged);
    } catch (err) {
      setLoadError(formatErrorMessage(err, 'Could not load soil amendments.'));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadAmendments();
  }, [loadAmendments]);

  const handleAdd = () => {
    if (onLogAmendment) {
      onLogAmendment();
    } else {
      Alert.alert('Log Amendment', 'Add a new FYM, compost, or organic amendment entry.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>FR-F06</Text>
            <Text style={styles.headerTitle}>Soil Amendments Log</Text>
            <Text style={styles.headerSubtitle}>FYM, compost & recommendations</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={78} width="100%" style={{ marginBottom: 12 }} />
          <Skeleton height={78} width="100%" />
        </View>
      ) : loadError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{loadError}</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section Heading ── */}
        <Text style={styles.sectionHeading}>Recent amendments</Text>

        {/* ── Amendments List ── */}
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No amendments logged yet.</Text>
        ) : (
        <View style={styles.amendmentsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.amendmentCard}>
              <View style={styles.iconBadge}>
                <LeafSproutIcon size={22} color={P.forestGreen} />
              </View>

              <View style={styles.amendmentInfo}>
                <Text style={styles.amendmentName}>{item.name}</Text>
                <Text style={styles.amendmentZone}>{item.zoneInfo}</Text>
              </View>

              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
          ))}
        </View>
        )}
      </ScrollView>
      )}

      {/* ── Bottom Fixed Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={handleAdd}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Log Amendment"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.logBtnText}>Log Amendment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  loadErrorText: {
    color: P.red600,
    fontSize: typography.body,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
    paddingVertical: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTag: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  recommendationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.mintTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    marginBottom: 20,
    gap: 12,
  },
  recommendationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.forestGreen,
    lineHeight: 18,
  },
  recommendationBold: {
    fontWeight: '700',
    color: P.twGreen900,
  },
  sectionHeading: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 12,
  },
  amendmentsList: {
    gap: 10,
  },
  amendmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amendmentInfo: {
    flex: 1,
    marginRight: 10,
  },
  amendmentName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  amendmentZone: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 3,
  },
  quantityText: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.twGray900,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  logBtn: {
    backgroundColor: P.forestGreen,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  logBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
});
