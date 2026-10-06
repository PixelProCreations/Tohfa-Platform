import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FDF3F0',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  cardBg:             '#FFFFFF',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FileTextIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface ReceivingHistoryItem {
  id: string;
  grnId: string;
  details: string;
  status: 'Accepted' | 'Partial' | 'Rejected';
}

export interface ReceivingHistoryScreenProps {
  onBack?: () => void;
  onSelectRecord?: (grnId: string) => void;
}

export function ReceivingHistoryScreen({
  onBack,
  onSelectRecord,
}: ReceivingHistoryScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Accepted' | 'Partially Accepted' | 'Rejected'>('All');

  const historyItems: ReceivingHistoryItem[] = [
    {
      id: '1',
      grnId: 'GRN-000842',
      details: 'Coonoor · Tomato · 445/480 KG',
      status: 'Partial',
    },
    {
      id: '2',
      grnId: 'GRN-000839',
      details: 'Ooty · Potato · 300/300 KG',
      status: 'Accepted',
    },
    {
      id: '3',
      grnId: 'GRN-000831',
      details: 'Kotagiri · Carrot · 0/150 KG',
      status: 'Rejected',
    },
  ];

  const filteredItems = historyItems.filter((item) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Accepted') return item.status === 'Accepted';
    if (selectedFilter === 'Partially Accepted') return item.status === 'Partial';
    if (selectedFilter === 'Rejected') return item.status === 'Rejected';
    return true;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Image 1 Screen 3) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Receiving History</Text>
        </View>
      </View>

      {/* ─── Horizontal Filter Pills ─── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['All', 'Accepted', 'Partially Accepted', 'Rejected'] as const).map((filter) => {
            const active = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Receiving History Records ─── */}
        {filteredItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.historyCard}
            onPress={() => onSelectRecord && onSelectRecord(item.grnId)}
            activeOpacity={0.8}
          >
            <View style={styles.iconBox}>
              <FileTextIcon size={18} color={PALETTE.primary} />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.grnIdText}>{item.grnId}</Text>
              <Text style={styles.detailsText}>{item.details}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Return Button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.returnBtnText}>Return to Receiving Dashboard →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  filterBar: {
    backgroundColor: PALETTE.pageBg,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterPillActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  historyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.noticeBgOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
  },
  grnIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 100,
    backgroundColor: PALETTE.noticeBgOrange,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  returnBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  returnBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
