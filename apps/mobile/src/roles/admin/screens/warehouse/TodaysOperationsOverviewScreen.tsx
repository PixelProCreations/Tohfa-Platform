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
  primary: '#F0562A', // Brand Orange
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
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

export interface TodaysOperationsOverviewScreenProps {
  onBack?: () => void;
  onNavigateActivity?: () => void;
  onNavigateIncoming?: () => void;
  onNavigateStorage?: () => void;
  onNavigateVerification?: () => void;
  onNavigateMaterials?: () => void;
  onNavigateIssues?: () => void;
  onNavigateStaff?: () => void;
  onNavigateFulfilment?: () => void;
  onNavigateQuality?: () => void;
  onNavigateTimeline?: () => void;
}

export function TodaysOperationsOverviewScreen({
  onBack,
  onNavigateActivity,
  onNavigateIncoming,
  onNavigateStorage,
  onNavigateVerification,
  onNavigateMaterials,
  onNavigateIssues,
  onNavigateStaff,
  onNavigateFulfilment,
  onNavigateQuality,
  onNavigateTimeline,
}: TodaysOperationsOverviewScreenProps) {
  const KPIS = [
    { label: 'RECEIVING', value: '12', onPress: onNavigateIncoming },
    { label: 'STORAGE', value: '24', onPress: onNavigateStorage },
    { label: 'VERIFICATION', value: '8', onPress: onNavigateVerification },
    { label: 'MATERIALS', value: '16', onPress: onNavigateMaterials },
    { label: 'ISSUES', value: '5', onPress: onNavigateIssues },
    { label: 'STAFF', value: '19', onPress: onNavigateStaff },
  ];

  const handleActivity = onNavigateTimeline || onNavigateActivity;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Today's Operations</Text>
        </View>
        <Text style={styles.headerSubtitle}>28 September 2026</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 KPI Cards in 3x2 Grid */}
        <View style={styles.kpiGrid}>
          {KPIS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.kpiCard}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Card */}
        <TouchableOpacity
          style={styles.activityCard}
          onPress={handleActivity}
          activeOpacity={0.8}
        >
          <View style={styles.iconBox}>
            <StorageBuildingIcon size={20} color={PALETTE.primary} />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Storage Activity</Text>
            <Text style={styles.activitySub}>
              Tomato moved to Cold Storage · Rack 02 — Coonoor
            </Text>
          </View>
          <Text style={styles.activityTime}>10:42 AM</Text>
        </TouchableOpacity>

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
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 10,
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
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '31.3%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    lineHeight: 15,
  },
  activityTime: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '600',
    marginLeft: 8,
  },
});
