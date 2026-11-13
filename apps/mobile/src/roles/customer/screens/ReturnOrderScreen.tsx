import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  BackArrowSvg,
  ShoppingBagSvg,
  ReturnBoxIllustrationSvg,
  ChevronDownSvg,
  CameraPlusSvg,
} from '../components/ContactSupportIcons';
import {
  SAMPLE_ORDERS,
  SAMPLE_REVIEW_ITEMS,
  RETURN_REASONS,
  type OrderOption,
  type ReturnReasonOption,
  type ReviewItem,
} from '../components/contactSupportData';
import { ReturnSubmittedModal } from '../components/ReturnSubmittedModal';

export interface ReturnOrderScreenProps {
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
  onBack?: (() => void) | undefined;
  initialOrderId?: string | undefined;
}

const CheckboxSquareSvg = ({ checked }: { checked: boolean }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    {checked ? (
      <>
        <Rect width={20} height={20} rx={4} fill="#1E7E34" />
        <Path
          d="M6 10l3 3 5-6"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <Rect
        x={1}
        y={1}
        width={18}
        height={18}
        rx={3}
        stroke="#D1D5DB"
        strokeWidth={1.5}
        fill="#FFFFFF"
      />
    )}
  </Svg>
);

export function ReturnOrderScreen({
  onNavigate,
  onBack,
  initialOrderId = 'ord_1',
}: ReturnOrderScreenProps): React.JSX.Element {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);
  const [showOrderPicker, setShowOrderPicker] = useState<boolean>(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(['prod_1']);
  const defaultReason: ReturnReasonOption = RETURN_REASONS[0] ?? {
    id: 'quality',
    label: 'Quality issue (damaged / spoiled)',
  };
  const [selectedReason, setSelectedReason] = useState<ReturnReasonOption>(defaultReason);
  const [showReasonPicker, setShowReasonPicker] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const fallbackOrder: OrderOption = {
    id: 'ord_1',
    orderNumber: 'ORD-20261115-0039',
    dateStr: '15 Jul 2026',
    itemCount: 3,
  };
  const selectedOrder: OrderOption =
    SAMPLE_ORDERS.find((o) => o.id === selectedOrderId) ?? SAMPLE_ORDERS[0] ?? fallbackOrder;

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const fallbackProduct: ReviewItem = {
    id: 'prod_1',
    name: 'Fresh apples',
    weight: '(1 kg)',
    image: 0,
    rating: 5,
  };

  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can add up to 5 photos.');
      return;
    }
    const sampleImage = SAMPLE_REVIEW_ITEMS[0]?.image ?? 0;
    setPhotos((prev) => [...prev, sampleImage]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedProductIds.length === 0) {
      Alert.alert('Select Product', 'Please select at least one product to return.');
      return;
    }
    setShowSuccessModal(true);
  };

  const primaryProduct: ReviewItem =
    SAMPLE_REVIEW_ITEMS.find((p) => p.id === selectedProductIds[0]) ??
    SAMPLE_REVIEW_ITEMS[0] ??
    fallbackProduct;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <BackArrowSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Order</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BANNER ────────────────────────────────────────────────────── */}
        <View style={styles.banner}>
          <View style={styles.bannerTextColumn}>
            <Text style={styles.bannerTitle}>Request a Return</Text>
            <Text style={styles.bannerSubtitle}>
              Select the item and reason for return.
            </Text>
          </View>
          <View style={styles.bannerImageWrapper}>
            <ReturnBoxIllustrationSvg size={58} />
          </View>
        </View>

        {/* ── SELECT ORDER CARD ─────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowOrderPicker(true)}
          style={styles.orderCard}
          accessibilityLabel="Select Order"
        >
          <View style={styles.orderIconBox}>
            <ShoppingBagSvg color="#1E7E34" size={20} />
          </View>
          <View style={styles.orderInfoColumn}>
            <Text style={styles.orderIdText}>{selectedOrder.orderNumber}</Text>
            <Text style={styles.orderMetaText}>
              {selectedOrder.dateStr} · {selectedOrder.itemCount} items
            </Text>
          </View>
          <ChevronDownSvg color="#6B7280" size={16} />
        </TouchableOpacity>

        {/* ── SELECT PRODUCT SECTION ───────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Select product</Text>
        <View style={styles.productsList}>
          {SAMPLE_REVIEW_ITEMS.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.8}
                onPress={() => toggleProduct(product.id)}
                style={[
                  styles.productCard,
                  isSelected && styles.productCardSelected,
                ]}
                accessibilityLabel={`Select product ${product.name}`}
              >
                <Image
                  source={product.image}
                  style={styles.productImage}
                  resizeMode="contain"
                />
                <View style={styles.productTextColumn}>
                  <Text style={styles.productNameText}>
                    {product.name}{' '}
                    <Text style={styles.productWeightText}>{product.weight}</Text>
                  </Text>
                </View>
                <CheckboxSquareSvg checked={isSelected} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── REASON FOR RETURN SECTION ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Reason for return</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowReasonPicker(true)}
          style={styles.reasonSelector}
          accessibilityLabel="Reason for return selector"
        >
          <Text style={styles.reasonSelectorText}>{selectedReason.label}</Text>
          <ChevronDownSvg color="#6B7280" size={16} />
        </TouchableOpacity>

        {/* ── DESCRIBE THE ISSUE SECTION ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Describe the issue</Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your issue or question..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            style={styles.textArea}
          />
          <Text style={styles.charCounter}>{description.length}/500</Text>
        </View>

        {/* ── ADD PHOTOS (OPTIONAL) SECTION ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>Add Photos (optional)</Text>
        <View style={styles.photosRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddPhoto}
            style={styles.addPhotoButton}
            accessibilityLabel="Add Photo"
          >
            <CameraPlusSvg />
          </TouchableOpacity>

          {photos.map((img, idx) => (
            <View key={idx} style={styles.photoThumbnailWrapper}>
              <Image source={img} style={styles.photoThumbnail} resizeMode="cover" />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleRemovePhoto(idx)}
                style={styles.photoRemoveBadge}
                accessibilityLabel="Remove photo"
              >
                <Text style={styles.photoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── SUBMIT BUTTON ────────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          style={styles.submitButton}
          accessibilityLabel="Request Return"
        >
          <Text style={styles.submitButtonText}>Request Return</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── ORDER PICKER MODAL ──────────────────────────────────────────────── */}
      <Modal
        visible={showOrderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowOrderPicker(false)}
        >
          <View style={styles.pickerDialog}>
            <Text style={styles.pickerTitle}>Select Order</Text>
            {SAMPLE_ORDERS.map((order) => {
              const active = order.id === selectedOrderId;
              return (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedOrderId(order.id);
                    setShowOrderPicker(false);
                  }}
                  style={[styles.pickerItem, active && styles.pickerItemActive]}
                >
                  <View style={styles.pickerItemLeft}>
                    <ShoppingBagSvg
                      color={active ? '#1E7E34' : '#6B7280'}
                      size={18}
                    />
                    <View style={styles.pickerItemTexts}>
                      <Text
                        style={[
                          styles.pickerItemTitle,
                          active && styles.pickerItemTitleActive,
                        ]}
                      >
                        {order.orderNumber}
                      </Text>
                      <Text style={styles.pickerItemSub}>
                        {order.dateStr} · {order.itemCount} items
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.pickerItemAmount}>{order.itemCount} items</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── REASON PICKER MODAL ─────────────────────────────────────────────── */}
      <Modal
        visible={showReasonPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowReasonPicker(false)}
        >
          <View style={styles.pickerDialog}>
            <Text style={styles.pickerTitle}>Reason for Return</Text>
            {RETURN_REASONS.map((reason) => {
              const active = reason.id === selectedReason.id;
              return (
                <TouchableOpacity
                  key={reason.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedReason(reason);
                    setShowReasonPicker(false);
                  }}
                  style={[styles.pickerItem, active && styles.pickerItemActive]}
                >
                  <Text
                    style={[
                      styles.pickerItemTitle,
                      active && styles.pickerItemTitleActive,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── RETURN SUBMITTED POPUP MODAL ───────────────────────────────────── */}
      <ReturnSubmittedModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        returnId="RET-20260715-0147"
        orderNumber={selectedOrder.orderNumber}
        productName={`${primaryProduct.name} ${primaryProduct.weight}`}
        productImage={primaryProduct.image}
        onTrackReturn={() => {
          setShowSuccessModal(false);
          onNavigate?.('TrackSupportRequest', {
            supportId: 'RET-20260715-0147',
            orderNumber: selectedOrder.orderNumber,
            productName: `${primaryProduct.name} ${primaryProduct.weight}`,
            issueTypeLabel: selectedReason.label,
            submittedOn: '15 Jul 2026, 9:41 AM',
          });
        }}
        onContinueShopping={() => {
          setShowSuccessModal(false);
          onNavigate?.('Home');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF9F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  bannerTextColumn: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#5E6F5E',
    lineHeight: 16,
  },
  bannerImageWrapper: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  orderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfoColumn: {
    flex: 1,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 2,
  },
  orderMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 10,
  },
  productsList: {
    marginBottom: 18,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  productCardSelected: {
    backgroundColor: '#EFF9F0',
    borderColor: '#1E7E34',
  },
  productImage: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  productTextColumn: {
    flex: 1,
  },
  productNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  productWeightText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  reasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
  },
  reasonSelectorText: {
    fontSize: 13,
    color: '#1A2E1A',
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 18,
  },
  textArea: {
    fontSize: 13,
    color: '#1A2E1A',
    minHeight: 36,
    paddingVertical: 4,
  },
  charCounter: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  addPhotoButton: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#1E7E34',
    backgroundColor: '#EFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  photoThumbnailWrapper: {
    width: 58,
    height: 58,
    borderRadius: 10,
    position: 'relative',
    marginRight: 12,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#1E7E34',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: '#EFF9F0',
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerItemTexts: {
    marginLeft: 10,
  },
  pickerItemTitle: {
    fontSize: 13,
    color: '#1A2E1A',
  },
  pickerItemTitleActive: {
    fontWeight: '700',
    color: '#1E7E34',
  },
  pickerItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pickerItemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
  },
});

