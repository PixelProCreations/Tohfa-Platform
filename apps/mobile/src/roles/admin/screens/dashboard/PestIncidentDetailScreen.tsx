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
import { IncidentItem, SAMPLE_INCIDENTS } from './FarmerPestIncidentsScreen';

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

  // Accent & Action
  orangeBtn: adminColors.brand,
  ongoingBlue: '#0284C7',
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

function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
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

export interface PestIncidentDetailScreenProps {
  incident?: IncidentItem | undefined;
  onBack: () => void;
  onViewPest?: () => void;
  onViewApplicationGuide?: () => void;
}

export function PestIncidentDetailScreen({
  incident,
  onBack,
  onViewPest,
  onViewApplicationGuide,
}: PestIncidentDetailScreenProps) {
  const item: IncidentItem = incident ?? SAMPLE_INCIDENTS[0]!;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 4 & 5 ─── */}
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

          <Text style={styles.headerTitle}>Incident Detail</Text>

          <View style={styles.filterBtn}>
            <FilterSlidersIcon size={20} color={THEME.white} />
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          Monitor pest incidents reported by TOHFA farmers
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Farmer (View Farmer button explicitly removed as per instruction) ─── */}
        <Text style={styles.sectionHeading}>Farmer</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{item.farmer}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValue}>{item.farmerId}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farm</Text>
              <Text style={styles.fieldValue}>{item.farm}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Zone</Text>
              <Text style={styles.fieldValue}>{item.zone}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Crop ─── */}
        <Text style={styles.sectionHeading}>Crop</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Crop Name</Text>
              <Text style={styles.fieldValue}>{item.crop}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Variety</Text>
              <Text style={styles.fieldValue}>{item.variety}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farm Zone</Text>
              <Text style={styles.fieldValue}>{item.farmZone}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Crop Stage</Text>
              <Text style={styles.fieldValue}>{item.cropStage}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Pest ─── */}
        <Text style={styles.sectionHeading}>Pest</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Common Name</Text>
              <Text style={styles.fieldValue}>{item.pest}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Scientific Name</Text>
              <Text style={styles.fieldValue}>{item.scientificName}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Severity</Text>
            <Text style={styles.fieldValue}>{item.severity}</Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Symptoms</Text>
            <Text style={styles.fieldValueNormal}>{item.farmerNotes || 'Curling leaves, sticky residue on foliage.'}</Text>
          </View>
        </View>

        {/* Button: View Pest */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onViewPest}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>View Pest</Text>
        </TouchableOpacity>

        {/* ─── 4. Detection ─── */}
        <Text style={styles.sectionHeading}>Detection</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{item.detectedDate}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Location/Zone</Text>
              <Text style={styles.fieldValue}>{item.farmZone}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Farmer Notes</Text>
            <Text style={styles.fieldValueNormal}>{item.farmerNotes}</Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Photos</Text>
            <Text style={styles.fieldValue}>{item.photos}</Text>
          </View>
        </View>

        {/* ─── 5. Treatment ─── */}
        <Text style={styles.sectionHeading}>Treatment</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabelUppercase}>TREATMENT</Text>
          <Text style={styles.fieldValueNormal}>{item.treatmentName}</Text>
        </View>

        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Application Date</Text>
              <Text style={styles.fieldValue}>{item.treatmentDate}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Treatment Status</Text>
              <Text style={styles.fieldValue}>{item.treatmentStatus}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <Text style={styles.fieldValueNormal}>{item.treatmentNotes}</Text>
          </View>
        </View>

        {/* Button: View Application Guide */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onViewApplicationGuide}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>View Application Guide</Text>
        </TouchableOpacity>

        {/* ─── 6. Resolution ─── */}
        <Text style={styles.sectionHeading}>Resolution</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Status</Text>
          <Text style={[styles.fieldValue, { color: THEME.ongoingBlue }]}>
            {item.status}
          </Text>
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
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
  fieldLabel: {
    fontSize: 11,
    color: THEME.labelMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldLabelUppercase: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.labelMuted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  fieldValueNormal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
    lineHeight: 18,
  },

  // Outline Buttons
  outlineBtn: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },

  // Read-only Banner
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
