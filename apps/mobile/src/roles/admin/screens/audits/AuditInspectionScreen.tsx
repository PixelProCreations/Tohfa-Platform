import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../api/errors';
import type { AuditDetailDto, RatingCategoryCode } from '../../api/audits';
import { t, type TranslationKey } from '../../i18n';
import { makeCan, type Can } from '../../permissions/can';
import { adminColors, adminType } from '../../theme';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  INSPECTION_STEP_ORDER,
  InspectionStepError,
  SUMMARY_MAX,
  inspectionBlocker,
  stepLabel,
  toScoreInputs,
} from './auditActions';
import type { AuditReportData } from './AuditReportScreen';
import { useAuditDetail, useInspectAudit } from './useAuditsData';

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  orangeLight:   '#FFF0EB',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  divider:       '#F5F1EB',
  warningBg:     '#FFF8EE',
  warningBorder: '#FFE6C2',
  warningText:   '#9A6218',
  scoreBg:       '#F8F5EE',
};

const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type AuditEntry = {
  id?: string;
  farmerName: string;
  farmId: string;
  type?: string;
  day: string;
  month: string;
  year?: string;
  location: string;
  auditorLabel: string;
};

/** docs/rbac.json codes the inspection needs: start + complete, score the categories, log a finding. */
export const AUDIT_INSPECTION_CODES = {
  conduct: 'audit.conduct',
  score: 'audit.score.categories',
  findings: 'audit.findings.log',
} as const;

const FAIL_CLOSED: Can = makeCan([]);

/** Category names are the farmer-rating catalogue's (same 10 seeded rating_categories, BR-06). */
function categoryName(code: RatingCategoryCode): string {
  return t(`farmerDetail.rating.category.${code}` as TranslationKey);
}

