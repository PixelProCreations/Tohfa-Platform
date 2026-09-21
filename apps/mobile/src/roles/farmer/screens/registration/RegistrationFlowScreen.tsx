import React, { useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { useTheme } from '../../theme';
import { Step1Personal } from './Step1Personal';
import { Step2FarmDetails } from './Step2FarmDetails';
import { Step3Location } from './Step3Location';
import { Step4Documents } from './Step4Documents';
import { Step5Review } from './Step5Review';
import { useRegistrationDraftStore, type Step1PersonalData } from '../../storage/registrationDraft';
import {
  createFarmerApplication,
  saveFarmerApplicationStep,
} from '../../api/registration';

interface RegistrationFlowProps {
  onNavigate: (screen: 'ApplicationStatus' | 'Welcome', params?: Record<string, string | number | undefined>) => void;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Personal Details',
  2: 'Farm Details',
  3: 'Location & Map',
  4: 'Documents & Certificates',
  5: 'Review & Submit',
};

export const RegistrationFlowScreen: React.FC<RegistrationFlowProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const { colors } = theme;
  const [apiError, setApiError] = useState<string | null>(null);

  // `persist` restores `draft` from AsyncStorage asynchronously; `hasHydrated` flips true once
  // that restore has settled (found a draft, found nothing, or failed) -- see
  // `storage/registrationDraft.ts`'s `onRehydrateStorage`. Replaces the old manual `loading`
  // state + cold-start effect, which called a broken `getRegistrationDraft()`/
  // `saveRegistrationDraft()` pair backed by a `localStorage` global that doesn't exist in RN.
  const hasHydrated = useRegistrationDraftStore((s) => s.hasHydrated);
  const draft = useRegistrationDraftStore((s) => s.draft);
  const setApplicationId = useRegistrationDraftStore((s) => s.setApplicationId);
  const updateStepAndAdvanceInStore = useRegistrationDraftStore((s) => s.updateStepAndAdvance);
  const goToStep = useRegistrationDraftStore((s) => s.goToStep);
  const goBackInStore = useRegistrationDraftStore((s) => s.goBack);

  async function updateStepAndAdvance(step: number, payload: unknown) {
    let currentAppId = draft.applicationId;
    setApiError(null);

    // When step 1 completes, create the real application draft on server
    if (step === 1 && (currentAppId === 'draft-temp' || currentAppId.startsWith('app-'))) {
      const step1 = payload as Step1PersonalData;
      try {
        const appRes = await createFarmerApplication({
          mobile: step1.mobile!,
          fullName: step1.fullName!,
          preferredLocale: 'en',
        });
        if (appRes?.id) {
          currentAppId = appRes.id;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create application. Please check your connection and try again.';
        setApiError(msg);
        // Still advance locally so user doesn't lose their data — server sync will retry on next step
        console.warn('createFarmerApplication failed:', err);
      }
    }

    if (currentAppId !== draft.applicationId) {
      setApplicationId(currentAppId);
    }
    updateStepAndAdvanceInStore(step, payload);

    // Persist step to server in background if we have a real app ID
    if (currentAppId !== 'draft-temp' && !currentAppId.startsWith('app-')) {
      try {
        await saveFarmerApplicationStep(currentAppId, step, payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Failed to save Step ${step}. Your data is kept locally.`;
        setApiError(msg);
        console.warn(`saveFarmerApplicationStep ${step} failed:`, err);
      }
    }
  }

  function handleBack() {
    if (draft.currentStep <= 1) {
      onNavigate('Welcome');
      return;
    }
    goBackInStore();
  }

  if (!hasHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const stepTitle = STEP_TITLES[draft.currentStep] ?? 'Personal Details';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      {/* API error banner — dismissible, shown above the step header */}
      {apiError ? (
        <View style={[styles.apiBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFCA2C' }]}>
          <Icon name="warning" size={16} color="#856404" />
          <Text style={styles.apiBannerText}>{apiError}</Text>
          <TouchableOpacity onPress={() => setApiError(null)}>
            <Icon name="close" size={16} color="#856404" />
          </TouchableOpacity>
        </View>
      ) : null}
      {/* Branding Spec Header */}
      {draft.currentStep < 3 && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.white,
              borderBottomColor: colors.borderSoft,
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.backButtonCircle,
                {
                  borderColor: colors.borderMedium,
                  backgroundColor: colors.white,
                },
              ]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textDark }]}>{stepTitle}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
                Step {draft.currentStep} of 5
              </Text>
            </View>
          </View>

          {/* 5 Progress Bar Segments */}
          <View style={styles.progressRow}>
            {[1, 2, 3, 4, 5].map((s) => {
              const isActive = s <= draft.currentStep;
              return (
                <View
                  key={s}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: isActive ? colors.brandGreen : colors.borderMedium },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Main Step Content */}
      <View style={styles.stepContent}>
        {draft.currentStep === 1 ? (
          <Step1Personal
            initialData={draft.step1}
            onSave={(data) => updateStepAndAdvance(1, data)}
            onBack={handleBack}
          />
        ) : draft.currentStep === 2 ? (
          <Step2FarmDetails
            initialData={draft.step2}
            onSave={(data) => updateStepAndAdvance(2, data)}
            onBack={handleBack}
          />
        ) : draft.currentStep === 3 ? (
          <Step3Location
            initialData={draft.step3}
            onSave={(data) => updateStepAndAdvance(3, data)}
            onBack={handleBack}
          />
        ) : draft.currentStep === 4 ? (
          <Step4Documents
            initialData={draft.step4}
            onSave={(data) => updateStepAndAdvance(4, data)}
            onBack={handleBack}
          />
        ) : (
          <Step5Review
            draft={draft}
            onSubmitSuccess={(appId) =>
              onNavigate('ApplicationStatus', { applicationId: appId })
            }
            onBack={handleBack}
            onEditStep={(step) => goToStep(step)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonArrow: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  stepContent: {
    flex: 1,
  },
  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  apiBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});
