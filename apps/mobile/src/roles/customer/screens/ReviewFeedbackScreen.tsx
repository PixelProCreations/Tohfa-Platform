import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import {
  BackArrowSvg,
  ProduceCrateSvg,
  ShoppingBagSvg,
  ChevronDownSvg,
  StarSvg,
  CheckboxSvg,
} from '../components/ContactSupportIcons';
import {
  SAMPLE_ORDERS,
  SAMPLE_REVIEW_ITEMS,
  REVIEW_ASPECTS,
} from '../components/contactSupportData';
import type { OrderOption, ReviewItem } from '../components/contactSupportData';
import { ReviewSubmittedModal } from '../components/ReviewSubmittedModal';

export interface ReviewFeedbackScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}

export const ReviewFeedbackScreen: React.FC<ReviewFeedbackScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderOption>(SAMPLE_ORDERS[0]!);
  const [showOrderPicker, setShowOrderPicker] = useState<boolean>(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(SAMPLE_REVIEW_ITEMS);
  const [activeReviewProductId, setActiveReviewProductId] = useState<string>('prod_1');
  const [overallRating, setOverallRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState<boolean>(false);

  const toggleAspect = (aspectId: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspectId) ? prev.filter((id) => id !== aspectId) : [...prev, aspectId],
    );
  };

  const handleRateItem = (itemId: string, rating: number) => {
    setActiveReviewProductId(itemId);
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              rating,
              statusLabel: rating >= 4 ? 'Excellent' : rating >= 3 ? 'Good' : 'Average',
            }
          : item,
      ),
    );
  };

  const activeProduct = reviewItems.find((p) => p.id === activeReviewProductId);
  const activeProductName = activeProduct?.name ?? 'Royal Gala';

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
          <Text style={styles.headerTitle}>Review & Feedback</Text>
        </View>

        {/* ── BANNER CARD ───────────────────────────────────────────────────── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTextColumn}>
            <Text style={styles.bannerTitle}>Share your experience</Text>
            <Text style={styles.bannerSubtitle}>
              Tell other about the product quality, freshness and your overall experience.
            </Text>
          </View>
          <View style={styles.bannerIllustration}>
            <ProduceCrateSvg size={58} />
          </View>
        </View>

        {/* ── SELECT ORDER CARD ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.orderCard}
          activeOpacity={0.7}
          onPress={() => setShowOrderPicker(true)}
          accessibilityLabel="Select order"
        >
          <View style={styles.orderIconBadge}>
            <ShoppingBagSvg color="#2E7D32" size={20} />
          </View>
          <View style={styles.orderTextColumn}>
            <Text style={styles.orderNumber}>{selectedOrder.orderNumber}</Text>
            <Text style={styles.orderSubtitle}>
              {`${selectedOrder.dateStr} · ${selectedOrder.itemCount} items`}
            </Text>
          </View>
          <ChevronDownSvg color="#4B5563" size={20} />
        </TouchableOpacity>

        {/* ── REVIEW YOUR ITEMS SECTION ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Review your items</Text>
        <View style={styles.reviewItemsContainer}>
          {reviewItems.map((item) => {
            const isActive = activeReviewProductId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.reviewItemCard, isActive && styles.reviewItemCardActive]}
                activeOpacity={0.8}
                onPress={() => setActiveReviewProductId(item.id)}
                accessibilityLabel={`Review ${item.name}`}
              >
                <Image source={item.image} style={styles.reviewThumb} resizeMode="contain" />
                <View style={styles.reviewInfoCol}>
                  <Text style={styles.reviewItemName}>
                    {item.name} <Text style={styles.reviewItemWeight}>{item.weight}</Text>
                  </Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                        onPress={() => handleRateItem(item.id, star)}
                        accessibilityLabel={`Rate ${item.name} ${star} stars`}
                      >
                        <StarSvg filled={star <= item.rating} size={15} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {item.rating > 0 ? (
                  <View style={styles.excellentBadge}>
                    <Text style={styles.excellentBadgeText}>{item.statusLabel || 'Excellent'}</Text>
                  </View>
                ) : (
                  <Text style={styles.tapToRateText}>Tap to rate</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── OVERALL RATING SECTION ────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Overall rating</Text>
        <View style={styles.overallRatingRow}>
          <View style={styles.overallStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                onPress={() => setOverallRating(star)}
                accessibilityLabel={`Rate overall ${star} stars`}
              >
                <StarSvg filled={star <= overallRating} size={30} />
              </TouchableOpacity>
            ))}
          </View>
          <View
            style={[
              styles.scoreBadge,
              overallRating > 0 ? styles.scoreBadgePositive : styles.scoreBadgeZero,
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                overallRating > 0 ? styles.scoreTextPositive : styles.scoreTextZero,
              ]}
            >
              {overallRating > 0 ? `${overallRating}.0` : '0.0'}
            </Text>
          </View>
        </View>

        {/* ── YOUR REVIEW SECTION ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Your Review</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Describe your issue or question..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Text style={styles.charCounter}>{`${reviewText.length}/500`}</Text>
        </View>

        {/* ── WHAT DID YOU LIKE SECTION ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>What did you like?</Text>
        <View style={styles.aspectsGrid}>
          {REVIEW_ASPECTS.map((aspect) => {
            const isChecked = selectedAspects.includes(aspect.id);
            return (
              <TouchableOpacity
                key={aspect.id}
                style={[styles.aspectCard, isChecked && styles.aspectCardChecked]}
                activeOpacity={0.8}
                onPress={() => toggleAspect(aspect.id)}
                accessibilityLabel={aspect.label}
              >
                <CheckboxSvg checked={isChecked} size={18} />
                <Text style={[styles.aspectLabel, isChecked && styles.aspectLabelChecked]}>
                  {aspect.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── SUBMIT REVIEW BUTTON ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.85}
          onPress={() => setIsSuccessModalVisible(true)}
          accessibilityLabel="Submit Review"
        >
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── ORDER SELECTION MODAL ─────────────────────────────────────────── */}
      <Modal visible={showOrderPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOrderPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select an Order</Text>
            {SAMPLE_ORDERS.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                style={[
                  styles.modalOrderItem,
                  selectedOrder.id === ord.id && styles.modalOrderItemActive,
                ]}
                onPress={() => {
                  setSelectedOrder(ord);
                  setShowOrderPicker(false);
                }}
              >
                <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                <Text style={styles.orderSubtitle}>{`${ord.dateStr} · ${ord.itemCount} items`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── REVIEW SUBMITTED POPUP (FIGMA SCREEN 66 MATCH) ────────────────── */}
      <ReviewSubmittedModal
        visible={isSuccessModalVisible}
        orderNumber={selectedOrder.orderNumber}
        productName={activeProductName}
        onClose={() => setIsSuccessModalVisible(false)}
        onReviewAnother={(prodId) => {
          setIsSuccessModalVisible(false);
          setActiveReviewProductId(prodId);
        }}
        onContinueShopping={() => {
          setIsSuccessModalVisible(false);
          onNavigate?.('Home');
        }}
      />
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

  /* Banner Card */
  bannerCard: {
    backgroundColor: '#F0F8EE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerTextColumn: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 18,
  },
  bannerIllustration: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Select Order */
  orderCard: {
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  orderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E9F7E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderTextColumn: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  orderSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 6,
  },

  /* Review your items */
  reviewItemsContainer: {
    gap: 10,
    marginBottom: 22,
  },
  reviewItemCard: {
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewItemCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0F8EE',
  },
  reviewThumb: {
    width: 38,
    height: 38,
    marginRight: 12,
  },
  reviewInfoCol: {
    flex: 1,
    gap: 4,
  },
  reviewItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  reviewItemWeight: {
    fontWeight: '400',
    color: '#374151',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  excellentBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  excellentBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2E7D32',
  },
  tapToRateText: {
    fontSize: 11.5,
    color: '#6B7280',
  },

  /* Overall Rating */
  overallRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  scoreBadgeZero: {
    backgroundColor: '#FEE2E2',
  },
  scoreBadgePositive: {
    backgroundColor: '#E8F5E9',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreTextZero: {
    color: '#EF4444',
  },
  scoreTextPositive: {
    color: '#2E7D32',
  },

  /* Your Review */
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 22,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 46,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  /* What did you like? */
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 26,
  },
  aspectCard: {
    width: '48.2%',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aspectCardChecked: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0F8EE',
  },
  aspectLabel: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '500',
    flexShrink: 1,
  },
  aspectLabelChecked: {
    color: '#2E7D32',
    fontWeight: '700',
  },

  /* Submit Button */
  submitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Order Picker Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 16,
  },
  modalOrderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOrderItemActive: {
    backgroundColor: '#F0F8EE',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});

