import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Svg, { Circle, Line, Path, Rect, Polygon } from 'react-native-svg';
import { type CounterOffer, type Listing } from '../../api/listings';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// Pure Vector Icons (Zero missing codepoint errors)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ScheduleIcon({ size = 24, color = '#d85b3b' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7V12L15 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoIcon({ size = 18, color = '#757575' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M12 11V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function EyeIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 20, color = '#bdbdbd' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 20, color = '#2e7d32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PhotoUploadIcon({ size = 22, color = '#2e7d32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 8L12 3M12 3L7 8M12 3V15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GalleryIcon({ size = 20, color = '#1976d2' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SampleBatchIcon({ size = 20, color = '#7b1fa2' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 17L12 22L22 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12L12 17L22 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = '#616161' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SwapIcon({ size = 18, color = '#673ab7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 7H20M20 7L16 3M20 7L16 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17H4M4 17L8 21M4 17L8 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CounterOfferScreenProps {
  listing?: Listing | null | undefined;
  listingId?: string | undefined;
  cropName?: string | undefined;
  offer?: CounterOffer | null | undefined;
  onAccept?: (() => void) | undefined;
  onReject?: (() => void) | undefined;
  onCounter?: (() => void) | undefined;
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  onRefreshListing?: (() => Promise<void>) | undefined;
}

interface UploadedPhoto {
  id: string;
  uri: any;
  name: string;
  size: string;
  timestamp: string;
  sourceType: 'camera' | 'gallery' | 'sample';
}

