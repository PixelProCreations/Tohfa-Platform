import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import type { AuditReportData } from './AuditReportScreen';

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

type CriterionKey =
  | 'Soil Health'
  | 'Water Management'
  | 'Pest & Disease Control'
  | 'Biodiversity'
  | 'Record Keeping'
  | 'Compliance History';

const CRITERIA: CriterionKey[] = [
  'Soil Health',
  'Water Management',
  'Pest & Disease Control',
  'Biodiversity',
  'Record Keeping',
  'Compliance History',
];

const DEFAULT_SCORES: Record<CriterionKey, number> = {
  'Soil Health': 8,
  'Water Management': 7,
  'Pest & Disease Control': 6,
  'Biodiversity': 8,
  'Record Keeping': 7,
  'Compliance History': 8,
};

// ─── Score Stepper Row ────────────────────────────────────────────────────────
function ScoreRow({
  label,
  score,
  onChange,
}: {
  label: string;
  score: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={s.scoreRow}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={s.scoreName}>{label}</Text>
      </View>
      <View style={s.stepperRow}>
        <TouchableOpacity
          style={[s.stepBtn, score <= 1 && s.stepBtnDisabled]}
          onPress={() => onChange(Math.max(1, score - 1))}
          activeOpacity={0.7}
          disabled={score <= 1}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={[s.stepBtnText, score <= 1 && s.stepBtnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={s.scoreBubble}>
          <Text style={s.scoreValue}>{score}</Text>
        </View>

        <TouchableOpacity
          style={[s.stepBtn, score >= 10 && s.stepBtnDisabled]}
          onPress={() => onChange(Math.min(10, score + 1))}
          activeOpacity={0.7}
          disabled={score >= 10}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={[s.stepBtnText, score >= 10 && s.stepBtnTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen Props ─────────────────────────────────────────────────────────────
export interface AuditInspectionScreenProps {
  entry?: AuditEntry | undefined;
  farmerName?: string | undefined;
  farmId?: string | undefined;
  zone?: string | undefined;
  onBack: () => void;
  onSubmitted?: (data: AuditReportData) => void;
}

export function AuditInspectionScreen({
  entry,
  farmerName,
  farmId,
  zone,
  onBack,
  onSubmitted,
}: AuditInspectionScreenProps) {
  const [scores, setScores] = useState<Record<CriterionKey, number>>({ ...DEFAULT_SCORES });
  const [violation, setViolation] = useState(false);
  const [notes, setNotes] = useState('');

  const activeFarmer = farmerName ?? entry?.farmerName ?? 'Vijay Anand';
  const activeFarmId = farmId ?? entry?.farmId ?? '#TOHFA-F-00234';
  const activeZone   = zone ?? entry?.location ?? 'Ooty';

  function handleScore(key: CriterionKey, val: number) {
    setScores((prev) => ({ ...prev, [key]: val }));
  }

  const rawSum = Object.values(scores).reduce((a, b) => a + b, 0);
  const scaledScore = Math.round((rawSum / (CRITERIA.length * 10)) * 1000);

  function handleSubmit() {
    const reportData: AuditReportData = {
      entry: entry ?? {
        id: '1',
        day: '14',
        month: 'Sep',
        farmerName: activeFarmer,
        location: activeZone,
        farmId: activeFarmId,
        auditorLabel: 'Auditor: Ravi K.',
      },
      totalScore: scaledScore,
      maxScore: 1000,
      majorViolations: violation ? 1 : 0,
      status: violation ? 'CRITICAL_ACTION_REQUIRED' : 'COMPLIANT',
      date: '14 Sep 2026',
      notes,
    };
    onSubmitted?.(reportData);
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

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
          {activeFarmer} · {activeFarmId} · {activeZone} · Sep 14, 2026
        </Text>

        {/* ─── Criteria Score Card ─── */}
        <View style={s.scoreCard}>
          <View style={s.scoreCardHeader}>
            <Text style={s.scoreCardTitle}>Compliance Criteria</Text>
            <View style={s.scoreTotalBadge}>
              <Text style={s.scoreTotalBadgeText}>{scaledScore} / 1000 pts</Text>
            </View>
          </View>

          {CRITERIA.map((key, i) => (
            <View key={key}>
              <ScoreRow
                label={key}
                score={scores[key]}
                onChange={(v) => handleScore(key, v)}
              />
              {i < CRITERIA.length - 1 && <View style={s.scoreDivider} />}
            </View>
          ))}
        </View>

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
            onValueChange={setViolation}
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
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        <View style={{ height: 16 }} />

        {/* ─── Submit CTA Button ─── */}
        <TouchableOpacity
          style={s.ctaBtn}
          activeOpacity={0.85}
          onPress={handleSubmit}
        >
          <Icon name="assignment" size={18} color="#FFFFFF" />
          <Text style={s.ctaBtnLabel}>Submit Inspection</Text>
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
  ctaBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
