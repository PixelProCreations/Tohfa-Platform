import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import {
  BackArrowSvg,
  TicketSvg,
  CheckCircleSvg,
  ActiveStepSvg,
  DashedCircleSvg,
  HeadsetSvg,
} from '../components/ContactSupportIcons';

export interface TrackSupportRequestScreenProps {
  supportId?: string | undefined;
  orderNumber?: string | undefined;
  productName?: string | undefined;
  issueTypeLabel?: string | undefined;
  submittedOn?: string | undefined;
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
}

export const TrackSupportRequestScreen: React.FC<TrackSupportRequestScreenProps> = ({
  supportId = 'SUP-20261115-0039',
  orderNumber = 'ORD-20260712-0028',
  productName = 'Royal Gala (1 kg)',
  issueTypeLabel = 'Product support',
  submittedOn = '15 Nov 2026, 9:41 AM',
  onBack,
  onNavigate,
}) => {
  const [isCancelled, setIsCancelled] = useState(false);

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Support Request',
      'Are you sure you want to cancel this support request?',
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: () => {
            setIsCancelled(true);
            Alert.alert('Request Cancelled', 'Your support request has been cancelled.', [
              {
                text: 'OK',
                onPress: () => {
                  if (onBack) {
                    onBack();
                  } else {
                    onNavigate?.('ContactSupport');
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowSvg />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track request</Text>
        </View>

        {/* ── SUPPORT ID CARD ───────────────────────────────────────────────── */}
        <View style={styles.supportIdCard}>
          <View style={styles.supportIdLeft}>
            <TicketSvg color="#2E7D32" size={24} />
            <View style={styles.supportIdTextCol}>
              <Text style={styles.supportIdLabel}>Support ID</Text>
              <Text style={styles.supportIdValue}>{supportId}</Text>
            </View>
          </View>
        </View>

        {/* ── REQUEST SUMMARY ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Request Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order ID</Text>
            <Text style={styles.summaryValue}>{orderNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Product</Text>
            <Text style={styles.summaryValue}>{productName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Issue type</Text>
            <Text style={styles.summaryValue}>{issueTypeLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Submitted on</Text>
            <Text style={styles.summaryValue}>{submittedOn}</Text>
          </View>
        </View>

        {/* ── REQUEST STATUS ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Request Status</Text>
        <View style={styles.statusTimeline}>
          {/* Step 1: Request received */}
          <View style={styles.timelineItem}>
            <View style={styles.indicatorCol}>
              <CheckCircleSvg />
              <View style={[styles.timelineConnector, styles.connectorGreen]} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Request received</Text>
              <Text style={styles.stepTimestamp}>15 Nov 2026, 9:41 AM</Text>
              <Text style={styles.stepDescription}>
                Your request has been successfully submitted.
              </Text>
            </View>
          </View>

          {/* Step 2: Under review */}
          <View style={styles.timelineItem}>
            <View style={styles.indicatorCol}>
              <ActiveStepSvg />
              <View style={[styles.timelineConnector, styles.connectorGray]} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Under review</Text>
              <Text style={styles.stepTimestamp}>15 Nov 2026, 11:20 AM</Text>
              <Text style={styles.stepDescription}>
                Our support team will check the details and content you within 24 hours.
              </Text>
            </View>
          </View>

          {/* Step 3: Resolution */}
          <View style={styles.timelineItemLast}>
            <View style={styles.indicatorCol}>
              <DashedCircleSvg />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Resolution</Text>
              <Text style={styles.stepPending}>Pending</Text>
              <Text style={styles.stepDescriptionMuted}>
                We&apos;ll help you with a solution (replacement, refund or other support).
              </Text>
            </View>
          </View>
        </View>

        {/* ── REQUEST UPDATES ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Request Updates</Text>
        <View style={styles.updatesTimeline}>
          {/* Vertical left connecting line */}
          <View style={styles.updatesGuideLine} />

          {/* Update Item 1 (Under review) */}
          <View style={styles.updateRow}>
            <View style={styles.updateDot} />
            <View style={[styles.updateCard, styles.updateCardActive]}>
              <View style={styles.updateCardHeader}>
                <View style={styles.updateHeaderLeft}>
                  <HeadsetSvg color="#2E7D32" size={18} />
                  <Text style={styles.updateTeamTitle}>Support Team</Text>
                </View>
                <Text style={styles.updateTimestamp}>15 Nov 2026, 11:20 AM</Text>
              </View>
              <Text style={styles.updateMessage}>
                We are reviewing your request. We&apos;ll update you soon.
              </Text>
            </View>
          </View>

          {/* Update Item 2 (Request received) */}
          <View style={styles.updateRow}>
            <View style={styles.updateDot} />
            <View style={[styles.updateCard, styles.updateCardNeutral]}>
              <View style={styles.updateCardHeader}>
                <View style={styles.updateHeaderLeft}>
                  <HeadsetSvg color="#4B5563" size={18} />
                  <Text style={styles.updateTeamTitle}>Support Team</Text>
                </View>
                <Text style={styles.updateTimestamp}>15 Nov 2026, 9:41 AM</Text>
              </View>
              <Text style={styles.updateMessage}>Your request has been received.</Text>
            </View>
          </View>
        </View>

        {/* ── CANCEL REQUEST BUTTON ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.cancelButton, isCancelled && styles.cancelButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleCancelRequest}
          disabled={isCancelled}
          accessibilityLabel="Cancel Request"
        >
          <Text style={styles.cancelButtonText}>
            {isCancelled ? 'Request Cancelled' : 'Cancel Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 48,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2E1A',
  },

  /* Support ID Card */
  supportIdCard: {
    backgroundColor: '#EAF6E9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  supportIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportIdTextCol: {
    gap: 2,
  },
  supportIdLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  supportIdValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 12,
    marginTop: 6,
  },

  /* Request Summary */
  summaryContainer: {
    gap: 10,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  /* Request Status Timeline */
  statusTimeline: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineItemLast: {
    flexDirection: 'row',
    gap: 12,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 22,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 46,
    marginVertical: 4,
  },
  connectorGreen: {
    backgroundColor: '#2E7D32',
  },
  connectorGray: {
    backgroundColor: '#E5E7EB',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  stepTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stepPending: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stepDescription: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 4,
  },
  stepDescriptionMuted: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },

  /* Request Updates */
  updatesTimeline: {
    position: 'relative',
    marginBottom: 28,
    gap: 12,
  },
  updatesGuideLine: {
    position: 'absolute',
    left: 4.5,
    top: 22,
    bottom: 22,
    width: 2,
    backgroundColor: '#A7D7A9',
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    zIndex: 1,
  },
  updateCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  updateCardActive: {
    backgroundColor: '#EAF6E9',
  },
  updateCardNeutral: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  updateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  updateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateTeamTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  updateTimestamp: {
    fontSize: 11,
    color: '#6B7280',
  },
  updateMessage: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },

  /* Cancel Button */
  cancelButton: {
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonDisabled: {
    borderColor: '#9CA3AF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
});

