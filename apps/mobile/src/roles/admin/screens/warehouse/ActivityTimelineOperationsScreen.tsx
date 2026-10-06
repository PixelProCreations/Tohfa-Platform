import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  headerBg:      '#F0562A',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14',
  primarySoft:   '#FDF3F0',
  pageBg:        '#F3EFE9',

  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  border:        '#EEDCD3',
  borderRow:     '#F2ECE5',
  cardBg:        '#FFFFFF',
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

function CrateDownloadIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M3 13h4.5l1.5 2.5h6l1.5-2.5H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7v4.5M9.5 9.5l2.5 2.5 2.5-2.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BagDispatchIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 7V5a4 4 0 0 1 8 0v2M4 7h12l1 13H3L4 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface ActivityTimelineOperationsScreenProps {
  onBack?: () => void;
  onSelectActivity?: (id: string) => void;
  onViewAllHistory?: () => void;
}

export function ActivityTimelineOperationsScreen({
  onBack,
  onSelectActivity,
  onViewAllHistory,
}: ActivityTimelineOperationsScreenProps) {
  const ACTIVITIES = [
    {
      id: 'GR-04512',
      title: 'Goods Received — GR-04512',
      subtitle: 'Kotagiri · SWA Manoj · Tap to inspect',
      time: '09:45 AM',
      iconType: 'received' as const,
    },
    {
      id: 'ORD-88213',
      title: 'Order Dispatched — ORD-88213',
      subtitle: 'Ooty · SWA Arun · Tap to inspect',
      time: '09:12 AM',
      iconType: 'dispatched' as const,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Screenshot 5) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Activity Timeline</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section Header ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Operational Activity Detail</Text>
        </View>

        {/* ─── Activity List Card ─── */}
        <View style={styles.activityContainer}>
          {ACTIVITIES.map((item, index) => {
            const isLast = index === ACTIVITIES.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.activityRow,
                  !isLast && styles.activityRowBorder,
                ]}
                onPress={() => onSelectActivity?.(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconSquare}>
                  {item.iconType === 'received' ? (
                    <CrateDownloadIcon size={18} color={PALETTE.primary} />
                  ) : (
                    <BagDispatchIcon size={18} color={PALETTE.primary} />
                  )}
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>{item.subtitle}</Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  <Text style={{ fontSize: 13, color: PALETTE.primary }}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Action Button ─── */}
        {onViewAllHistory && (
          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={onViewAllHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomActionText}>View Full Operations History →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  activityContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderRow,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  itemSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C8983',
    marginLeft: 8,
  },
  bottomActionBtn: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
});
