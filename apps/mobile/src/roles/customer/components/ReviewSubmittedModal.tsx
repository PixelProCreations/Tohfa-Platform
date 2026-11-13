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
import { ProductImages } from '../assets/images/products';
import {
  MedalRibbonSvg,
  ShoppingBagSvg,
  StarSvg,
} from './ContactSupportIcons';
import Svg, { Path } from 'react-native-svg';

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

export interface ReviewSubmittedModalProps {
  visible: boolean;
  orderNumber?: string;
  productName?: string;
  onClose: () => void;
  onReviewAnother?: (productId: string) => void;
  onContinueShopping?: () => void;
}

interface ReviewModalProduct {
  id: string;
  name: string;
  weight: string;
  image: number;
  reviewed: boolean;
  rating: number;
}

const MODAL_PRODUCTS: ReviewModalProduct[] = [
  {
    id: 'prod_1',
    name: 'Fresh apples',
    weight: '(1 kg)',
    image: ProductImages.fruitApple,
    reviewed: true,
    rating: 5,
  },
  {
    id: 'prod_2',
    name: 'Fuji',
    weight: '(1 kg)',
    image: ProductImages.fruitApple,
    reviewed: false,
    rating: 0,
  },
  {
    id: 'prod_3',
    name: 'Green Curly Lettuce',
    weight: '(1 kg)',
    image: ProductImages.foryouLettuce,
    reviewed: false,
    rating: 0,
  },
];

export const ReviewSubmittedModal: React.FC<ReviewSubmittedModalProps> = ({
  visible,
  orderNumber = 'ORD-20260715-0147',
  productName = 'Royal Gala',
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
            {/* Medal Ribbon Graphic */}
            <View style={styles.graphicContainer}>
              <MedalRibbonSvg size={60} />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Thank you for your review!</Text>
            <Text style={styles.subtitle}>
              {`Your review for ${productName} has been submitted successfully.`}
            </Text>

            {/* Order ID Banner */}
            <View style={styles.orderCard}>
              <View style={styles.orderIconBadge}>
                <ShoppingBagSvg color="#2E7D32" size={18} />
              </View>
              <View style={styles.orderTextCol}>
                <Text style={styles.orderLabel}>Order ID</Text>
                <Text style={styles.orderValue}>{orderNumber}</Text>
              </View>
            </View>

            {/* Products List */}
            <View style={styles.productsList}>
              {MODAL_PRODUCTS.map((prod) => (
                <View key={prod.id} style={styles.productRow}>
                  <Image source={prod.image} style={styles.productThumb} resizeMode="contain" />
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
                      <Text style={styles.reviewedText}>Reviewed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.writeReviewButton}
                      activeOpacity={0.7}
                      onPress={() => onReviewAnother?.(prod.id)}
                      accessibilityLabel={`Write review for ${prod.name}`}
                    >
                      <Text style={styles.writeReviewText}>Write Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => onReviewAnother?.('prod_2')}
              accessibilityLabel="Review Another Product"
            >
              <Text style={styles.primaryButtonText}>Review Another Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={onContinueShopping}
              accessibilityLabel="Continue Shopping"
            >
              <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    position: 'relative',
    shadowColor: '#000000',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  orderCard: {
    width: '100%',
    backgroundColor: '#EAF6E9',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderTextCol: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 11,
    color: '#4B5563',
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
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
    color: '#111827',
  },
  productWeight: {
    fontWeight: '400',
    color: '#6B7280',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewedText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2E7D32',
  },
  writeReviewButton: {
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  writeReviewText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#2E7D32',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
});

