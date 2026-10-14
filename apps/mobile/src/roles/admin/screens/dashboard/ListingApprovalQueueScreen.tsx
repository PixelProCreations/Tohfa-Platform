/**
 * Screen 44 — Listing Approval Queue
 * Admin can review and approve/counter/reject listings with grade filters
 * Farmer Admin's own listings are auto-routed (conflict of interest rule)
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

type Grade = 'All' | 'Grade 1' | 'Grade 2' | 'Grade 3';

interface Listing {
  id: string;
  cropName: string;
  quantity: string;
  pricePerKg: number;
  ceilingPrice: number;
  farmerName: string;
  farmerId: string;
  grade: string;
  isOwnListing?: boolean;
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    cropName: 'Carrots',
    quantity: '80kg',
    pricePerKg: 40,
    ceilingPrice: 42,
    farmerName: 'Vijay Anand',
    farmerId: 'TOHFA-F-00234',
    grade: 'Grade 1',
  },
  {
    id: '2',
    cropName: 'Beetroot',
    quantity: '45kg',
    pricePerKg: 35,
    ceilingPrice: 35,
    farmerName: 'Kavitha M.',
    farmerId: 'TOHFA-F-00302',
    grade: 'Grade 2',
  },
  {
    id: '3',
    cropName: 'Tomatoes',
    quantity: '60kg',
    pricePerKg: 28,
    ceilingPrice: 30,
    farmerName: 'Ravi Kumar',
    farmerId: 'TOHFA-F-00145',
    grade: 'Grade 3',
  },
  {
    id: '4',
    cropName: 'Cabbage',
    quantity: '35kg',
    pricePerKg: 22,
    ceilingPrice: 25,
    farmerName: 'Lakshmi R.',
    farmerId: 'TOHFA-F-00289',
    grade: 'Grade 3',
  },
];

interface ListingApprovalQueueScreenProps {
  onBack: () => void;
  onApprove: (id: string) => void;
  onCounter: (id: string) => void;
  onReject: (id: string) => void;
}

export function ListingApprovalQueueScreen({
  onBack,
  onApprove,
  onCounter,
  onReject,
}: ListingApprovalQueueScreenProps) {
  const [selectedGrade, setSelectedGrade] = useState<Grade>('All');

  const grades: Grade[] = ['All', 'Grade 1', 'Grade 2', 'Grade 3'];

  const filteredListings =
    selectedGrade === 'All'
      ? MOCK_LISTINGS
      : MOCK_LISTINGS.filter((l) => l.grade === selectedGrade);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('listingApprovalQueue.backLabel')}
        >
          <Icon name="chevron_right" size={20} color={adminColors.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>{t('listingApprovalQueue.title')}</Text>
        <Text style={styles.subtitle}>
          {filteredListings.length === 1 
            ? t('listingApprovalQueue.subtitleSingular') 
            : `${filteredListings.length} ${t('listingApprovalQueue.subtitlePlural')}`}
        </Text>

        {/* Grade Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScroll}
        >
          {grades.map((grade) => {
            const isActive = selectedGrade === grade;
            return (
              <TouchableOpacity
                key={grade}
                onPress={() => setSelectedGrade(grade)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{grade}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Listing Cards */}
        <View style={styles.listingList}>
          {filteredListings.map((listing) => (
            <View key={listing.id} style={styles.listingCard}>
              {/* Icon */}
              <View style={styles.iconBox}>
                <Icon name="eco" size={20} color={adminColors.brand} />
              </View>

              {/* Content */}
              <View style={styles.listingContent}>
                <View style={styles.listingHeader}>
                  <Text style={styles.cropName}>
                    {listing.cropName} — {listing.quantity}
                  </Text>
                  <View style={styles.priceColumn}>
                    <Text style={styles.priceAmount}>₹{listing.pricePerKg}/kg</Text>
                    <Text style={styles.ceilingText}>
                      {t('listingApprovalQueue.label.ceiling')} ₹{listing.ceilingPrice}
                    </Text>
                  </View>
                </View>

                <Text style={styles.farmerInfo}>
                  {listing.farmerName} · #{listing.farmerId}
                </Text>

                <View style={styles.gradeBadgeRow}>
                  <View
                    style={[
                      styles.gradeBadge,
                      listing.grade === 'Grade 1' && styles.gradeBadge1,
                      listing.grade === 'Grade 2' && styles.gradeBadge2,
                    ]}
                  >
                    <Text style={styles.gradeBadgeText}>{listing.grade}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {!listing.isOwnListing && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => onApprove(listing.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="check" size={16} color={adminColors.success.text} />
                      <Text style={styles.approveBtnText}>{t('listingApprovalQueue.action.approve')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => onCounter(listing.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="swap_horiz" size={16} color={adminColors.ink} />
                      <Text style={styles.counterBtnText}>{t('listingApprovalQueue.action.counter')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => onReject(listing.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="close" size={18} color={adminColors.danger.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.xl,
  },
  title: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: 6,
  },
  subtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: adminSpacing.xl,
  },
  tabsScroll: {
    marginBottom: adminSpacing.xl,
    marginHorizontal: -adminSpacing.xl,
  },
  tabsContainer: {
    paddingHorizontal: adminSpacing.xl,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
  },
  tabTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  listingList: {
    gap: 10,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: adminColors.brandTint,
  },
  listingContent: {
    flex: 1,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cropName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  farmerInfo: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: -4,
    marginBottom: 6,
  },
  gradeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: adminColors.warning.bg,
  },
  gradeBadge1: {
    backgroundColor: adminColors.warning.bg,
  },
  gradeBadge2: {
    backgroundColor: adminColors.brandTint,
  },
  gradeBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  ceilingText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.xs,
    paddingVertical: 10,
    gap: 4,
  },
  approveBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  counterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xs,
    paddingVertical: 10,
    gap: 4,
  },
  counterBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  rejectBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.xs,
  },
  bottomSpacer: {
    height: 40,
  },
});
