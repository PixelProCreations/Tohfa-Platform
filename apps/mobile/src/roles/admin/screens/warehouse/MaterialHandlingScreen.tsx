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
  greenBg: '#EAF3DE',
  greenText: '#1E8E5A',
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

function ReceiveActionIcon({ size = 22, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IssueActionIcon({ size = 22, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16V8M8 12l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HistoryActionIcon({ size = 22, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface MaterialHandlingScreenProps {
  onBack?: () => void;
  onSelectMaterial?: (materialId: string) => void;
  onReceiveMaterial?: () => void;
  onIssueMaterial?: () => void;
  onViewHistory?: () => void;
}

export function MaterialHandlingScreen({
  onBack,
  onSelectMaterial,
  onReceiveMaterial,
  onIssueMaterial,
  onViewHistory,
}: MaterialHandlingScreenProps) {
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
          <Text style={styles.headerTitle}>Material Handling</Text>
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
            <Text style={styles.kpiLabel}>Total Materials</Text>
            <Text style={styles.kpiValue}>42</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Low Material</Text>
            <Text style={styles.kpiValue}>5</Text>
          </View>
        </View>

        {/* Packaging Box Card */}
        <TouchableOpacity
          style={styles.materialCard}
          onPress={() => onSelectMaterial?.('MAT-0021')}
          activeOpacity={0.8}
        >
          <View style={styles.materialTopRow}>
            <View>
              <Text style={styles.materialName}>Packaging Box</Text>
              <Text style={styles.materialId}>MAT-0021</Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.materialBottomRow}>
            <View>
              <Text style={styles.whLabel}>Warehouse</Text>
              <Text style={styles.whValue}>Coonoor</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.whLabel}>Qty</Text>
              <Text style={styles.qtyValue}>120 Units</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── Material Actions ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Material Actions</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Receive */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onReceiveMaterial}
            activeOpacity={0.8}
          >
            <ReceiveActionIcon size={24} color={PALETTE.primary} />
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>

          {/* Issue */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onIssueMaterial}
            activeOpacity={0.8}
          >
            <IssueActionIcon size={24} color={PALETTE.primary} />
            <Text style={styles.actionText}>Issue</Text>
          </TouchableOpacity>

          {/* History */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onViewHistory}
            activeOpacity={0.8}
          >
            <HistoryActionIcon size={24} color={PALETTE.primary} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
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
  materialCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  materialTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  materialName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  materialId: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  availableBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  materialBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 3,
  },
  whValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
