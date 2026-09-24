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
import { Icon } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  inputBg: '#FFFFFF',
  inputBorder: '#EDE7DF',
  placeholder: '#BDB6AF',
  pillBorder: '#E8E1D7',
  pillActiveBg: '#F0562A',
  pillActiveText: '#FFFFFF',
  pillInactiveBg: '#FFFFFF',
  pillInactiveText: '#4A443F',
  ratingAmberBg: '#FFF3E0',
  ratingAmberText: '#E08000',
  ratingBlueBg: '#E3F2FD',
  ratingBlueText: '#1565C0',
  ratingPurpleBg: '#EDE7F6',
  ratingPurpleText: '#7C4DFF',
  ratingMutedBg: '#F5F5F5',
  ratingMutedText: '#9E9E9E',
  dotGreen: '#2E7D32',
  dotRed: '#F0562A',
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
                stroke="#2B2523"
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
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 21L16.65 16.65"
              stroke="#2B2523"
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
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
    backgroundColor: '#F0ECE6',
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
