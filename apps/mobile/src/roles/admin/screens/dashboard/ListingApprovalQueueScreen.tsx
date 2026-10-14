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

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  orangeLight: '#FFF3EF',
  yellowBg: '#FFF9E6',
  yellowText: '#9A6B00',
  green: '#2E7D32',
  greenBg: '#E8F5E9',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  ceilingGray: '#9A8F88',
  border: '#EDE9E4',
  warningBg: '#FFF3E0',
  warningText: '#E08000',
};

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
      <StatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>Listing Approval Queue</Text>
        <Text style={styles.subtitle}>
          {filteredListings.length === 1 
            ? '1 listing awaiting review' 
            : `${filteredListings.length} listings awaiting review`}
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
              <View style={[styles.iconBox, { backgroundColor: P.orangeBg }]}>
                <Icon name="eco" size={20} color={P.orange} />
              </View>

              {/* Content */}
              <View style={styles.listingContent}>
                <View style={styles.listingHeader}>
                  <Text style={styles.cropName}>
                    {listing.cropName} — {listing.quantity}
                  </Text>
                  <View style={styles.priceColumn}>
                    <Text style={styles.priceAmount}>₹{listing.pricePerKg}/kg</Text>
                    <Text style={styles.ceilingText}>Ceiling ₹{listing.ceilingPrice}</Text>
                  </View>
                </View>

                <Text style={styles.farmerInfo}>
                  {listing.farmerName} · #{listing.farmerId}
                </Text>

                <View style={styles.gradeBadgeRow}>
                  <View
                    style={[
                      styles.gradeBadge,
                      listing.grade === 'Grade 1' && { backgroundColor: '#FFF3E0' },
                      listing.grade === 'Grade 2' && { backgroundColor: '#FFF9E6' },
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
                      <Icon name="check" size={16} color={P.green} />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => onCounter(listing.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="swap_horiz" size={16} color="#1a1a1a" />
                      <Text style={styles.counterBtnText}>Counter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => onReject(listing.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="close" size={18} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Conflict of Interest Warning */}
          <View style={styles.warningCard}>
            <Icon name="warning" size={16} color={P.warningText} style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              Farmer Admin's own listings are auto-routed here for SA/TA review — conflict-of-interest rule.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#1A1A1A',
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  tabsScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
  },
  tabActive: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.body,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listingList: {
    gap: 10,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 12,
    marginTop: 0,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listingContent: {
    flex: 1,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  farmerInfo: {
    fontSize: 13,
    color: P.lightGray,
    marginTop: -4,
    marginBottom: 6,
    fontFamily: 'Manrope, system-ui, sans-serif',
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
    backgroundColor: P.yellowBg,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.yellowText,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  ceilingText: {
    fontSize: 11,
    color: P.ceilingGray,
    fontFamily: 'Manrope, system-ui, sans-serif',
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
    backgroundColor: P.greenBg,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.green,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  counterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orangeLight,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  counterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  rejectBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.warningBg,
    borderRadius: 12,
    padding: 14,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 10.5,
    color: P.warningText,
    lineHeight: 15,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
