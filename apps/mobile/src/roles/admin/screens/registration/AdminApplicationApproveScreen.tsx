import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import type { PendingApplicationItem } from './AdminPendingApplicationsScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  greenBg: '#E8F5E9',
  greenText: '#2E7D32',
  inputBorder: '#E0DDD7',
  inputBg: '#FFFFFF',
};

interface Props {
  application: PendingApplicationItem;
  onBack: () => void;
  onConfirmApprove: (notes: string) => void;
}

export const AdminApplicationApproveScreen: React.FC<Props> = ({
  application,
  onBack,
  onConfirmApprove,
}) => {
  const [notes, setNotes] = useState('');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Approve Application</Text>
        <Text style={styles.subtitle}>
          Confirm approval and onboard {application.name} to Tohfa Platform
        </Text>

        {/* Applicant Summary Card */}
        <View style={styles.card}>
          <View style={styles.applicantRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{application.initials}</Text>
            </View>
            <View style={styles.applicantInfo}>
              <Text style={styles.applicantName}>{application.name}</Text>
              <Text style={styles.applicantSub}>
                {application.location} · {application.phone ?? '+91 98XXX XX412'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.badgeRow}>
            <View style={styles.verifiedPill}>
              <Icon name="check_circle" size={16} color={P.greenText} style={{ marginRight: 6 }} />
              <Text style={styles.verifiedPillText}>All Documents Verified</Text>
            </View>
          </View>
        </View>


        {/* Approval Notes */}
        <Text style={styles.fieldLabel}>Approval Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. FMB boundary coordinates and Aadhaar successfully verified against land registry records."
          placeholderTextColor="#A09890"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Action Button: Confirm & Onboard Farmer */}
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.85}
          onPress={() => onConfirmApprove(notes)}
        >
          <Icon name="check_circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.confirmBtnText}>Confirm & Onboard Farmer</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 12 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: P.subtitle,
    marginBottom: 20,
  },
  card: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: P.titleBrown,
  },
  applicantInfo: { flex: 1 },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 3,
  },
  applicantSub: {
    fontSize: 12.5,
    color: P.subtitle,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.cardBorder,
    marginVertical: 14,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.greenBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifiedPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.greenText,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E4DD',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: P.ink,
    textAlignVertical: 'top',
    minHeight: 88,
    marginBottom: 24,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 16,
    height: 52,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
