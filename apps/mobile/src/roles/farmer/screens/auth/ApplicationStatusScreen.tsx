import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme, authPalette as P, typography } from '../../theme';
import {
  fetchApplicationStatus,
  type ApplicationStatusResponse,
  type FarmerInfoRequestItem,
} from '../../api/auth';
import { getFarmerApplicationDraft } from '../../api/registration';
import { useRegistrationDraftStore } from '../../storage/registrationDraft';
import { ErrorState, Icon, Skeleton, SafeAreaView } from '@tohfa/mobile-ui';
import { formatErrorMessage } from '../../../../shell/api/client';
import { t, type TranslationKey } from '../../../../i18n/farmer';

interface ApplicationStatusScreenProps {
  applicationId: string;
  onNavigate: (screen: 'Welcome' | 'MainTabs' | 'Register', params?: Record<string, string | number | undefined>) => void;
}

const ITEM_LABEL_KEYS: Record<FarmerInfoRequestItem, TranslationKey> = {
  AADHAAR: 'farmer.applicationStatus.item.AADHAAR',
  FMB_SKETCH: 'farmer.applicationStatus.item.FMB_SKETCH',
  PATTA_CHITTA: 'farmer.applicationStatus.item.PATTA_CHITTA',
  BANK_DETAILS: 'farmer.applicationStatus.item.BANK_DETAILS',
  CERTIFICATE: 'farmer.applicationStatus.item.CERTIFICATE',
  OTHER: 'farmer.applicationStatus.item.OTHER',
};

function firstStepForRequestedItems(items: readonly FarmerInfoRequestItem[]): number {
  const stepNumbers = items.map((item) => {
    if (item === 'BANK_DETAILS') return 1;
    if (item === 'FMB_SKETCH') return 3;
    return 4;
  });
  return stepNumbers.length > 0 ? Math.min(...stepNumbers) : 4;
}

const STEPS = [
  { key: 'SUBMITTED', title: 'Submitted', sub: 'Just now' },
  { key: 'DOCS_REVIEW', title: 'Documents Under Review', sub: 'In progress · 1-2 days' },
  { key: 'FARM_VERIFICATION', title: 'Farm Verification Visit', sub: 'Pending · 2-3 days' },
  { key: 'AUDIT', title: 'Audit Completed', sub: 'Pending' },
  { key: 'APPROVED', title: 'Approved', sub: 'Pending' },
] as const;