// ─── Score Stepper Row ────────────────────────────────────────────────────────
function ScoreRow({
  label,
  score,
  max,
  onChange,
}: {
  label: string;
  /** null = not scored yet (incomplete, never zero, BR-06). */
  score: number | null;
  max: number;
  onChange: (n: number) => void;
}) {
  const atMin = score !== null && score <= 0;
  const atMax = score !== null && score >= max;
  return (
    <View style={s.scoreRow}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={s.scoreName}>{label}</Text>
      </View>
      <View style={s.stepperRow}>
        <TouchableOpacity
          style={[s.stepBtn, atMin && s.stepBtnDisabled]}
          onPress={() => onChange(score === null ? 0 : Math.max(0, score - 1))}
          activeOpacity={0.7}
          disabled={atMin}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={[s.stepBtnText, atMin && s.stepBtnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={s.scoreBubble}>
          <Text style={s.scoreValue}>{score === null ? ADMIN_NO_VALUE : score}</Text>
        </View>

        <TouchableOpacity
          style={[s.stepBtn, atMax && s.stepBtnDisabled]}
          onPress={() => onChange(score === null ? 1 : Math.min(max, score + 1))}
          activeOpacity={0.7}
          disabled={atMax}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={[s.stepBtnText, atMax && s.stepBtnTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen Props ─────────────────────────────────────────────────────────────
export interface AuditInspectionScreenProps {
  entry?: AuditEntry | undefined;
  /** The API id of the audit being inspected; every call goes to this record. */
  auditId?: string | undefined;
  farmerName?: string | undefined;
  farmId?: string | undefined;
  zone?: string | undefined;
  onBack: () => void;
  /** Called only once the server has COMPLETED the audit; the data is the server's, not computed here. */
  onSubmitted?: (data: AuditReportData) => void;
  /** The signed-in admin's permission check; without it every action is refused (fail closed). */
  can?: Can | undefined;
}

/** The report the next screen draws, from the audit the server just completed. */
function reportFromAudit(audit: AuditDetailDto, entry: AuditEntry | undefined, notes: string): AuditReportData {
  return {
    entry: {
      ...(entry ?? { day: '', month: '' }),
      id: audit.id,
      farmerName: audit.farmerName,
      farmId: audit.tohfaFarmerId,
      location: audit.zoneName ?? ADMIN_NO_VALUE,
      auditorLabel: audit.auditType === 'EXTERNAL' ? audit.externalAgencyName ?? ADMIN_NO_VALUE : audit.auditorName ?? ADMIN_NO_VALUE,
      day: entry?.day ?? '',
      month: entry?.month ?? '',
    },
    totalScore: audit.totalScore ?? 0,
    maxScore: audit.maxScore,
    majorViolations: audit.majorViolationsCount,
    ...(audit.tier !== null ? { status: audit.tier } : {}),
    date: formatAdminDay(audit.completedAt ?? audit.scheduledFor),
    notes,
  };
}

export function AuditInspectionScreen({
  entry,
  auditId,
  farmerName,
  farmId,
  zone,
  onBack,
  onSubmitted,
  can = FAIL_CLOSED,
}: AuditInspectionScreenProps) {
  const id = auditId ?? entry?.id;
  const detail = useAuditDetail(id);
  const inspect = useInspectAudit();
  const audit = detail.data;

  const [values, setValues] = useState<Record<string, number | null>>({});
  const [violation, setViolation] = useState(false);
  const [notes, setNotes] = useState('');
  const [blocked, setBlocked] = useState<string | null>(null);
  // Set when the run reached the server far enough to record a finding: it cannot be withdrawn here.
  const [findingLogged, setFindingLogged] = useState(false);

  const canConduct = can(AUDIT_INSPECTION_CODES.conduct);
  const canScore = can(AUDIT_INSPECTION_CODES.score);
  const canLog = can(AUDIT_INSPECTION_CODES.findings);
  const permitted = canConduct && canScore && (!violation || canLog);

  const activeFarmer = audit?.farmerName ?? farmerName ?? entry?.farmerName ?? ADMIN_NO_VALUE;
  const activeFarmId = audit?.tohfaFarmerId ?? farmId ?? entry?.farmId ?? ADMIN_NO_VALUE;
  const activeZone   = audit?.zoneName ?? zone ?? entry?.location ?? ADMIN_NO_VALUE;
  const activeDate   = audit !== undefined ? formatAdminDay(audit.scheduledFor) || ADMIN_NO_VALUE : ADMIN_NO_VALUE;

  // The category list, its order and each maximum are the server's (AuditDetail.categoryScores).
  const categories = audit?.categoryScores ?? [];
  // A score the server already holds (an earlier, interrupted run) is the starting point, never a default.
  const scoreOf = (code: RatingCategoryCode): number | null => {
    if (code in values) return values[code] ?? null;
    return categories.find((c) => c.categoryCode === code)?.score ?? null;
  };
  const current = categories.map((c) => scoreOf(c.categoryCode));
  const scoredSum = current.reduce<number>((a, b) => a + (b ?? 0), 0);
  const maxTotal = categories.reduce((a, c) => a + c.maxScore, 0);

  function handleScore(code: RatingCategoryCode, val: number) {
    setValues((prev) => ({ ...prev, [code]: val }));
    setBlocked(null);
  }

  const failure = inspect.error instanceof InspectionStepError ? inspect.error : null;
  const mutationError = failure !== null ? failure.cause : inspect.error;

  // Success is reported from the COMPLETED audit the server returned, nowhere else.
  function handleSubmit() {
    if (inspect.isPending || audit === undefined || id === undefined || !permitted) return;
    const blocker = inspectionBlocker({ status: audit.status, scores: current, violation, notes });
    if (blocker !== null) {
      setBlocked(t(blocker));
      return;
    }
    setBlocked(null);
    const summary = notes.trim() === '' ? undefined : notes.trim();
    inspect.mutate(
      {
        auditId: id,
        status: audit.status,
        scores: toScoreInputs(categories, Object.fromEntries(categories.map((c) => [c.categoryCode, scoreOf(c.categoryCode)]))),
        summary,
        majorFindingDescription: violation ? notes.trim() : undefined,
      },
      {
        onSuccess: (completed) => onSubmitted?.(reportFromAudit(completed, entry, notes)),
        onError: (err) => {
          if (err instanceof InspectionStepError && err.saved.includes('finding')) setFindingLogged(true);
        },
      },
    );
  }

  const showLoading = id !== undefined && audit === undefined && detail.isPending;
  const showLoadError = audit === undefined && !showLoading && (id === undefined || detail.error !== null);
  const failedTitleKey = 'admin.auditActions.inspection.failedTitle' as const;

  return (
    <SafeAreaView style={s.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Back Button (Standard Rounded-Rectangle) ─── */}
        <TouchableOpacity
          onPress={onBack}
          style={s.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow_back" size={20} color={PALETTE.ink} />
        </TouchableOpacity>

        {/* ─── Page Title & Subtitle ─── */}
        <Text style={s.pageTitle}>Audit Inspection</Text>
        <Text style={s.pageSubtitle}>
          {activeFarmer} · {activeFarmId} · {activeZone} · {activeDate}
        </Text>

        {showLoading ? <AdminLoadingState /> : null}
        {showLoadError ? (
          id === undefined ? (
            <Text style={s.errorText}>{t('admin.auditActions.inspection.noAudit')}</Text>
          ) : (
            <AdminErrorState error={detail.error} onRetry={() => void detail.refetch()} />
          )
        ) : null}

        {/* ─── Criteria Score Card ─── */}
        {audit !== undefined ? (
          <View style={s.scoreCard}>
            <View style={s.scoreCardHeader}>
              <Text style={s.scoreCardTitle}>Compliance Criteria</Text>
              <View style={s.scoreTotalBadge}>
                <Text style={s.scoreTotalBadgeText}>
                  {t('admin.auditActions.inspection.totalBadge', { score: scoredSum, max: maxTotal })}
                </Text>
              </View>
            </View>

            {categories.map((c, i) => (
              <View key={c.categoryCode}>
                <ScoreRow
                  label={categoryName(c.categoryCode)}
                  score={scoreOf(c.categoryCode)}
                  max={c.maxScore}
                  onChange={(v) => handleScore(c.categoryCode, v)}
                />
                {i < categories.length - 1 && <View style={s.scoreDivider} />}
              </View>
            ))}
          </View>
        ) : null}

        {/* ─── Major Violation Toggle Card ─── */}
        <View style={[s.violationCard, violation && s.violationCardActive]}>
          <View style={[s.violationIconWrap, violation && s.violationIconWrapActive]}>
            <Icon name="warning" size={18} color={violation ? '#D9381E' : PALETTE.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.violationLabel}>Major violation found</Text>
            <Text style={s.violationSub}>Flags critical compliance alert</Text>
          </View>
          <Switch
            value={violation}
            onValueChange={(v) => {
              setViolation(v);
              setBlocked(null);
            }}
            disabled={!canLog || findingLogged}
            trackColor={{ false: '#DDD8D2', true: PALETTE.orange }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ─── Findings Notes Input ─── */}
        <Text style={s.fieldLabel}>Findings notes</Text>
        <TextInput
          style={s.notesInput}
          placeholder="Log manual audit observations and notes..."
          placeholderTextColor="#9A8F88"
          value={notes}
          onChangeText={(text) => {
            setNotes(text);
            setBlocked(null);
          }}
          maxLength={SUMMARY_MAX}
          multiline
          textAlignVertical="top"
        />

        <View style={{ height: 16 }} />

        {failure !== null ? (
          <View style={s.warningBox}>
            <Text style={s.warningTitle}>{t(failedTitleKey)}</Text>
            <Text style={s.warningText}>{t(adminErrorKey(mutationError))}</Text>
            <Text style={s.warningText}>
              {t('admin.auditActions.inspection.failedAt', { step: stepLabel(failure.step) })}
            </Text>
            {failure.saved.length > 0 ? (
              <Text style={s.warningText}>
                {t('admin.auditActions.inspection.savedSoFar', {
                  steps: INSPECTION_STEP_ORDER.filter((st) => failure.saved.includes(st))
                    .map((st) => t(`admin.auditActions.inspection.saved.${st}` as TranslationKey))
                    .join(', '),
                })}
              </Text>
            ) : null}
            <Text style={s.warningText}>{t('admin.auditActions.inspection.resumeHint')}</Text>
          </View>
        ) : inspect.error !== null ? (
          <Text style={s.errorText}>{t(adminErrorKey(mutationError))}</Text>
        ) : null}
        {!permitted ? <Text style={s.errorText}>{t('admin.auditActions.inspection.noPermission')}</Text> : null}
        {blocked !== null ? <Text style={s.errorText}>{blocked}</Text> : null}

        {/* ─── Submit CTA Button ─── */}
        <TouchableOpacity
          style={[s.ctaBtn, (inspect.isPending || audit === undefined || !permitted) && s.ctaBtnDisabled]}
          activeOpacity={0.85}
          disabled={inspect.isPending || audit === undefined || !permitted}
          onPress={handleSubmit}
        >
          <Icon name="assignment" size={18} color="#FFFFFF" />
          <Text style={s.ctaBtnLabel}>
            {inspect.isPending ? t('admin.auditActions.inspection.submitting') : 'Submit Inspection'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Back Button
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE8E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 14,
  },

  // Page Titles
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 20,
    lineHeight: 18,
  },

  // Criteria Score Card
  scoreCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    ...CARD_SHADOW,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
    marginBottom: 2,
  },
  scoreCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  scoreTotalBadge: {
    backgroundColor: PALETTE.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreTotalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orange,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  scoreName: {
    fontSize: 14,
    color: PALETTE.ink,
    fontWeight: '600',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },

  // Stepper Controls
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F2EB',
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#FAF8F5',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.ink,
    lineHeight: 20,
  },
  stepBtnTextDisabled: {
    color: '#A09890',
  },
  scoreBubble: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },

  // Violation Card
  violationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    ...CARD_SHADOW,
  },
  violationCardActive: {
    backgroundColor: '#FFF7F5',
    borderColor: '#F8CEBF',
  },
  violationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  violationIconWrapActive: {
    backgroundColor: '#FDECE7',
  },
  violationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  violationSub: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginTop: 1,
  },

  // Findings Notes
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 14,
    color: PALETTE.ink,
    minHeight: 100,
    lineHeight: 20,
    marginBottom: 20,
    ...CARD_SHADOW,
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.orange,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  errorText: {
    ...adminType.body,
    color: adminColors.danger.text,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: PALETTE.warningBg,
    borderColor: PALETTE.warningBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.warningText,
    marginBottom: 6,
  },
  warningText: {
    fontSize: 12.5,
    color: PALETTE.warningText,
    lineHeight: 18,
    marginBottom: 4,
  },
  ctaBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
