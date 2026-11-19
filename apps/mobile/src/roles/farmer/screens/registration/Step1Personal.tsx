import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../../../i18n/farmer';
import type { Step1PersonalData } from '../../storage/registrationDraft';
import { makeStyles } from './step1Personal/styles';
import { useStep1Form } from './step1Personal/useStep1Form';
import { PersonalSection } from './step1Personal/PersonalSection';
import { MobileSection } from './step1Personal/MobileSection';
import { AddressSection } from './step1Personal/AddressSection';

interface Step1Props {
  initialData?: Step1PersonalData | undefined;
  onSave: (data: Step1PersonalData) => void;
  onBack?: (() => void) | undefined;
}

export const Step1Personal: React.FC<Step1Props> = ({ initialData, onSave }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const form = useStep1Form(initialData, onSave);
  const { verifying } = form.state;

  const sectionProps = {
    form,
    styles,
    colors: {
      placeholder: colors.textPlaceholder,
      subtle: colors.textSubtle,
      brand: colors.brandGreen,
      white: colors.white,
    },
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={form.scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <PersonalSection {...sectionProps} />
          <MobileSection {...sectionProps} />
          <AddressSection {...sectionProps} />
        </ScrollView>

        {/* Sticky Bottom Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={verifying}
            style={[styles.continueButton, verifying ? styles.continueButtonBusy : null]}
            onPress={form.handleContinue}
          >
            {verifying ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.continueButtonText}>
                {t('farmer.registration.step1.continueButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
