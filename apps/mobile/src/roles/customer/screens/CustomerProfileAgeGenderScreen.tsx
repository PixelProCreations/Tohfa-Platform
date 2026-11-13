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
  ScrollView,
} from 'react-native';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';

interface CustomerProfileAgeGenderScreenProps {
  onNavigate: (screen: 'CustomerProfilePreferences' | 'CustomerMain' | 'CustomerProfileName') => void;
}

export const CustomerProfileAgeGenderScreen: React.FC<CustomerProfileAgeGenderScreenProps> = ({ onNavigate }) => {
  const [age, setAge] = useState('');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const genders = [
    { id: 'male', label: 'Male', emoji: '👨' },
    { id: 'female', label: 'Female', emoji: '👩' },
    { id: 'unspecified', label: 'Prefer not to say', emoji: '' },
  ];

  const handleNext = () => {
    onNavigate('CustomerProfilePreferences');
  };

  const handleSkip = () => {
    onNavigate('CustomerProfilePreferences');
  };

  const isFormFilled = age.trim().length > 0 || selectedGender !== null;

  return (
    <View style={styles.container}>
      {/* Hide status bar symbols, edge-to-edge pure white */}
      <StatusBar hidden={true} />

      {/* ── TOP HEADER: 3-SEGMENT PROGRESS (Green / Green / Grey) + SKIP ── */}
      <View style={styles.headerRow}>
        <View style={styles.progressSegmentsWrap}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── QUESTION 1: WHAT IS YOUR AGE? ───────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.questionTitle}>What is your age?</Text>
            <View style={styles.ageInputWrap}>
              <TextInput
                style={styles.ageInput}
                placeholder=""
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={3}
                value={age}
                onChangeText={setAge}
                textAlign="center"
              />
              <View style={[styles.ageUnderline, age.trim().length > 0 && styles.ageUnderlineActive]} />
            </View>
          </View>

          {/* ── QUESTION 2: WHAT IS YOUR GENDER? ────────────────────────────── */}
          <View style={[styles.sectionWrap, { marginTop: 44 }]}>
            <Text style={styles.questionTitle}>What is your gender?</Text>

            <View style={styles.genderRow}>
              {genders.map((g) => {
                const isSelected = selectedGender === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedGender(isSelected ? null : g.id)}
                    style={styles.genderItemWrap}
                  >
                    <View style={styles.genderItemContent}>
                      {g.emoji ? <Text style={styles.genderEmoji}>{g.emoji}</Text> : null}
                      <Text style={[styles.genderLabel, isSelected && styles.genderLabelActive]}>
                        {g.label}
                      </Text>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkIcon}>✓</Text>
                        </View>
                      ) : (
                        <Text style={styles.plusText}>+</Text>
                      )}
                    </View>
                    <View style={[styles.itemUnderline, isSelected && styles.itemUnderlineActive]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── BOTTOM CENTERED CIRCULAR ACTION BUTTON ──────────────────────── */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              style={[
                styles.circularButton,
                styles.circularButtonActive,
                customerShadow.raised,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Next Step"
            >
              <ArrowRightFigmaIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing[24],
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 16,
  },
  progressSegmentsWrap: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    maxWidth: 240,
  },
  progressSegment: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: customerColors.brand,
  },
  progressSegmentInactive: {
    backgroundColor: '#E5E7EB',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontFamily: customerFonts.semibold,
    fontSize: 15,
    color: customerColors.body,
    letterSpacing: 0.2,
  },
  contentWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: customerSpacing[24],
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sectionWrap: {
    width: '100%',
    alignItems: 'center',
  },
  questionTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 27,
    lineHeight: 34,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  ageInputWrap: {
    width: '100%',
    alignItems: 'center',
  },
  ageInput: {
    width: '100%',
    fontSize: 24,
    fontFamily: customerFonts.bold,
    color: customerColors.brand,
    paddingVertical: 8,
  },
  ageUnderline: {
    height: 1.5,
    width: '100%',
    backgroundColor: '#E5E7EB',
  },
  ageUnderlineActive: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  genderItemWrap: {
    flex: 1,
  },
  genderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  genderEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  genderLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
  genderLabelActive: {
    fontFamily: customerFonts.bold,
    color: customerColors.brand,
  },
  plusText: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    lineHeight: 18,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  checkIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: customerColors.brand,
    lineHeight: 11,
  },
  itemUnderline: {
    height: 1.5,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginTop: 4,
  },
  itemUnderlineActive: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  buttonContainer: {
    marginTop: 70,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
});
