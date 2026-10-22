import React, { useState } from 'react';
import {
  Modal,
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
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HorizontalFilterIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top slider bar with vertical pip */}
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bottom slider bar with vertical pip */}
      <Line x1="3.5" y1="16" x2="20.5" y2="16" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="8" y1="12.5" x2="8" y2="19.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 17, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function ChevronIcon({ isOpen, size = 16, color = adminColors.muted }: { isOpen?: boolean; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isOpen ? (
        <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface HistoryAuditItem {
  id: string;
  code: string;
  farmerName: string;
  badge: 'Red flag' | 'Completed';
  auditType: string;
  date: string;
  score: string;
  findings: string;
  tier: string;
}

export interface CorrectiveActionItem {
  id: string;
  code: string;
  fndCode: string;
  badge: string;
}

export interface AuditHistoryComplianceScreenProps {
  onBack: () => void;
  onSelectAudit?: (audit: HistoryAuditItem) => void;
  onSelectCorrectiveAction?: (action: CorrectiveActionItem) => void;
}

const FARMER_OPTIONS = [
  'All',
  'FMR-00124 · Ramesh Kumar',
  'FMR-00131 · Selvi',
  'FMR-00177 · Meena',
  'FMR-00203 · Lakshmi',
  'FMR-00098 · Kumar',
  'FMR-00215 · Arun',
  'FMR-00152 · Vijay',
  'FMR-00221 · Priya',
  'FMR-00104 · Ganesan',
  'FMR-00118 · Kavitha',
  'FMR-00127 · Senthil',
  'FMR-00146 · Sundar',
];

const ZONE_OPTIONS = [
  'All',
  'Ooty',
  'Coonoor',
  'Kotagiri',
  'Gudalur',
];

const AUDIT_TYPE_OPTIONS = [
  'All',
  'Internal',
  'External',
];

