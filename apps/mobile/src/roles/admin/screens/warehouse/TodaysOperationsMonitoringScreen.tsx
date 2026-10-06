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

export interface TodaysOperationsMonitoringScreenProps {
  onBack?: () => void;
  onNavigateIncoming?: () => void;
  onNavigateFulfilment?: () => void;
  onNavigateQuality?: () => void;
  onNavigateTimeline?: () => void;
}

export function TodaysOperationsMonitoringScreen({
  onBack,
  onNavigateIncoming,
  onNavigateFulfilment,
  onNavigateQuality,
  onNavigateTimeline,
}: TodaysOperationsMonitoringScreenProps) {
  const operations = [
    { title: 'Incoming Goods', onPress: onNavigateIncoming },
    { title: 'Order Fulfilment', onPress: onNavigateFulfilment },
    { title: 'Quality Issues', onPress: onNavigateQuality },
    { title: 'Warehouse-wise Activity Timeline', onPress: onNavigateTimeline },
  ];

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
        <Text style={styles.headerSubtitle}>Daily operational monitoring · All Warehouses</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Operations Navigation List Card */}
        <View style={styles.listCard}>
          {operations.map((item, idx) => (
            <React.Fragment key={idx}>
              <TouchableOpacity
                style={styles.rowItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
              {idx < operations.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Note / Disclaimer Box */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Every operational card has a View All action, and every transaction links to its owning module rather than duplicating the record here.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingBottom: 32,
  },
  listCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFE9',
  },
  noteBox: {
    backgroundColor: '#FDF1EB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F6D2C4',
    padding: 14,
  },
  noteText: {
    fontSize: 11.5,
    color: '#9C3D18',
    lineHeight: 17,
    fontWeight: '500',
  },
});
