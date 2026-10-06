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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

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

function WarningTriangleIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function GavelIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z" />
    </Svg>
  );
}

function CheckCircleOutlineIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface AlertsAndActionCenterScreenProps {
  onBack?: () => void;
  onSelectAlert?: (alertId: string) => void;
}

export function AlertsAndActionCenterScreen({
  onBack,
  onSelectAlert,
}: AlertsAndActionCenterScreenProps) {
  const [selectedStatusTab, setSelectedStatusTab] = useState<'All' | 'Unread' | 'Resolved'>('All');
  const [selectedPriorityTab, setSelectedPriorityTab] = useState<'All Priority' | 'Critical' | 'All Warehouses'>('All Priority');

  const ALERTS = [
    {
      id: 'alert_1',
      title: 'Coonoor stock below target',
      subtitle: 'Low-stock alert · Today, 08:20 AM',
      icon: 'warning',
    },
    {
      id: 'alert_2',
      title: 'SWA issue escalated — Ooty',
      subtitle: 'Warehouse-level dispute · Today, 07:50 AM',
      icon: 'escalation',
    },
    {
      id: 'alert_3',
      title: 'Follow up: Transfer TRF-00284 variance',
      subtitle: 'Assigned action · Due today',
      icon: 'check',
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Alerts & Action Center</Text>
        </View>
        <Text style={styles.headerSubtitle}>Warehouse-level problems requiring attention</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Chips Row 1 */}
        <View style={styles.chipsRow}>
          {(['All', 'Unread', 'Resolved'] as const).map((tab) => {
            const active = selectedStatusTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedStatusTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filter Chips Row 2 */}
        <View style={styles.chipsRow}>
          {(['All Priority', 'Critical', 'All Warehouses'] as const).map((tab) => {
            const active = selectedPriorityTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedPriorityTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Alert Cards */}
        <View style={styles.alertsContainer}>
          {ALERTS.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              onPress={() => onSelectAlert && onSelectAlert(alert.id)}
              activeOpacity={0.8}
            >
              <View style={styles.alertAccentBar} />
              <View style={styles.alertContentRow}>
                {alert.icon === 'warning' && <WarningTriangleIcon size={22} color={PALETTE.primary} />}
                {alert.icon === 'escalation' && <GavelIcon size={22} color={PALETTE.primary} />}
                {alert.icon === 'check' && <CheckCircleOutlineIcon size={22} color={PALETTE.primary} />}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertSub}>{alert.subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
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
    paddingTop: Platform.OS === 'android' ? 8 : 10,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    marginLeft: 32,
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
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  alertsContainer: {
    marginTop: 6,
    gap: 12,
  },
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: PALETTE.primary,
    borderRadius: 2,
  },
  alertContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  alertSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
});
