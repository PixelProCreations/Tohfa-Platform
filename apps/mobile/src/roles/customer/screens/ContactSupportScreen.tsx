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
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import { ProductImages } from '../assets/images/products';
import { SupportSubmittedModal } from '../components/SupportSubmittedModal';
import { ReviewSubmittedModal } from '../components/ReviewSubmittedModal';
import { ReviewFeedbackSection } from '../components/ReviewFeedbackSection';
import {
  BackArrowSvg,
  SupportAgentSvg,
  ProduceCrateSvg,
  ShoppingBagSvg,
  ChevronDownSvg,
  CameraPlusSvg,
  CheckCircleSvg,
  EmptyCircleSvg,
  RadioSelectedSvg,
  CloseSmallSvg,
} from '../components/ContactSupportIcons';
import {
  RELATED_TABS,
  ORDER_ISSUE_TYPES,
  PRODUCT_ISSUE_TYPES,
  OTHER_ISSUE_TYPES,
  ALL_ISSUE_LABELS,
  SAMPLE_PRODUCTS,
  SAMPLE_ORDERS,
  SAMPLE_REVIEW_ITEMS,
} from '../components/contactSupportData';
import type {
  RelatedCategory,
  IssueTypeCode,
  OrderOption,
  ReviewItem,
} from '../components/contactSupportData';

export interface ContactSupportScreenProps {
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
  initialTab?: RelatedCategory | undefined;
}

