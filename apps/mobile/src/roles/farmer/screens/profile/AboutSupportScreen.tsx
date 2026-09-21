import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.greenDeep1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TractorIcon({ size = 26, color = P.weatherCloudWhite }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="17" r="2" stroke={color} strokeWidth="2" />
      <Path
        d="M4 17h-1v-4a2 2 0 0 1 2-2h3l3-4h4v7h3a2 2 0 0 1 2 2v1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 11V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DocTextIcon({ size = 20, color = P.greyMid1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ size = 20, color = P.greyMid1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExternalLinkIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15 3h6v6M10 14L21 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 18, color = P.greenDeep2 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhoneIcon({ size = 20, color = P.greenDeep1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MailIcon({ size = 20, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MapPinIcon({ size = 18, color = P.greyMid1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 28, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? P.twAmber500 : P.twGray200}>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={filled ? P.twAmber500 : P.twGray300}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── FAQs Data ────────────────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  linkText?: string | undefined;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'harvest',
    question: 'How do I mark a crop harvest-ready?',
    answer:
      "Open the crop's detail view in the Produce Calendar and toggle its stage to Harvest-ready — the status is recalculated from your logged dates.",
    linkText: 'Produce Calendar >',
  },
  {
    id: 'counter',
    question: 'Why was my listing counter-offered?',
    answer:
      'Counter-offers are proposed by aggregators or quality inspectors based on batch grading, current market index, or transport logistics.',
  },
  {
    id: 'worker',
    question: 'How do I add a new worker?',
    answer:
      'Navigate to Workforce & Payroll from the Farm screen and tap "+ Add Worker" to enter their profile and daily wage configuration.',
  },
  {
    id: 'market_day',
    question: 'What happens if I miss a market day?',
    answer:
      'Your harvested batch remains secured in verified storage for up to 24 hours. You can reschedule transport or sell to nearby direct buyers.',
  },
  {
    id: 'certification',
    question: 'How do I update certification documents?',
    answer:
      'Go to Certifications from your Farm Dashboard, select the expired/renewing cert, and tap "Upload Renewal" with your latest document proof.',
  },
  {
    id: 'offline',
    question: 'Can I use the app offline?',
    answer:
      'Yes! Farm diary logs, soil test entries, and field notes work completely offline and automatically sync once mobile data or WiFi reconnects.',
  },
];

// ── Types & Props ────────────────────────────────────────────────────────────

interface AboutSupportScreenProps {
  onBack: () => void;
  onNavigateToProduceCalendar?: (() => void) | undefined;
}

