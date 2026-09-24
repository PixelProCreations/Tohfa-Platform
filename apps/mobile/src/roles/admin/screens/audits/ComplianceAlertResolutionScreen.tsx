import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:  '#8E3314',
  orange:     '#E85226',
  pageBg:     '#FAF8F5',
  cardBg:     '#FFFFFF',
  ink:        '#1A1412',
  labelMuted: '#6D6761',
  border:     '#EBE7E0',
  divider:    '#F3EFE9',
  greenBg:    '#EAF2E1',
  greenText:  '#2A572D',
  amberBg:    '#FEF3C7',
  amberText:  '#B45309',
  amberBorder:'#FCD34D',
  btnBorder:  '#E2DDD5',
};

export interface ComplianceAlertResolutionScreenProps {
  onBack: () => void;
  onResolved?: () => void;
  onSuccess?: () => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={PALETTE.amberText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkBoxIcon({ checked }: { checked: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {checked ? (
        <>
          <Circle cx="12" cy="12" r="10" fill={PALETTE.greenBg} />
          <Path
            d="M8 12.5l2.5 2.5 5.5-5.5"
            stroke={PALETTE.greenText}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <Circle cx="12" cy="12" r="9.5" stroke="#C4BCB4" strokeWidth="1.8" />
      )}
    </Svg>
  );
}

export function ComplianceAlertResolutionScreen({
  onBack,
  onResolved,
  onSuccess,
}: ComplianceAlertResolutionScreenProps) {
  const [tasks, setTasks] = useState([
    { id: 't1', text: 'Relocate storage bags 50m away from irrigation channel', done: true },
    { id: 't2', text: 'Construct sealed impermeable containment berm', done: true },
    { id: 't3', text: 'Submit soil & water runoff lab verification report', done: false },
    { id: 't4', text: 'Host auditor on-site follow-up inspection', done: false },
  ]);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  const completedCount = tasks.filter((t) => t.done).length;

  function handleSubmitResolution() {
    Alert.alert(
      'Submit CAPA Resolution',
      `Submit corrective documentation (${completedCount}/${tasks.length} actions verified) to Chief Quality Auditor for sign-off?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Resolution',
          onPress: () => {
            Alert.alert(
              'Sign-off Requested',
              'Remediation dossier submitted. The auditor will review the photographic evidence within 24 hours.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    (onSuccess ?? onResolved)?.();
                    onBack();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Compliance Resolution</Text>
        <Text style={styles.pageSubtitle}>
          Corrective Action Plan (CAPA) #TOHFA-CAPA-041
        </Text>

        {/* Urgent Alert Notice */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <WarningTriangleIcon />
            <Text style={styles.alertTitle}>Active Non-Conformity Notice</Text>
          </View>
          <Text style={styles.alertFarmer}>Vijay Anand · Farm #TOHFA-F-00234</Text>
          <Text style={styles.alertIssue}>
            Finding: Proximity of fertilizer storage to natural drainage ditch violated organic buffer
            standards during Q3 inspection.
          </Text>

          <View style={styles.alertStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Severity</Text>
              <Text style={[styles.statVal, { color: PALETTE.amberText }]}>Major Level 2</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Grace Period</Text>
              <Text style={styles.statVal}>11 Days Left</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Auditor</Text>
              <Text style={styles.statVal}>Ravi K.</Text>
            </View>
          </View>
        </View>

        {/* Required Actions Checklist */}
        <Text style={styles.sectionTitle}>Remediation Checklist</Text>
        <View style={styles.tasksCard}>
          {tasks.map((task, idx) => {
            const isLast = idx === tasks.length - 1;

            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskItem, !isLast && styles.taskBorder]}
                onPress={() => toggleTask(task.id)}
                activeOpacity={0.7}
              >
                <CheckmarkBoxIcon checked={task.done} />
                <Text style={[styles.taskText, task.done && styles.taskTextDone]}>
                  {task.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress Bar Summary */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>CAPA Completion Status</Text>
            <Text style={styles.progressPct}>
              {completedCount} of {tasks.length} Completed
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${(completedCount / tasks.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Submit CTA */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmitResolution}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>Submit Remediation Dossier</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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

  // Titles
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 20,
    lineHeight: 18,
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#FFFDF5',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: PALETTE.amberBorder,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.amberText,
  },
  alertFarmer: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  alertIssue: {
    fontSize: 12.5,
    color: PALETTE.labelMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  alertStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F3E8C8',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10.5,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.ink,
  },

  // Checklist
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },
  tasksCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  taskBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  taskText: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  taskTextDone: {
    color: PALETTE.labelMuted,
    textDecorationLine: 'line-through',
  },

  // Progress Card
  progressCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orange,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.divider,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: PALETTE.orange,
    borderRadius: 3,
  },

  // CTA
  submitBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
