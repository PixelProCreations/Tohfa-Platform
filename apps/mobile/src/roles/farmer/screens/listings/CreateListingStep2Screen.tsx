import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import { formatMoneyAmount } from '../../api/wallet';
import {
  buildCreateListingInput,
  checkAskingPrice,
  checkQuantity,
  createIdempotencyKeyCache,
  createListing,
  formatKg,
  getFairPriceCeilings,
  lineTotal,
  listingErrorMessageKey,
  SELLABLE_GRADES,
  type CeilingLookup,
  type CreateListingFormError,
  type Grade,
  type Listing,
  type ListingCropChoice,
} from '../../api/listings';
import { gradeLabel, moneyOrDash, tk } from './listingFormat';

// Custom Icons
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = ({ color = colors.brandGreen, size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhotoIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={P.greyLight1} strokeWidth="1.5" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={P.greyLight1} />
    <Path d="M21 15L16 10L5 21" stroke={P.greyLight1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldCheckOrange = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S4 18 4 12V6L12 2L20 6V12C20 18 12 22 12 22Z" stroke={P.deepOrange800} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12L11 14L15 10" stroke={P.deepOrange800} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldCheckGreen = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S4 18 4 12V6L12 2L20 6V12C20 18 12 22 12 22Z" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12L11 14L15 10" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusCircle = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={P.grey500} strokeWidth="2" />
    <Path d="M12 8V16M8 12H16" stroke={P.grey500} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CheckCircleGreen = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={colors.brandGreen} strokeWidth="1.5" />
    <Path d="M8 12L11 15L16 9" stroke={colors.brandGreen} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIconSmall = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L19 7" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TagIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20.59 13.41L13.42 20.58A2 2 0 0 1 12 21A2 2 0 0 1 10.59 20.58L2 12V2H12L20.59 10.59A2 2 0 0 0 20.59 13.41Z" stroke={P.weatherCloudWhite} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="7" cy="7" r="1" fill={P.weatherCloudWhite} />
  </Svg>
);

const CloseIcon = ({ size = 18, color = P.grey600 }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RadioCircle = ({ selected = false }: { selected?: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={selected ? colors.brandGreen : P.grey300}
      strokeWidth={selected ? 2 : 1.5}
      fill={selected ? colors.brandGreen : 'none'}
    />
    {selected ? (
      <Path d="M8 12L11 15L16 9" stroke={P.weatherCloudWhite} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ) : null}
  </Svg>
);

interface CreateListingStep2ScreenProps {
  /** The crop picked on step 1. */
  crop?: ListingCropChoice | null | undefined;
  /** Called with the created listing once `POST /listings` returns 201. */
  onSuccess?: (listing: Listing) => void;
  onCancel?: () => void;
  onBack?: () => void;
}

// ─────────────────────────────────────────────
// Data: the fair price ceiling for the chosen crop + grade from
// GET /fair-prices (BR-07), and POST /listings with an Idempotency-Key.
// The server is the BR-07 gate; the inline ceiling hint only says early what
// it will say, and its own PRICE_ABOVE_CEILING is surfaced if they disagree.
//
// Judgment call, flagged in the hand-off: the design has no grade control
// (it shows the grade as "locked from your harvest record", and no harvest
// record endpoint exists), so the grade badge opens a system picker of the
// three sellable grades. No grade is pre-selected.
//
// Left out of the approved design because nothing backs them (not faked):
//   - "180 kg available" and "Locked from your harvest record": no harvest
//     record / stock endpoint;
//   - the "+10%" TOHFA markup: a business threshold with no farmer-readable
//     config, shown as a neutral dash.
// The dashed PHOTO box is kept as the design's placeholder; the design has no
// add-photo affordance, so listing photo upload is not wired.
// ─────────────────────────────────────────────

type CeilingState = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | CeilingLookup;

function formErrorKey(error: CreateListingFormError): string {
  switch (error) {
    case 'NO_CROP':
      return 'farmer.listings.create.step2.missingCrop';
    case 'NO_GRADE':
      return 'farmer.listings.create.step2.noGrade';
    case 'QUANTITY_INVALID':
      return 'farmer.listings.create.step2.quantityInvalid';
    case 'PRICE_INVALID':
      return 'farmer.listings.create.step2.priceInvalid';
    case 'NO_CEILING':
      return 'farmer.listings.create.step2.noCeiling';
    case 'PRICE_ABOVE_CEILING':
      return 'farmer.listings.error.PRICE_ABOVE_CEILING';
  }
}

export function CreateListingStep2Screen({
  crop,
  onSuccess,
  onCancel,
  onBack,
}: CreateListingStep2ScreenProps): React.JSX.Element {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [gradePickerVisible, setGradePickerVisible] = useState<boolean>(false);
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [ceiling, setCeiling] = useState<CeilingState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<boolean>(false);
  // Same key for a retry of the same body; a new key once the body changes.
  const idempotencyRef = useRef(createIdempotencyKeyCache());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cropId = crop?.id ?? null;

  // BR-07: the ceiling in effect today for this crop + grade.
  useEffect(() => {
    if (cropId === null || grade === null) {
      setCeiling({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setCeiling({ status: 'loading' });
    getFairPriceCeilings(cropId, grade, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        const row = res.items[0];
        setCeiling(row ? { status: 'found', price: row.ceilingPrice } : { status: 'none' });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCeiling({ status: 'error' });
      });
    return () => controller.abort();
  }, [cropId, grade]);

  const ceilingPrice = ceiling.status === 'found' ? ceiling.price : null;
  const quantityCheck = checkQuantity(quantityInput);
  const priceCheck = checkAskingPrice(priceInput, ceilingPrice);
  const priceOk = priceCheck === 'WITHIN_CEILING' || priceCheck === 'NO_CEILING';
  const estimatedTotal =
    quantityCheck === 'OK' && priceOk ? lineTotal(priceInput, quantityInput) : null;
  const priceHasError =
    priceCheck === 'INVALID' || priceCheck === 'ABOVE_CEILING' || (priceOk && ceiling.status === 'none');

  const openGradePicker = () => {
    setGradePickerVisible(true);
  };

  const handleSubmit = async () => {
    // A ref, not `submitting`: two taps inside one render would both see false.
    if (inFlightRef.current) return;
    const result = buildCreateListingInput({
      cropId,
      grade,
      quantityInput,
      priceInput,
      ceiling:
        ceiling.status === 'found' || ceiling.status === 'none' ? ceiling : { status: 'unknown' },
    });
    if (!result.ok) {
      Alert.alert(t('farmer.listings.create.step2.submitErrorTitle'), t(tk(formErrorKey(result.error))), [
        { text: t('farmer.common.ok') },
      ]);
      return;
    }
    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const created = await createListing(
        result.input,
        idempotencyRef.current.keyFor(JSON.stringify(result.input)),
      );
      inFlightRef.current = false;
      idempotencyRef.current.reset();
      if (!mountedRef.current) return;
      setSubmitting(false);
      onSuccess?.(created);
    } catch (error) {
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      setSubmitting(false);
      Alert.alert(
        t('farmer.listings.create.step2.submitErrorTitle'),
        t(tk(listingErrorMessageKey(error, 'farmer.listings.error.generic'))),
        [{ text: t('farmer.common.ok') }],
      );
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>{t('farmer.listings.create.step1.title')}</Text>
          <Text style={styles.headerSub}>{t('farmer.listings.create.step2.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} accessibilityRole="button" accessibilityLabel={t('farmer.common.cancel')}>
          <Text style={styles.cancelText}>{t('farmer.common.cancel')}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
      </View>
    </View>
  );

  if (!crop) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.centerFill}>
          <Text style={styles.emptyText}>{t('farmer.listings.create.step2.missingCrop')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ceilingSub =
    grade === null
      ? t('farmer.listings.create.step2.ceilingSubNoGrade')
      : ceiling.status === 'found'
        ? t('farmer.listings.create.step2.ceilingSub', { grade: gradeLabel(grade) })
        : ceiling.status === 'none'
          ? t('farmer.listings.create.step2.ceilingNone')
          : ceiling.status === 'error'
            ? t('farmer.listings.create.step2.ceilingError')
            : '';

  const priceMessage =
    priceCheck === 'WITHIN_CEILING' && ceilingPrice !== null
      ? t('farmer.listings.create.step2.withinCeiling', { price: formatMoneyAmount(ceilingPrice) })
      : priceCheck === 'ABOVE_CEILING' && ceilingPrice !== null
        ? t('farmer.listings.create.step2.aboveCeiling', { price: formatMoneyAmount(ceilingPrice) })
        : priceCheck === 'INVALID'
          ? t('farmer.listings.create.step2.priceInvalid')
          : priceOk && ceiling.status === 'none'
            ? t('farmer.listings.create.step2.noCeiling')
            : null;

  const submitDisabled = submitting || ceiling.status === 'loading';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {header}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Crop Card */}
        <View style={styles.cropCard}>
          <View style={styles.photoBox}>
            <PhotoIcon />
            <Text style={styles.photoText}>{t('farmer.listings.create.step2.photo')}</Text>
          </View>
          <View style={styles.cropTextCol}>
            <View style={styles.cropTitleRow}>
              <Text style={styles.cropTitle} numberOfLines={1}>
                {crop.displayName}
              </Text>
              <TouchableOpacity
                style={grade === null ? styles.gradeButton : styles.gradeButtonSelected}
                onPress={openGradePicker}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={grade === null ? t('farmer.listings.create.selectGrade') : gradeLabel(grade)}
                accessibilityHint={t('farmer.listings.create.step2.gradeA11yHint')}
              >
                <Text style={grade === null ? styles.gradeButtonText : styles.gradeButtonSelectedText}>
                  {grade === null ? t('farmer.listings.create.selectGrade') : gradeLabel(grade)}
                </Text>
                <ChevronDown
                  color={grade === null ? P.weatherCloudWhite : colors.brandGreen}
                  size={12}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Alert Box */}
        <View style={styles.alertBox}>
          <View style={{ marginTop: 2, marginRight: 12 }}>
            <ShieldCheckOrange />
          </View>
          <Text style={styles.alertText}>
            {grade === null
              ? t('farmer.listings.create.step2.claimPrefixNoGrade')
              : t('farmer.listings.create.step2.claimPrefix', { grade: gradeLabel(grade) })}
            <Text style={{ fontWeight: '700' }}>{t('farmer.listings.create.step2.claimBold')}</Text>
            {t('farmer.listings.create.step2.claimSuffix')}
          </Text>
        </View>

        {/* Quantity Input */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>
              {t('farmer.listings.create.step2.quantityLabel')}{' '}
              <Text style={{ color: P.red700 }}>{t('farmer.listings.create.step2.requiredMark')}</Text>
            </Text>
          </View>
          <View style={[styles.inputWrapper, quantityCheck === 'INVALID' ? styles.inputWrapperError : null]}>
            <TextInput
              style={styles.input}
              value={quantityInput}
              onChangeText={setQuantityInput}
              keyboardType="decimal-pad"
              editable={!submitting}
              accessibilityLabel={t('farmer.listings.create.step2.quantityLabel')}
            />
          </View>
          {quantityCheck === 'INVALID' ? (
            <View style={styles.validationRow}>
              <Text style={styles.validationErrorText}>{t('farmer.listings.create.step2.quantityInvalid')}</Text>
            </View>
          ) : null}
        </View>

        {/* Fair price ceiling (BR-07) */}
        <View style={styles.pricingRow}>
          <View style={[styles.pricingBox, { backgroundColor: P.lightGreen50, borderColor: P.lightGreen100, borderWidth: 1 }]}>
            <View style={styles.pricingBoxHeaderRow}>
              <ShieldCheckGreen />
              <Text style={styles.pricingBoxTitleGreen}>{t('farmer.listings.create.step2.ceilingTitle')}</Text>
            </View>
            {ceilingPrice !== null ? (
              <Text style={styles.pricingBoxValueGreen}>
                {formatMoneyAmount(ceilingPrice)}
                <Text style={styles.pricingBoxUnit}>{t('farmer.listings.common.perKgUnit')}</Text>
              </Text>
            ) : (
              <Text style={styles.pricingBoxValueGreen}>{t('farmer.listings.common.dash')}</Text>
            )}
            <Text style={styles.pricingBoxSub}>{ceilingSub}</Text>
          </View>

          <View style={[styles.pricingBox, { backgroundColor: P.grey100, borderColor: P.borderLight, borderWidth: 1 }]}>
            <View style={styles.pricingBoxHeaderRow}>
              <PlusCircle />
              <Text style={styles.pricingBoxTitleGray}>{t('farmer.listings.create.step2.markupTitle')}</Text>
            </View>
            <Text style={styles.pricingBoxValueGray}>{t('farmer.listings.common.dash')}</Text>
            <Text style={styles.pricingBoxSub}>{t('farmer.listings.create.step2.markupSub')}</Text>
          </View>
        </View>

        {/* Asking Price Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {t('farmer.listings.create.step2.priceLabel')}{' '}
            <Text style={{ color: P.red700 }}>{t('farmer.listings.create.step2.requiredMark')}</Text>
          </Text>
          <View style={[styles.inputWrapper, { borderColor: priceHasError ? P.red700 : colors.brandGreen }]}>
            <Text style={styles.currencySymbol}>{t('farmer.listings.common.rupee')}</Text>
            <TextInput
              style={styles.inputWithSymbol}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="decimal-pad"
              editable={!submitting}
              accessibilityLabel={t('farmer.listings.create.step2.priceLabel')}
            />
            {priceCheck === 'WITHIN_CEILING' ? <CheckCircleGreen /> : null}
          </View>
          {priceMessage !== null ? (
            <View style={styles.validationRow}>
              {priceCheck === 'WITHIN_CEILING' ? <CheckIconSmall /> : null}
              <Text style={priceHasError ? styles.validationErrorText : styles.validationText}>{priceMessage}</Text>
            </View>
          ) : null}
        </View>

        {/* Sale Value Box */}
        <View style={styles.saleValueBox}>
          <View style={styles.saleValueCol}>
            <Text style={styles.saleValueTitle}>{t('farmer.listings.create.step2.saleValueTitle')}</Text>
            {estimatedTotal !== null ? (
              <Text style={styles.saleValueSub}>
                {t('farmer.listings.create.step2.saleValueSub', {
                  qty: formatKg(quantityInput),
                  price: formatMoneyAmount(priceInput.trim()),
                })}
              </Text>
            ) : null}
          </View>
          <Text style={styles.saleValueAmount}>{moneyOrDash(estimatedTotal)}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer / Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitDisabled ? styles.btnDisabled : null]}
          onPress={() => void handleSubmit()}
          disabled={submitDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.listings.create.step2.submit')}
          accessibilityState={{ disabled: submitDisabled, busy: submitting }}
        >
          <TagIcon />
          <Text style={styles.submitBtnText}>{t('farmer.listings.create.step2.submit')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Grade Selection Modal ── */}
      <Modal
        visible={gradePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGradePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setGradePickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.close')}
          />
          <View style={styles.gradeModalCard}>
            {/* Header */}
            <View style={styles.gradeModalHeaderRow}>
              <Text style={styles.gradeModalTitle}>
                {t('farmer.listings.create.step2.gradePickerTitle')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setGradePickerVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.common.close')}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={P.grey600} />
              </TouchableOpacity>
            </View>

            {/* Subtitle / explanation */}
            <Text style={styles.gradeModalSubtitle}>
              {t('farmer.listings.create.step2.gradePickerBody')}
            </Text>

            {/* Sellable Grade Options */}
            <View style={styles.gradeOptionsList}>
              {SELLABLE_GRADES.map((g) => {
                const isSelected = grade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.gradeOptionCard,
                      isSelected && styles.gradeOptionCardSelected,
                    ]}
                    onPress={() => {
                      setGrade(g);
                      setGradePickerVisible(false);
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={gradeLabel(g)}
                  >
                    <View style={styles.gradeOptionLeft}>
                      <View
                        style={[
                          styles.gradeOptionBadge,
                          isSelected && styles.gradeOptionBadgeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.gradeOptionBadgeText,
                            isSelected && styles.gradeOptionBadgeTextSelected,
                          ]}
                        >
                          {g === 'GRADE_1' ? 'G1' : g === 'GRADE_2' ? 'G2' : 'G3'}
                        </Text>
                      </View>
                      <View style={styles.gradeOptionTextCol}>
                        <Text
                          style={[
                            styles.gradeOptionLabel,
                            isSelected && styles.gradeOptionLabelSelected,
                          ]}
                        >
                          {gradeLabel(g)}
                        </Text>
                        <Text style={styles.gradeOptionDesc}>
                          {g === 'GRADE_1'
                            ? 'Top Quality · Premium Produce'
                            : g === 'GRADE_2'
                              ? 'Standard Quality · Good Condition'
                              : 'Fair Quality · Commercial / Process'}
                        </Text>
                      </View>
                    </View>
                    <RadioCircle selected={isSelected} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.gradeModalCancelBtn}
              onPress={() => setGradePickerVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.common.cancel')}
            >
              <Text style={styles.gradeModalCancelText}>{t('farmer.common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.grey50,
  },
  header: {
    backgroundColor: P.weatherCloudWhite,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.grey300,
    backgroundColor: P.weatherCloudWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.teal900,
  },
  headerSub: {
    fontSize: typography.body,
    color: P.blueGrey400,
    marginTop: 2,
  },
  cancelText: {
    fontSize: typography.bodyLarge,
    color: P.blueGrey500,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
    paddingHorizontal: 20,
    gap: 8,
  },
  progressActive: {
    flex: 1,
    backgroundColor: colors.brandGreen,
    borderRadius: 1.5,
  },
  scrollContent: {
    padding: 20,
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  photoBox: {
    width: 64,
    height: 64,
    backgroundColor: P.grey100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: P.grey300,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: typography.caption,
    color: P.grey500,
    fontWeight: '700',
    marginTop: 4,
  },
  cropTextCol: {
    flex: 1,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cropTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.grey900,
    flexShrink: 1,
  },
  gradeButton: {
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  gradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.weatherCloudWhite,
  },
  gradeButtonSelected: {
    backgroundColor: colors.brandGreenLight,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  gradeButtonSelectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  gradeBadge: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.brandGreen,
  },
  cropSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropSubText: {
    fontSize: typography.body,
    color: P.grey500,
    fontWeight: '500',
    flexShrink: 1,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: P.orange50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.orange100,
  },
  alertText: {
    flex: 1,
    fontSize: typography.body,
    color: P.deepOrange800,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.grey800,
    marginBottom: 8,
  },
  inputLabelRight: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.grey600,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.green500,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperError: {
    borderColor: P.red600,
  },
  input: {
    flex: 1,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.grey900,
  },
  inputWithSymbol: {
    flex: 1,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.grey900,
    marginLeft: 8,
  },
  currencySymbol: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.grey600,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pricingBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  pricingBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pricingBoxTitleGreen: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.brandGreen,
  },
  pricingBoxTitleGray: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.grey600,
  },
  pricingBoxValueGreen: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.brandGreen,
    marginBottom: 4,
  },
  pricingBoxValueGray: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.grey800,
    marginBottom: 4,
  },
  pricingBoxUnit: {
    fontSize: typography.bodySmall,
  },
  pricingBoxSub: {
    fontSize: typography.caption,
    color: P.grey600,
    lineHeight: 14,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  saleValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  saleValueCol: {
    flex: 1,
  },
  saleValueTitle: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  saleValueSub: {
    fontSize: typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  saleValueAmount: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: P.weatherCloudWhite,
  },
  footer: {
    padding: 20,
    backgroundColor: P.grey50,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    paddingVertical: 16,
  },
  submitBtnText: {
    color: P.weatherCloudWhite,
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    marginLeft: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  validationErrorText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.red700,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.grey600,
    textAlign: 'center',
  },
  // Grade Selection Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradeModalCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  gradeModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gradeModalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.grey900,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeModalSubtitle: {
    fontSize: typography.bodySmall,
    color: P.grey600,
    lineHeight: 18,
    marginBottom: 18,
  },
  gradeOptionsList: {
    gap: 10,
  },
  gradeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.borderLight,
    backgroundColor: P.weatherCloudWhite,
  },
  gradeOptionCardSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreenLight,
  },
  gradeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  gradeOptionBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeOptionBadgeSelected: {
    backgroundColor: colors.brandGreen,
  },
  gradeOptionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: P.grey700,
  },
  gradeOptionBadgeTextSelected: {
    color: P.weatherCloudWhite,
  },
  gradeOptionTextCol: {
    flex: 1,
  },
  gradeOptionLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.grey900,
  },
  gradeOptionLabelSelected: {
    color: colors.brandGreen,
  },
  gradeOptionDesc: {
    fontSize: typography.caption,
    color: P.grey500,
    marginTop: 2,
  },
  gradeModalCancelBtn: {
    marginTop: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: P.grey100,
  },
  gradeModalCancelText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.grey700,
  },
});