export function AboutSupportScreen({
  onBack,
  onNavigateToProduceCalendar,
}: AboutSupportScreenProps): React.JSX.Element {
  const [expandedFaq, setExpandedFaq] = useState<string | null>('harvest');
  const [rating, setRating] = useState<number>(4);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const toggleFaq = (id: string) => {
    setExpandedFaq((prev) => (prev === id ? null : id));
  };

  const handleOpenTerms = () => {
    Alert.alert('Terms of Service', 'Opening TOHFA Terms of Service document...');
  };

  const handleOpenPrivacy = () => {
    Alert.alert('Privacy Policy', 'Opening TOHFA Privacy & Data Policy document...');
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:18004251661').catch(() => {
      Alert.alert('Helpline', 'Call 1800 425 1661 (Toll-Free, Mon–Sat 9:00 am – 6:00 pm)');
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@tohfa.org').catch(() => {
      Alert.alert('Email Support', 'Write to support@tohfa.org');
    });
  };

  const handleSubmitFeedback = () => {
    Alert.alert(
      'Thank you!',
      `Your feedback (${rating} stars) has been submitted to the TOHFA team.`,
      [{ text: 'OK', onPress: () => setFeedbackText('') }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.weatherCloudWhite} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={20} color={P.greenDeep1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About & support</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── App Info Card ── */}
        <View style={styles.appCard}>
          <View style={styles.appIconBox}>
            <TractorIcon size={26} color={P.weatherCloudWhite} />
          </View>
          <View style={styles.appInfoCol}>
            <Text style={styles.appName}>TOHFA Farmer</Text>
            <Text style={styles.appVersion}>Version 1.0.0 · Build 75</Text>
            <Text style={styles.appOrg}>Nilgiris Horticulture Organic Farmers Assn.</Text>
          </View>
        </View>

        {/* ── SECTION: LEGAL ── */}
        <Text style={styles.sectionHeaderTitle}>LEGAL</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={handleOpenTerms}
            activeOpacity={0.75}
          >
            <DocTextIcon size={20} color={P.greyMid1} />
            <Text style={styles.legalRowText}>Terms of Service</Text>
            <ExternalLinkIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.legalRow}
            onPress={handleOpenPrivacy}
            activeOpacity={0.75}
          >
            <ShieldIcon size={20} color={P.greyMid1} />
            <Text style={styles.legalRowText}>Privacy Policy</Text>
            <ExternalLinkIcon size={18} color={P.twGray400} />
          </TouchableOpacity>
        </View>

        {/* ── SECTION: HELP CENTER ── */}
        <Text style={styles.sectionHeaderTitle}>HELP CENTER</Text>
        <View style={styles.cardContainer}>
          {FAQS_DATA.map((faq, idx) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <View key={faq.id}>
                {idx > 0 && <View style={styles.rowDivider} />}
                <TouchableOpacity
                  style={styles.faqHeaderRow}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  {isExpanded ? (
                    <ChevronUpIcon size={18} color={P.greenDeep2} />
                  ) : (
                    <ChevronDownIcon size={18} color={P.twGray400} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqBodyBox}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    {faq.linkText && (
                      <TouchableOpacity
                        onPress={() => onNavigateToProduceCalendar?.()}
                        activeOpacity={0.7}
                        style={styles.faqLinkBtn}
                      >
                        <Text style={styles.faqLinkText}>{faq.linkText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── SECTION: CONTACT TOHFA ── */}
        <Text style={styles.sectionHeaderTitle}>CONTACT TOHFA</Text>

        {/* Helpline */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleCallHelpline}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIconBox, { backgroundColor: P.greenTint3 }]}>
            <PhoneIcon size={20} color={P.greenDeep1} />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={styles.contactTitle}>Helpline · 1800 425 1661</Text>
            <Text style={styles.contactSubtitle}>Mon–Sat, 9:00 am – 6:00 pm</Text>
          </View>
          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleEmailSupport}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIconBox, { backgroundColor: P.blueTint1 }]}>
            <MailIcon size={20} color={P.twBlue600} />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={styles.contactTitle}>support@tohfa.org</Text>
            <Text style={styles.contactSubtitle}>Email support</Text>
          </View>
          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* Regional Offices */}
        <View style={styles.officesCard}>
          <View style={styles.officesHeader}>
            <MapPinIcon size={18} color={P.greyMid1} />
            <Text style={styles.officesTitle}>Regional offices</Text>
          </View>
          <View style={styles.chipsRow}>
            {['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'].map((office) => (
              <View key={office} style={styles.officeChip}>
                <Text style={styles.officeChipText}>{office}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION: FEEDBACK ── */}
        <Text style={styles.sectionHeaderTitle}>FEEDBACK</Text>
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>How's the app working for you?</Text>

          {/* 5-Star Row */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <TouchableOpacity
                key={starIndex}
                onPress={() => setRating(starIndex)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <StarIcon size={28} filled={starIndex <= rating} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback Text Input */}
          <TextInput
            style={styles.feedbackInput}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="Tell us what's working or what could be better... (optional)"
            placeholderTextColor={P.twGray400}
            multiline
            numberOfLines={3}
          />

          {/* Submit Feedback Button */}
          <TouchableOpacity
            style={styles.submitFeedbackBtn}
            onPress={handleSubmitFeedback}
            activeOpacity={0.85}
          >
            <Text style={styles.submitFeedbackBtnText}>Submit feedback</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.creamTint2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: P.weatherCloudWhite,
    borderBottomWidth: 1,
    borderBottomColor: P.tanTint1,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: P.nearBlackDark2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: P.tanTint4,
    marginBottom: 20,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  appIconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: P.greenDeep2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  appInfoCol: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: P.nearBlackDark2,
  },
  appVersion: {
    fontSize: 12,
    color: P.greyMid3,
    marginTop: 2,
    fontWeight: '500',
  },
  appOrg: {
    fontSize: 12,
    color: P.greyMid3,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: P.greyMid1,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  cardContainer: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.tanTint4,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalRowText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlackDark2,
    marginLeft: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: P.tanTint5,
    marginLeft: 16,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: P.nearBlackDark2,
    paddingRight: 8,
  },
  faqBodyBox: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },
  faqAnswerText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: P.greenDeep3,
  },
  faqLinkBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  faqLinkText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: P.greenDeep2,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: P.tanTint4,
    marginBottom: 10,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  contactIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactTextCol: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlackDark2,
  },
  contactSubtitle: {
    fontSize: 12,
    color: P.greyMid1,
    marginTop: 2,
  },
  officesCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.tanTint4,
    marginBottom: 20,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  officesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  officesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.nearBlackDark2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  officeChip: {
    backgroundColor: P.tanTint1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  officeChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.greenDeep3,
  },
  feedbackCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: P.tanTint4,
    marginBottom: 16,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  feedbackTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlackDark2,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  starTouch: {
    padding: 2,
  },
  feedbackInput: {
    backgroundColor: P.tanTint5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.tanTint7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: P.nearBlackDark2,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  submitFeedbackBtn: {
    backgroundColor: P.greenDeep2,
    borderRadius: 13,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitFeedbackBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: P.weatherCloudWhite,
  },
});
