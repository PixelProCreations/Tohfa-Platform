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

function TransferArrowsIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardChecklistIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12.5l2.5 2.5L16 10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingLargeIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArchiveCrateIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CreateSwaIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Line x1="20" y1="8" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="23" y1="11" x2="17" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ViewReportsIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagTargetIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GavelIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z" />
    </Svg>
  );
}

export interface QuickActionsOverviewScreenProps {
  onBack?: () => void;
  onTransferStock?: () => void;
  onReviewReceiving?: () => void;
  onWarehouseOverview?: () => void;
  onViewInventory?: () => void;
  onCreateSwa?: () => void;
  onViewReports?: () => void;
  onWarehouseTargets?: () => void;
  onReviewEscalations?: () => void;
}

export function QuickActionsOverviewScreen({
  onBack,
  onTransferStock,
  onReviewReceiving,
  onWarehouseOverview,
  onViewInventory,
  onCreateSwa,
  onViewReports,
  onWarehouseTargets,
  onReviewEscalations,
}: QuickActionsOverviewScreenProps) {
  const ACTIONS = [
    {
      id: 'transfer_stock',
      label: 'Transfer Stock',
      icon: <TransferArrowsIcon size={26} color={PALETTE.primary} />,
      onPress: onTransferStock,
    },
    {
      id: 'review_receiving',
      label: 'Review Receiving',
      icon: <ClipboardChecklistIcon size={26} color={PALETTE.primary} />,
      onPress: onReviewReceiving,
    },
    {
      id: 'warehouse_overview',
      label: 'Warehouse Overview',
      icon: <BuildingLargeIcon size={26} color={PALETTE.primary} />,
      onPress: onWarehouseOverview,
    },
    {
      id: 'view_inventory',
      label: 'View Inventory',
      icon: <ArchiveCrateIcon size={26} color={PALETTE.primary} />,
      onPress: onViewInventory,
    },
    {
      id: 'create_swa',
      label: 'Create SWA',
      icon: <CreateSwaIcon size={26} color={PALETTE.primary} />,
      onPress: onCreateSwa,
    },
    {
      id: 'view_reports',
      label: 'View Reports',
      icon: <ViewReportsIcon size={26} color={PALETTE.primary} />,
      onPress: onViewReports,
    },
    {
      id: 'warehouse_targets',
      label: 'Warehouse Targets',
      icon: <FlagTargetIcon size={26} color={PALETTE.primary} />,
      onPress: onWarehouseTargets,
    },
    {
      id: 'review_escalations',
      label: 'Review Escalations',
      icon: <GavelIcon size={26} color={PALETTE.primary} />,
      onPress: onReviewEscalations,
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
          <Text style={styles.headerTitle}>Quick Actions</Text>
        </View>
        <Text style={styles.headerSubtitle}>Shortcuts to frequent, permission-appropriate workflows</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 8 Action Tiles (2-column grid) */}
        <View style={styles.grid}>
          {ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.actionCard}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              {item.icon}
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Disclaimer / Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Each shortcut opens a working destination screen in its owning module — Quick Actions never duplicates a full operational form.
          </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  infoBannerText: {
    fontSize: 12,
    color: PALETTE.orangeDeep,
    lineHeight: 18,
    fontWeight: '500',
  },
});
