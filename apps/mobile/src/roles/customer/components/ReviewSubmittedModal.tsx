import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  MedalRibbonSvg,
  ShoppingBagSvg,
  StarSvg,
} from './ContactSupportIcons';
import Svg, { Path } from 'react-native-svg';
import { t } from '../../../i18n/customer';
import { customerColors } from '../theme';

const ModalCloseSvg = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={customerColors.neutral.neutral700}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export interface ReviewSubmittedModalProps {
  visible: boolean;
  orderNumber?: string;
  productName?: string;
  onClose: () => void;
  onReviewAnother?: (productId: string) => void;
  onContinueShopping?: () => void;
  /** The order's lines as reviewed (one review per order covers them all). */
  products?: ReviewModalProduct[];
}

export interface ReviewModalProduct {
  id: string;
  name: string;
  weight: string;
  imageUri?: string | undefined;
  reviewed: boolean;
  rating: number;
}

export const ReviewSubmittedModal: React.FC<ReviewSubmittedModalProps> = ({
  visible,
  orderNumber = '',
  productName = '',
  products = [],
  onClose,
  onReviewAnother,
  onContinueShopping,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Right Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel={t('customer.orders.review.modal.closeDialog')}
          >
            <ModalCloseSvg />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Medal Ribbon Graphic */}
            <View style={styles.graphicContainer}>
              <MedalRibbonSvg size={60} />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>{t('customer.orders.review.modal.title')}</Text>
            <Text style={styles.subtitle}>
              {t('customer.orders.review.modal.subtitle', { product: productName })}
            </Text>

            {/* Order ID Banner */}
            <View style={styles.orderCard}>
              <View style={styles.orderIconBadge}>
                <ShoppingBagSvg color={customerColors.primary} size={18} />
              </View>
              <View style={styles.orderTextCol}>
                <Text style={styles.orderLabel}>{t('customer.orders.review.modal.orderId')}</Text>
                <Text style={styles.orderValue}>{orderNumber}</Text>
              </View>
            </View>

            {/* Products List */}
            <View style={styles.productsList}>
              {products.map((prod) => (
                <View key={prod.id} style={styles.productRow}>
                  {prod.imageUri ? <Image source={{ uri: prod.imageUri }} style={styles.productThumb} resizeMode="contain" /> : <View style={styles.productThumb} />}
                  <View style={styles.productInfoCol}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {prod.name}{' '}
                      <Text style={styles.productWeight}>{prod.weight}</Text>
                    </Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarSvg
                          key={star}
                          filled={star <= prod.rating}
                          size={14}
                        />
                      ))}
                    </View>
                  </View>

                  {prod.reviewed ? (
                    <View style={styles.reviewedBadge}>
                      <Text style={styles.reviewedText}>{t('customer.orders.review.modal.reviewed')}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.writeReviewButton}
                      activeOpacity={0.7}
                      onPress={() => onReviewAnother?.(prod.id)}
                      accessibilityLabel={t('customer.orders.review.modal.writeReviewA11y', { name: prod.name })}
                    >
                      <Text style={styles.writeReviewText}>{t('customer.orders.review.modal.writeReview')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => onReviewAnother?.('')}
              accessibilityLabel={t('customer.orders.review.modal.reviewAnother')}
            >
              <Text style={styles.primaryButtonText}>{t('customer.orders.review.modal.reviewAnother')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={onContinueShopping}
              accessibilityLabel={t('customer.orders.review.modal.continueShopping')}
            >
              <Text style={styles.secondaryButtonText}>{t('customer.orders.review.modal.continueShopping')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: customerColors.overlay.scrim55,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: customerColors.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    position: 'relative',
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: customerColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  graphicContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  orderCard: {
    width: '100%',
    backgroundColor: customerColors.palette.green.successWash,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  orderIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: customerColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderTextCol: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 11,
    color: customerColors.neutral.neutral700,
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
  },
  productsList: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productThumb: {
    width: 34,
    height: 34,
    marginRight: 10,
  },
  productInfoCol: {
    flex: 1,
    gap: 3,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
  },
  productWeight: {
    fontWeight: '400',
    color: customerColors.neutral.neutral600,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewedBadge: {
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewedText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: customerColors.primary,
  },
  writeReviewButton: {
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral600,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  writeReviewText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: customerColors.neutral.neutral800,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: customerColors.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: customerColors.white,
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: customerColors.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: customerColors.white,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: customerColors.primary,
  },
});

