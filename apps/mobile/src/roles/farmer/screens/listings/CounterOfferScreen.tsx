import React, { useCallback, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type CounterOffer, type Listing } from '../../api/listings';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../theme';

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

export function CounterOfferScreen({
  listing,
  listingId,
  cropName,
  offer: initialOffer,
  onAccept,
  onReject,
  onCounter,
  onSuccess,
  onCancel,
}: CounterOfferScreenProps): React.JSX.Element {
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Derive values safely from props or listing or default demo data
  const cropSubtitle = cropName || listing?.cropName || 'Carrot - Ooty - Grade 1';
  const qty = listing?.quantityKg || '150';
  const askPrice = listing?.askingPricePerKg || '40';
  const askTotal = (Number(qty) * Number(askPrice)).toLocaleString('en-IN');
  
  const activeOffer = initialOffer || listing?.activeCounterOffer;
  const offerPrice = activeOffer?.pricePerKg || '34';
  const offerTotal = (Number(qty) * Number(offerPrice)).toLocaleString('en-IN');
  
  const adminReason = activeOffer?.message || 'On inspection the batch grades as Grade 2 (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onCancel}>
            <Icon name="arrow_back" size={20} color={colors.brandGreen} />
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
              <Icon name="schedule" size={28} color={P.coralMid2} />
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

          <Text style={styles.sectionHeader}>COMPARE THE TERMS</Text>

          {/* Cards */}
          <View style={styles.cardsRow}>
            {/* Ask Card */}
            <View style={styles.askCard}>
              <Text style={styles.cardHeaderAsk}>YOUR ASK</Text>
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>Quantity</Text>
                <Text style={styles.cardFieldValue}>{qty} kg</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>Price</Text>
                <Text style={styles.cardFieldValue}>₹{askPrice}/kg</Text>
              </View>
              <View style={styles.dashedDivider} />
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>Total</Text>
                <Text style={styles.cardFieldValue}>₹{askTotal}</Text>
              </View>
            </View>

            {/* Counter Card */}
            <View style={styles.counterCard}>
              <Text style={styles.cardHeaderCounter}>ADMIN COUNTER</Text>
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
            </View>
          </View>

          {/* Admin Reason */}
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeaderRow}>
              <Icon name="info" size={18} color={P.grey600} />
              <Text style={styles.reasonHeader}>Admin's reason</Text>
            </View>
            <Text style={styles.reasonText}>
              On inspection the batch grades as <Text style={styles.boldText}>Grade 2</Text> (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.
            </Text>
          </View>

          {/* Inspection Photo */}
          <Pressable style={styles.photoCard}>
            <View style={styles.photoIconBox}>
              <Icon name="visibility" size={24} color={P.grey500} />
            </View>
            <View style={styles.photoTextContainer}>
              <Text style={styles.photoTitle}>Inspection photo</Text>
              <Text style={styles.photoSubtitle}>Admin's quality evidence · tap to view</Text>
            </View>
            <Icon name="chevron_right" size={24} color={P.greyLight1} />
          </Pressable>

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
              <Icon name="check" size={14} color={colors.brandGreen} />
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
            <Icon name="swap_horiz" size={18} color={P.deepPurple500} />
            <Text style={styles.btnCounterText}>Counter back</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.btnWithdraw]}
            onPress={() => {
              if (onReject) onReject();
              else if (onCancel) onCancel();
            }}
          >
            <Icon name="close" size={18} color={P.greyDeep1} />
            <Text style={styles.btnWithdrawText}>Withdraw</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.tanTint9,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: P.greyTint1,
    backgroundColor: P.weatherCloudWhite,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.greenTint5,
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
    color: P.nearBlackDark3,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.grey500,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  timerBanner: {
    flexDirection: 'row',
    backgroundColor: P.tanTint8,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    color: P.coralMid2,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timerMainValue: {
    fontSize: 22,
    fontWeight: '800',
    color: P.rustDeep1,
  },
  timerLeftLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: P.rustDeep1,
  },
  timerRight: {
    alignItems: 'flex-end',
  },
  timerRightText: {
    fontSize: 11,
    color: P.coralMid4,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: P.grey500,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  askCard: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
  },
  counterCard: {
    flex: 1,
    backgroundColor: P.violetTint1,
    borderWidth: 1.5,
    borderColor: P.violetLight1,
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
  },
  cardHeaderAsk: {
    fontSize: 11,
    fontWeight: '800',
    color: P.grey500,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardHeaderCounter: {
    fontSize: 11,
    fontWeight: '800',
    color: P.violetMid1,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardField: {
    marginBottom: 10,
  },
  cardFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.grey500,
    marginBottom: 2,
  },
  cardFieldValue: {
    fontSize: 17,
    fontWeight: '800',
    color: P.grey900,
  },
  counterColor: {
    color: P.violetDeep1,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '800',
    color: P.coralMid3,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderStyle: 'dashed',
    marginVertical: 8,
    borderRadius: 1,
  },
  dashedDividerCounter: {
    borderColor: P.violetTint3,
  },
  reasonCard: {
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reasonHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: P.grey800,
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 14,
    color: P.greyDeep1,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: P.grey800,
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 12,
    padding: 12,
  },
  photoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: P.grey100,
    borderWidth: 1.5,
    borderColor: P.grey300,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photoTextContainer: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.grey900,
    marginBottom: 2,
  },
  photoSubtitle: {
    fontSize: 12,
    color: P.grey500,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: P.weatherCloudWhite,
    borderTopWidth: 1,
    borderTopColor: P.greyTint1,
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
    backgroundColor: colors.brandGreen,
  },
  btnAcceptIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: P.weatherCloudWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  btnAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.weatherCloudWhite,
  },
  btnCounter: {
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.violetMid1,
  },
  btnCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.violetMid1,
    marginTop: 2,
  },
  btnWithdraw: {
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.grey300,
  },
  btnWithdrawText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.greyDeep1,
    marginTop: 2,
  },
});

