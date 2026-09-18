import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
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

    // When step 1 completes, create the real application draft on server with farmer's actual mobile & name
    if (step === 1 && (currentAppId === 'draft-temp' || currentAppId.startsWith('app-'))) {
      // validateStep(1, ...) (screens/registration/validation.ts) already guarantees a
      // non-empty, valid fullName/mobile before Step1Personal ever calls onSave, so the
      // non-null assertions below are safe -- no fake fallback values needed.
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
        console.warn('createFarmerApplication caught:', err);
      }
    }

    if (currentAppId !== draft.applicationId) {
      setApplicationId(currentAppId);
    }
    updateStepAndAdvanceInStore(step, payload);

    // Persist step to server in background if valid app ID
    if (currentAppId !== 'draft-temp' && !currentAppId.startsWith('app-')) {
      try {
        await saveFarmerApplicationStep(currentAppId, step, payload);
      } catch (err) {
        console.warn(`saveFarmerApplicationStep ${step} caught:`, err);
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
});
