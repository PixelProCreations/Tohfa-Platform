import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';

interface CustomerProfileNameScreenProps {
  onNavigate: (screen: 'CustomerProfileAgeGender' | 'CustomerMain' | 'CustomerLogin') => void;
}

export const CustomerProfileNameScreen: React.FC<CustomerProfileNameScreenProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');

  const hasName = name.trim().length > 0;

  const handleNext = () => {
    if (hasName) {
      onNavigate('CustomerProfileAgeGender');
    }
  };

  const handleSkip = () => {
    onNavigate('CustomerProfileAgeGender');
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* Top Header: 3-Segment Progress Bar + Skip */}
      <View style={styles.headerRow}>
        <View style={styles.progressSegmentsWrap}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentInactive]} />
          <View style={[styles.progressSegment, styles.progressSegmentInactive]} />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Center Block (349 Fill x 204 Hug from Figma) */}
        <View style={styles.centerBlock}>
          <Text style={styles.title}>What should we call you?</Text>

          {/* Underline Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder=""
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              textAlign="center"
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
            <View style={styles.underline} />
          </View>
        </View>

        {/* Bottom Button Area (349 Fill x 44 Hug from Figma) */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            disabled={!hasName}
            style={[
              styles.circularButton,
              hasName ? styles.circularButtonActive : styles.circularButtonDisabled,
              hasName && customerShadow.raised,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <ArrowRightFigmaIcon size={24} color={hasName ? '#FFFFFF' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing[24],
    paddingTop: 48,
    paddingBottom: 16,
    gap: 16,
  },
  progressSegmentsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: customerColors.brand,
  },
  progressSegmentInactive: {
    backgroundColor: '#E5E7EB',
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    color: customerColors.body,
    fontWeight: '500',
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: customerSpacing[24],
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 349,
    alignSelf: 'center',
  },
  title: {
    fontFamily: customerFonts.editorial,
    fontSize: 30,
    lineHeight: 38,
    color: customerColors.body,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  nameInput: {
    fontFamily: customerFonts.regular,
    fontSize: 20,
    color: customerColors.body,
    paddingVertical: 10,
    textAlign: 'center',
  },
  underline: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  bottomArea: {
    width: '100%',
    maxWidth: 349,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  circularButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  circularButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  homeIndicator: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    opacity: 0.8,
    alignSelf: 'center',
    marginBottom: 8,
  },
});

