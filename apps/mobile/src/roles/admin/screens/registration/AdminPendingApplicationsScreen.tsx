import React, { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';

const pinIconAsset = require('../../assets/images/pin.png');

// ─── Theme & Palette ─────────────────────────────────────────────────────────
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
  scrollTrack: '#FAF8F5',
  scrollBar: '#78736E',
  arrowColor: '#78736E',
  statusGreenBg: '#E8F5E9',
  statusGreenText: '#2E7D32',
  statusAmberBg: '#FFF3E0',
  statusAmberText: '#B25E00',
  statusRedBg: '#FFEBEE',
  statusRedText: '#D32F2F',
  dashedBorder: '#DFCFC4',
  dotRed: '#F0562A',
};

export interface PendingApplicationItem {
  id: string;
  name: string;
  initials: string;
  location: string;
  appliedTime: string;
  badgeLabel: string;
  badgeType: 'green' | 'amber' | 'red';
  phone?: string;
  aadhaar?: string;
  farmSize?: string;
  fmbZones?: string;
  primaryCrops?: string;
  dayCountText?: string;
}

export const DEMO_PENDING_APPLICATIONS: PendingApplicationItem[] = [
  {
    id: 'app-001',
    name: 'Muthukumar S.',
    initials: 'MS',
    location: 'Kotagiri',
    appliedTime: 'Applied 2 days ago',
    badgeLabel: 'Docs OK',
    badgeType: 'green',
    phone: '+91 98XXX XX412',
    aadhaar: 'XXXX XXXX 4821',
    farmSize: '3.4 acres',
    fmbZones: '6 zones marked',
    primaryCrops: 'Carrots, Cabbage',
    dayCountText: 'Review 3-5 day working days timeline applies — this application is on day 2 of 5.',
  },
  {
    id: 'app-002',
    name: 'Lakshmi R.',
    initials: 'LR',
    location: 'Ooty',
    appliedTime: 'Applied 4 days ago',
    badgeLabel: 'KYC Pending',
    badgeType: 'amber',
    phone: '+91 98XXX XX891',
    aadhaar: 'XXXX XXXX 3390',
    farmSize: '2.8 acres',
    fmbZones: '4 zones marked',
    primaryCrops: 'Potato, Garlic',
    dayCountText: 'Review 3-5 day working days timeline applies — this application is on day 4 of 5.',
  },
  {
    id: 'app-003',
    name: 'Velu Kannan',
    initials: 'VK',
    location: 'Coonoor',
    appliedTime: 'Applied 5 days ago',
    badgeLabel: 'Day 5 of 5',
    badgeType: 'red',
    phone: '+91 98XXX XX104',
    aadhaar: 'XXXX XXXX 9912',
    farmSize: '5.1 acres',
    fmbZones: '8 zones marked',
    primaryCrops: 'Tea, Carrot',
    dayCountText: 'Urgent review: 3-5 day working days timeline applies — this application is on day 5 of 5.',
  },
  {
    id: 'app-004',
    name: 'Pushpa T.',
    initials: 'PT',
    location: 'Gudalur',
    appliedTime: 'Applied 1 day ago',
    badgeLabel: 'Docs OK',
    badgeType: 'green',
    phone: '+91 98XXX XX557',
    aadhaar: 'XXXX XXXX 6721',
    farmSize: '4.2 acres',
    fmbZones: '5 zones marked',
    primaryCrops: 'Pepper, Banana, Cardamom',
    dayCountText: 'Review 3-5 day working days timeline applies — this application is on day 1 of 5.',
  },
];

interface Props {
  onBack: () => void;
  onSelectApplication: (item: PendingApplicationItem) => void;
}

const FILTER_PILLS = [
  { id: 'ALL', label: 'All (9)' },
  { id: 'DOCS', label: 'Docs Complete (6)' },
  { id: 'KYC', label: 'Awaiting KYC (3)' },
  { id: 'OOTY', label: 'Ooty' },
  { id: 'KOTAGIRI', label: 'Kotagiri' },
  { id: 'COONOOR', label: 'Coonoor' },
];