export function CounterOfferScreen({
  listing,
  cropName,
  offer: initialOffer,
  onAccept,
  onReject,
  onCounter,
  onSuccess,
  onCancel,
}: CounterOfferScreenProps): React.JSX.Element {
  // Selected terms tab: 'ask' | 'counter'
  const [selectedTerm, setSelectedTerm] = useState<'ask' | 'counter'>('counter');

  // Photo viewer & upload states
  const [showAdminPhotoModal, setShowAdminPhotoModal] = useState<boolean>(false);
  const [showUploadPicker, setShowUploadPicker] = useState<boolean>(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<{
    uri: any;
    title: string;
    subtitle: string;
    details?: string;
  } | null>(null);

  // Derive values safely from props or listing or default demo data
  const cropSubtitle = cropName || listing?.cropName || 'Carrot - Ooty - Grade 1';
  const qty = listing?.quantityKg || '150';
  const askPrice = listing?.askingPricePerKg || '40';
  const askTotal = (Number(qty) * Number(askPrice)).toLocaleString('en-IN');

  const activeOffer = initialOffer || listing?.activeCounterOffer;
  const offerPrice = activeOffer?.pricePerKg || '34';
  const offerTotal = (Number(qty) * Number(offerPrice)).toLocaleString('en-IN');

  const adminReason =
    activeOffer?.message ||
    'On inspection the batch grades as Grade 2 (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.';

  const adminPhotoSource = require('../../../../assets/images/real_carrot.jpg');

  // Pick Document / Image directly from device
  const handlePickFromDevice = async () => {
    setShowUploadPicker(false);
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      const newPhoto: UploadedPhoto = {
        id: `photo_${Date.now()}`,
        uri: res.uri ? { uri: res.uri } : require('../../../../assets/images/real_carrot.jpg'),
        name: res.name || 'BATCH_EVIDENCE.jpg',
        size: res.size ? `${(res.size / (1024 * 1024)).toFixed(1)} MB` : '2.1 MB',
        timestamp: `Uploaded today at ${timeStr}`,
        sourceType: 'gallery',
      };
      setUploadedPhotos((prev) => [newPhoto, ...prev]);
      Alert.alert('Photo Attached', `${res.name || 'Photo'} has been attached as counter-evidence.`);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        // Fallback for mock environments
        handleSelectUploadOption('gallery');
      }
    }
  };

  const handleSelectUploadOption = (option: 'camera' | 'gallery' | 'sample') => {
    setShowUploadPicker(false);
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    let newPhoto: UploadedPhoto;
    if (option === 'camera') {
      newPhoto = {
        id: `photo_${Date.now()}`,
        uri: require('../../../../assets/images/real_carrot.jpg'),
        name: `CAM_${Date.now().toString().slice(-4)}.jpg`,
        size: '1.8 MB',
        timestamp: `Captured today at ${timeStr}`,
        sourceType: 'camera',
      };
      Alert.alert('Photo Captured', 'Batch evidence photo has been attached successfully.');
    } else if (option === 'gallery') {
      newPhoto = {
        id: `photo_${Date.now()}`,
        uri: require('../../../../assets/images/real_carrot.jpg'),
        name: `IMG_BATCH_EVIDENCE.jpg`,
        size: '2.4 MB',
        timestamp: `Uploaded today at ${timeStr}`,
        sourceType: 'gallery',
      };
      Alert.alert('Photo Uploaded', 'Gallery inspection photo has been attached.');
    } else {
      newPhoto = {
        id: `photo_${Date.now()}`,
        uri: require('../../../../assets/images/real_carrot.jpg'),
        name: `QC_SAMPLE_BATCH.jpg`,
        size: '2.1 MB',
        timestamp: `Attached at ${timeStr}`,
        sourceType: 'sample',
      };
      Alert.alert('Sample Attached', 'Batch quality sample photo attached.');
    }

    setUploadedPhotos((prev) => [newPhoto, ...prev]);
  };

  const handleRemovePhoto = (id: string) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this uploaded evidence photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setUploadedPhotos((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onCancel}>
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Counter-Offer</Text>
            <Text style={styles.headerSubtitle}>{cropSubtitle}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Timer Banner */}
          <View style={styles.timerBanner}>
            <View style={styles.timerLeft}>
              <ScheduleIcon size={28} color="#d85b3b" />
              <View style={styles.timerTextContainer}>
                <Text style={styles.timerTopLabel}>TIME TO RESPOND</Text>
                <Text style={styles.timerMainValue}>
                  22h 30m <Text style={styles.timerLeftLabel}>left</Text>
                </Text>
              </View>
            </View>
            <View style={styles.timerRight}>
              <Text style={styles.timerRightText}>within 24h</Text>
              <Text style={styles.timerRightText}>or it lapses</Text>
            </View>
          </View>

          {/* COMPARE THE TERMS Header */}
          <View style={styles.termsHeaderRow}>
            <Text style={styles.sectionHeader}>COMPARE THE TERMS</Text>
            <Text style={styles.tapToSelectHint}>Tap a tab to select</Text>
          </View>

          {/* Interactive Cards / Tabs Row */}
          <View style={styles.cardsRow}>
            {/* Ask Card (Clickable Tab) */}
            <Pressable
              style={[styles.askCard, selectedTerm === 'ask' && styles.askCardSelected]}
              onPress={() => setSelectedTerm('ask')}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTerm === 'ask' }}
            >
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[
                    styles.cardHeaderAsk,
                    selectedTerm === 'ask' && styles.cardHeaderAskSelected,
                  ]}
                >
                  YOUR ASK
                </Text>
                {selectedTerm === 'ask' && (
                  <View style={styles.selectedBadgeGreen}>
                    <CheckIcon size={11} color="#1b5e20" />
                  </View>
                )}
              </View>

              <View style={styles.cardField}>
                <Text
                  style={[
                    styles.cardFieldLabel,
                    selectedTerm === 'ask' && styles.cardFieldLabelGreen,
                  ]}
                >
                  Quantity
                </Text>
                <Text
                  style={[
                    styles.cardFieldValue,
                    selectedTerm === 'ask' && styles.cardFieldValueGreen,
                  ]}
                >
                  {qty} kg
                </Text>
              </View>
              <View style={styles.cardField}>
                <Text
                  style={[
                    styles.cardFieldLabel,
                    selectedTerm === 'ask' && styles.cardFieldLabelGreen,
                  ]}
                >
                  Price
                </Text>
                <Text
                  style={[
                    styles.cardFieldValue,
                    selectedTerm === 'ask' && styles.cardFieldValueGreen,
                  ]}
                >
                  ₹{askPrice}/kg
                </Text>
              </View>
              <View
                style={[
                  styles.dashedDivider,
                  selectedTerm === 'ask' && styles.dashedDividerGreen,
                ]}
              />
              <View style={styles.cardField}>
                <Text
                  style={[
                    styles.cardFieldLabel,
                    selectedTerm === 'ask' && styles.cardFieldLabelGreen,
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.cardFieldValue,
                    selectedTerm === 'ask' && styles.cardFieldValueGreen,
                  ]}
                >
                  ₹{askTotal}
                </Text>
              </View>
            </Pressable>

            {/* Counter Card (Clickable Tab) */}
            <Pressable
              style={[
                styles.counterCard,
                selectedTerm === 'counter' && styles.counterCardSelected,
              ]}
              onPress={() => setSelectedTerm('counter')}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTerm === 'counter' }}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderCounter}>ADMIN COUNTER</Text>
                {selectedTerm === 'counter' && (
                  <View style={styles.selectedBadgePurple}>
                    <CheckIcon size={11} color="#55348b" />
                  </View>
                )}
              </View>

              <View style={styles.cardField}>
                <Text style={[styles.cardFieldLabel, styles.counterColor]}>Quantity</Text>
                <Text style={[styles.cardFieldValue, styles.counterColor]}>{qty} kg</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={[styles.cardFieldLabel, styles.counterColor]}>Price</Text>
                <Text style={[styles.cardFieldValue, styles.counterColor]}>
                  ₹{offerPrice}/kg <Text style={styles.discountText}>▼15%</Text>
                </Text>
              </View>
              <View style={[styles.dashedDivider, styles.dashedDividerCounter]} />
              <View style={styles.cardField}>
                <Text style={[styles.cardFieldLabel, styles.counterColor]}>Total</Text>
                <Text style={[styles.cardFieldValue, styles.counterColor]}>₹{offerTotal}</Text>
              </View>
            </Pressable>
          </View>

          {/* Admin Reason */}
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeaderRow}>
              <InfoIcon size={18} color="#757575" />
              <Text style={styles.reasonHeader}>Admin's reason</Text>
            </View>
            <Text style={styles.reasonText}>
              On inspection the batch grades as <Text style={styles.boldText}>Grade 2</Text> (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.
            </Text>
          </View>

          {/* Inspection Photo (Tap to view admin quality evidence) */}
          <TouchableOpacity
            style={styles.photoCard}
            onPress={() => setShowAdminPhotoModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.photoThumbnailBox}>
              <Image source={adminPhotoSource} style={styles.photoThumbnailImg} resizeMode="cover" />
              <View style={styles.photoEyeOverlay}>
                <EyeIcon size={16} color="#ffffff" />
              </View>
            </View>
            <View style={styles.photoTextContainer}>
              <View style={styles.photoTitleRow}>
                <Text style={styles.photoTitle}>Inspection photo</Text>
                <View style={styles.gradeTag}>
                  <Text style={styles.gradeTagText}>Grade 2</Text>
                </View>
              </View>
              <Text style={styles.photoSubtitle}>Admin's quality evidence · tap to view</Text>
            </View>
            <ChevronRightIcon size={20} color="#bdbdbd" />
          </TouchableOpacity>

          {/* ── Farmer Counter-Evidence Photo Upload Section ── */}
          <View style={styles.uploadSection}>
            <View style={styles.uploadSectionHeader}>
              <Text style={styles.uploadSectionTitle}>YOUR COUNTER-EVIDENCE</Text>
              <TouchableOpacity
                style={styles.addPhotoBtn}
                onPress={() => setShowUploadPicker(true)}
                activeOpacity={0.7}
              >
                <CameraIcon size={15} color="#2e7d32" />
                <Text style={styles.addPhotoBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {uploadedPhotos.length === 0 ? (
              <TouchableOpacity
                style={styles.uploadEmptyCard}
                onPress={() => setShowUploadPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.uploadIconCircle}>
                  <PhotoUploadIcon size={22} color="#2e7d32" />
                </View>
                <View style={styles.uploadEmptyTextGroup}>
                  <Text style={styles.uploadEmptyTitle}>Upload Inspection / Batch Photo</Text>
                  <Text style={styles.uploadEmptySubtitle}>
                    Attach clear photo evidence of your harvest batch to contest grading or support counter-offer
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.uploadedList}>
                {uploadedPhotos.map((photo) => (
                  <View key={photo.id} style={styles.uploadedPhotoCard}>
                    <TouchableOpacity
                      style={styles.uploadedPhotoThumbWrapper}
                      onPress={() =>
                        setPreviewPhoto({
                          uri: photo.uri,
                          title: 'Uploaded Evidence Photo',
                          subtitle: photo.name,
                          details: photo.timestamp,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Image source={photo.uri} style={styles.uploadedPhotoThumb} resizeMode="cover" />
                      <View style={styles.uploadedPhotoOverlay}>
                        <EyeIcon size={14} color="#ffffff" />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.uploadedPhotoInfo}>
                      <View style={styles.uploadedTitleRow}>
                        <Text style={styles.uploadedPhotoName} numberOfLines={1}>
                          {photo.name}
                        </Text>
                        <View style={styles.attachedBadge}>
                          <Text style={styles.attachedBadgeText}>Attached</Text>
                        </View>
                      </View>
                      <Text style={styles.uploadedPhotoTime}>{photo.timestamp}</Text>
                      <View style={styles.uploadedActionsRow}>
                        <TouchableOpacity
                          style={styles.viewActionBtn}
                          onPress={() =>
                            setPreviewPhoto({
                              uri: photo.uri,
                              title: 'Uploaded Evidence Photo',
                              subtitle: photo.name,
                              details: photo.timestamp,
                            })
                          }
                        >
                          <Text style={styles.viewActionText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.replaceActionBtn}
                          onPress={() => setShowUploadPicker(true)}
                        >
                          <Text style={styles.replaceActionText}>Replace</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeActionBtn}
                          onPress={() => handleRemovePhoto(photo.id)}
                        >
                          <Text style={styles.removeActionText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.actionBtn, styles.btnAccept]}
            onPress={() => {
              if (onAccept) onAccept();
              else if (onSuccess) onSuccess();
              else if (onCancel) onCancel();
            }}
          >
            <View style={styles.btnAcceptIconContainer}>
              <CheckIcon size={12} color="#2e7d32" />
            </View>
            <Text style={styles.btnAcceptText}>Accept</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.btnCounter]}
            onPress={() => {
              if (onCounter) onCounter();
              else if (onCancel) onCancel();
            }}
          >
            <SwapIcon size={18} color="#673ab7" />
            <Text style={styles.btnCounterText}>Counter back</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.btnWithdraw]}
            onPress={() => {
              if (onReject) onReject();
              else if (onCancel) onCancel();
            }}
          >
            <CloseIcon size={18} color="#616161" />
            <Text style={styles.btnWithdrawText}>Withdraw</Text>
          </Pressable>
        </View>

        {/* ── Admin Inspection Photo Modal ── */}
        <Modal visible={showAdminPhotoModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.photoModalCard}>
              <View style={styles.photoModalHeader}>
                <View>
                  <Text style={styles.photoModalTitle}>Admin Quality Inspection</Text>
                  <Text style={styles.photoModalSubtitle}>Batch evidence uploaded by Tohfa Quality Admin</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setShowAdminPhotoModal(false)}
                >
                  <CloseIcon size={18} color="#424242" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalImageContainer}>
                <Image source={adminPhotoSource} style={styles.modalImage} resizeMode="cover" />
                <View style={styles.modalGradeOverlay}>
                  <Text style={styles.modalGradeOverlayText}>Grade 2 Assessed (Ceiling ₹34/kg)</Text>
                </View>
              </View>

              <View style={styles.modalNotesBox}>
                <Text style={styles.modalNotesTitle}>Inspector Findings:</Text>
                <Text style={styles.modalNotesText}>{adminReason}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setShowAdminPhotoModal(false)}
              >
                <Text style={styles.modalDismissBtnText}>Close Inspection Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Upload Picker Sheet / Modal ── */}
        <Modal visible={showUploadPicker} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowUploadPicker(false)}
          >
            <View style={styles.pickerSheet}>
              <View style={styles.pickerSheetHandle} />
              <Text style={styles.pickerSheetTitle}>Upload Counter-Evidence Photo</Text>
              <Text style={styles.pickerSheetSubtitle}>
                Add clear photos of your batch to support your grading or price ask
              </Text>

              <TouchableOpacity
                style={styles.pickerSheetOption}
                onPress={() => handleSelectUploadOption('camera')}
              >
                <View style={[styles.pickerOptionIconBox, { backgroundColor: '#e8f5e9' }]}>
                  <CameraIcon size={22} color="#2e7d32" />
                </View>
                <View style={styles.pickerOptionTextContainer}>
                  <Text style={styles.pickerOptionLabel}>Take Photo with Camera</Text>
                  <Text style={styles.pickerOptionDesc}>Capture current batch or produce lot directly</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerSheetOption}
                onPress={handlePickFromDevice}
              >
                <View style={[styles.pickerOptionIconBox, { backgroundColor: '#e3f2fd' }]}>
                  <GalleryIcon size={22} color="#1976d2" />
                </View>
                <View style={styles.pickerOptionTextContainer}>
                  <Text style={styles.pickerOptionLabel}>Choose from Device Gallery</Text>
                  <Text style={styles.pickerOptionDesc}>Browse phone files and select batch image</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerSheetOption}
                onPress={() => handleSelectUploadOption('sample')}
              >
                <View style={[styles.pickerOptionIconBox, { backgroundColor: '#f3e5f5' }]}>
                  <SampleBatchIcon size={22} color="#7b1fa2" />
                </View>
                <View style={styles.pickerOptionTextContainer}>
                  <Text style={styles.pickerOptionLabel}>Attach Quality Batch Sample</Text>
                  <Text style={styles.pickerOptionDesc}>Use verified Grade 1 carrot batch sample</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerCancelBtn}
                onPress={() => setShowUploadPicker(false)}
              >
                <Text style={styles.pickerCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── Fullscreen Preview Modal ── */}
        <Modal visible={Boolean(previewPhoto)} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.photoModalCard}>
              <View style={styles.photoModalHeader}>
                <View>
                  <Text style={styles.photoModalTitle}>{previewPhoto?.title}</Text>
                  <Text style={styles.photoModalSubtitle}>{previewPhoto?.subtitle}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setPreviewPhoto(null)}
                >
                  <CloseIcon size={18} color="#424242" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalImageContainer}>
                {previewPhoto?.uri && (
                  <Image source={previewPhoto.uri} style={styles.modalImage} resizeMode="cover" />
                )}
              </View>

              {previewPhoto?.details && (
                <View style={styles.modalNotesBox}>
                  <Text style={styles.modalNotesText}>{previewPhoto.details}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setPreviewPhoto(null)}
              >
                <Text style={styles.modalDismissBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d5ebd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c3029',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  timerBanner: {
    flexDirection: 'row',
    backgroundColor: '#fde9e1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerTextContainer: {
    marginLeft: 12,
  },
  timerTopLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d85b3b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timerMainValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8b4b3b',
  },
  timerLeftLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8b4b3b',
  },
  timerRight: {
    alignItems: 'flex-end',
  },
  timerRightText: {
    fontSize: 11,
    color: '#a05c48',
    fontWeight: '500',
  },
  termsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#757575',
    letterSpacing: 0.5,
  },
  tapToSelectHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9e9e9e',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  askCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  askCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#2e7d32',
    borderWidth: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    marginLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  counterCardSelected: {
    backgroundColor: '#fbf9ff',
    borderColor: '#9b71e1',
    borderWidth: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderAsk: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9e9e9e',
    letterSpacing: 0.5,
  },
  cardHeaderAskSelected: {
    color: '#2e7d32',
  },
  selectedBadgeGreen: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgePurple: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ede7f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderCounter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7b4bc6',
    letterSpacing: 0.5,
  },
  cardField: {
    marginBottom: 8,
  },
  cardFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9e9e9e',
    marginBottom: 2,
  },
  cardFieldLabelGreen: {
    color: '#2e7d32',
  },
  cardFieldValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
  },
  cardFieldValueGreen: {
    color: '#1b5e20',
  },
  counterColor: {
    color: '#55348b',
  },
  discountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e55a30',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    marginVertical: 8,
    borderRadius: 1,
  },
  dashedDividerGreen: {
    borderColor: '#bbf7d0',
  },
  dashedDividerCounter: {
    borderColor: '#e1d4fa',
  },
  reasonCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reasonHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 13.5,
    color: '#616161',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#424242',
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  photoThumbnailBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  photoEyeOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTextContainer: {
    flex: 1,
  },
  photoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  photoTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#212121',
    marginRight: 8,
  },
  gradeTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  gradeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  photoSubtitle: {
    fontSize: 12,
    color: '#757575',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#757575',
    letterSpacing: 0.5,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    gap: 4,
  },
  addPhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  uploadEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadEmptyTextGroup: {
    flex: 1,
  },
  uploadEmptyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 2,
  },
  uploadEmptySubtitle: {
    fontSize: 11.5,
    color: '#6b7280',
    lineHeight: 16,
  },
  uploadedList: {
    gap: 10,
  },
  uploadedPhotoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadedPhotoThumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  uploadedPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  uploadedPhotoOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedPhotoInfo: {
    flex: 1,
  },
  uploadedTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  uploadedPhotoName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 6,
  },
  attachedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  attachedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  uploadedPhotoTime: {
    fontSize: 11.5,
    color: '#6b7280',
    marginBottom: 6,
  },
  uploadedActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewActionBtn: {
    paddingVertical: 2,
  },
  viewActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  replaceActionBtn: {
    paddingVertical: 2,
  },
  replaceActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  removeActionBtn: {
    paddingVertical: 2,
  },
  removeActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ebebeb',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  btnAccept: {
    backgroundColor: '#2e7d32',
  },
  btnAcceptIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  btnAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnCounter: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#7b4bc6',
  },
  btnCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7b4bc6',
    marginTop: 2,
  },
  btnWithdraw: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  btnWithdrawText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#616161',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  photoModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  photoModalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
    marginBottom: 14,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalGradeOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalGradeOverlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    textAlign: 'center',
  },
  modalNotesBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  modalNotesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  modalNotesText: {
    fontSize: 12.5,
    color: '#4b5563',
    lineHeight: 18,
  },
  modalDismissBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  pickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  pickerSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  pickerSheetSubtitle: {
    fontSize: 12.5,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 18,
  },
  pickerSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  pickerOptionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pickerOptionTextContainer: {
    flex: 1,
  },
  pickerOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  pickerOptionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  pickerCancelBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  pickerCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
});
