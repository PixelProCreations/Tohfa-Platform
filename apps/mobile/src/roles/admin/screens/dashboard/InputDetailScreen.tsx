import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing } from '../../theme';
import { ApprovedInputItem } from './ApprovedInputsScreen';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',

  // Status Badges
  activeBadgeBg: '#DCFCE7',
  activeBadgeText: '#15803D',
  discontinuedBadgeBg: '#475569',
  discontinuedBadgeText: '#FFFFFF',
  neutralPillBg: '#F3F4F6',
  neutralPillText: '#374151',

  // Info Notice
  noticeBg: '#FCEEE2',
  noticeBorder: '#F7DAC3',
  noticeText: '#9C4A1A',
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// Circle Slash Read-only Icon (Exact Material Symbols block)
function BlockCircleIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface InputDetailScreenProps {
  inputItem?: ApprovedInputItem | undefined;
  onBack: () => void;
}

const DEFAULT_ITEM: ApprovedInputItem = {
  id: 'INP-00125',
  name: 'Jeevamirtha',
  code: 'INP-00125',
  category: 'Bio-input',
  subcategory: 'Microbial Culture',
  farmingType: 'Natural Farming',
  status: 'Active',
  approvedDate: '10 Mar 2026',
  manufacturer: 'Farmer-prepared',
  method: 'Soil drench',
  usage: 'As configured',
  frequency: 'As configured',
  crops: ['Carrot', 'Cabbage', 'Beans'],
};

export function InputDetailScreen({
  inputItem = DEFAULT_ITEM,
  onBack,
}: InputDetailScreenProps) {
  const item = inputItem || DEFAULT_ITEM;
  const isActive = item.status === 'Active';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 4 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{item.name}</Text>
        </View>

        {/* Status Row */}
        <View style={styles.headerStatusRow}>
          <Text style={styles.headerStatusLabel}>Status: </Text>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.badgeActive : styles.badgeDiscontinued,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isActive ? styles.badgeTextActive : styles.badgeTextDiscontinued,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Basic Information ─── */}
        <Text style={styles.sectionHeading}>Basic Information</Text>
        <View style={styles.card}>
          {/* Row 1 */}
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Input Name</Text>
              <Text style={styles.fieldValue}>{item.name}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Input Code</Text>
              <Text style={styles.fieldValue}>{item.code}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValue}>{item.category}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Subcategory</Text>
              <Text style={styles.fieldValue}>{item.subcategory}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farming Type</Text>
              <Text style={styles.fieldValue}>{item.farmingType}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{item.status}</Text>
            </View>
          </View>

          {/* Row 4 */}
          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Approved Date</Text>
              <Text style={styles.fieldValue}>{item.approvedDate}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Manufacturer/Source</Text>
              <Text style={styles.fieldValue}>{item.manufacturer}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Usage Information ─── */}
        <Text style={styles.sectionHeading}>Usage Information</Text>
        <View style={styles.card}>
          {/* Row 1 */}
          <View style={styles.colFull}>
            <Text style={styles.fieldLabel}>Application Method</Text>
            <Text style={styles.fieldValue}>{item.method}</Text>
          </View>

          {/* Row 2 */}
          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Recommended Usage</Text>
              <Text style={styles.fieldValue}>{item.usage}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Frequency</Text>
              <Text style={styles.fieldValue}>{item.frequency}</Text>
            </View>
          </View>
        </View>


        {/* ─── 3. Related Crops ─── */}
        <Text style={styles.sectionHeading}>Related Crops</Text>
        <View style={styles.card}>
          <View style={styles.cropsRow}>
            {item.crops.map((crop) => (
              <View key={crop} style={styles.cropPill}>
                <Text style={styles.cropPillText}>{crop}</Text>
              </View>
            ))}
          </View>
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Header
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34,
    marginTop: 4,
  },
  headerStatusLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeActive: {
    backgroundColor: THEME.activeBadgeBg,
  },
  badgeTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.activeBadgeText,
  },
  badgeDiscontinued: {
    backgroundColor: THEME.discontinuedBadgeBg,
  },
  badgeTextDiscontinued: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.discontinuedBadgeText,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Section Heading
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 14,
    marginBottom: 8,
  },

  // Card Structure
  card: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  colFull: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    color: THEME.labelMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },

  // Notice Banner
  noticeBanner: {
    backgroundColor: THEME.noticeBg,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1,
    borderColor: THEME.noticeBorder,
    padding: 14,
    marginTop: 12,
  },
  noticeText: {
    fontSize: 12,
    color: THEME.noticeText,
    lineHeight: 17,
    fontWeight: '600',
  },

  // Related Crops Row
  cropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropPill: {
    backgroundColor: THEME.neutralPillBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cropPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.neutralPillText,
  },

  // Read-only Footer Banner
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 14,
    gap: 10,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 16,
  },
});
