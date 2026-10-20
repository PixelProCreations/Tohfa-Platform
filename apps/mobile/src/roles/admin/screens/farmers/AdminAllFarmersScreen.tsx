import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

function NavDashboardIcon({ color = adminColors.muted, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function NavFarmersIcon({ color = adminColors.brand, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-3-3.87"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-2a4 4 0 00-4-4H4a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M23 21v-2a4 4 0 00-3-3.87"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavSalesIcon({ color = adminColors.muted, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2.5" stroke={color} strokeWidth="2.2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function NavReportsIcon({ color = adminColors.muted, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20h18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M7 20V14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M12 20V9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M17 20V5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function NavProfileIcon({ color = adminColors.muted, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path
        d="M6 19.5c1.8-2 3.8-3 6-3s4.2 1 6 3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

const P = {
  bg: adminColors.canvas,
  cardBg: adminColors.card,
  cardBorder: adminColors.border,
  ink: adminColors.ink,
  titleBrown: adminColors.brandDeep,
  subtitle: adminColors.muted,
  orange: adminColors.brand,
  orangeBg: adminColors.brandTint,
  textSecondary: adminColors.muted,
  inputBg: adminColors.card,
  inputBorder: adminColors.border,
  placeholder: adminColors.muted,
  pillBorder: adminColors.border,
  pillActiveBg: adminColors.brand,
  pillActiveText: adminColors.onBrand,
  pillInactiveBg: adminColors.card,
  pillInactiveText: adminColors.ink,
  ratingAmberBg: adminColors.warning.bg,
  ratingAmberText: adminColors.warning.text,
  ratingBlueBg: adminColors.info.bg,
  ratingBlueText: adminColors.info.text,
  ratingPurpleBg: adminColors.brandTint,
  ratingPurpleText: adminColors.brandDeep,
  ratingMutedBg: adminColors.canvas,
  ratingMutedText: adminColors.muted,
  dotGreen: adminColors.success.text,
  dotRed: adminColors.danger.text,
};

export interface FarmerListItem {
  id: string;
  name: string;
  code: string;
  initials: string;
  farmName?: string;
  location: string;
  status: 'ACTIVE' | 'DISABLED';
  rating: number | null;
  ratingTier?: string;
  mobile?: string;
  aadhaar?: string;
  memberSince?: string;
  subscription?: string;
  farmSize?: string;
  fmbZones?: string;
  primaryCrops?: string;
  soilType?: string;
  irrigation?: string;
  aadhaarStatus?: 'Verified' | 'Pending' | 'Uploaded';
  pattaStatus?: 'Verified' | 'Pending' | 'Uploaded';
  passbookStatus?: 'Verified' | 'Pending' | 'Uploaded';
  certStatus?: 'Verified' | 'Pending' | 'Expired';
  kycNotes?: string;
}

export const DEMO_ALL_FARMERS: FarmerListItem[] = [
  {
    id: 'farmer-001',
    name: 'Vijay Anand',
    code: '#TOHFA-F-00234',
    initials: 'VA',
    farmName: 'Wild Eden Organic Farms',
    location: 'Ooty',
    status: 'ACTIVE',
    rating: 782,
    ratingTier: 'Excellent',
    mobile: '+91 98765 43210',
    aadhaar: 'XXXX XXXX 7654',
    memberSince: 'Mar 2025',
    subscription: 'Active · Paid',
  },
  {
    id: 'farmer-002',
    name: 'Ramasamy S.',
    code: '#TOHFA-F-00189',
    initials: 'RS',
    location: 'Coonoor',
    status: 'ACTIVE',
    rating: 718,
    ratingTier: 'Good',
    mobile: '+91 98765 11092',
    aadhaar: 'XXXX XXXX 1928',
    memberSince: 'Jan 2025',
    subscription: 'Active · Paid',
  },
  {
    id: 'farmer-003',
    name: 'Kavitha M.',
    code: '#TOHFA-F-00302',
    initials: 'KM',
    location: 'Gudalur',
    status: 'ACTIVE',
    rating: 668,
    ratingTier: 'Good',
    mobile: '+91 98765 44821',
    aadhaar: 'XXXX XXXX 5561',
    memberSince: 'Apr 2025',
    subscription: 'Active · Free',
  },
  {
    id: 'farmer-004',
    name: 'Selvi N.',
    code: '#TOHFA-F-00098',
    initials: 'SN',
    location: 'Kotagiri · Disabled',
    status: 'DISABLED',
    rating: null,
    ratingTier: 'Disabled',
    mobile: '+91 98765 99321',
    aadhaar: 'XXXX XXXX 7701',
    memberSince: 'Nov 2024',
    subscription: 'Inactive',
  },
];

interface Props {
  onBack?: () => void;
  onSelectFarmer: (farmer: FarmerListItem) => void;
  onNavigateTab?: (tab: 'Dashboard' | 'Farmers' | 'Sales' | 'Reports' | 'Profile') => void;
  showBottomNav?: boolean;
}

const FILTER_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'DISABLED', label: 'Disabled' },
  { id: 'EXCELLENT', label: 'Excellent tier' },
];

export const AdminAllFarmersScreen: React.FC<Props> = ({
  onBack,
  onSelectFarmer,
  onNavigateTab,
  showBottomNav = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filteredFarmers = DEMO_ALL_FARMERS.filter((f) => {
    if (selectedFilter === 'ACTIVE' && f.status !== 'ACTIVE') return false;
    if (selectedFilter === 'DISABLED' && f.status !== 'DISABLED') return false;
    if (selectedFilter === 'EXCELLENT' && (f.rating === null || f.rating < 750)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header back button if provided */}
      {onBack ? (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke={adminColors.ink}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ height: 16 }} />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Subtitle */}
        <Text style={styles.title}>All Farmers</Text>
        <Text style={styles.subtitle}>1,284 registered farmers across 4 zones</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
            <Path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke={adminColors.ink}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 21L16.65 16.65"
              stroke={adminColors.ink}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or zone"
            placeholderTextColor={P.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedFilter(tab.id)}
                activeOpacity={0.8}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Farmer Cards */}
        <View style={styles.listSection}>
          {filteredFarmers.map((item) => {
            const isDisabled = item.status === 'DISABLED';
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isDisabled && styles.cardDisabled]}
                activeOpacity={0.85}
                onPress={() => onSelectFarmer(item)}
              >
                <View
                  style={[
                    styles.avatarCircle,
                    isDisabled ? styles.avatarCircleDisabled : styles.avatarCircleNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      isDisabled ? styles.avatarTextDisabled : styles.avatarTextNormal,
                    ]}
                  >
                    {item.initials}
                  </Text>
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.cardName, isDisabled && { color: P.subtitle }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.codeText}> {item.code}</Text>
                  </View>

                  <View style={styles.subRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isDisabled ? P.dotRed : P.dotGreen },
                      ]}
                    />
                    <Text style={styles.subText}>
                      {item.farmName ? `${item.farmName} · ` : ''}
                      {item.location}
                    </Text>
                  </View>
                </View>

                {/* Rating Badge */}
                <View
                  style={[
                    styles.ratingBadge,
                    item.rating && item.rating >= 750
                      ? styles.ratingBadgeAmber
                      : item.rating
                      ? styles.ratingBadgeBlue
                      : styles.ratingBadgeMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingText,
                      item.rating && item.rating >= 750
                        ? styles.ratingTextAmber
                        : item.rating
                        ? styles.ratingTextBlue
                        : styles.ratingTextMuted,
                    ]}
                  >
                    ★ {item.rating ?? '-'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <View style={styles.bottomNav}>
          {/* Tab 1: Dashboard */}
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => {
              if (onNavigateTab) {
                onNavigateTab('Dashboard');
              } else if (onBack) {
                onBack();
              }
            }}
            activeOpacity={0.7}
          >
            <NavDashboardIcon color={adminColors.muted} />
            <Text style={styles.navTabLabel}>Dashboard</Text>
          </TouchableOpacity>

          {/* Tab 2: Farmers (Active) */}
          <TouchableOpacity
            style={styles.navTabItem}
            activeOpacity={0.7}
          >
            <NavFarmersIcon color={adminColors.brand} />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Farmers</Text>
          </TouchableOpacity>

          {/* Tab 3: Sales */}
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Sales')}
            activeOpacity={0.7}
          >
            <NavSalesIcon color={adminColors.muted} />
            <Text style={styles.navTabLabel}>Sales</Text>
          </TouchableOpacity>

          {/* Tab 4: Reports */}
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Reports')}
            activeOpacity={0.7}
          >
            <NavReportsIcon color={adminColors.muted} />
            <Text style={styles.navTabLabel}>Reports</Text>
          </TouchableOpacity>

          {/* Tab 5: Profile */}
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Profile')}
            activeOpacity={0.7}
          >
            <NavProfileIcon color={adminColors.muted} />
            <Text style={styles.navTabLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navTabLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 4,
  },
  navTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
    cursor: 'pointer' as any,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: P.subtitle,
    marginBottom: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.inputBorder,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: P.ink,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  filterPillActive: {
    backgroundColor: P.pillActiveBg,
    borderColor: P.pillActiveBg,
  },
  filterPillInactive: {
    backgroundColor: P.pillInactiveBg,
    borderColor: P.pillBorder,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: P.pillActiveText,
  },
  filterPillTextInactive: {
    color: P.pillInactiveText,
  },
  listSection: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...adminShadow.sm,
    cursor: 'pointer' as any,
  },
  cardDisabled: {
    opacity: 0.75,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarCircleNormal: {
    backgroundColor: P.orangeBg,
  },
  avatarCircleDisabled: {
    backgroundColor: adminColors.canvas,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarTextNormal: {
    color: P.titleBrown,
  },
  avatarTextDisabled: {
    color: P.subtitle,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  codeText: {
    fontSize: 12,
    color: P.subtitle,
    fontWeight: '500',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  subText: {
    fontSize: 12,
    color: P.textSecondary,
  },
  ratingBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingBadgeAmber: {
    backgroundColor: P.ratingAmberBg,
  },
  ratingBadgeBlue: {
    backgroundColor: P.ratingBlueBg,
  },
  ratingBadgeMuted: {
    backgroundColor: P.ratingMutedBg,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratingTextAmber: {
    color: P.ratingAmberText,
  },
  ratingTextBlue: {
    color: P.ratingBlueText,
  },
  ratingTextMuted: {
    color: P.ratingMutedText,
  },
});
