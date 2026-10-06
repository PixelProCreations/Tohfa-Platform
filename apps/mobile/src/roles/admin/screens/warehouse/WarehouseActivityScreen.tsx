import React from 'react';
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

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  primarySoft: '#FDF3F0',
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

function StorageBuildingIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-8h6v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MaterialBoxIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 13l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface WarehouseActivityScreenProps {
  onBack?: () => void;
  onViewTimeline?: () => void;
  onSelectActivity?: (activityType: string) => void;
  onNavigateOperationsHistory?: () => void;
}

export function WarehouseActivityScreen({
  onBack,
  onViewTimeline,
  onSelectActivity,
  onNavigateOperationsHistory,
}: WarehouseActivityScreenProps) {
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
          <Text style={styles.headerTitle}>Warehouse Activity</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Recent/current — not the Stock Ledger or Receiving History
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* View as Timeline Button */}
        <TouchableOpacity
          style={styles.timelineBtn}
          onPress={onViewTimeline}
          activeOpacity={0.8}
        >
          <Text style={styles.timelineBtnText}>View as Timeline</Text>
        </TouchableOpacity>

        {/* Activities List */}
        <View style={styles.activityList}>
          {/* Activity 1 */}
          <TouchableOpacity
            style={styles.activityCard}
            onPress={() => onSelectActivity?.('Storage Activity')}
            activeOpacity={0.8}
          >
            <View style={styles.iconBox}>
              <StorageBuildingIcon size={22} color={PALETTE.primary} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Storage Activity</Text>
              <Text style={styles.activitySub}>
                Tomato moved to Cold Storage — Coonoor
              </Text>
            </View>
            <Text style={styles.activityTime}>10:42 AM</Text>
          </TouchableOpacity>

          {/* Activity 2 */}
          <TouchableOpacity
            style={styles.activityCard}
            onPress={() => onSelectActivity?.('Material Handling')}
            activeOpacity={0.8}
          >
            <View style={styles.iconBox}>
              <MaterialBoxIcon size={22} color={PALETTE.primary} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Material Handling</Text>
              <Text style={styles.activitySub}>
                Packaging Box issued · 20 units — Coonoor
              </Text>
            </View>
            <Text style={styles.activityTime}>09:50 AM</Text>
          </TouchableOpacity>
        </View>

        {onNavigateOperationsHistory && (
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={onNavigateOperationsHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.historyBtnText}>View Long-Term Operations History →</Text>
          </TouchableOpacity>
        )}

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
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
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
    marginLeft: 38,
    fontWeight: '500',
    lineHeight: 16,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timelineBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
    paddingRight: 8,
  },
  activityTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  activitySub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },
  activityTime: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  historyBtn: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
});
