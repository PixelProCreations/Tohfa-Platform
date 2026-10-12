// Design id: M4-S03 / M3S08
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import type {
  WarehouseScreenBaseProps,
  WarehouseSelectionProps,
  WarehouseTab,
  StorageLocationItem,
  StorageSectionItem,
  StorageHierarchyNode,
} from './types';
import { warehouseNameOf } from './WarehouseProfileParts';

export interface StorageInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  onSelectLocation?: ((locationId: string) => void) | undefined;
  locations?: readonly StorageLocationItem[] | undefined;
  sections?: readonly StorageSectionItem[] | undefined;
  hierarchy?: Readonly<Record<string, readonly StorageHierarchyNode[]>> | undefined;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function LockIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseBuildingIcon({ size = 18, color = '#4E5D56' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8l9-5 9 5v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8h18M7 12v9M12 12v9M17 12v9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function InfoIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Tab Bar Icons ────────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? '#F0562A' : '#71717A';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? '#F0562A' : '#71717A';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v7.5M8.5 11.5L12 15l3.5-3.5M8 18h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? '#F0562A' : '#71717A';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 18.5 4h-13z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M3 9.5h18M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? '#F0562A' : '#71717A';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {[5, 12, 19].flatMap((cy) =>
        [5, 12, 19].map((cx) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill={color} />),
      )}
    </Svg>
  );
}

export function StorageInfoScreen({
  scope,
  onBack,
  onTabChange,
  onSelectLocation,
  warehouseOptions,
  selectedWarehouseId,
}: StorageInfoScreenProps) {
  const warehouseName =
    scope.warehouseName ||
    (scope.warehouseId ? warehouseNameOf(scope, scope.warehouseId, warehouseOptions) : undefined) ||
    'Coonoor Warehouse';

  const handleTabPress = (tab: WarehouseTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home') {
      onBack?.();
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Top SafeArea for Header */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>Storage Locations</Text>
          </View>

          {/* Warehouse Locked Pill */}
          <View style={styles.warehousePill}>
            <LockIcon size={12} color="#FFFFFF" />
            <Text style={styles.warehousePillText}>{warehouseName}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Warehouse Name Subheader */}
          <View style={styles.warehouseRow}>
            <WarehouseBuildingIcon size={18} color="#4E5D56" />
            <Text style={styles.warehouseRowText}>{warehouseName}</Text>
          </View>

          {/* Cold Storage Section */}
          <Text style={styles.sectionTitle}>Cold Storage</Text>

          {/* Card 1: Section A */}
          <TouchableOpacity
            style={styles.storageCard}
            activeOpacity={onSelectLocation ? 0.75 : 1}
            onPress={() => onSelectLocation?.('coon-cs-a')}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Section A</Text>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>75% Full</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>3 racks · 2 products stored</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '75%', backgroundColor: '#F0562A' }]} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Section B */}
          <TouchableOpacity
            style={styles.storageCard}
            activeOpacity={onSelectLocation ? 0.75 : 1}
            onPress={() => onSelectLocation?.('coon-cs-b')}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Section B</Text>
              <View style={styles.badgeDanger}>
                <Text style={styles.badgeDangerText}>92% Full</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>4 racks · 3 products stored</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '92%', backgroundColor: '#EF4444' }]} />
            </View>
          </TouchableOpacity>

          {/* Card 3: Section A · Rack 03 · Shelf 03 */}
          <TouchableOpacity
            style={styles.storageCard}
            activeOpacity={onSelectLocation ? 0.75 : 1}
            onPress={() => onSelectLocation?.('coon-cs-a-r03')}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Section A · Rack 03 · Shelf 03</Text>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Active</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>BAT-COO-00241 · Tomato · Grade 1</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '55%', backgroundColor: '#F0562A' }]} />
            </View>
          </TouchableOpacity>

          {/* Dry Storage Section */}
          <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Dry Storage</Text>

          {/* Card 4: Section C */}
          <TouchableOpacity
            style={styles.storageCard}
            activeOpacity={onSelectLocation ? 0.75 : 1}
            onPress={() => onSelectLocation?.('coon-ds-c')}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Section C</Text>
              <View style={styles.badgeDanger}>
                <Text style={styles.badgeDangerText}>Empty</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>2 racks · 0 products stored</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '0%', backgroundColor: '#F0562A' }]} />
            </View>
          </TouchableOpacity>

          {/* Notice Box */}
          <View style={styles.noticeBox}>
            <View style={styles.noticeIconWrap}>
              <InfoIcon size={18} color="#2563EB" />
            </View>
            <Text style={styles.noticeText}>
              Capacity and occupancy figures are read from the warehouse's storage configuration, not entered here — SWA views storage, it doesn't reconfigure it.
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Bottom Tab Bar */}
        <SafeAreaView style={styles.bottomSafeArea}>
          <View style={styles.tabBar}>
            <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleTabPress('Home')}>
              <HomeTabIcon active={false} />
              <Text style={styles.tabLabel}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleTabPress('Receiving')}>
              <ReceivingTabIcon active={false} />
              <Text style={styles.tabLabel}>Receiving</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleTabPress('Inventory')}>
              <InventoryTabIcon active={true} />
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleTabPress('More')}>
              <MoreTabIcon active={false} />
              <Text style={styles.tabLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  topSafeArea: {
    backgroundColor: '#F0562A',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
    marginLeft: 34,
    gap: 6,
  },
  warehousePillText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  warehouseRowText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 12,
  },
  storageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    flex: 1,
    paddingRight: 8,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeSuccessText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeDangerText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 4,
    marginBottom: 14,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F5F1EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 18,
  },
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE6DF',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#F0562A',
    fontWeight: '700',
  },
});
