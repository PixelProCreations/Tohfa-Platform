/**
 * The three decision screens' shared look — Approve Application, Reject
 * Application, Request More Info — exactly as the design draws all three
 * (origin/Superadmin-main screens/registration/AdminApplication{Approve,Reject,RequestInfo}Screen.tsx):
 * the 44pt back card, the 26pt brand-deep title, the sub-title, the applicant
 * card (48pt avatar, name, "place · mobile"), the 14pt field labels, the
 * 88pt notes box and the 52pt primary button with its brand-tinted shadow.
 *
 * The applicant card comes from the API by application id, never from the
 * host's item or the design's fixture phone ("+91 98XXX XX412").
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { adminColors, adminRadius, adminShadow, adminSpacing } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { BOX, FS, LH, RAD, SP } from '../designMetrics';
import { orDash } from './applicationLogic';

export interface ApplicantSummary {
  name: string;
  initials: string;
  /** "Ketti · 9876512345"; empty when neither is known. */
  sub: string;
}

export function applicantSummary(app: ApplicationDetailView | undefined): ApplicantSummary {
  const name = orDash(app?.applicant.name);
  const place = app?.applicant.address.village ?? app?.applicant.address.district ?? null;
  const sub = [place, app?.applicant.mobile ?? null].filter((p): p is string => p !== null && p !== '').join(' · ');
  const initials =
    app === undefined || name === ADMIN_NO_VALUE
      ? ADMIN_NO_VALUE
      : name
          .split(/\s+/)
          .map((w) => w.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase();
  return { name, initials, sub };
}

/** The design's applicant card; `children` go under a divider (the Approve screen's verification pill). */
export function ApplicantCard({ summary, children, last = false }: { summary: ApplicantSummary; children?: React.ReactNode; last?: boolean }) {
  return (
    <View style={[decisionStyles.card, last ? decisionStyles.cardTight : null]}>
      <View style={decisionStyles.applicantRow}>
        <View style={decisionStyles.avatarCircle}>
          <Text style={decisionStyles.avatarText}>{summary.initials}</Text>
        </View>
        <View style={decisionStyles.applicantInfo}>
          <Text style={decisionStyles.applicantName}>{summary.name}</Text>
          {summary.sub === '' ? null : <Text style={decisionStyles.applicantSub}>{summary.sub}</Text>}
        </View>
      </View>
      {children === undefined ? null : (
        <>
          <View style={decisionStyles.cardDivider} />
          {children}
        </>
      )}
    </View>
  );
}

export const decisionStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: { paddingHorizontal: SP.s20, paddingTop: SP.s12, paddingBottom: SP.s6 },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: SP.s20, paddingTop: SP.s12 },
  title: {
    fontSize: FS.s26,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: SP.s4,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: FS.s13_5, lineHeight: LH.l19, color: adminColors.muted, marginBottom: SP.s20 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: RAD.r18,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: SP.s16,
    marginBottom: SP.s20,
    // design: 0 1 4 black 3% shadow, elevation 2 — nearest token is adminShadow.sm (0 1 3 .04).
    ...adminShadow.sm,
  },
  /** The Request More Info card sits 16pt (not 20) above its notice. */
  cardTight: { marginBottom: SP.s16 },
  applicantRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: BOX.button,
    height: BOX.button,
    borderRadius: BOX.button / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.s14,
  },
  avatarText: { fontSize: FS.s17, fontWeight: '800', color: adminColors.brandDeep },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: FS.s16, fontWeight: '700', color: adminColors.ink, marginBottom: SP.s3 },
  applicantSub: { fontSize: FS.s12_5, color: adminColors.muted },
  cardDivider: { height: SP.s1, backgroundColor: adminColors.border, marginVertical: SP.s14 },
  fieldLabel: { fontSize: FS.s14, fontWeight: '700', color: adminColors.ink, marginBottom: SP.s8 },
  notesInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: RAD.r14,
    padding: SP.s14,
    fontSize: FS.s14,
    color: adminColors.ink,
    textAlignVertical: 'top',
    minHeight: BOX.formNotesMin,
    marginBottom: SP.s24,
  },
  notesInputError: { borderColor: adminColors.danger.text },
  /** The design's primary button: 52pt, radius 16, with a brand-coloured lift. */
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: RAD.r16,
    height: BOX.cta,
    // design: 0 4 6 (brand, .28), elevation 3. Offset and colour are exact; blur and opacity from adminShadow.md.
    ...adminShadow.md,
    shadowColor: adminColors.brand,
    elevation: 3,
  },
  primaryBtnIcon: { marginRight: SP.s8 },
  primaryBtnText: { color: adminColors.onBrand, fontSize: FS.s15, fontWeight: '800' },
  busy: { opacity: 0.6 },
  /** A control whose backend is still being built: drawn as designed, visibly not available. */
  actionUnavailable: { opacity: 0.5 },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: SP.s16,
  },
  errorText: { fontSize: FS.s13, color: adminColors.danger.text },
  bottomSpacer: { height: SP.s40 },
});
