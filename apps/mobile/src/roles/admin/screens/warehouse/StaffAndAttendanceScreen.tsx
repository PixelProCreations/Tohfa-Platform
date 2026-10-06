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
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
  greenBg: '#EAF3DE',
  greenText: '#1E8E5A',
  chipBg: '#FDF3F0',
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

function UserOutlineIcon({ size = 20, color = '#7A2E14' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface StaffAndAttendanceScreenProps {
  onBack?: () => void;
}

export function StaffAndAttendanceScreen({ onBack }: StaffAndAttendanceScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'Today' | 'Staff' | 'History'>('Today');

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
          <Text style={styles.headerTitle}>Staff & Attendance</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 2 KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Staff</Text>
            <Text style={styles.kpiValue}>34</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Present</Text>
            <Text style={styles.kpiValue}>27</Text>
          </View>
        </View>

        {/* 3 Segment Tabs */}
        <View style={styles.segmentRow}>
          {(['Today', 'Staff', 'History'] as const).map((tab) => {
            const active = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Coonoor Header Card */}
        <View style={styles.warehouseSummaryCard}>
          <Text style={styles.warehouseName}>Coonoor</Text>
          <View style={styles.greenBadge}>
            <Text style={styles.greenBadgeText}>7 / 9 Present</Text>
          </View>
        </View>

        {/* Staff Member Card */}
        <View style={styles.staffCard}>
          <View style={styles.avatarBox}>
            <UserOutlineIcon size={18} color={PALETTE.orangeDeep} />
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>Ramesh Kumar</Text>
            <Text style={styles.staffRole}>Warehouse Staff - Coonoor</Text>
          </View>
          <View style={styles.presentBadge}>
            <Text style={styles.presentBadgeText}>Present</Text>
          </View>
        </View>

        {/* Bottom Disclaimer Box */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This screen never grows into a full HR system — no salary, payroll, appraisal, employee creation/deletion or role management.
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
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  warehouseSummaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  warehouseName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  greenBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greenBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  staffCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  presentBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presentBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  disclaimerBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderColor: PALETTE.noticeBorderOrange,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
  },
});