export function AuditHistoryComplianceScreen({
  onBack,
  onSelectAudit,
  onSelectCorrectiveAction,
}: AuditHistoryComplianceScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'farmer' | 'zone' | 'auditType' | null>(null);

  // Filters State
  const [selectedFarmer, setSelectedFarmer] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedAuditType, setSelectedAuditType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  // Sample Audit History Data matching Image 5
  const auditList: HistoryAuditItem[] = [
    {
      id: '1',
      code: 'AUD-2026-0038',
      farmerName: 'Kumar',
      badge: 'Red flag',
      auditType: 'Internal',
      date: '2 Sep 2026',
      score: 'Score 68/100',
      findings: '2 major, 3 minor',
      tier: 'Tier not calculated',
    },
    {
      id: '2',
      code: 'AUD-2026-0055',
      farmerName: 'Meena',
      badge: 'Completed',
      auditType: 'Internal',
      date: '24 Sep 2026',
      score: 'Score 90/100',
      findings: '0 major, 1 minor',
      tier: 'Tier not calculated',
    },
  ];

  const correctiveActions: CorrectiveActionItem[] = [
    {
      id: 'ca1',
      code: 'CA-0032',
      fndCode: 'FND-0141',
      badge: 'Evidence Submitted',
    },
  ];

  const filteredAudits = auditList.filter((item) => {
    if (selectedFarmer !== 'All') {
      const farmerNameOnly = selectedFarmer.split('·')[1]?.trim() || selectedFarmer;
      if (!item.farmerName.toLowerCase().includes(farmerNameOnly.toLowerCase())) {
        return false;
      }
    }
    if (selectedAuditType !== 'All' && item.auditType !== selectedAuditType) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.farmerName.toLowerCase().includes(q)
    );
  });

  const handleResetFilters = () => {
    setSelectedFarmer('All');
    setSelectedZone('All');
    setSelectedAuditType('All');
    setDateFrom('');
    setDateTo('');
    setMinScore('');
    setMaxScore('');
    setOpenDropdown(null);
    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 5 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Audit History & Compliance
          </Text>

          <TouchableOpacity
            style={styles.headerFilterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <HorizontalFilterIcon />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar Matching Image 5 ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search audit or farmer"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* ── Subtitle Count ── */}
        <Text style={styles.countSubtitle}>32 completed · 1 red-flagged</Text>

        {/* ── Audits List ── */}
        <View style={styles.auditsList}>
          {filteredAudits.map((item) => {
            const isRedFlag = item.badge === 'Red flag';
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.auditCard, isRedFlag && styles.auditCardRedBorder]}
                onPress={() => onSelectAudit?.(item)}
                activeOpacity={0.75}
              >
                <View style={styles.auditCardTopRow}>
                  <Text style={styles.auditCardTitle}>
                    {item.code} · {item.farmerName}
                  </Text>

                  <View style={[styles.badgePill, isRedFlag ? styles.badgePillRed : styles.badgePillGreen]}>
                    <Text style={[styles.badgeText, isRedFlag ? styles.badgeTextRed : styles.badgeTextGreen]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.auditCardSubtitle}>
                  {item.auditType} · {item.date} · {item.score} · {item.findings} · {item.tier}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Corrective Actions Section Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>Corrective actions</Text>
        <View style={styles.correctiveActionsList}>
          {correctiveActions.map((ca) => (
            <TouchableOpacity
              key={ca.id}
              style={styles.correctiveActionCard}
              onPress={() => onSelectCorrectiveAction?.(ca)}
              activeOpacity={0.75}
            >
              <Text style={styles.correctiveActionTitle}>
                {ca.code} · {ca.fndCode}
              </Text>

              <View style={styles.badgePillWarning}>
                <Text style={styles.badgeTextWarning}>{ca.badge}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Red Flag Section Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>Red flag</Text>
        <View style={styles.redFlagCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Status</Text>
            <Text style={styles.statusFlaggedText}>Flagged</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Set by</Text>
            <Text style={styles.tableValue}>Priya Nair · 3 Sep 2026</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Reason</Text>
            <Text style={styles.tableValue}>Repeated major findings across 2 audits</Text>
          </View>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════════
          FILTERS POPUP MODAL (Image 5 Right)
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
                style={styles.modalCloseBtn}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {/* Field 1: Farmer */}
              <Text style={styles.fieldLabel}>Farmer</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpenDropdown(openDropdown === 'farmer' ? null : 'farmer')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{selectedFarmer}</Text>
                <ChevronIcon isOpen={openDropdown === 'farmer'} />
              </TouchableOpacity>
              {openDropdown === 'farmer' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {FARMER_OPTIONS.map((opt, idx) => {
                      const isSelected = selectedFarmer === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            idx === FARMER_OPTIONS.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setSelectedFarmer(opt);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Field 2: Zone */}
              <Text style={styles.fieldLabel}>Zone</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpenDropdown(openDropdown === 'zone' ? null : 'zone')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{selectedZone}</Text>
                <ChevronIcon isOpen={openDropdown === 'zone'} />
              </TouchableOpacity>
              {openDropdown === 'zone' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {ZONE_OPTIONS.map((opt, idx) => {
                      const isSelected = selectedZone === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            idx === ZONE_OPTIONS.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setSelectedZone(opt);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Field 3: Audit type */}
              <Text style={styles.fieldLabel}>Audit type</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpenDropdown(openDropdown === 'auditType' ? null : 'auditType')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{selectedAuditType}</Text>
                <ChevronIcon isOpen={openDropdown === 'auditType'} />
              </TouchableOpacity>
              {openDropdown === 'auditType' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {AUDIT_TYPE_OPTIONS.map((opt, idx) => {
                      const isSelected = selectedAuditType === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            idx === AUDIT_TYPE_OPTIONS.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setSelectedAuditType(opt);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Field 4: Audit date from */}
              <Text style={styles.fieldLabel}>Audit date from</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <CalendarIcon />
              </View>

              {/* Field 5: Audit date to */}
              <Text style={styles.fieldLabel}>Audit date to</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateTo}
                  onChangeText={setDateTo}
                />
                <CalendarIcon />
              </View>

              {/* Field 6: Minimum score */}
              <Text style={styles.fieldLabel}>Minimum score</Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                value={minScore}
                onChangeText={setMinScore}
              />

              {/* Field 7: Maximum score */}
              <Text style={styles.fieldLabel}>Maximum score</Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                value={maxScore}
                onChangeText={setMaxScore}
              />
            </ScrollView>

            {/* Bottom Modal Actions */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: 6,
  },
  headerFilterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    columnGap: 8,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  searchInput: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
    paddingVertical: 0,
  },
  countSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    marginLeft: 2,
  },

  // Audit Cards
  auditsList: {
    rowGap: 10,
    marginBottom: adminSpacing.lg,
  },
  auditCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  auditCardRedBorder: {
    borderColor: adminColors.danger.text,
  },
  auditCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  auditCardTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  auditCardSubtitle: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    lineHeight: 15,
  },

  // Badges
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
  },
  badgePillRed: {
    backgroundColor: adminColors.danger.bg,
    borderColor: adminColors.danger.text,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgePillGreen: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.text,
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },

  // Section Headings
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },

  // Corrective Actions
  correctiveActionsList: {
    rowGap: 8,
    marginBottom: adminSpacing.lg,
  },
  correctiveActionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  correctiveActionTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgePillWarning: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.text,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeTextWarning: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
  },

  // Red Flag Card
  redFlagCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tableLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statusFlaggedText: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    marginBottom: adminSpacing.md,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
    marginTop: 8,
  },
  dropdownField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.xs,
  },
  dropdownValue: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    marginTop: 2,
    marginBottom: adminSpacing.sm,
    maxHeight: 200,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemActive: {
    backgroundColor: adminColors.muted,
  },
  dropdownItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownItemTextActive: {
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  dateInputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.xs,
  },
  dateInputText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
  },
  numericInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.xs,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 6,
  },
  applyBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
