import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { AdminConfirmDialog } from '../../components/AdminConfirmDialog';
import type { Can } from '../../permissions/can';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

function ArrowRightIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RadioCircleIcon({ selected }: { selected: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={9.5} stroke={selected ? adminColors.brand : '#D1C7BD'} strokeWidth={2} />
      {selected ? <Circle cx={11} cy={11} r={5.5} fill={adminColors.brand} /> : null}
    </Svg>
  );
}

function ExcelFileIcon({ size = 32, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.8" />
      <Path d="M14 2v6h6M8 13l3 4M11 13l-3 4M13 13h3M13 17h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CsvFileIcon({ size = 32, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.8" />
      <Path d="M14 2v6h6M8 15h2M8 12h3M8 18h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PdfFileIcon({ size = 32, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.8" />
      <Path d="M14 2v6h6M9 13h2a1.5 1.5 0 010 3H9v-3zM14 13v4M14 15h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ReadyCheckIcon({ size = 56, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={adminColors.success.bg} stroke={color} strokeWidth="2" />
      <Path d="M7 12.5l3.5 3.5 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Interfaces & Data ──────────────────────────────────────────────────────

export interface AuditReportExportWizardScreenProps {
  onBack: () => void;
  onFinishExport?: (() => void) | undefined;
  initialReportName?: string | undefined;
  role?: string | undefined;
  can?: Can | undefined;
}

const AUDIT_EXPORT_REPORTS = [
  'Audit Summary Report',
  'Farmer Audit History',
  'Quarterly Coverage',
  'Findings & Violations',
  'Compliance Summary',
  'Full Audit Dataset',
];

/**
 * AuditReportExportWizardScreen
 *
 * Professional 5-step report export wizard:
 * - Proper layout spacing, without dot clipping
 * - Admin theme (adminColors, adminRadius, adminSpacing, adminType)
 * - Fixed bottom action bar (Back / Next / Generate Export)
 * - RBAC permission check: can('report.export.file')
 * - Step 1: Select Report
 * - Step 2: Select Period
 * - Step 3: Filters
 * - Step 4: File Format
 * - Step 5: Report Preview & Generation
 */
export function AuditReportExportWizardScreen({
  onBack,
  onFinishExport,
  initialReportName = 'Audit Summary Report',
  role: _role = 'SUPER_ADMIN',
  can,
}: AuditReportExportWizardScreenProps): React.JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 'generating' | 'ready'>(1);
  const [selectedReport, setSelectedReport] = useState<string>(initialReportName);
  const [period, setPeriod] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('This Month');
  const [selectedZone, setSelectedZone] = useState<'All' | 'Coonoor' | 'Ooty' | 'Kotagiri'>('All');
  const [selectedType, setSelectedType] = useState<'All' | 'Internal' | 'External'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Completed' | 'Pending' | 'Scheduled'>('All');
  const [format, setFormat] = useState<'Excel' | 'CSV' | 'PDF'>('Excel');

  // RBAC check: does user hold report export grant?
  const canExportFile = can ? (can('report.export.file') || can('audit.tier.configure_thresholds')) : true;

  useEffect(() => {
    if (step === 'generating') {
      const timer = setTimeout(() => {
        setStep('ready');
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const [dialogState, setDialogState] = useState<{
    title: string;
    message: string;
    variant?: 'brand' | 'success' | 'danger';
  } | null>(null);

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5) {
      if (!canExportFile) {
        setDialogState({
          title: 'Permission Denied',
          message: 'Your account does not have permission to generate export files.',
          variant: 'danger',
        });
        return;
      }
      setStep('generating');
    }
  };

  const handleBack = () => {
    if (step === 1) onBack();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(4);
    else if (step === 'ready') onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Export Audit Report
          </Text>
        </View>
      </View>

      {/* ─── Dedicated Step Indicator Sub-header (No Clipping, Clean Spacing) ─── */}
      {typeof step === 'number' && (
        <View style={styles.stepProgressContainer}>
          <View style={styles.stepDotsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step >= s && styles.stepDotActive,
                  step === s && styles.stepDotCurrent,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* ─── Generating State Screen ─── */}
      {step === 'generating' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={adminColors.brand} />
          <Text style={styles.generatingTitle}>Generating Audit Export...</Text>
          <Text style={styles.generatingSubtitle}>
            Compiling audit scores, category records, and findings summary.
          </Text>
        </View>
      )}

      {/* ─── Ready / Downloaded Screen ─── */}
      {step === 'ready' && (
        <View style={styles.centerContainer}>
          <ReadyCheckIcon />
          <Text style={styles.readyTitle}>Export Ready for Download</Text>
          <Text style={styles.readySubtitle}>
            Your {selectedReport} has been generated successfully in {format} format.
          </Text>

          <View style={styles.fileCard}>
            <Text style={styles.fileName}>
              {selectedReport.replace(/\s+/g, '-')}-2026-10-25.{format === 'Excel' ? 'xlsx' : format.toLowerCase()}
            </Text>
            <Text style={styles.fileSize}>42 audit records · 84 KB</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setDialogState({
                title: 'Download Started',
                message: `Downloading ${selectedReport} (${format})...`,
                variant: 'brand',
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Download File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={onFinishExport || onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>View in Report History</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Wizard Steps 1 to 5 Content ─── */}
      {typeof step === 'number' && (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP 1: Select Report */}
            {step === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeaderTitle}>Step 1 — Select Audit Report</Text>
                <Text style={styles.stepHeaderSub}>
                  Choose the audit dataset you wish to export.
                </Text>

                <View style={styles.card}>
                  {AUDIT_EXPORT_REPORTS.map((rep, idx) => {
                    const isSelected = selectedReport === rep;
                    return (
                      <TouchableOpacity
                        key={rep}
                        style={[
                          styles.optionRow,
                          idx === AUDIT_EXPORT_REPORTS.length - 1 && styles.optionRowLast,
                        ]}
                        onPress={() => setSelectedReport(rep)}
                        activeOpacity={0.7}
                      >
                        <RadioCircleIcon selected={isSelected} />
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {rep}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 2: Select Period */}
            {step === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeaderTitle}>Step 2 — Select Period</Text>
                <Text style={styles.stepHeaderSub}>
                  Filter records by audit date range.
                </Text>

                <View style={styles.periodRow}>
                  <View style={styles.periodCol}>
                    <View style={styles.periodHeaderRow}>
                      <Text style={styles.periodLabel}>From</Text>
                      <CalendarIcon size={16} color={adminColors.brand} />
                    </View>
                    <Text style={styles.periodDateText}>01 Sep 2026</Text>
                  </View>
                  <View style={styles.periodCol}>
                    <View style={styles.periodHeaderRow}>
                      <Text style={styles.periodLabel}>To</Text>
                      <CalendarIcon size={16} color={adminColors.brand} />
                    </View>
                    <Text style={styles.periodDateText}>25 Oct 2026</Text>
                  </View>
                </View>

                <Text style={styles.filterSectionTitle}>Quick Select</Text>
                <View style={styles.filterChipRow}>
                  {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((p) => {
                    const isSelected = period === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setPeriod(p)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 3: Filters */}
            {step === 3 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeaderTitle}>Step 3 — Filters</Text>
                <Text style={styles.stepHeaderSub}>
                  Narrow down by farm zone, audit type, and status.
                </Text>

                {/* Zone Filter */}
                <Text style={styles.filterSectionTitle}>Zone</Text>
                <View style={styles.filterChipRow}>
                  {(['All', 'Coonoor', 'Ooty', 'Kotagiri'] as const).map((z) => {
                    const isSelected = selectedZone === z;
                    return (
                      <TouchableOpacity
                        key={z}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setSelectedZone(z)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {z}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Audit Type Filter */}
                <Text style={[styles.filterSectionTitle, { marginTop: 18 }]}>Audit Type</Text>
                <View style={styles.filterChipRow}>
                  {(['All', 'Internal', 'External'] as const).map((t) => {
                    const isSelected = selectedType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setSelectedType(t)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Status Filter */}
                <Text style={[styles.filterSectionTitle, { marginTop: 18 }]}>Status</Text>
                <View style={styles.filterChipRow}>
                  {(['All', 'Completed', 'Pending', 'Scheduled'] as const).map((st) => {
                    const isSelected = selectedStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setSelectedStatus(st)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 4: File Format */}
            {step === 4 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeaderTitle}>Step 4 — File Format</Text>
                <Text style={styles.stepHeaderSub}>
                  Select the export file format.
                </Text>

                <View style={styles.formatRow}>
                  {(['Excel', 'CSV', 'PDF'] as const).map((fmt) => {
                    const isSelected = format === fmt;
                    return (
                      <TouchableOpacity
                        key={fmt}
                        style={[styles.formatCard, isSelected && styles.formatCardActive]}
                        onPress={() => setFormat(fmt)}
                        activeOpacity={0.75}
                      >
                        {fmt === 'Excel' && (
                          <ExcelFileIcon size={32} color={isSelected ? adminColors.brand : adminColors.brandDeep} />
                        )}
                        {fmt === 'CSV' && (
                          <CsvFileIcon size={32} color={isSelected ? adminColors.brand : adminColors.brandDeep} />
                        )}
                        {fmt === 'PDF' && (
                          <PdfFileIcon size={32} color={isSelected ? adminColors.brand : adminColors.brandDeep} />
                        )}
                        <Text style={[styles.formatName, isSelected && styles.formatNameActive]}>
                          {fmt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 5: Report Preview */}
            {step === 5 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeaderTitle}>Step 5 — Report Preview</Text>
                <Text style={styles.stepHeaderSub}>
                  Verify parameters before generating the final export.
                </Text>

                {/* Summary Card */}
                <View style={styles.card}>
                  <View style={styles.previewGridRow}>
                    <View style={styles.previewGridCol}>
                      <Text style={styles.metricLabel}>Report</Text>
                      <Text style={styles.metricValueBold}>{selectedReport}</Text>
                    </View>
                    <View style={styles.previewGridCol}>
                      <Text style={styles.metricLabel}>Zone / Scope</Text>
                      <Text style={styles.metricValueBold}>{selectedZone === 'All' ? 'All Zones' : selectedZone}</Text>
                    </View>
                  </View>

                  <View style={[styles.previewGridRow, { marginTop: 14 }]}>
                    <View style={styles.previewGridCol}>
                      <Text style={styles.metricLabel}>Period</Text>
                      <Text style={styles.metricValueBold}>01 Sep – 25 Oct 2026</Text>
                    </View>
                    <View style={styles.previewGridCol}>
                      <Text style={styles.metricLabel}>Format</Text>
                      <Text style={styles.metricValueBold}>{format}</Text>
                    </View>
                  </View>
                </View>

                {/* Preview Metrics Card */}
                <Text style={[styles.filterSectionTitle, { marginTop: 18, marginBottom: 8 }]}>
                  Preview Metrics
                </Text>
                <View style={styles.card}>
                  <View style={styles.metricLine}>
                    <Text style={styles.metricLabel}>Total Audits</Text>
                    <Text style={styles.metricValueBold}>42</Text>
                  </View>
                  <View style={styles.metricLine}>
                    <Text style={styles.metricLabel}>Completed Audits</Text>
                    <Text style={styles.metricValueBold}>32</Text>
                  </View>
                  <View style={styles.metricLine}>
                    <Text style={styles.metricLabel}>Average Score</Text>
                    <Text style={styles.metricValueBold}>86.7 / 100</Text>
                  </View>
                  <View style={styles.metricLine}>
                    <Text style={styles.metricLabel}>Findings & Violations</Text>
                    <Text style={styles.metricValueBold}>36 Major, 25 Minor</Text>
                  </View>
                  <View style={[styles.metricLine, { borderBottomWidth: 0 }]}>
                    <Text style={styles.metricLabel}>Missing Coverage</Text>
                    <Text style={styles.metricValueBold}>4 farmer-quarters</Text>
                  </View>
                </View>

                {/* RBAC notice if needed */}
                {!canExportFile && (
                  <View style={styles.rbacNoticeBox}>
                    <Text style={styles.rbacNoticeText}>
                      View-only access: your role has permissions to preview this export config, but export file generation is restricted.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* ─── Fixed Bottom Actions Bar ─── */}
          <View style={styles.bottomBar}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.navBackBtn}
                onPress={handleBack}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Go back to previous step"
              >
                <Text style={styles.navBackBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.navNextBtn,
                step === 1 && { flex: 1 },
                !canExportFile && step === 5 && styles.btnDisabled,
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={step === 5 ? 'Generate Export' : 'Next step'}
            >
              <Text style={styles.navNextBtnText}>
                {step === 5 ? 'Generate Export' : 'Next'}
              </Text>
              {step < 5 && <ArrowRightIcon size={18} color={adminColors.onBrand} />}
            </TouchableOpacity>
          </View>
        </>
      )}

      <AdminConfirmDialog
        visible={dialogState !== null}
        title={dialogState?.title ?? ''}
        message={dialogState?.message ?? ''}
        confirmLabel="OK"
        hideCancel
        destructive={dialogState?.variant === 'danger'}
        variant={dialogState?.variant}
        onConfirm={() => setDialogState(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived from Admin Theme ─────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '700',
  },

  // Dedicated Step Indicator Bar (Fixed below header, avoids any clipping)
  stepProgressContainer: {
    backgroundColor: adminColors.canvas,
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8D1C9',
  },
  stepDotActive: {
    backgroundColor: adminColors.brand,
  },
  stepDotCurrent: {
    backgroundColor: adminColors.brand,
    width: 24,
    borderRadius: 4,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 16,
    paddingBottom: 110, // Generous spacing so content never collides with fixed bottom bar
  },
  stepSection: {
    width: '100%',
  },
  stepHeaderTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepHeaderSub: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13.5,
    marginBottom: 16,
    lineHeight: 19,
  },

  // Card Structure
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    ...adminShadow.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEA',
  },
  optionRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 10,
  },
  optionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14.5,
    marginLeft: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Step 2: Period Controls
  periodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  periodCol: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    ...adminShadow.sm,
  },
  periodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  periodLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  periodDateText: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '700',
  },

  // Filter Chips
  filterSectionTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: '#D8D1C9',
    backgroundColor: adminColors.card,
  },
  filterChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Step 4: Format Cards
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EDE7E1',
    ...adminShadow.sm,
  },
  formatCardActive: {
    borderColor: adminColors.brand,
    backgroundColor: '#FFF8F4',
  },
  formatName: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 10,
  },
  formatNameActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Step 5: Preview
  previewGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewGridCol: {
    flex: 1,
  },
  metricLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12.5,
    marginBottom: 4,
  },
  metricValueBold: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  metricLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEA',
  },
  rbacNoticeBox: {
    backgroundColor: '#FFF8ED',
    borderRadius: adminRadius.md,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FEE0B6',
  },
  rbacNoticeText: {
    ...adminType.caption,
    color: '#B45309',
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Fixed Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: '#EBE5DE',
    ...adminShadow.sm,
  },
  navBackBtn: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: '#D8D1C9',
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackBtnText: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  navNextBtn: {
    flex: 2,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...adminShadow.sm,
  },
  navNextBtnText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Generating & Ready States
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: adminSpacing.xl,
  },
  generatingTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
  },
  generatingSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  readyTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 18,
  },
  readySubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  fileCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: 24,
  },
  fileName: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  fileSize: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...adminShadow.sm,
  },
  primaryBtnText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
  },
  outlineBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#D8D1C9',
    borderRadius: adminRadius.md,
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
