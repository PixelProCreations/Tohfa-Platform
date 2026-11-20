import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { NetworkError } from '../../../shell/api/client';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import { SupportSubmittedModal } from '../components/SupportSubmittedModal';
import {
  BackArrowSvg,
  SupportAgentSvg,
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
} from '../components/contactSupportData';
import type {
  RelatedCategory,
  IssueTypeCode,
} from '../components/contactSupportData';
import {
  DESCRIPTION_MAX,
  MAX_TICKET_PHOTOS,
  buildTicketDescription,
  buildTicketSubject,
  capPhotos,
  formatSupportDate,
  formatSupportDateTime,
  issueLabelFromSubject,
  issueToCategory,
  pickIssuePhotos,
  productFromDescription,
  remainingPhotoSlots,
  uploadIssuePhoto,
  useCreateSupportTicket,
  useSupportOrders,
  validateTicketDraft,
  type CustomerTicketDetail,
  type PickedPhoto,
  type SupportOrderOption,
} from '../api/support';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

export interface ContactSupportScreenProps {
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
  initialTab?: RelatedCategory | undefined;
}

interface PhotoItem {
  key: string;
  photo: PickedPhoto;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  uploadId?: string;
}

let photoSeq = 0;

export const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({
  onBack,
  onNavigate,
  initialTab = 'order',
}) => {
  const insets = useSafeAreaInsets();
  // The old in-screen 'review' tab (demo SAMPLE_REVIEW_ITEMS, fake submit) is gone: order reviews
  // live in ReviewFeedbackScreen (POST /orders/{id}/review). A stale 'review' param opens 'order'.
  const [relatedTo, setRelatedTo] = useState<RelatedCategory>(
    initialTab === undefined || initialTab === 'review' ? 'order' : initialTab,
  );
  const ordersQuery = useSupportOrders();
  const orders = ordersQuery.data ?? [];
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderPicker, setShowOrderPicker] = useState<boolean>(false);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueTypeCode>('product_support');
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CustomerTicketDetail | null>(null);
  const createTicket = useCreateSupportTicket();

  const selectedOrder: SupportOrderOption | null =
    orders.find((o) => o.id === selectedOrderId) ?? (orders.length > 0 ? orders[0]! : null);
  const needsOrder = relatedTo === 'order' || relatedTo === 'product';
  const uploading = photos.some((p) => p.status === 'uploading');
  const hasFailedPhoto = photos.some((p) => p.status === 'error');

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const patchPhoto = (key: string, patch: Partial<PhotoItem>) =>
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const startUpload = async (item: PhotoItem) => {
    patchPhoto(item.key, { status: 'uploading', progress: 0 });
    try {
      const uploadId = await uploadIssuePhoto(item.photo, (pct) => patchPhoto(item.key, { progress: pct }));
      patchPhoto(item.key, { status: 'done', uploadId, progress: 100 });
    } catch {
      patchPhoto(item.key, { status: 'error' });
    }
  };

  const handleAddPhoto = async () => {
    const slots = remainingPhotoSlots(photos.length);
    if (slots <= 0) {
      Alert.alert(t('customer.contact.photoLimitTitle'), t('customer.contact.photoLimitBody', { max: MAX_TICKET_PHOTOS }));
      return;
    }
    setPhotoNotice(null);
    try {
      const { photos: picked, rejected } = await pickIssuePhotos(slots);
      if (rejected > 0) setPhotoNotice(t('customer.contact.photoTypeNotice'));
      const items: PhotoItem[] = capPhotos<PhotoItem>(
        [],
        picked.map((photo) => ({ key: `p${(photoSeq += 1)}`, photo, status: 'uploading' as const, progress: 0 })),
      ).slice(0, slots);
      if (items.length === 0) return;
      setPhotos((prev) => [...prev, ...items]);
      items.forEach((item) => void startUpload(item));
    } catch {
      setPhotoNotice(t('customer.contact.photoOpenError'));
    }
  };

  const handleRemovePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  };

  let bannerTitle = t('customer.contact.banner.order.title');
  let bannerSubtitle = t('customer.contact.banner.order.subtitle');
  if (relatedTo === 'product') {
    bannerTitle = t('customer.contact.banner.product.title');
    bannerSubtitle = t('customer.contact.banner.product.subtitle');
  } else if (relatedTo === 'other') {
    bannerTitle = t('customer.contact.banner.other.title');
    bannerSubtitle = t('customer.contact.banner.other.subtitle');
  }

  const currentIssueTypes =
    relatedTo === 'product'
      ? PRODUCT_ISSUE_TYPES
      : relatedTo === 'other'
        ? OTHER_ISSUE_TYPES
        : ORDER_ISSUE_TYPES;

  let ctaButtonText = t('customer.contact.cta.send');
  if (relatedTo === 'product' || relatedTo === 'other') {
    ctaButtonText = t('customer.contact.cta.submit');
  }

  const handleSelectRelated = (tabId: RelatedCategory) => {
    setRelatedTo(tabId);
    setSubmitError(null);
    if (tabId === 'product') {
      setSelectedIssue('quality_issue');
    } else if (tabId === 'other') {
      setSelectedIssue('account_profile');
      setPhotos([]);
    } else {
      setSelectedIssue('product_support');
    }
  };

  const draftProblem = validateTicketDraft({
    relatedTo,
    orderId: selectedOrder?.id ?? null,
    description,
    photosUploading: uploading,
  });
  const canSubmit = draftProblem === null && !hasFailedPhoto && !createTicket.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    const issueLabel = ALL_ISSUE_LABELS[selectedIssue];
    const orderNumber = needsOrder ? selectedOrder?.orderNumber ?? null : null;
    const photoUploadIds = photos.flatMap((p) => (p.uploadId ? [p.uploadId] : []));
    try {
      const ticket = await createTicket.mutateAsync({
        category: issueToCategory(selectedIssue),
        subject: buildTicketSubject(issueLabel, orderNumber),
        description: buildTicketDescription(description, relatedTo === 'product' ? selectedProductName : null),
        ...(needsOrder && selectedOrder ? { orderId: selectedOrder.id } : {}),
        ...(photoUploadIds.length > 0 ? { photoUploadIds } : {}),
      });
      setCreated(ticket);
    } catch (err) {
      const e = mapProblem(err);
      if (e.silent) return;
      // After a lost response the ticket may exist. Resubmitting the unchanged form reuses the
      // attempt's Idempotency-Key (BR-212), so the server replays that ticket instead of duplicating it.
      const unsure = err instanceof NetworkError;
      setSubmitError(unsure ? t('customer.contact.submitUnsure', { message: e.message }) : e.message);
    }
  };

  const draftHint =
    draftProblem === 'order_required'
      ? t('customer.contact.hint.orderRequired')
      : draftProblem === 'photos_uploading'
        ? t('customer.contact.hint.photosUploading')
        : null;

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
            accessibilityLabel={t('customer.contact.back')}
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('customer.contact.title')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onNavigate?.('CustomerSupport')}
          accessibilityLabel={t('customer.contact.myRequests')}
          style={{ marginLeft: 'auto' }}
        >
          <Text style={{ color: customerColors.brand, fontWeight: '700', fontSize: 13 }}>{t('customer.contact.myRequests')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── BANNER CARD ───────────────────────────────────────────────────── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTextColumn}>
            <Text style={styles.bannerTitle}>{bannerTitle}</Text>
            <Text style={styles.bannerSubtitle}>{bannerSubtitle}</Text>
          </View>
          <View style={styles.bannerIllustration}>
            <SupportAgentSvg size={68} />
          </View>
        </View>

        {/* ── RELATED TO SECTION ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t('customer.contact.relatedTo')}</Text>
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
                accessibilityLabel={t('customer.contact.relatedToA11y', { label: tab.label })}
              >
                <IconComp color={isSelected ? customerColors.primary : customerColors.neutral.neutral600} size={18} />
                <Text style={[styles.relatedTabText, isSelected && styles.relatedTabTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── SELECT ORDER SECTION ──────────────────────────────────────────── */}
        {(relatedTo === 'order' || relatedTo === 'product') && (
          <>
            <Text style={styles.sectionTitle}>{t('customer.contact.selectOrder')}</Text>
            {ordersQuery.isLoading ? (
              <ActivityIndicator accessibilityLabel={t('customer.contact.ordersLoading')} />
            ) : ordersQuery.isError ? (
              <TouchableOpacity onPress={() => void ordersQuery.refetch()} accessibilityLabel={t('customer.contact.ordersRetryA11y')}>
                <Text style={{ color: customerColors.shared.error }}>{t('customer.contact.ordersError')}</Text>
              </TouchableOpacity>
            ) : selectedOrder === null ? (
              <Text style={styles.orderSubtitle}>{t('customer.contact.noOrders')}</Text>
            ) : (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => setShowOrderPicker(true)}
                accessibilityLabel={t('customer.contact.selectOrderA11y')}
              >
                <View style={styles.orderIconBadge}>
                  <ShoppingBagSvg color={customerColors.primary} size={20} />
                </View>
                <View style={styles.orderTextColumn}>
                  <Text style={styles.orderNumber}>{selectedOrder.orderNumber}</Text>
                  <Text style={styles.orderSubtitle}>
                    {`${formatSupportDate(selectedOrder.placedAt)}${selectedOrder.itemCount !== null ? ` · ${t('customer.contact.itemCount', { count: selectedOrder.itemCount })}` : ''}`}
                  </Text>
                </View>
                <ChevronDownSvg color={customerColors.neutral.neutral700} size={20} />
              </TouchableOpacity>
            )}
          </>
        )}

        <>
            {/* ── SELECT PRODUCT SECTION (names from the order; folded into the description) ── */}
            {relatedTo === 'product' && selectedOrder !== null && selectedOrder.productNames.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('customer.contact.selectProduct')}</Text>
                <View style={styles.productListContainer}>
                  {selectedOrder.productNames.map((name) => {
                    const isSelected = selectedProductName === name;
                    return (
                      <TouchableOpacity
                        key={name}
                        style={[styles.productCard, isSelected && styles.productCardSelected]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedProductName(name)}
                        accessibilityLabel={t('customer.contact.selectProductA11y', { name })}
                      >
                        <Text style={[styles.productName, { flex: 1 }]}>{name}</Text>
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
            <Text style={styles.sectionTitle}>{t('customer.contact.issueType')}</Text>
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
                      <IconComp color={isSelected ? customerColors.primary : customerColors.neutral.neutral600} size={18} />
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
            <Text style={styles.sectionTitle}>{t('customer.contact.tellMore')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('customer.contact.descriptionPlaceholder')}
                placeholderTextColor={customerColors.neutral.neutral500}
                multiline
                maxLength={DESCRIPTION_MAX}
                value={description}
                onChangeText={setDescription}
                accessibilityLabel={t('customer.contact.descriptionA11y')}
              />
              <Text style={styles.charCounter}>{`${description.length}/${DESCRIPTION_MAX}`}</Text>
            </View>

            {/* ── ADD PHOTOS (OPTIONAL) SECTION ─────────────────────────────────── */}
            {(
              <>
                <Text style={styles.sectionTitle}>{t('customer.contact.addPhotos')}</Text>
                <View style={styles.photosRow}>
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => void handleAddPhoto()}
                    activeOpacity={0.7}
                    accessibilityLabel={t('customer.contact.addPhotoA11y')}
                  >
                    <CameraPlusSvg />
                  </TouchableOpacity>

                  {photos.map((p) => (
                    <View key={p.key} style={styles.photoThumbnailContainer}>
                      <Image source={{ uri: p.photo.uri }} style={styles.photoThumbnail} />
                      {p.status === 'uploading' ? (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: customerColors.overlay.white60 }}>
                          <ActivityIndicator accessibilityLabel={t('customer.contact.photoUploading')} />
                          <Text style={{ fontSize: 10 }}>{`${Math.round(p.progress)}%`}</Text>
                        </View>
                      ) : null}
                      {p.status === 'error' ? (
                        <TouchableOpacity
                          onPress={() => void startUpload(p)}
                          accessibilityLabel={t('customer.contact.photoRetryA11y')}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(220,38,38,0.7)' }}
                        >
                          <Text style={{ color: customerColors.white, fontSize: 10, fontWeight: '700' }}>{t('customer.contact.retry')}</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        style={styles.photoRemoveBadge}
                        onPress={() => handleRemovePhoto(p.key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={t('customer.contact.removePhotoA11y')}
                      >
                        <CloseSmallSvg />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <Text style={styles.photosHelperText}>{t('customer.contact.photosHelper', { max: MAX_TICKET_PHOTOS })}</Text>
                {photoNotice !== null ? <Text style={{ color: customerColors.shared.error, fontSize: 12 }}>{photoNotice}</Text> : null}
              </>
            )}
        </>

        {submitError !== null ? (
          <Text style={{ color: customerColors.shared.error, fontSize: 12, marginTop: 8 }} accessibilityRole="alert">
            {submitError}
          </Text>
        ) : null}
        {draftHint !== null ? (
          <Text style={{ color: customerColors.neutral.neutral600, fontSize: 12, marginTop: 8 }}>{draftHint}</Text>
        ) : null}

        {/* ── SUBMIT / SEND TO SUPPORT BUTTON ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.sendButton, !canSubmit && { opacity: 0.5 }]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}
          accessibilityLabel={ctaButtonText}
        >
          {createTicket.isPending ? (
            <ActivityIndicator color={customerColors.white} />
          ) : (
            <Text style={styles.sendButtonText}>{ctaButtonText}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── ORDER SELECTION MODAL ─────────────────────────────────────────── */}
      <Modal visible={showOrderPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOrderPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('customer.contact.selectOrderModal')}</Text>
            {orders.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                style={[styles.modalOrderItem, selectedOrder?.id === ord.id && styles.modalOrderItemActive]}
                onPress={() => {
                  setSelectedOrderId(ord.id);
                  setSelectedProductName(null);
                  setShowOrderPicker(false);
                }}
              >
                <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                <Text style={styles.orderSubtitle}>
                  {`${formatSupportDate(ord.placedAt)}${ord.itemCount !== null ? ` · ${t('customer.contact.itemCount', { count: ord.itemCount })}` : ''}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── SUBMITTED POPUP (real ticket) ─────────────────────────────────── */}
      <SupportSubmittedModal
        visible={created !== null}
        orderNumber={created?.orderNumber ?? t('customer.contact.na')}
        productName={created ? productFromDescription(created.description) ?? t('customer.contact.na') : t('customer.contact.na')}
        issueTypeLabel={created ? issueLabelFromSubject(created.subject, created.orderNumber) : ''}
        submittedOn={created ? formatSupportDateTime(created.createdAt) : ''}
        supportId={created?.ticketNumber ?? ''}
        onClose={() => setCreated(null)}
        onTrackRequest={() => {
          const id = created?.id;
          setCreated(null);
          onNavigate?.('TrackSupportRequest', { ticketId: id });
        }}
        onContinueShopping={() => {
          setCreated(null);
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
    backgroundColor: customerColors.white,
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
    backgroundColor: customerColors.white,
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
    borderColor: customerColors.heading,
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
    backgroundColor: customerColors.palette.green.paleMint,
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
    borderColor: customerColors.neutral.neutral300,
    backgroundColor: customerColors.white,
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
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 12,
    backgroundColor: customerColors.white,
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
    backgroundColor: customerColors.selected,
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
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 12,
    backgroundColor: customerColors.white,
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
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 12,
    backgroundColor: customerColors.white,
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
    borderBottomColor: customerColors.neutral.neutral300,
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
    borderColor: customerColors.palette.green.emeraldLight,
    backgroundColor: customerColors.shared.successLight,
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
    borderColor: customerColors.neutral.neutral300,
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: customerColors.neutral.black,
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
    shadowColor: customerColors.neutral.black,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: customerFonts.bold,
    color: customerColors.white,
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
    backgroundColor: customerColors.white,
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
    borderBottomColor: customerColors.neutral.neutral100,
  },
  modalOrderItemActive: {
    backgroundColor: customerColors.palette.green.paleMint,
  },
});
