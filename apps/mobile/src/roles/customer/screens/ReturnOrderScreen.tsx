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
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  BackArrowSvg,
  ShoppingBagSvg,
  ReturnBoxIllustrationSvg,
  ChevronDownSvg,
  CameraPlusSvg,
} from '../components/ContactSupportIcons';
import { RETURN_REASONS, type ReturnReasonOption } from '../components/contactSupportData';
import { ApiError } from '../../../shell/api/client';
import { gradeLabel } from '../api/catalog';
import { isReturnEligible, useOrder, useOrders, type OrderSummary } from '../api/orders';
import { RETURN_MAX_PHOTOS, useCreateReturn, type CustomerReturnRequest } from '../api/returns';
import { pickIssuePhotos, uploadIssuePhoto } from '../api/support';
import { mapProblem } from '../api/problem';
import { canStepDown, canStepUp, formatKg, formatRupees, stepKg, type Quantity } from '../utils/money';
import { formatIstDate } from '../utils/orderFormat';
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

interface ReturnPhoto {
  key: string;
  uri: string;
  uploadId: string | null;
  progress: number;
  failed: boolean;
}

const QTY_STEP = { step: '0.5', min: '0.5' };

/**
 * Return order (Figma 46:42764 / 46:42834). Server-driven:
 *  - eligible orders = own DELIVERED / PICKED_UP orders (GET /orders);
 *  - lines = Order.items (orderItemId) with a kg quantity (default the full line);
 *  - photos (<= 5): ISSUE_PHOTO signed uploads, sent as photoUploadIds (BR-204);
 *  - POST /orders/{orderId}/returns { reason, items, note, photoUploadIds }.
 */
