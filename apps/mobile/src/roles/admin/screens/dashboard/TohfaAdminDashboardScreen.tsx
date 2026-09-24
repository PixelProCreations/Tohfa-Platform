import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { colors } from '../../../farmer/theme';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#7E2E11', // Deep terracotta heading color
  orange:        '#E85226', // Vibrant signature orange
  pageBg:        '#FAF8F5', // Warm light cream
  cardBg:        '#FFFFFF',
  ink:           '#1A1412', // Near-black text
  labelMuted:    '#6D6761', // Secondary muted text
  border:        '#ECE8E1', // Soft card border
  peachBadge:    '#FDEEE9', // Soft peach pill background
  peachText:     '#943818', // Deep terracotta pill text
  peachIconBg:   '#FDEEE9',
  blueIconBg:    '#EBF3FA',
  blueText:      '#2563EB',
  greenIconBg:   '#EAF5EA',
  greenText:     '#2E7D32',
  amberIconBg:   '#FEF3C7',
  amberText:     '#B45309',
  purpleIconBg:  '#F3E8FF',
  purpleText:    '#7E22CE',
  tabInactive:   '#6D6761',
  tabBorder:     '#EDE8E0',
  checkGreen:    '#0D8253',
};

type TohfaAdminTab = 'Dashboard' | 'Listings' | 'Pricing' | 'Allocations' | 'Profile';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={PALETTE.peachText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonAvatarIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TagPriceIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={PALETTE.orange} />
    </Svg>
  );
}

function ListingsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={PALETTE.blueText} strokeWidth="2" />
      <Path d="M7 8h10M7 12h10M7 16h6" stroke={PALETTE.blueText} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={PALETTE.greenText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={PALETTE.greenText} strokeWidth="2" />
    </Svg>
  );
}

function WarehouseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={PALETTE.amberText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrendingUpIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={PALETTE.checkGreen}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={PALETTE.checkGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={PALETTE.checkGreen} strokeWidth="2" />
      <Path d="M8 12l3 3 6-6" stroke={PALETTE.checkGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.secHeader}>
      <Text style={styles.secTitle}>{title}</Text>
      {subtitle ? <Text style={styles.secSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function StatCard({
  iconBox,
  value,
  label,
  delta,
  deltaPositive = true,
}: {
  iconBox: React.ReactNode;
  value: string;
  label: string;
  delta: string;
  deltaPositive?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        {iconBox}
        <Text style={[styles.statDelta, { color: deltaPositive ? PALETTE.checkGreen : PALETTE.orange }]}>
          {delta}
        </Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export interface TohfaAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
  onSwitchRole?: (role: string) => void;
}

export function TohfaAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onSwitchRole,
}: TohfaAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<TohfaAdminTab>('Dashboard');
  const [user, setUser] = useState<UserMe | null>(null);

  // Mock interactive queue state
  const [listings, setListings] = useState([
    {
      id: 'LST-902',
      farmer: 'K. Ramasamy',
      location: 'Coonoor Valley',
      crop: 'Nilgiris CTC Tea (Leaf Grade A)',
      qty: '2,400 kg',
      askingPrice: 240,
      fairPrice: 245,
      status: 'PENDING',
    },
    {
      id: 'LST-903',
      farmer: 'M. Senthil',
      location: 'Ooty Hills',
      crop: 'Organic Hill Carrots',
      qty: '1,800 kg',
      askingPrice: 39,
      fairPrice: 38,
      status: 'PENDING',
    },
    {
      id: 'LST-904',
      farmer: 'S. Selvaraj',
      location: 'Kotagiri Ridge',
      crop: 'Table Beetroot (Grade A)',
      qty: '3,200 kg',
      askingPrice: 42,
      fairPrice: 42,
      status: 'PENDING',
    },
    {
      id: 'LST-905',
      farmer: 'P. Murugan',
      location: 'Gudalur Lowlands',
      crop: 'Nilgiris Special Garlic',
      qty: '950 kg',
      askingPrice: 175,
      fairPrice: 180,
      status: 'PENDING',
    },
  ]);

  // Fair price rates
  const [prices, setPrices] = useState([
    { id: '1', crop: 'Nilgiris CTC Tea (Grade A)', current: 245, prev: 238, change: '+₹7 (2.9%)', unit: '₹/kg' },
    { id: '2', crop: 'Organic Nilgiris Carrots', current: 38, prev: 35, change: '+₹3 (8.5%)', unit: '₹/kg' },
    { id: '3', crop: 'Table Beetroot (Grade A)', current: 42, prev: 42, change: '0.0%', unit: '₹/kg' },
    { id: '4', crop: 'Hill Garlic (Super Grade)', current: 180, prev: 172, change: '+₹8 (4.6%)', unit: '₹/kg' },
    { id: '5', crop: 'Nilgiris Potatoes (Kufri)', current: 28, prev: 29, change: '-₹1 (-3.4%)', unit: '₹/kg' },
  ]);

  const [priceModalCrop, setPriceModalCrop] = useState<string | null>(null);
  const [newPriceInput, setNewPriceInput] = useState('');

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Tohfa Platform Admin';

  const handleApproveListing = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'APPROVED' } : l))
    );
    Alert.alert('Listing Approved', `Listing #${id} is now active and allocated to B2B/B2C marketplace catalogs.`);
  };

  const handleUpdatePrice = () => {
    if (!priceModalCrop || !newPriceInput) return;
    const num = parseFloat(newPriceInput);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid positive number.');
      return;
    }
    setPrices((prev) =>
      prev.map((p) =>
        p.crop === priceModalCrop
          ? { ...p, prev: p.current, current: num, change: `${num >= p.current ? '+' : ''}${num - p.current} ₹/kg` }
          : p
      )
    );
    Alert.alert('Fair Price Updated', `Updated fair price for ${priceModalCrop} to ₹${num}/kg. Mandi parity recalculation complete.`);
    setPriceModalCrop(null);
    setNewPriceInput('');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.pageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greetSmall}>Platform Operations,</Text>
                <Text style={styles.greetName}>{displayName}</Text>
                <View style={styles.rolePill}>
                  <ShieldIcon />
                  <Text style={styles.rolePillText}>Tohfa Platform Admin</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => setActiveTab('Profile')}
                activeOpacity={0.8}
              >
                <PersonAvatarIcon />
              </TouchableOpacity>
            </View>

            {/* Live Metrics */}
            <SectionHeader title="Market & Platform Overview" subtitle="Real-time Nilgiris produce exchange health" />
            <View style={styles.statsGrid}>
              <StatCard
                iconBox={<View style={[styles.statIconBox, { backgroundColor: PALETTE.peachIconBg }]}><ListingsIcon /></View>}
                value="142"
                label="Active Listings"
                delta="↑ +18 today"
              />
              <StatCard
                iconBox={<View style={[styles.statIconBox, { backgroundColor: PALETTE.amberIconBg }]}><TagPriceIcon /></View>}
                value="18"
                label="Pending Approvals"
                delta="Action req."
                deltaPositive={false}
              />
              <StatCard
                iconBox={<View style={[styles.statIconBox, { backgroundColor: PALETTE.greenIconBg }]}><AllocationsIcon /></View>}
                value="₹245/kg"
                label="Fair Price (Tea)"
                delta="↑ +2.9% index"
              />
              <StatCard
                iconBox={<View style={[styles.statIconBox, { backgroundColor: PALETTE.blueIconBg }]}><WarehouseIcon /></View>}
                value="4 / 4"
                label="Warehouses Active"
                delta="✓ All online"
              />
            </View>

            {/* Quick Actions */}
            <SectionHeader title="Platform Controls" />
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={styles.quickActionTile}
                onPress={() => setActiveTab('Pricing')}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: PALETTE.peachIconBg }]}>
                  <TagPriceIcon />
                </View>
                <Text style={styles.quickActionTitle}>Fair Price Discovery</Text>
                <Text style={styles.quickActionDesc}>Set benchmark rates & mandi parity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionTile}
                onPress={() => setActiveTab('Listings')}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: PALETTE.blueIconBg }]}>
                  <ListingsIcon />
                </View>
                <Text style={styles.quickActionTitle}>Listings Queue (18)</Text>
                <Text style={styles.quickActionDesc}>Approve & grade verify batches</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionTile}
                onPress={() => setActiveTab('Allocations')}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: PALETTE.greenIconBg }]}>
                  <AllocationsIcon />
                </View>
                <Text style={styles.quickActionTitle}>Channel Allocations</Text>
                <Text style={styles.quickActionDesc}>B2B wholesale, retail & export</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionTile}
                onPress={() => setActiveTab('Profile')}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                  <WarehouseIcon />
                </View>
                <Text style={styles.quickActionTitle}>Warehouse Network</Text>
                <Text style={styles.quickActionDesc}>4 Hubs (Ooty, Coonoor, Gudalur, Kotagiri)</Text>
              </TouchableOpacity>
            </View>

            {/* Pending Approvals Spotlight */}
            <SectionHeader title="Urgent: Listings Awaiting Approval" subtitle="Review farmer batch pricing & quality specs" />
            <View style={styles.cardStack}>
              {listings.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.listingCard}>
                  <View style={styles.listingHeader}>
                    <View>
                      <Text style={styles.listingId}>{item.id} • {item.location}</Text>
                      <Text style={styles.listingCrop}>{item.crop}</Text>
                      <Text style={styles.listingFarmer}>Farmer: {item.farmer} • {item.qty}</Text>
                    </View>
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>₹{item.askingPrice}/kg</Text>
                    </View>
                  </View>

                  <View style={styles.listingDivider} />

                  <View style={styles.listingBottom}>
                    <Text style={styles.fairPriceHint}>
                      Fair Price Benchmark: <Text style={{ fontWeight: '700', color: PALETTE.titleRust }}>₹{item.fairPrice}/kg</Text>
                    </Text>
                    {item.status === 'APPROVED' ? (
                      <View style={styles.approvedBadge}>
                        <CheckCircleIcon />
                        <Text style={styles.approvedText}>Approved</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApproveListing(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.approveBtnText}>Approve Batch</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Warehouses Network Snapshot */}
            <SectionHeader title="Regional Warehouse Network" />
            <View style={styles.whGrid}>
              <View style={styles.whCard}>
                <Text style={styles.whCode}>WH-MAIN • OOTY</Text>
                <Text style={styles.whCapacity}>82.4% Full (412 MT)</Text>
                <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '82.4%' }]} /></View>
              </View>
              <View style={styles.whCard}>
                <Text style={styles.whCode}>WH-COON • COONOOR</Text>
                <Text style={styles.whCapacity}>64.0% Full (128 MT)</Text>
                <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '64%' }]} /></View>
              </View>
              <View style={styles.whCard}>
                <Text style={styles.whCode}>WH-GUDL • GUDALUR</Text>
                <Text style={styles.whCapacity}>71.2% Full (142 MT)</Text>
                <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '71.2%' }]} /></View>
              </View>
              <View style={styles.whCard}>
                <Text style={styles.whCode}>WH-KOTA • KOTAGIRI</Text>
                <Text style={styles.whCapacity}>58.0% Full (116 MT)</Text>
                <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '58%' }]} /></View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Listings Queue Tab */}
        {activeTab === 'Listings' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <SectionHeader title="Farmer Listings Review Queue" subtitle="Verify batch quality, minimum guarantee & approve for sale" />
            {listings.map((item) => (
              <View key={item.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingId}>{item.id} • {item.location}</Text>
                    <Text style={styles.listingCrop}>{item.crop}</Text>
                    <Text style={styles.listingFarmer}>Farmer: {item.farmer} • Quantity: {item.qty}</Text>
                  </View>
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>₹{item.askingPrice}/kg</Text>
                  </View>
                </View>

                <View style={styles.listingDivider} />

                <View style={styles.listingBottom}>
                  <Text style={styles.fairPriceHint}>
                    Mandi Parity Benchmark: <Text style={{ fontWeight: '700', color: PALETTE.titleRust }}>₹{item.fairPrice}/kg</Text>
                  </Text>
                  {item.status === 'APPROVED' ? (
                    <View style={styles.approvedBadge}>
                      <CheckCircleIcon />
                      <Text style={styles.approvedText}>Active in Catalog</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApproveListing(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Fair Pricing Tab */}
        {activeTab === 'Pricing' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <SectionHeader title="Daily Fair Price Discovery" subtitle="Minimum guaranteed farmer baseline rates across Nilgiris" />
            
            {prices.map((p) => (
              <View key={p.id} style={styles.priceCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceCropName}>{p.crop}</Text>
                  <Text style={styles.priceTrend}>{p.change} vs yesterday</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.priceAmount}>₹{p.current}<Text style={styles.priceUnit}> /kg</Text></Text>
                  <TouchableOpacity
                    style={styles.editPriceBtn}
                    onPress={() => {
                      setPriceModalCrop(p.crop);
                      setNewPriceInput(String(p.current));
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editPriceText}>Update Rate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Price Edit Modal Inline */}
            {priceModalCrop && (
              <View style={styles.priceModalCard}>
                <Text style={styles.priceModalTitle}>Update Benchmark for {priceModalCrop}</Text>
                <Text style={styles.priceModalSub}>Enter new daily minimum guaranteed price in ₹/kg</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={newPriceInput}
                  onChangeText={setNewPriceInput}
                  placeholder="e.g. 248"
                  placeholderTextColor={PALETTE.labelMuted}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#F0ECE4' }]}
                    onPress={() => setPriceModalCrop(null)}
                  >
                    <Text style={{ color: PALETTE.ink, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: PALETTE.orange }]}
                    onPress={handleUpdatePrice}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Price</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Allocations Tab */}
        {activeTab === 'Allocations' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <SectionHeader title="Channel Demand & Allocations" subtitle="Live multi-channel distribution breakdown" />
            
            <View style={styles.allocationCard}>
              <Text style={styles.allocTitle}>B2B Wholesale Channel</Text>
              <Text style={styles.allocSub}>Institutional Buyers, Hotels, Bulk Packers</Text>
              <View style={styles.allocMetricsRow}>
                <Text style={styles.allocMetricVal}>24.5 MT (45%)</Text>
                <Text style={styles.allocStatusOk}>✓ Optimal Stocking</Text>
              </View>
              <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '45%', backgroundColor: PALETTE.blueText }]} /></View>
            </View>

            <View style={styles.allocationCard}>
              <Text style={styles.allocTitle}>B2C Consumer Direct</Text>
              <Text style={styles.allocSub}>Tohfa Fresh Retail & Subscription Boxes</Text>
              <View style={styles.allocMetricsRow}>
                <Text style={styles.allocMetricVal}>16.2 MT (30%)</Text>
                <Text style={styles.allocStatusOk}>✓ Fast Moving</Text>
              </View>
              <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '30%', backgroundColor: PALETTE.greenText }]} /></View>
            </View>

            <View style={styles.allocationCard}>
              <Text style={styles.allocTitle}>Export & Premium Single-Estate</Text>
              <Text style={styles.allocSub}>Specialty Tea & High-Elevation GI Crops</Text>
              <View style={styles.allocMetricsRow}>
                <Text style={styles.allocMetricVal}>13.5 MT (25%)</Text>
                <Text style={styles.allocStatusOk}>✓ Premium Clearance</Text>
              </View>
              <View style={styles.whBarTrack}><View style={[styles.whBarFill, { width: '25%', backgroundColor: PALETTE.orange }]} /></View>
            </View>
          </ScrollView>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={styles.profileHeaderCard}>
              <View style={styles.bigAvatar}><PersonAvatarIcon /></View>
              <Text style={styles.profName}>{displayName}</Text>
              <Text style={styles.profRole}>Tohfa Platform Operations Administrator</Text>
              <Text style={styles.profEmail}>{user?.email ?? 'admin@tohfa.test'}</Text>
            </View>

            <SectionHeader title="Administrative Account & Session" />
            <View style={styles.cardStack}>
              <TouchableOpacity
                style={styles.signOutCard}
                onPress={async () => {
                  await logout();
                  onSignOut();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutText}>Sign Out of Platform Admin</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Dashboard')}
          activeOpacity={0.7}
        >
          <View style={activeTab === 'Dashboard' ? styles.tabIconActive : null}>
            <ListingsIcon />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && styles.tabLabelActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Listings')}
          activeOpacity={0.7}
        >
          <View style={activeTab === 'Listings' ? styles.tabIconActive : null}>
            <ListingsIcon />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Listings' && styles.tabLabelActive]}>Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Pricing')}
          activeOpacity={0.7}
        >
          <View style={activeTab === 'Pricing' ? styles.tabIconActive : null}>
            <TagPriceIcon />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Pricing' && styles.tabLabelActive]}>Fair Price</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Allocations')}
          activeOpacity={0.7}
        >
          <View style={activeTab === 'Allocations' ? styles.tabIconActive : null}>
            <AllocationsIcon />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Allocations' && styles.tabLabelActive]}>Allocations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Profile')}
          activeOpacity={0.7}
        >
          <View style={activeTab === 'Profile' ? styles.tabIconActive : null}>
            <PersonAvatarIcon />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greetSmall: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    fontWeight: '500',
  },
  greetName: {
    fontSize: 21,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
    marginTop: 1,
    marginBottom: 5,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.peachBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 5,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.peachText,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },
  secHeader: {
    marginTop: 18,
    marginBottom: 10,
  },
  secTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.2,
  },
  secSubtitle: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.3%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDelta: {
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  statLabel: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionTile: {
    width: '48.3%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  quickActionDesc: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 3,
    lineHeight: 14,
  },
  cardStack: {
    gap: 10,
  },
  listingCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listingId: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  listingCrop: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginTop: 2,
  },
  listingFarmer: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: PALETTE.peachBadge,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.peachText,
  },
  listingDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 10,
  },
  listingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fairPriceHint: {
    fontSize: 12,
    color: PALETTE.labelMuted,
  },
  approveBtn: {
    backgroundColor: PALETTE.orange,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PALETTE.greenIconBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  whGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  whCard: {
    width: '48.3%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  whCode: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.titleRust,
  },
  whCapacity: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginVertical: 4,
  },
  whBarTrack: {
    height: 5,
    backgroundColor: '#EFEAE3',
    borderRadius: 3,
    overflow: 'hidden',
  },
  whBarFill: {
    height: '100%',
    backgroundColor: PALETTE.orange,
    borderRadius: 3,
  },
  priceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceCropName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  priceTrend: {
    fontSize: 11,
    color: PALETTE.checkGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.titleRust,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.labelMuted,
  },
  editPriceBtn: {
    marginTop: 4,
  },
  editPriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.orange,
  },
  priceModalCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.orange,
    marginTop: 10,
  },
  priceModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  priceModalSub: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  priceInput: {
    height: 42,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: PALETTE.ink,
    backgroundColor: '#FAF8F5',
  },
  modalBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  allocTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  allocSub: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  allocMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  allocMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.titleRust,
  },
  allocStatusOk: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.checkGreen,
  },
  profileHeaderCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  profRole: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  profEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.titleRust,
    marginTop: 2,
  },
  signOutCard: {
    backgroundColor: '#FDEEE9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8D8CE',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#943818',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.orange,
    fontWeight: '800',
  },
});