export const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({
  onBack,
  onNavigate,
  initialTab = 'order',
}) => {
  const insets = useSafeAreaInsets();
  const [relatedTo, setRelatedTo] = useState<RelatedCategory>(initialTab ?? 'order');
  const [selectedOrder, setSelectedOrder] = useState<OrderOption>(SAMPLE_ORDERS[0]!);
  const [showOrderPicker, setShowOrderPicker] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(SAMPLE_PRODUCTS[0]!.id);
  const [selectedIssue, setSelectedIssue] = useState<IssueTypeCode>('product_support');
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<number[]>([ProductImages.fruitApple, ProductImages.fruitApple]);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState<boolean>(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState<boolean>(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(SAMPLE_REVIEW_ITEMS);
  const [activeReviewProductId, setActiveReviewProductId] = useState<string>('prod_1');
  const [overallRating, setOverallRating] = useState<number>(0);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos.');
      return;
    }
    setPhotos((prev) => [...prev, ProductImages.fruitApple]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  let bannerTitle = "We're Here to help!";
  let bannerSubtitle = 'Get quick support for orders, payments, products or any other issues.';
  if (relatedTo === 'product') {
    bannerTitle = 'Need help with an ordered product?';
    bannerSubtitle = "Tell us what's wrong and we'll get it sorted for you.";
  } else if (relatedTo === 'other') {
    bannerTitle = 'General support';
    bannerSubtitle = "Need help with something else? Let us know and we'll assist you.";
  } else if (relatedTo === 'review') {
    bannerTitle = 'Share your experience';
    bannerSubtitle = 'Tell other about the product quality, freshness and your overall experience.';
  }

  const currentIssueTypes =
    relatedTo === 'product'
      ? PRODUCT_ISSUE_TYPES
      : relatedTo === 'other'
        ? OTHER_ISSUE_TYPES
        : ORDER_ISSUE_TYPES;

  let ctaButtonText = 'Send to Support';
  if (relatedTo === 'product' || relatedTo === 'other') {
    ctaButtonText = 'Submit Request';
  } else if (relatedTo === 'review') {
    ctaButtonText = 'Submit Review';
  }

  const handleSelectRelated = (tabId: RelatedCategory) => {
    setRelatedTo(tabId);
    if (tabId === 'product') {
      setSelectedIssue('quality_issue');
      setPhotos([ProductImages.fruitApple, ProductImages.fruitApple]);
    } else if (tabId === 'other') {
      setSelectedIssue('account_profile');
      setPhotos([]);
    } else if (tabId === 'review') {
      setPhotos([]);
    } else {
      setSelectedIssue('product_support');
      setPhotos([ProductImages.fruitApple, ProductImages.fruitApple]);
    }
  };

  const selectedProduct = SAMPLE_PRODUCTS.find((p) => p.id === selectedProductId);
  const selectedProductName = `${selectedProduct?.name ?? 'Royal Gala'} ${selectedProduct?.weight ?? '(1 kg)'}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.circleIconButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {relatedTo === 'review' ? 'Review & Feedback' : 'Contact Support'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BANNER CARD ───────────────────────────────────────────────────── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTextColumn}>
            <Text style={styles.bannerTitle}>{bannerTitle}</Text>
            <Text style={styles.bannerSubtitle}>{bannerSubtitle}</Text>
          </View>
          <View style={styles.bannerIllustration}>
            {relatedTo === 'review' ? <ProduceCrateSvg size={68} /> : <SupportAgentSvg size={68} />}
          </View>
        </View>

        {/* ── RELATED TO SECTION ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Related to</Text>
        <View style={styles.relatedRow}>
          {RELATED_TABS.map((tab) => {
            const isSelected = relatedTo === tab.id;
            const IconComp = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.relatedTab, isSelected && styles.relatedTabSelected]}
                onPress={() => handleSelectRelated(tab.id)}
                activeOpacity={0.8}
                accessibilityLabel={`Related to ${tab.label}`}
              >
                <IconComp color={isSelected ? '#2E7D32' : '#6B7280'} size={18} />
                <Text style={[styles.relatedTabText, isSelected && styles.relatedTabTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── SELECT ORDER SECTION ──────────────────────────────────────────── */}
        {(relatedTo === 'order' || relatedTo === 'product' || relatedTo === 'review') && (
          <>
            <Text style={styles.sectionTitle}>Select order</Text>
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
          </>
        )}

        {/* ── REVIEW TAB CONTENT (FIGMA SCREEN 65 MATCH) ────────────────────── */}
        {relatedTo === 'review' ? (
          <ReviewFeedbackSection
            reviewItems={reviewItems}
            activeReviewProductId={activeReviewProductId}
            setActiveReviewProductId={setActiveReviewProductId}
            setReviewItems={setReviewItems}
            overallRating={overallRating}
            setOverallRating={setOverallRating}
            description={description}
            setDescription={setDescription}
            selectedAspects={selectedAspects}
            setSelectedAspects={setSelectedAspects}
          />
        ) : (
          <>
            {/* ── SELECT PRODUCT SECTION ────────────────────────────────────────── */}
            {(relatedTo === 'order' || relatedTo === 'product') && (
              <>
                <Text style={styles.sectionTitle}>Select product</Text>
                <View style={styles.productListContainer}>
                  {SAMPLE_PRODUCTS.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[styles.productCard, isSelected && styles.productCardSelected]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedProductId(prod.id)}
                        accessibilityLabel={`Select product ${prod.name}`}
                      >
                        <Image source={prod.image} style={styles.productThumb} resizeMode="contain" />
                        <Text style={styles.productName}>
                          {prod.name} <Text style={styles.productWeight}>{prod.weight}</Text>
                        </Text>
                        <View style={styles.radioWrapper}>
                          {isSelected ? <RadioSelectedSvg /> : <EmptyCircleSvg />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── ISSUE TYPE SECTION ────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Issue type</Text>
            <View style={styles.issueGrid}>
              {currentIssueTypes.map((issue) => {
                const isSelected = selectedIssue === issue.code;
                const IconComp = issue.icon;
                return (
                  <TouchableOpacity
                    key={issue.code}
                    style={[styles.issueCard, isSelected && styles.issueCardSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedIssue(issue.code)}
                    accessibilityLabel={issue.label}
                  >
                    <View style={styles.issueCardLeft}>
                      <IconComp color={isSelected ? '#2E7D32' : '#6B7280'} size={18} />
                      <View style={styles.issueLabelCol}>
                        <Text style={[styles.issueCardLabel, isSelected && styles.issueCardLabelSelected]} numberOfLines={2}>
                          {issue.label}
                        </Text>
                        {issue.sublabel ? (
                          <Text style={styles.issueCardSublabel}>{issue.sublabel}</Text>
                        ) : null}
                      </View>
                    </View>
                    {isSelected ? <CheckCircleSvg /> : <EmptyCircleSvg />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── TELL US MORE SECTION ──────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Tell us more</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Describe your issue or question..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.charCounter}>{`${description.length}/500`}</Text>
            </View>

            {/* ── ADD PHOTOS (OPTIONAL) SECTION ─────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Add Photos (optional)</Text>
            <View style={styles.photosRow}>
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto} activeOpacity={0.7} accessibilityLabel="Add photo">
                <CameraPlusSvg />
              </TouchableOpacity>

              {photos.map((photoUri, index) => (
                <View key={index} style={styles.photoThumbnailContainer}>
                  <Image source={photoUri} style={styles.photoThumbnail} />
                  <TouchableOpacity
                    style={styles.photoRemoveBadge}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Remove photo"
                  >
                    <CloseSmallSvg />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {relatedTo === 'product' && (
              <Text style={styles.photosHelperText}>You can add up to 5 images (JPG, PNG)</Text>
            )}
          </>
        )}

        {/* ── SUBMIT / SEND TO SUPPORT BUTTON ────────────────────────────────── */}
        <TouchableOpacity
          style={styles.sendButton}
          activeOpacity={0.85}
          onPress={() => {
            if (relatedTo === 'review') {
              setIsReviewModalVisible(true);
            } else {
              setIsSuccessModalVisible(true);
            }
          }}
          accessibilityLabel={ctaButtonText}
        >
          <Text style={styles.sendButtonText}>{ctaButtonText}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── ORDER SELECTION MODAL ─────────────────────────────────────────── */}
      <Modal visible={showOrderPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOrderPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select an Order</Text>
            {SAMPLE_ORDERS.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                style={[styles.modalOrderItem, selectedOrder.id === ord.id && styles.modalOrderItemActive]}
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

      {/* ── EXACT POPUP (FIGMA DESIGN MATCH) ──────────────────────────────── */}
      <SupportSubmittedModal
        visible={isSuccessModalVisible}
        orderNumber={relatedTo === 'other' ? 'N/A' : selectedOrder.orderNumber}
        productName={relatedTo === 'other' ? 'N/A' : selectedProductName}
        issueTypeLabel={ALL_ISSUE_LABELS[selectedIssue]}
        submittedOn="15 Nov 2026, 9:41 AM"
        supportId="SUP-20261115-0039"
        onClose={() => setIsSuccessModalVisible(false)}
        onTrackRequest={() => {
          setIsSuccessModalVisible(false);
          onNavigate?.('TrackSupportRequest', {
            supportId: 'SUP-20261115-0039',
            orderNumber: relatedTo === 'other' ? 'ORD-20260712-0028' : selectedOrder.orderNumber,
            productName: relatedTo === 'other' ? 'Royal Gala (1 kg)' : selectedProductName,
            issueTypeLabel: ALL_ISSUE_LABELS[selectedIssue],
            submittedOn: '15 Nov 2026, 9:41 AM',
          });
        }}
        onContinueShopping={() => {
          setIsSuccessModalVisible(false);
          onNavigate?.('Home');
        }}
      />

      {/* ── REVIEW SUBMITTED POPUP (FIGMA SCREEN 66 MATCH) ────────────────── */}
      <ReviewSubmittedModal
        visible={isReviewModalVisible}
        orderNumber={selectedOrder.orderNumber}
        productName="Royal Gala"
        onClose={() => setIsReviewModalVisible(false)}
        onReviewAnother={(prodId) => {
          setIsReviewModalVisible(false);
          setActiveReviewProductId(prodId);
        }}
        onContinueShopping={() => {
          setIsReviewModalVisible(false);
          onNavigate?.('Home');
        }}
      />
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 12,
    paddingBottom: 48,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: customerFonts.editorial,
    color: customerColors.heading,
  },

  /* Banner */
  bannerCard: {
    backgroundColor: '#F0F8EE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  bannerTextColumn: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTitle: {
    fontSize: 20,
    fontFamily: customerFonts.editorial,
    color: customerColors.heading,
    lineHeight: 24,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: customerFonts.regular,
    color: customerColors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  bannerIllustration: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 16,
    fontFamily: customerFonts.bold,
    color: customerColors.heading,
    marginBottom: 10,
    marginTop: 14,
  },

  /* Related to tabs */
  relatedRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  relatedTab: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  relatedTabSelected: {
    borderColor: customerColors.primary,
    backgroundColor: customerColors.selected,
  },
  relatedTabText: {
    fontSize: 13,
    fontFamily: customerFonts.semibold,
    color: customerColors.muted,
  },
  relatedTabTextSelected: {
    color: customerColors.primary,
    fontFamily: customerFonts.bold,
  },

  /* Select Order Card */
  orderCard: {
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    fontFamily: customerFonts.bold,
    color: customerColors.heading,
  },
  orderSubtitle: {
    fontSize: 12.5,
    fontFamily: customerFonts.regular,
    color: customerColors.muted,
    marginTop: 2,
  },

  /* Select Product */
  productListContainer: {
    gap: 10,
    marginBottom: 20,
  },
  productCard: {
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCardSelected: {
    borderColor: customerColors.primary,
    backgroundColor: customerColors.selected,
  },
  productThumb: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontFamily: customerFonts.semibold,
    color: customerColors.heading,
  },
  productWeight: {
    fontFamily: customerFonts.regular,
    color: customerColors.muted,
  },
  radioWrapper: {
    marginLeft: 8,
  },

  /* Issue Type Grid */
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  issueCard: {
    width: '48.2%',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  issueCardSelected: {
    borderColor: customerColors.primary,
    backgroundColor: customerColors.selected,
  },
  issueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 4,
  },
  issueLabelCol: {
    flex: 1,
    justifyContent: 'center',
  },
  issueCardLabel: {
    fontSize: 12.5,
    fontFamily: customerFonts.semibold,
    color: customerColors.muted,
    flexShrink: 1,
  },
  issueCardSublabel: {
    fontSize: 9.5,
    fontFamily: customerFonts.regular,
    color: customerColors.muted,
    marginTop: 1,
  },
  issueCardLabelSelected: {
    color: customerColors.primary,
    fontFamily: customerFonts.bold,
  },

  /* Tell us more */
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 20,
  },
  textInput: {
    fontSize: 14,
    fontFamily: customerFonts.regular,
    color: customerColors.body,
    minHeight: 46,
    paddingTop: 8,
    paddingBottom: 4,
    textAlignVertical: 'top',
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    fontFamily: customerFonts.semibold,
    color: customerColors.muted,
    marginTop: 4,
  },

  /* Add Photos */
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  addPhotoButton: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoThumbnailContainer: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'visible',
    position: 'relative',
  },
  photoThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  photosHelperText: {
    fontSize: 12,
    fontFamily: customerFonts.regular,
    color: customerColors.muted,
    marginTop: -16,
    marginBottom: 24,
  },

  /* CTA Button */
  sendButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: customerFonts.bold,
    color: '#FFFFFF',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: customerFonts.bold,
    color: customerColors.heading,
    marginBottom: 16,
  },
  modalOrderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOrderItemActive: {
    backgroundColor: '#F0F8EE',
  },
});
