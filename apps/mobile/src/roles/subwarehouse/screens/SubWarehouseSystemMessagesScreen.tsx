import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#E7E2D6',
  divider:       '#F0ECE3',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
  unreadDot:     '#F0562A',
  iconBoxBg:     '#F4EFEA',
  iconColor:     '#6B7280',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SystemMessageItem {
  id: string;
  type: 'maintenance' | 'update';
  title: string;
  subtitle: string;
  timestamp: string;
  isUnread: boolean;
}

const INITIAL_MESSAGES: SystemMessageItem[] = [
  {
    id: 'MSG-01',
    type: 'maintenance',
    title: 'System Maintenance',
    subtitle: 'Scheduled system maintenance may temporarily affect warehouse operations.',
    timestamp: '25 Sep 2026 · 08:00 PM',
    isUnread: true,
  },
  {
    id: 'MSG-02',
    type: 'update',
    title: 'System Update',
    subtitle: 'A new TOHFA system update is available.',
    timestamp: '24 Sep 2026 · ✓ Read',
    isUnread: false,
  },
];

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

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

function BuildingIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WrenchIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.9 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PhoneUpdateIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 18h.01M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 8v5m-2-2l2 2 2-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h.01M12 6h.01M20 6h.01M4 12h.01M12 12h.01M20 12h.01M4 18h.01M12 18h.01M20 18h.01"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseSystemMessagesScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToHistory?: () => void;
}

export function SubWarehouseSystemMessagesScreen({
  onBack,
  onTabChange,
  onNavigateToHistory,
}: SubWarehouseSystemMessagesScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<SystemMessageItem[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState<SubWHTab>('More');

  const filtered = messages.filter((m) => {
    if (activeFilter === 'Unread' && !m.isUnread) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q);
  });

  const handleBottomTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
    else if (tab === 'Home' && onBack) onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>System Messages</Text>
        </View>

        {/* Facility Pill */}
        <View style={styles.warehousePill}>
          <BuildingIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Chips (All / Unread) ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Unread'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Title, message, reference ID"
            placeholderTextColor="#8A928D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filter', 'Filter messages...')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} />
          </TouchableOpacity>
        </View>

        {/* ─── Messages Card Container ─── */}
        <View style={styles.messagesCard}>
          {filtered.map((item, index) => {
            const isLast = index === filtered.length - 1;
            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.messageRow}
                  onPress={() => {
                    setMessages((prev) =>
                      prev.map((m) => (m.id === item.id ? { ...m, isUnread: false } : m))
                    );
                    Alert.alert(item.title, item.subtitle);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    {item.type === 'maintenance' && <WrenchIcon size={20} />}
                    {item.type === 'update' && <PhoneUpdateIcon size={20} />}
                  </View>

                  <View style={styles.textCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
                  </View>

                  {item.isUnread && <View style={styles.unreadDot} />}
                </TouchableOpacity>

                {!isLast && <View style={styles.itemDivider} />}
              </View>
            );
          })}
        </View>

        {/* ─── Message History Navigation Row ─── */}
        <TouchableOpacity
          style={styles.historyCard}
          onPress={onNavigateToHistory ? onNavigateToHistory : () => Alert.alert('History', 'Opening message archive history...')}
          activeOpacity={0.75}
        >
          <Text style={styles.historyText}>Message History</Text>
          <ChevronRightIcon size={18} />
        </TouchableOpacity>
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  warehousePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  warehousePillText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  messagesCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PALETTE.iconBoxBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
    lineHeight: 16.5,
  },
  itemTimestamp: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textMuted,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.unreadDot,
    marginTop: 6,
  },
  itemDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  historyText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