export const AdminPendingApplicationsScreen: React.FC<Props> = ({
  onBack,
  onSelectApplication,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(260);
  const filterScrollRef = useRef<ScrollView>(null);

  const filteredApps = DEMO_PENDING_APPLICATIONS.filter((app) => {
    if (selectedFilter === 'DOCS' && app.badgeType !== 'green') return false;
    if (selectedFilter === 'KYC' && app.badgeType !== 'amber') return false;
    if (selectedFilter === 'OOTY' && !app.location.includes('Ooty')) return false;
    if (selectedFilter === 'KOTAGIRI' && !app.location.includes('Kotagiri')) return false;
    if (selectedFilter === 'COONOOR' && !app.location.includes('Coonoor')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header with circular back button */}
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Subtitle */}
        <Text style={styles.title}>Pending Applications</Text>
        <Text style={styles.subtitle}>
          9 farmer applications awaiting review · sorted oldest first per the 3-5 day review window
        </Text>

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
            placeholder="Search by name or location"
            placeholderTextColor={P.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Horizontal scroll filter chips with Ooty, Kotagiri, Coonoor */}
        <ScrollView
          ref={filterScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const maxOffset = contentSize.width - layoutMeasurement.width;
            if (maxOffset > 0) {
              setScrollProgress(Math.min(1, Math.max(0, contentOffset.x / maxOffset)));
            }
          }}
          scrollEventThrottle={16}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = selectedFilter === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                onPress={() => setSelectedFilter(pill.id)}
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
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Visual Custom Scroll Bar with left and right triangles */}
        <View style={styles.scrollBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              filterScrollRef.current?.scrollTo({ x: 0, animated: true });
            }}
          >
            <Text style={styles.scrollArrow}>◀</Text>
          </TouchableOpacity>
          <View
            style={styles.scrollTrack}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          >
            <View
              style={[
                styles.scrollThumb,
                {
                  width: trackWidth * 0.65,
                  transform: [
                    {
                      translateX: scrollProgress * (trackWidth * 0.35),
                    },
                  ],
                },
              ]}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              filterScrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <Text style={styles.scrollArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Application Cards */}
        <View style={styles.listSection}>
          {filteredApps.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onSelectApplication(item)}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={styles.locationRow}>
                  <Image source={pinIconAsset} style={styles.pinImage} resizeMode="contain" />
                  <Text style={styles.locationText}>
                    {item.location} · {item.appliedTime}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.badge,
                  item.badgeType === 'green' && styles.badgeGreen,
                  item.badgeType === 'amber' && styles.badgeAmber,
                  item.badgeType === 'red' && styles.badgeRed,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.badgeType === 'green' && styles.badgeTextGreen,
                    item.badgeType === 'amber' && styles.badgeTextAmber,
                    item.badgeType === 'red' && styles.badgeTextRed,
                  ]}
                >
                  {item.badgeLabel}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dashed info bottom container */}
        <View style={styles.dashedFooter}>
          <Text style={styles.dashedFooterText}>
            5 more applications below — scroll to review all 9.
          </Text>
        </View>

        <View style={{ height: 36 }} />
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
    paddingTop: 14,
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
    elevation: 1,
    cursor: 'pointer' as any,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#602208',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#7A6F68',
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
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 12,
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
  scrollBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  scrollArrow: {
    fontSize: 9,
    color: '#78736E',
    marginHorizontal: 5,
    cursor: 'pointer' as any,
  },
  scrollTrack: {
    flex: 1,
    height: 7,
    backgroundColor: 'transparent',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollThumb: {
    position: 'absolute',
    top: 0,
    height: 7,
    backgroundColor: '#7C756F',
    borderRadius: 4,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: P.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.titleBrown,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinImage: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: P.textSecondary,
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeGreen: {
    backgroundColor: P.statusGreenBg,
  },
  badgeAmber: {
    backgroundColor: P.statusAmberBg,
  },
  badgeRed: {
    backgroundColor: P.statusRedBg,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: P.statusGreenText,
  },
  badgeTextAmber: {
    color: P.statusAmberText,
  },
  badgeTextRed: {
    color: P.statusRedText,
  },
  dashedFooter: {
    marginTop: 16,
    borderWidth: 1.2,
    borderColor: P.dashedBorder,
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dashedFooterText: {
    fontSize: 14,
    color: '#5C554F',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
});
