import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { AuditSummaryDto } from '../../api/audits';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { useAuditCompliance, useAuditList } from './useAuditsData';

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
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
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

function ChevronIcon({ isOpen }: { isOpen?: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      {isOpen ? (
        <Path d="M18 15l-6-6-6 6" stroke={adminColors.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M6 9l6 6 6-6" stroke={adminColors.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
  can?: Can | undefined;
  onBack: () => void;
  onSelectAudit?: ((audit: HistoryAuditItem) => void) | undefined;
  /**
   * Not wired yet: there is no corrective-actions endpoint, so the screen has
   * no CorrectiveActionItem to pass. Kept so the navigation contract does not
   * change when that read exists; the card is non-interactive until then.
   */
  onSelectCorrectiveAction?: ((action: CorrectiveActionItem) => void) | undefined;
}

const AUDIT_TYPE_OPTIONS = ['All', 'Internal', 'External'];

export function AuditHistoryComplianceScreen({
  can,
  onBack,
  onSelectAudit,
}: AuditHistoryComplianceScreenProps): React.JSX.Element {
  const canView = can ? can('audit.view') : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'auditType' | null>(null);

  // Filters State
  const [selectedAuditType, setSelectedAuditType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  // Live queries: only if canView is permitted
  const { data: compliance } = useAuditCompliance({});
  const auditListQuery = useAuditList(
    { status: ['COMPLETED'] },
    { enabled: canView },
  );

  const completedAudits: AuditSummaryDto[] = canView ? auditListQuery.items : [];

  const auditItems: HistoryAuditItem[] = useMemo(() => {
    if (!canView || completedAudits.length === 0) return [];
    return completedAudits.map((item) => {
      const isRedFlag = item.redFlagged;
      const findingsText = item.findingCounts
        ? `${item.findingCounts.major} major, ${item.findingCounts.minor} minor`
        : '—';
      const scoreText = item.totalScore !== null && item.totalScore !== undefined
        ? `Score ${item.totalScore}/100`
        : 'Score —';
      const tierText = item.tier ? `Tier ${item.tier}` : 'Tier not calculated';
      const scheduledDate = item.scheduledFor ? item.scheduledFor.split('T')[0] ?? item.scheduledFor : '—';

      return {
        id: item.id,
        code: item.id,
        farmerName: item.farmerName ?? '—',
        badge: isRedFlag ? ('Red flag' as const) : ('Completed' as const),
        auditType: item.auditType === 'INTERNAL' ? 'Internal' : 'External',
        date: scheduledDate,
        score: scoreText,
        findings: findingsText,
        tier: tierText,
      };
    });
  }, [canView, completedAudits]);

  const filteredAudits = useMemo(() => {
    return auditItems.filter((item) => {
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
  }, [auditItems, selectedAuditType, searchQuery]);

  const completedCount = compliance?.counts?.compliant !== undefined
    ? String(compliance.counts.compliant)
    : canView && completedAudits.length > 0
      ? String(completedAudits.length)
      : '—';

  const redFlaggedCount = compliance?.counts?.redFlaggedAudits !== undefined
    ? String(compliance.counts.redFlaggedAudits)
    : '—';

  const handleResetFilters = () => {
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
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
        <Text style={styles.countSubtitle}>
          {completedCount} completed · {redFlaggedCount} red-flagged
        </Text>

        {/* ── Audits List ── */}
        <View style={styles.auditsList}>
          {filteredAudits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>—</Text>
            </View>
          ) : (
            filteredAudits.map((item) => {
              const isRedFlag = item.badge === 'Red flag';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.auditCard, isRedFlag && styles.auditCardRedBorder]}
                  onPress={() => {
                    if (onSelectAudit) onSelectAudit(item);
                  }}
                  disabled={!onSelectAudit}
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
            })
          )}
        </View>

        {/* ── Corrective Actions Section Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>Corrective actions</Text>
        <View style={styles.correctiveActionsList}>
          {/*
            There is no corrective-actions endpoint yet, so there is no
            CorrectiveActionItem to hand `onSelectCorrectiveAction`. The card
            stays a plain View — a tappable row with nothing behind it would
            promise a detail screen the data cannot fill.
          */}
          <View style={styles.correctiveActionCard}>
            <Text style={styles.correctiveActionTitle}>—</Text>
            <View style={styles.badgePillWarning}>
              <Text style={styles.badgeTextWarning}>—</Text>
            </View>
          </View>
        </View>

        {/* ── Red Flag Section Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>Red flag</Text>
        <View style={styles.redFlagCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Status</Text>
            <Text style={compliance?.counts?.redFlaggedAudits ? styles.statusFlaggedText : styles.tableValue}>
              {compliance?.counts?.redFlaggedAudits ? 'Flagged' : '—'}
            </Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Set by</Text>
            <Text style={styles.tableValue}>—</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Reason</Text>
            <Text style={styles.tableValue}>—</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Filters Popup Modal ── */}
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
              {/* Field: Audit Type */}
              <Text style={styles.fieldLabel}>Audit Type</Text>
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

              {/* Field: Date Range */}
              <Text style={styles.fieldLabel}>Date Range (From / To)</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <CalendarIcon />
              </View>

              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateTo}
                  onChangeText={setDateTo}
                />
                <CalendarIcon />
              </View>

              {/* Field: Score Range */}
              <Text style={styles.fieldLabel}>Score Range (Min / Max)</Text>
              <View style={styles.modalButtonsRow}>
                <TextInput
                  style={[styles.numericInput, styles.halfFlex]}
                  placeholder="Min"
                  placeholderTextColor={adminColors.placeholder}
                  keyboardType="numeric"
                  value={minScore}
                  onChangeText={setMinScore}
                />
                <TextInput
                  style={[styles.numericInput, styles.halfFlex]}
                  placeholder="Max"
                  placeholderTextColor={adminColors.placeholder}
                  keyboardType="numeric"
                  value={maxScore}
                  onChangeText={setMaxScore}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
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
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
  },
  headerFilterBtn: {
    width: 36,
    height: 36,
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
  },
  countSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  auditsList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  emptyContainer: {
    padding: adminSpacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
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
    marginBottom: 4,
  },
  auditCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgePillGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgePillRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeText: {
    ...adminType.caption,
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  auditCardSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  correctiveActionsList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  correctiveActionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  correctiveActionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  badgePillWarning: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeTextWarning: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
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
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statusFlaggedText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },
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
    backgroundColor: adminColors.brandTint,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownItemTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
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
    color: adminColors.ink,
  },
  halfFlex: {
    flex: 1,
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
    color: adminColors.ink,
  },
});
