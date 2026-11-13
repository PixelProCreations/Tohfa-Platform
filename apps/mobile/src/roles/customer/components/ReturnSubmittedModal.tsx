import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ProductImages } from '../assets/images/products';
import { ReturnTicketSvg } from './ContactSupportIcons';

export interface ReturnSubmittedModalProps {
  visible: boolean;
  onClose: () => void;
  returnId?: string;
  orderNumber?: string;
  productName?: string;
  productImage?: number;
  onTrackReturn?: () => void;
  onContinueShopping?: () => void;
}

const CloseSvg = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={11} fill="#F3F4F6" />
    <Path
      d="M8 8l8 8M16 8l-8 8"
      stroke="#4B5563"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SuccessCheckSvg = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
    <Circle cx={32} cy={32} r={30} fill="#E8F8EE" />
    <Circle cx={32} cy={32} r={20} fill="#2E7D32" />
    <Path
      d="M26 32l4 4 8-8"
      stroke="#FFFFFF"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export function ReturnSubmittedModal({
  visible,
  onClose,
  returnId = 'RET-20260715-0147',
  orderNumber = 'ORD-20260715-0039',
  productName = 'Fresh apples (1 kg)',
  productImage = ProductImages.fruitApple,
  onTrackReturn,
  onContinueShopping,
}: ReturnSubmittedModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialogCard}>
          {/* Close button in top-right */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close return submitted modal"
          >
            <CloseSvg />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Success Badge */}
            <View style={styles.iconWrapper}>
              <SuccessCheckSvg />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Return Request Submitted!</Text>
            <Text style={styles.subtitle}>
              Your return request has been successfully submitted. We&apos;ll
              notify you once it&apos;s reviewed.
            </Text>

            {/* Return Request ID Pill Card */}
            <View style={styles.returnIdCard}>
              <View style={styles.ticketIconBox}>
                <ReturnTicketSvg color="#2E7D32" size={20} />
              </View>
              <View style={styles.returnIdColumn}>
                <Text style={styles.returnIdLabel}>Return Request ID</Text>
                <Text style={styles.returnIdValue}>{returnId}</Text>
              </View>
            </View>

            {/* Product Summary Row */}
            <View style={styles.productCard}>
              <Image
                source={productImage}
                style={styles.productThumbnail}
                resizeMode="cover"
              />
              <View style={styles.productInfoColumn}>
                <Text style={styles.productLabel}>Product</Text>
                <Text style={styles.productName}>{productName}</Text>
              </View>
            </View>

            {/* Dashed Separator */}
            <View style={styles.dashedDivider} />

            {/* Two Column Order Details */}
            <View style={styles.metaRow}>
              <View style={styles.metaColumn}>
                <Text style={styles.metaLabel}>Order ID</Text>
                <Text style={styles.metaValue}>{orderNumber}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaColumn}>
                <Text style={styles.metaLabel}>Order ID</Text>
                <Text style={styles.metaValue}>{orderNumber}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onTrackReturn?.();
              }}
              style={styles.trackButton}
              accessibilityLabel="Track Return Request"
            >
              <Text style={styles.trackButtonText}>Track Return Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onContinueShopping?.();
              }}
              style={styles.continueButton}
              accessibilityLabel="Continue Shopping"
            >
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2E1A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  returnIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#C6E7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 14,
  },
  ticketIconBox: {
    marginRight: 10,
  },
  returnIdColumn: {
    flex: 1,
  },
  returnIdLabel: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 2,
  },
  returnIdValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },
  productThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  productInfoColumn: {
    flex: 1,
  },
  productLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  metaColumn: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  trackButton: {
    width: '100%',
    backgroundColor: '#1E7E34',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#1E7E34',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#1E7E34',
    fontSize: 14,
    fontWeight: '700',
  },
});

