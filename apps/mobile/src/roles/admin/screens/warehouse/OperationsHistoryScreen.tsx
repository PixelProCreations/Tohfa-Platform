import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

function SearchIcon({ size = 18, color = '#888888' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DocCheckIcon({ size = 18, color = '#7A2E14' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PackageIcon({ size = 18, color = '#7A2E14' }: { size?: number; color?: string }) {
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

export interface OperationsHistoryScreenProps {
  onBack?: () => void;
  onExport?: () => void;
  onSelectVerification?: () => void;
  onSelectMaterial?: () => void;
}

export function OperationsHistoryScreen({
  onBack,
  onExport,
  onSelectVerification,
  onSelectMaterial,
}: OperationsHistoryScreenProps) {
  const [search, setSearch] = useState('');

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      Alert.alert('Operations History Exported', 'CSV report has been saved to your downloads folder.');
    }
  };

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
          <Text style={styles.headerTitle}>Operations History</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Long-term searchable record — not recent activity
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search operations"
            placeholderTextColor="#888888"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* History List Card */}
        <View style={styles.card}>
          {/* Item 1 */}
          <TouchableOpacity
            style={styles.itemRow}
            onPress={onSelectVerification}
            activeOpacity={0.7}
          >
            <View style={styles.itemIconBox}>
              <DocCheckIcon size={18} color={PALETTE.orangeDeep} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>Stock Verification — VER-0021</Text>
              <Text style={styles.itemSub}>Coonoor · 28 Sep 2026, 09:30 AM</Text>
            </View>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Item 2 */}
          <TouchableOpacity
            style={styles.itemRow}
            onPress={onSelectMaterial}
            activeOpacity={0.7}
          >
            <View style={styles.itemIconBox}>
              <PackageIcon size={18} color={PALETTE.orangeDeep} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>
                Material Issued — Packaging Box (20 Units)
              </Text>
              <Text style={styles.itemSub}>Coonoor · 27 Sep 2026, 04:20 PM</Text>
            </View>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.8}
        >
          <Text style={styles.exportBtnText}>Export Operations</Text>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 14,
  },
  exportBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
