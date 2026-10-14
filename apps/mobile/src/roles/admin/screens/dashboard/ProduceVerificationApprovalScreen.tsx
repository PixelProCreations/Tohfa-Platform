import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { ProduceQualityVerificationScreen } from './ProduceQualityVerificationScreen';
import { ProduceGradeCheckScreen } from './ProduceGradeCheckScreen';
import { ProduceDamageInspectionScreen } from './ProduceDamageInspectionScreen';
import { ProduceFairPriceCheckScreen } from './ProduceFairPriceCheckScreen';
import { ProduceFinalEligibilityDecisionScreen } from './ProduceFinalEligibilityDecisionScreen';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { FarmerProfileDetailScreen } from './FarmerProfileDetailScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadDocumentIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15V8M9 11l3-3 3 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="9"
        y1="16"
        x2="15"
        y2="16"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ProduceVerificationApprovalScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  initialStep?: number | undefined;
  onBack: () => void;
  onSubmitSuccess?: (() => void) | undefined;
  onViewFarmerProfile?: (() => void) | undefined;
  onViewListing?: (() => void) | undefined;
}

export function ProduceVerificationApprovalScreen({
  listingId,
  cropName,
  farmerName,
  initialStep = 1,
  onBack,
  onSubmitSuccess,
  onViewFarmerProfile,
  onViewListing,
}: ProduceVerificationApprovalScreenProps) {
  const [showFarmerProfile, setShowFarmerProfile] = useState(false);
  const [farmerInfoOpen, setFarmerInfoOpen] = useState(true);
  const [produceInfoOpen, setProduceInfoOpen] = useState(true);
  const [tohfaReqOpen, setTohfaReqOpen] = useState(true);

  const [activeStep, setActiveStep] = useState(initialStep);
  const [showHandoverConfirmation, setShowHandoverConfirmation] = useState(false);

  const [verifiedQuantity, setVerifiedQuantity] = useState('');
  const [weighingRef, setWeighingRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<'Grade 1' | 'Grade 2' | 'Rejected' | null>('Grade 1');

  // ─── Step 2: Quality Verification ───
  if (activeStep === 2) {
    return (
      <ProduceQualityVerificationScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        onBack={() => setActiveStep(1)}
        onPreviousStep={() => setActiveStep(1)}
        onContinue={() => setActiveStep(3)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 3: Grade Check ───
  if (activeStep === 3) {
    return (
      <ProduceGradeCheckScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        selectedGrade={selectedGrade ?? 'Grade 1'}
        onBack={() => setActiveStep(2)}
        onPreviousStep={() => setActiveStep(2)}
        onContinue={(grade) => {
          setSelectedGrade(grade);
          setActiveStep(4);
        }}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 4: Damage Inspection ───
  if (activeStep === 4) {
    return (
      <ProduceDamageInspectionScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        verifiedQty={parseFloat(verifiedQuantity) || 50}
        onBack={() => setActiveStep(3)}
        onPreviousStep={() => setActiveStep(3)}
        onContinue={() => setActiveStep(5)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 5: Fair Price Check ───
  if (activeStep === 5) {
    return (
      <ProduceFairPriceCheckScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        grade={selectedGrade ?? 'Grade 1'}
        fairPriceRange={selectedGrade === 'Grade 2' ? 'Rs. 80-90/KG' : 'Rs. 95-105/KG'}
        onBack={() => setActiveStep(4)}
        onPreviousStep={() => setActiveStep(4)}
        onContinue={() => setActiveStep(6)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  // ─── Step 6: Final Eligibility & Decision ───
  if (activeStep === 6) {
    if (showHandoverConfirmation) {
      return (
        <HandoverConfirmationScreen
          handoverId="HO-2026-0002"
          status="Completed"
          onBack={() => setShowHandoverConfirmation(false)}
        />
      );
    }

    return (
      <ProduceFinalEligibilityDecisionScreen
        listingId={listingId}
        cropName={cropName}
        farmerName={farmerName}
        farmerId="FR-00241"
        listedQty={parseFloat(verifiedQuantity) || 50}
        selectedGrade={selectedGrade ?? 'Grade 1'}
        onBack={() => setActiveStep(5)}
        onPreviousStep={() => setActiveStep(5)}
        onApproveSuccess={() => setShowHandoverConfirmation(true)}
        onGoToStep={(s) => setActiveStep(s)}
      />
    );
  }

  if (showFarmerProfile) {
    return (
      <FarmerProfileDetailScreen
        farmer={{
          farmerId: 'FR-00241',
          name: farmerName ?? '',
          zone: 'Coonoor',
          farmingMethod: 'Organic',
          accountStatus: 'Active',
          certification: 'Certified',
          farmCount: 1,
          listingCount: 18,
          rating: '4.6 ★',
          auditStatus: 'Upcoming',
        }}
        onBack={() => setShowFarmerProfile(false)}
      />
    );
  }

  const headerSub = [listingId, cropName, farmerName].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('produceVerificationApproval.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('produceVerificationApproval.title')}</Text>
        </View>
        {headerSub.length > 0 && (
          <Text style={styles.headerSubtitle}>{headerSub}</Text>
        )}
      </View>

      {/* ─── Body Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Metadata Card */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('produceVerificationApproval.meta.verificationId')}</Text>
              <Text style={styles.metaValue}>{t('produceVerificationApproval.meta.verificationIdVal')}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('produceVerificationApproval.meta.listingId')}</Text>
              <Text style={styles.metaValue}>{listingId ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('produceVerificationApproval.meta.status')}</Text>
              <Text style={styles.metaValue}>{t('produceVerificationApproval.meta.statusVal')}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('produceVerificationApproval.meta.dateTime')}</Text>
              <Text style={styles.metaValue}>10 Oct 2026, 10:00</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('produceVerificationApproval.meta.farmerAdmin')}</Text>
              <Text style={styles.metaValue}>Suresh Kumar</Text>
            </View>
          </View>
        </View>

        {/* Farmer Information Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setFarmerInfoOpen(!farmerInfoOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.accordionTitle}>{t('produceVerificationApproval.accordion.farmerInfo')}</Text>
            {farmerInfoOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </TouchableOpacity>

          {farmerInfoOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer ID</Text>
                <Text style={styles.dataValue}>FR-00241</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer name</Text>
                <Text style={styles.dataValue}>{farmerName ?? '—'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Contact number</Text>
                <Text style={styles.dataValue}>+91 98XXX XX045</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farm location</Text>
                <Text style={styles.dataValue}>Coonoor, Nilgiris</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer verification status</Text>
                <Text style={[styles.dataValue, styles.verifiedText]}>Verified</Text>
              </View>

              <TouchableOpacity
                style={styles.viewSubBtn}
                onPress={() => {
                  if (onViewFarmerProfile) {
                    onViewFarmerProfile();
                  } else {
                    setShowFarmerProfile(true);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewSubBtnText}>{t('produceVerificationApproval.action.viewFarmer')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Produce Information Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setProduceInfoOpen(!produceInfoOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.accordionTitle}>{t('produceVerificationApproval.accordion.produceInfo')}</Text>
            {produceInfoOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </TouchableOpacity>

          {produceInfoOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Product</Text>
                <Text style={styles.dataValue}>{cropName ?? '—'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Crop variety</Text>
                <Text style={styles.dataValue}>Hybrid</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farming type</Text>
                <Text style={styles.dataValue}>Organic</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Listed quantity</Text>
                <Text style={styles.dataValue}>50 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Farmer expected price</Text>
                <Text style={styles.dataValue}>Rs. 100/KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Harvest date</Text>
                <Text style={styles.dataValue}>28 Sep 2026</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Expected availability</Text>
                <Text style={styles.dataValue}>1 Oct 2026</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Listing date</Text>
                <Text style={styles.dataValue}>29 Sep 2026</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Product images</Text>
                <Text style={styles.dataValue}>tomato-1.jpg, tomato-2.jpg</Text>
              </View>

              <TouchableOpacity
                style={styles.viewSubBtn}
                onPress={() => {
                  if (onViewListing) {
                    onViewListing();
                  } else {
                    onBack();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewSubBtnText}>{t('produceVerificationApproval.action.viewListing')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* TOHFA Purchase Requirements Accordion */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setTohfaReqOpen(!tohfaReqOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.accordionTitle}>{t('produceVerificationApproval.accordion.tohfaReq')}</Text>
            {tohfaReqOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </TouchableOpacity>

          {tohfaReqOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Required product</Text>
                <Text style={styles.dataValue}>{cropName ?? '—'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Required quantity</Text>
                <Text style={styles.dataValue}>30 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Previously committed</Text>
                <Text style={styles.dataValue}>0 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Remaining required</Text>
                <Text style={styles.dataValue}>30 KG</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Applicable fair price</Text>
                <Text style={styles.dataValue}>Depends on the grade (Step 5)</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Warehouse / collection point</Text>
                <Text style={styles.dataValue}>Coonoor Warehouse</Text>
              </View>

              <Text style={styles.footnoteText}>
                These values come from the listing, purchase and pricing records.
              </Text>
            </View>
          )}
        </View>

        {/* Verification steps header */}
        <Text style={styles.sectionTitle}>{t('produceVerificationApproval.section.steps')}</Text>

        {/* Numbered Stepper Circles 1 to 6 */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCurrent = activeStep === step;
            const isCompleted = activeStep > step;
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    (isCurrent || isCompleted) && styles.stepCircleActive,
                  ]}
                  onPress={() => setActiveStep(step)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.stepCircleText,
                      (isCurrent || isCompleted) && styles.stepCircleTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </TouchableOpacity>
                {idx < 5 && (
                  <View
                    style={[
                      styles.stepperLine,
                      step < activeStep && styles.stepperLineActive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* STEP 1: QUANTITY CHECK */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepHeaderTitle}>{t('produceVerificationApproval.stepHeader')}</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>{t('produceVerificationApproval.notCompleted')}</Text>
          </View>
        </View>

        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingTitle}>{t('produceVerificationApproval.section.outstanding')}</Text>
          <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
          <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
          <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
          <Text style={styles.outstandingItem}>• and 2 more</Text>
        </View>

        <View style={styles.qtyCard}>
          <View style={styles.qtyRow}>
            <View style={styles.qtyCol}>
              <Text style={styles.qtyLabel}>{t('produceVerificationApproval.label.listedQty')}</Text>
              <Text style={styles.qtyValue}>50 KG</Text>
            </View>
            <View style={styles.qtyCol}>
              <Text style={styles.qtyLabel}>{t('produceVerificationApproval.label.tohfaReqQty')}</Text>
              <Text style={styles.qtyValue}>30 KG</Text>
            </View>
          </View>

          <View style={styles.qtyRow}>
            <View style={styles.qtyCol}>
              <Text style={styles.qtyLabel}>{t('produceVerificationApproval.label.prevCommitted')}</Text>
              <Text style={styles.qtyValue}>0 KG</Text>
            </View>
            <View style={styles.qtyCol}>
              <Text style={styles.qtyLabel}>{t('produceVerificationApproval.label.remainingReq')}</Text>
              <Text style={styles.qtyValue}>30 KG</Text>
            </View>
          </View>

          <View style={styles.qtyRow}>
            <View style={styles.qtyCol}>
              <Text style={styles.qtyLabel}>{t('produceVerificationApproval.label.unit')}</Text>
              <Text style={styles.qtyValue}>KG</Text>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>
            {t('produceVerificationApproval.label.verifiedQty')} <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.inputBox}
            keyboardType="numeric"
            placeholder=""
            value={verifiedQuantity}
            onChangeText={setVerifiedQuantity}
          />
          <Text style={styles.inputCaption}>
            {t('produceVerificationApproval.caption.verifiedQty')}
          </Text>

          <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>{t('produceVerificationApproval.label.weighingRef')}</Text>
          <TextInput
            style={styles.inputBox}
            placeholder=""
            value={weighingRef}
            onChangeText={setWeighingRef}
          />

          <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>{t('produceVerificationApproval.label.remarks')}</Text>
          <TextInput
            style={[styles.inputBox, styles.inputBoxMultiline]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={remarks}
            onChangeText={setRemarks}
          />

          <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>{t('produceVerificationApproval.label.evidence')}</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => {
              setUploadedFile('weighing_slip_001.jpg');
              Alert.alert(
                t('produceVerificationApproval.alert.fileTitle'),
                t('produceVerificationApproval.alert.fileMsg'),
              );
            }}
            activeOpacity={0.7}
          >
            <UploadDocumentIcon size={20} color={adminColors.brandDeep} />
            <Text style={styles.uploadText}>
              {uploadedFile ?? t('produceVerificationApproval.uploadText')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>{t('produceVerificationApproval.section.qtyComparison')}</Text>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Listed (declared by the farmer)</Text>
            <Text style={styles.comparisonValue}>50 KG</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Verified available</Text>
            <Text style={styles.comparisonValue}>
              {verifiedQuantity ? `${verifiedQuantity} KG` : 'Not entered'}
            </Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>TOHFA remaining</Text>
            <Text style={styles.comparisonValue}>30 KG</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            if (!verifiedQuantity.trim()) {
              Alert.alert(
                t('produceVerificationApproval.alert.requiredTitle'),
                t('produceVerificationApproval.alert.requiredMsg'),
              );
              return;
            }
            setActiveStep(2);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>{t('produceVerificationApproval.action.continue')}</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: adminSpacing.xs,
    paddingLeft: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  metaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    width: '48%',
  },
  metaLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  metaValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  accordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  accordionBody: {
    marginTop: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dataLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  dataValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
  },
  verifiedText: {
    color: adminColors.success.text,
  },
  viewSubBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  viewSubBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  footnoteText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  sectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.xs,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: adminColors.brand,
  },
  stepCircleText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  stepCircleTextActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: adminColors.border,
  },
  stepperLineActive: {
    backgroundColor: adminColors.brand,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  stepHeaderTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  notCompletedBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  notCompletedBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  outstandingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  outstandingTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  outstandingItem: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  qtyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qtyCol: {
    width: '48%',
  },
  qtyLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  qtyValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  formSection: {
    marginBottom: adminSpacing.lg,
  },
  inputLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  requiredAsterisk: {
    color: adminColors.danger.text,
  },
  inputLabelSpacing: {
    marginTop: adminSpacing.lg,
  },
  inputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  inputBoxMultiline: {
    height: 85,
    textAlignVertical: 'top',
  },
  inputCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  uploadBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  uploadText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  comparisonCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  comparisonTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  comparisonLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  comparisonValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  continueBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  bottomSpacer: {
    height: 40,
  },
});
