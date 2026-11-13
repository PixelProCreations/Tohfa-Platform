import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const ModalCloseSvg = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#4B5563"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentCheckSvg = () => (
  <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
    <Rect x={10} y={6} width={28} height={36} rx={4} stroke="#2E7D32" strokeWidth={2.5} />
    <Path d="M16 14h16M16 20h16M16 26h10" stroke="#2E7D32" strokeWidth={2.5} strokeLinecap="round" />
    <Circle cx={36} cy={34} r={8} fill="#EAF6E9" stroke="#2E7D32" strokeWidth={2.5} />
    <Path d="M33 34l2 2 4-4" stroke="#2E7D32" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TicketSvg = ({ color = '#2E7D32', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 9a3 3 0 013-3h14a3 3 0 013 3v2a2 2 0 000 4v2a3 3 0 01-3 3H5a3 3 0 01-3-3v-2a2 2 0 000-4V9z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path d="M9 7v10M9 10h.01M9 14h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="2 2" />
  </Svg>
);

const CheckCircleSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} fill="#2E7D32" stroke="#2E7D32" strokeWidth={1.5} />
    <Path d="M8 12l2.5 2.5L16 9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DashedCircleSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#6B7280" strokeWidth={1.8} strokeDasharray="3 3" />
  </Svg>
);

export interface SupportSubmittedModalProps {
  visible: boolean;
  orderNumber: string;
  productName: string;
  issueTypeLabel: string;
  submittedOn?: string;
  supportId?: string;
  onClose: () => void;
  onTrackRequest?: () => void;
  onContinueShopping?: () => void;
}

export const SupportSubmittedModal: React.FC<SupportSubmittedModalProps> = ({
  visible,
  orderNumber,
  productName,
  issueTypeLabel,
  submittedOn = '15 Nov 2026, 9:41 AM',
  supportId = 'SUP-20261115-0039',
  onClose,
  onTrackRequest,
  onContinueShopping,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.successModalCard}>
          {/* Top Right Floating Close Button */}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
            accessibilityLabel="Close dialog"
          >
            <ModalCloseSvg />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Document Check Graphic Circle */}
            <View style={styles.documentIconCircle}>
              <DocumentCheckSvg />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.popupTitle}>Support Request Submitted!</Text>
            <Text style={styles.popupSubtitle}>
              We've received your request and our support team will get back to you soon.
            </Text>

            {/* Support ID Card */}
            <View style={styles.supportIdCard}>
              <View style={styles.supportIdLeft}>
                <TicketSvg color="#2E7D32" size={22} />
                <View style={styles.supportIdTextCol}>
                  <Text style={styles.supportIdLabel}>Support ID</Text>
                  <Text style={styles.supportIdValue}>{supportId}</Text>
                </View>
              </View>
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Open</Text>
              </View>
            </View>

            {/* Request Summary */}
            <Text style={styles.summaryTitle}>Request Summary</Text>
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

            {/* Dashed Divider */}
            <View style={styles.dashedDivider} />

            {/* What happens next? */}
            <Text style={styles.nextStepsTitle}>What happens next?</Text>

            {/* Timeline Steps */}
            <View style={styles.timelineList}>
              {/* Step 1 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeftCol}>
                  <CheckCircleSvg />
                  <View style={styles.timelineConnector} />
                </View>
                <View style={styles.timelineRightCol}>
                  <Text style={styles.timelineStepTitle}>Request received</Text>
                  <Text style={styles.timelineStepDesc}>
                    Your request has been successfully submitted.
                  </Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeftCol}>
                  <DashedCircleSvg size={18} />
                  <View style={styles.timelineConnector} />
                </View>
                <View style={styles.timelineRightCol}>
                  <Text style={styles.timelineStepTitle}>Under review</Text>
                  <Text style={styles.timelineStepDesc}>
                    Our support team will check the details and content you within 24 hours.
                  </Text>
                </View>
              </View>

              {/* Step 3 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeftCol}>
                  <DashedCircleSvg size={18} />
                </View>
                <View style={styles.timelineRightCol}>
                  <Text style={styles.timelineStepTitle}>Resolution</Text>
                  <Text style={styles.timelineStepDesc}>
                    We'll help you with a solution (replacement, refund or other support).
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.trackRequestButton}
              activeOpacity={0.85}
              onPress={onTrackRequest}
              accessibilityLabel="Track Request"
            >
              <Text style={styles.trackRequestButtonText}>Track Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueShoppingButton}
              activeOpacity={0.85}
              onPress={onContinueShopping}
              accessibilityLabel="Continue Shopping"
            >
              <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  successModalCard: {
    width: '94%',
    maxWidth: 390,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    position: 'relative',
    alignSelf: 'center',
    overflow: 'visible',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  modalCloseButton: {
    position: 'absolute',
    top: -12,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  documentIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EAF6E9',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2E1A',
    textAlign: 'center',
    marginBottom: 6,
  },
  popupSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  supportIdCard: {
    backgroundColor: '#EAF6E9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  supportIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportIdTextCol: {
    flexDirection: 'column',
  },
  supportIdLabel: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  supportIdValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  openBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  nextStepsTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  timelineList: {
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 46,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 22,
    marginRight: 10,
  },
  timelineConnector: {
    width: 1.5,
    height: 22,
    backgroundColor: '#D1D5DB',
    marginVertical: 2,
  },
  timelineRightCol: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineStepTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  timelineStepDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  trackRequestButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  continueShoppingButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueShoppingButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700',
  },
});