export const ApplicationStatusScreen: React.FC<ApplicationStatusScreenProps> = ({
  applicationId,
  onNavigate,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const [data, setData] = useState<ApplicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingDraft, setOpeningDraft] = useState(false);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const restoreFullDraft = useRegistrationDraftStore((s) => s.restoreFullDraft);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApplicationStatus(applicationId);
      setData(res);
    } catch (err: unknown) {
      // A failed GET /farmers/applications/:id/status must surface as a real
      // error, not a fabricated "Documents Under Review" status -- a farmer
      // acting on a status TOHFA never actually confirmed is worse than a
      // farmer seeing a retry screen (root CLAUDE.md §2.5 neighbourhood: never
      // show state the server didn't actually report). Formatted the same way
      // LoginScreen/ForgotPasswordScreen/PersonalDetailsScreen already do.
      setError(formatErrorMessage(err, t('error.generic')));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleBackToHome() {
    onNavigate('Welcome');
  }

  async function handleFixAndResubmit() {
    if (openingDraft) return;
    setOpeningDraft(true);
    setResubmitError(null);
    try {
      const draftRes = await getFarmerApplicationDraft(applicationId);
      const targetStep = firstStepForRequestedItems(data?.infoRequest?.items ?? []);
      restoreFullDraft(
        {
          applicationId: draftRes.id,
          currentStep: targetStep,
          step1Personal: draftRes.step1Personal,
          step2FarmDetails: draftRes.step2FarmDetails,
          step3Location: draftRes.step3Location,
          step4Documents: draftRes.step4Documents,
        },
        { isResubmit: true },
      );
      onNavigate('Register');
    } catch (err: unknown) {
      setResubmitError(formatErrorMessage(err, t('error.generic')));
    } finally {
      setOpeningDraft(false);
    }
  }

  const isInfoRequested = data?.status === 'INFO_REQUESTED';
  const isRejected = data?.status === 'REJECTED';
  const rejectionReason =
    data?.steps
      ?.slice()
      .reverse()
      .find((s) => s.status === 'REJECTED')?.note ??
    data?.notes ??
    null;

  // Derived from the server's own status value
  const activeStep = isInfoRequested
    ? 1
    : isRejected
      ? -1
      : Math.max(
          0,
          STEPS.findIndex((step) => step.key === data?.status),
        );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgLight, padding: 24, justifyContent: 'center' }]}>
        <Skeleton width="100%" height={200} borderRadius={16} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgLight, padding: 24, justifyContent: 'center' }]}>
        <ErrorState message={error} onRetry={loadStatus} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgLight }]}>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Status Icon */}
        <View style={styles.topIconContainer}>
          <View
            style={[
              styles.iconOuterCircle,
              { backgroundColor: isInfoRequested ? P.amber50 : colors.brandGreenLight },
            ]}
          >
            <View
              style={[
                styles.iconInnerCircle,
                { backgroundColor: isInfoRequested ? P.amberAccent : isRejected ? P.red600 : colors.brandGreen },
              ]}
            >
              <Icon
                name={isInfoRequested ? 'info' : isRejected ? 'close' : 'check'}
                size={32}
                color={P.white}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textDark }]}>
          {isInfoRequested
            ? t('farmer.applicationStatus.infoRequested.title')
            : isRejected
              ? t('farmer.applicationStatus.rejected.title')
              : 'Application\nSubmitted!'}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
          {isInfoRequested
            ? t('farmer.applicationStatus.infoRequested.subtitle')
            : isRejected
              ? t('farmer.applicationStatus.rejected.subtitle')
              : 'Your farmer application has been received and\nis now under review.'}
        </Text>

        {isInfoRequested && data?.infoRequest ? (
          <View style={styles.actionCard} testID="farmer.applicationStatus.infoRequestCard">
            <Text style={styles.actionCardTitle}>{t('farmer.applicationStatus.infoRequested.bannerTitle')}</Text>
            {data.infoRequest.items.length > 0 ? (
              <>
                <Text style={styles.actionCardLabel}>{t('farmer.applicationStatus.infoRequested.itemsLabel')}</Text>
                {data.infoRequest.items.map((item) => (
                  <Text key={item} style={styles.actionCardItem}>
                    • {t(ITEM_LABEL_KEYS[item] ?? 'farmer.applicationStatus.item.OTHER')}
                  </Text>
                ))}
              </>
            ) : null}
            {data.infoRequest.message ? (
              <>
                <Text style={styles.actionCardLabel}>{t('farmer.applicationStatus.infoRequested.messageLabel')}</Text>
                <Text style={styles.actionCardMessage}>{data.infoRequest.message}</Text>
              </>
            ) : null}
            {resubmitError ? <Text style={styles.resubmitErrorText}>{resubmitError}</Text> : null}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.resubmitBtn, { backgroundColor: P.amberAccent, opacity: openingDraft ? 0.7 : 1 }]}
              onPress={handleFixAndResubmit}
              disabled={openingDraft}
              testID="farmer.applicationStatus.resubmitBtn"
            >
              {openingDraft ? (
                <ActivityIndicator size="small" color={P.white} />
              ) : (
                <Text style={styles.resubmitBtnText}>{t('farmer.applicationStatus.infoRequested.cta')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {isRejected && rejectionReason ? (
          <View style={styles.actionCard} testID="farmer.applicationStatus.rejectedCard">
            <Text style={styles.actionCardLabel}>{t('farmer.applicationStatus.rejected.reasonLabel')}</Text>
            <Text style={styles.actionCardMessage}>{rejectionReason}</Text>
          </View>
        ) : null}

        {/* App ID Card */}
        <View style={[styles.idCard, { borderColor: colors.borderMedium, backgroundColor: colors.white }]}>
          <Text style={[styles.idLabel, { color: colors.textSubtle }]}>APPLICATION ID</Text>
          <Text style={[styles.idValue, { color: colors.brandGreen }]}>{applicationId.toUpperCase()}</Text>
          <Text style={[styles.idExpected, { color: colors.textSubtle }]}>
            Expected review: <Text style={{ color: colors.textDark, fontWeight: '700' }}>3 to 5 working days</Text>
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {STEPS.map((step, idx) => {
            const isPassed = idx < activeStep;
            const isCurrent = idx === activeStep;
            
            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineIconCol}>
                  {isPassed ? (
                    <View style={[styles.stepPassedCircle, { backgroundColor: colors.brandGreen }]}>
                      <Icon name="check" size={12} color={P.white} />
                    </View>
                  ) : isCurrent ? (
                    <View style={[styles.stepCurrentOuter, { backgroundColor: 'rgba(245, 166, 35, 0.2)' }]}>
                      <View style={[styles.stepCurrentInner, { backgroundColor: P.amberAccent }]} />
                    </View>
                  ) : (
                    <View style={[styles.stepPendingCircle, { backgroundColor: P.pendingGrey }]} />
                  )}

                  {idx < STEPS.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: isPassed ? colors.brandGreen : P.grey300 }]} />
                  )}
                </View>

                <View style={styles.timelineTextCol}>
                  <Text style={[
                    styles.stepTitle, 
                    { color: isPassed || isCurrent ? colors.textDark : P.pendingTextGrey, fontWeight: isPassed || isCurrent ? '700' : '600' }
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={[
                    styles.stepSub,
                    { color: isPassed || isCurrent ? colors.textSubtle : P.pendingSubGrey }
                  ]}>
                    {isInfoRequested && step.key === 'DOCS_REVIEW'
                      ? t('farmer.applicationStatus.infoRequested.timeline')
                      : step.sub}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{ fontWeight: '700' }}>What's next?</Text> A TOHFA representative will call you within 24 hours to confirm your details.
          </Text>
        </View>
        
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, { backgroundColor: colors.brandGreen }]} onPress={handleBackToHome}>
          <Text style={[styles.footerBtnText, { color: colors.white }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  topIconContainer: { marginBottom: 20 },
  iconOuterCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  iconInnerCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.title, fontWeight: '800', textAlign: 'center', marginBottom: 12, lineHeight: 28 },
  subtitle: { fontSize: typography.body, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  idCard: { width: '100%', borderWidth: 1, borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginBottom: 32 },
  idLabel: { fontSize: typography.caption, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  idValue: { fontSize: typography.bodyLarge, fontWeight: '800', marginBottom: 8 },
  idExpected: { fontSize: typography.body },
  timeline: { width: '100%', paddingLeft: 10, marginBottom: 24 },
  timelineItem: { flexDirection: 'row', minHeight: 64 },
  timelineIconCol: { width: 36, alignItems: 'center' },
  stepPassedCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  stepCurrentOuter: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  stepCurrentInner: { width: 20, height: 20, borderRadius: 10 },
  stepPendingCircle: { width: 20, height: 20, borderRadius: 10, marginTop: 6 },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineTextCol: { flex: 1, paddingLeft: 16, paddingTop: 6 },
  stepTitle: { fontSize: typography.bodyLarge, marginBottom: 2 },
  stepSub: { fontSize: typography.body },
  infoBox: { backgroundColor: P.noticeBg, borderWidth: 1, borderColor: P.noticeBorder, borderRadius: 8, padding: 16, width: '100%', marginBottom: 16 },
  infoBoxText: { fontSize: typography.body, color: P.noticeText, lineHeight: 20 },
  actionCard: {
    width: '100%',
    backgroundColor: P.amber50,
    borderWidth: 1,
    borderColor: P.amber200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  actionCardTitle: { fontSize: typography.bodyLarge, fontWeight: '800', color: P.twAmber900, marginBottom: 8 },
  actionCardLabel: { fontSize: typography.caption, fontWeight: '700', color: P.twAmber900, marginTop: 6, marginBottom: 4 },
  actionCardItem: { fontSize: typography.body, color: P.twAmber900, lineHeight: 20 },
  actionCardMessage: { fontSize: typography.body, color: P.twAmber900, lineHeight: 20 },
  resubmitErrorText: { fontSize: typography.bodySmall, color: P.red600, marginTop: 8 },
  resubmitBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitBtnText: { fontSize: typography.body, fontWeight: '700', color: P.white },
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1, gap: 12 },
  footerBtn: { width: '100%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footerBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
  footerBtnText: { fontSize: typography.bodyLarge, fontWeight: '700' }
});