export function ReturnOrderScreen({ onNavigate, onBack, initialOrderId }: ReturnOrderScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const ordersQuery = useOrders();
  const eligibleOrders: OrderSummary[] = (ordersQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((o) => isReturnEligible(o.status));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId ?? null);
  const effectiveOrderId = selectedOrderId ?? eligibleOrders[0]?.id ?? null;
  const orderQuery = useOrder(effectiveOrderId);
  const order = orderQuery.data;
  const [showOrderPicker, setShowOrderPicker] = useState<boolean>(false);
  /** orderItemId -> qty (kg) for the selected lines. */
  const [selected, setSelected] = useState<Record<string, Quantity>>({});
  const defaultReason: ReturnReasonOption = RETURN_REASONS[0] ?? { id: 'quality', label: 'Quality issue (damaged / spoiled)' };
  const [selectedReason, setSelectedReason] = useState<ReturnReasonOption>(defaultReason);
  const [showReasonPicker, setShowReasonPicker] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<ReturnPhoto[]>([]);
  const [created, setCreated] = useState<CustomerReturnRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const createReturn = useCreateReturn();

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  // Default: every line selected at its full quantity once the order loads.
  React.useEffect(() => {
    if (!order) return;
    setSelected(Object.fromEntries(order.items.map((it) => [it.id, it.qtyKg])));
    setFieldErrors({});
  }, [order]);

  const toggleProduct = (itemId: string, fullQty: Quantity) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[itemId] !== undefined) delete next[itemId];
      else next[itemId] = fullQty;
      return next;
    });
  };

  const stepQty = (itemId: string, fullQty: Quantity, dir: 1 | -1) => {
    setSelected((prev) => ({ ...prev, [itemId]: stepKg(prev[itemId] ?? fullQty, dir, { ...QTY_STEP, max: fullQty }) }));
  };

  const handleAddPhoto = async () => {
    const room = RETURN_MAX_PHOTOS - photos.length;
    if (room <= 0) {
      Alert.alert('Limit Reached', `You can add up to ${RETURN_MAX_PHOTOS} photos.`);
      return;
    }
    const picked = await pickIssuePhotos(room);
    for (const photo of picked.photos) {
      const key = `${photo.uri}-${Date.now()}-${Math.random()}`;
      setPhotos((prev) => [...prev, { key, uri: photo.uri, uploadId: null, progress: 0, failed: false }]);
      try {
        const uploadId = await uploadIssuePhoto(photo, (pct) =>
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, progress: pct } : p))),
        );
        setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, uploadId, progress: 100 } : p)));
      } catch {
        setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, failed: true } : p)));
      }
    }
  };

  const handleRemovePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  };

  const uploading = photos.some((p) => !p.uploadId && !p.failed);
  const lines = order ? order.items.filter((it) => selected[it.id] !== undefined) : [];

  const handleSubmit = async () => {
    if (!order) return;
    if (lines.length === 0) {
      Alert.alert('Select Product', 'Please select at least one product to return.');
      return;
    }
    setError(null);
    setFieldErrors({});
    try {
      const res = await createReturn.mutateAsync({
        orderId: order.id,
        input: {
          reason: selectedReason.label,
          items: lines.map((it) => ({ orderItemId: it.id, qty: selected[it.id] ?? it.qtyKg })),
          note: description,
          photoUploadIds: photos.flatMap((p) => (p.uploadId ? [p.uploadId] : [])),
        },
      });
      setCreated(res);
    } catch (err) {
      const p = mapProblem(err);
      if (p.silent) return;
      setFieldErrors(p.fieldErrors ?? {});
      setError(
        err instanceof ApiError && err.code === 'INVALID_STATE_TRANSITION'
          ? 'This order can be returned only after it is delivered or picked up.'
          : p.message,
      );
    }
  };

  const fieldError = (index: number) => fieldErrors[`body.items.${index}.qty`] ?? fieldErrors[`items.${index}.qty`];
  const first = lines[0];
  const firstThumb = order?.thumbnails?.find((t) => t.productName === first?.name)?.imageUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.circleIconButton} accessibilityLabel="Back">
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Order</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerTextColumn}>
            <Text style={styles.bannerTitle}>Request a Return</Text>
            <Text style={styles.bannerSubtitle}>Select the item and reason for return.</Text>
          </View>
          <View style={styles.bannerImageWrapper}>
            <ReturnBoxIllustrationSvg size={58} />
          </View>
        </View>

        {/* ── SELECT ORDER CARD (eligible orders only) ────────────────────── */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowOrderPicker(true)} style={styles.orderCard} accessibilityLabel="Select Order" testID="return-order-card">
          <View style={styles.orderIconBox}>
            <ShoppingBagSvg color="#1E7E34" size={20} />
          </View>
          <View style={styles.orderInfoColumn}>
            <Text style={styles.orderIdText}>{order?.orderNumber ?? (ordersQuery.isLoading || orderQuery.isLoading ? 'Loading…' : 'No returnable orders')}</Text>
            {order && (
              <Text style={styles.orderMetaText}>
                {formatIstDate(order.placedAt)} · {order.items.length} items
              </Text>
            )}
          </View>
          <ChevronDownSvg color="#6B7280" size={16} />
        </TouchableOpacity>

        {orderQuery.isLoading && <ActivityIndicator testID="return-loading" />}

        {/* ── SELECT PRODUCT (order lines, kg quantity) ─────────────────────── */}
        <Text style={styles.sectionTitle}>Select product</Text>
        <View style={styles.productsList}>
          {(order?.items ?? []).map((item, index) => {
            const isSelected = selected[item.id] !== undefined;
            const qty = selected[item.id] ?? item.qtyKg;
            const thumb = order?.thumbnails?.find((t) => t.productName === item.name)?.imageUrl;
            const err = fieldError(lines.findIndex((l) => l.id === item.id));
            return (
              <View key={item.id}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleProduct(item.id, item.qtyKg)}
                  style={[styles.productCard, isSelected && styles.productCardSelected]}
                  accessibilityLabel={`Select product ${item.name}`}
                  testID={`return-item-${item.id}`}
                >
                  {thumb ? <Image source={{ uri: thumb }} style={styles.productImage} resizeMode="contain" /> : <View style={styles.productImage} />}
                  <View style={styles.productTextColumn}>
                    <Text style={styles.productNameText}>
                      {item.name} <Text style={styles.productWeightText}>({gradeLabel(item.grade)} · {formatKg(item.qtyKg)})</Text>
                    </Text>
                  </View>
                  <CheckboxSquareSvg checked={isSelected} />
                </TouchableOpacity>
                {/* Return quantity (kg) [needs design review] */}
                {isSelected && (
                  <View style={styles.photosRow}>
                    <Text style={styles.productWeightText}>Return qty</Text>
                    <TouchableOpacity onPress={() => stepQty(item.id, item.qtyKg, -1)} disabled={!canStepDown(qty, QTY_STEP)} testID={`return-dec-${item.id}`} accessibilityLabel="Decrease quantity">
                      <Text style={styles.reasonSelectorText}> − </Text>
                    </TouchableOpacity>
                    <Text style={styles.reasonSelectorText}>{formatKg(qty)}</Text>
                    <TouchableOpacity onPress={() => stepQty(item.id, item.qtyKg, 1)} disabled={!canStepUp(qty, { ...QTY_STEP, max: item.qtyKg })} accessibilityLabel="Increase quantity">
                      <Text style={styles.reasonSelectorText}> + </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {!!err && (
                  <Text style={styles.charCounter} testID={`return-item-error-${index}`}>
                    {err}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Reason for return</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowReasonPicker(true)} style={styles.reasonSelector} accessibilityLabel="Reason for return selector">
          <Text style={styles.reasonSelectorText}>{selectedReason.label}</Text>
          <ChevronDownSvg color="#6B7280" size={16} />
        </TouchableOpacity>
        {!!(fieldErrors['body.reason'] ?? fieldErrors['reason']) && <Text style={styles.charCounter}>{fieldErrors['body.reason'] ?? fieldErrors['reason']}</Text>}

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
            testID="return-note"
          />
          <Text style={styles.charCounter}>{description.length}/500</Text>
        </View>

        {/* ── PHOTOS (<= 5, ISSUE_PHOTO uploads) ─────────────────────────────── */}
        <Text style={styles.sectionTitle}>Add Photos (optional)</Text>
        <View style={styles.photosRow}>
          {photos.length < RETURN_MAX_PHOTOS && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => void handleAddPhoto()} style={styles.addPhotoButton} accessibilityLabel="Add Photo" testID="return-add-photo">
              <CameraPlusSvg />
            </TouchableOpacity>
          )}
          {photos.map((photo) => (
            <View key={photo.key} style={styles.photoThumbnailWrapper} testID="return-photo">
              <Image source={{ uri: photo.uri }} style={[styles.photoThumbnail, !photo.uploadId && { opacity: 0.5 }]} resizeMode="cover" />
              {!photo.uploadId && !photo.failed && <ActivityIndicator style={{ position: 'absolute', top: 20, left: 20 }} />}
              {photo.failed && <Text style={styles.photoRemoveText}>!</Text>}
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleRemovePhoto(photo.key)} style={styles.photoRemoveBadge} accessibilityLabel="Remove photo">
                <Text style={styles.photoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {!!error && (
          <Text style={styles.charCounter} accessibilityRole="alert" testID="return-error">
            {error}
          </Text>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handleSubmit()}
          disabled={!order || uploading || createReturn.isPending}
          style={[styles.submitButton, (!order || uploading) && { opacity: 0.6 }]}
          accessibilityLabel="Request Return"
          testID="return-submit"
        >
          {createReturn.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Request Return</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showOrderPicker} transparent animationType="fade" onRequestClose={() => setShowOrderPicker(false)}>
        <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setShowOrderPicker(false)}>
          <View style={styles.pickerDialog}>
            <Text style={styles.pickerTitle}>Select Order</Text>
            {eligibleOrders.length === 0 && <Text style={styles.pickerItemSub}>Orders can be returned after delivery or pickup.</Text>}
            {eligibleOrders.map((o) => {
              const active = o.id === effectiveOrderId;
              return (
                <TouchableOpacity
                  key={o.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedOrderId(o.id);
                    setShowOrderPicker(false);
                  }}
                  style={[styles.pickerItem, active && styles.pickerItemActive]}
                >
                  <View style={styles.pickerItemLeft}>
                    <ShoppingBagSvg color={active ? '#1E7E34' : '#6B7280'} size={18} />
                    <View style={styles.pickerItemTexts}>
                      <Text style={[styles.pickerItemTitle, active && styles.pickerItemTitleActive]}>{o.orderNumber}</Text>
                      <Text style={styles.pickerItemSub}>
                        {formatIstDate(o.placedAt)} · {o.itemCount ?? 0} items
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.pickerItemAmount}>{formatRupees(o.totalAmount)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showReasonPicker} transparent animationType="fade" onRequestClose={() => setShowReasonPicker(false)}>
        <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setShowReasonPicker(false)}>
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
                  <Text style={[styles.pickerItemTitle, active && styles.pickerItemTitleActive]}>{reason.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Return created: track it on the order (returns have no tracking screen yet) [needs design review] */}
      <ReturnSubmittedModal
        visible={!!created}
        onClose={() => setCreated(null)}
        returnId={created ? `${created.id.slice(0, 8).toUpperCase()} · ${created.status}` : ''}
        orderNumber={order?.orderNumber ?? ''}
        productName={first ? `${first.name} (${formatKg(selected[first.id] ?? first.qtyKg)})` : ''}
        productImage={firstThumb ? { uri: firstThumb } : undefined}
        onTrackReturn={() => {
          setCreated(null);
          if (order) onNavigate?.('OrderTracking', { orderId: order.id });
        }}
        onContinueShopping={() => {
          setCreated(null);
          onNavigate?.('Home');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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

