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

// ─── Design Tokens (#F0562A Brand + Match System Messages) ───────────────────
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
};

export interface HistoryMessageItem {
  id: string;
  type: 'maintenance' | 'update' | 'process' | 'transfer' | 'policy';
  title: string;
  subtitle: string;
  timestamp: string;
  isUnread: boolean;
}

const INITIAL_HISTORY_MESSAGES: HistoryMessageItem[] = [
  {
    id: 'HIST-01',
    type: 'maintenance',
    title: 'System Maintenance',
    subtitle: 'Scheduled system maintenance may temporarily affect warehouse operations.',
    timestamp: '25 Sep 2026 · 08:00 PM',
    isUnread: true,
  },
  {
    id: 'HIST-02',
    type: 'update',
    title: 'System Update',
    subtitle: 'A new TOHFA system update is available.',
    timestamp: '24 Sep 2026 · 09:15 AM',
    isUnread: true,
  },
  {
    id: 'HIST-03',
    type: 'process',
    title: 'New Receiving Process',
    subtitle: 'Updated receiving process guidelines are now available for all warehouse staff.',
    timestamp: '22 Sep 2026 · ✓ Read',
    isUnread: false,
  },
  {
    id: 'HIST-04',
    type: 'transfer',
    title: 'Stock Transfer Notice',
    subtitle: 'New stock transfer request #TR-00412 pending approval.',
    timestamp: '20 Sep 2026 · 02:30 PM · ✓ Read',
    isUnread: false,
  },
  {
    id: 'HIST-05',
    type: 'policy',
    title: 'Policy Update',
    subtitle: 'Warehouse hygiene and pest management SOP revised.',
    timestamp: '18 Sep 2026 · ✓ Read',
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

function DocumentGuidelinesIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TransferNoticeIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldPolicyIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseMessageHistoryScreenProps {
  onBack?: () => void;
}

export function SubWarehouseMessageHistoryScreen({
  onBack,
}: SubWarehouseMessageHistoryScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Read'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<HistoryMessageItem[]>(INITIAL_HISTORY_MESSAGES);

  const filtered = messages.filter((m) => {
    if (activeFilter === 'Unread' && !m.isUnread) return false;
    if (activeFilter === 'Read' && m.isUnread) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q);
  });

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

          <Text style={styles.headerTitle}>Message History</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Input Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search title, message, reference ID"
            placeholderTextColor="#8A928D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filter', 'Filter message history...')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} />
          </TouchableOpacity>
        </View>

        {/* ─── Filter Chips (All / Unread / Read) ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Unread', 'Read'] as const).map((chip) => {
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

        {/* ─── History Messages Card Container ─── */}
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
                    {item.type === 'process' && <DocumentGuidelinesIcon size={20} />}
                    {item.type === 'transfer' && <TransferNoticeIcon size={20} />}
                    {item.type === 'policy' && <ShieldPolicyIcon size={20} />}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textInk,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  messagesCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
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
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  itemSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  itemTimestamp: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '500',
    color: PALETTE.textMuted,
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
});
