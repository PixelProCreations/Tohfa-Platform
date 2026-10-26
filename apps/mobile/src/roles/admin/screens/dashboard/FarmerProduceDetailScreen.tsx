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
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';

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

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface FarmProduceItem {
  id: string;
  name: string;
  grade: string;
  quantityKg: number;
  pricePerKg: number;
  status: 'Approved' | 'Pending Review' | 'Pending View' | 'Rejected' | 'Completed';
}

export interface FarmerProduceDetailScreenProps {
  farmerName?: string;
  farmerId?: string;
  zone?: string;
  farmingMethod?: string;
  initialItems?: FarmProduceItem[];
  completedProduceNames?: string[];
  onBack: () => void;
  onNavigateToCounterOffer?: (item: FarmProduceItem, isApproved: boolean) => void;
  onApproveAll?: () => void;
}

// Initial State matching Screenshot 4 (Beans: Pending Review, Tomato: Approved, Carrot: Pending View, Beans: Pending View)
const DEFAULT_PRODUCE_ITEMS: FarmProduceItem[] = [
  {
    id: 'P-01',
    name: 'Beans',
    grade: 'Grade 1',
    quantityKg: 75,
    pricePerKg: 100,
    status: 'Pending Review',
  },
  {
    id: 'P-02',
    name: 'Tomato',
    grade: 'Grade 1',
    quantityKg: 50,
    pricePerKg: 100,
    status: 'Approved',
  },
  {
    id: 'P-03',
    name: 'Carrot',
    grade: 'Grade 2',
    quantityKg: 80,
    pricePerKg: 70,
    status: 'Pending View',
  },
  {
    id: 'P-04',
    name: 'Beans',
    grade: 'Grade 2',
    quantityKg: 40,
    pricePerKg: 85,
    status: 'Pending View',
  },
];

// Approved State matching Screenshot 5 (Beans: Approved, Tomato: Approved, Carrot: Rejected, Beans: Rejected)
const APPROVED_PRODUCE_ITEMS: FarmProduceItem[] = [
  {
    id: 'P-01',
    name: 'Beans',
    grade: 'Grade 1',
    quantityKg: 75,
    pricePerKg: 100,
    status: 'Approved',
  },
  {
    id: 'P-02',
    name: 'Tomato',
    grade: 'Grade 1',
    quantityKg: 50,
    pricePerKg: 100,
    status: 'Approved',
  },
  {
    id: 'P-03',
    name: 'Carrot',
    grade: 'Grade 2',
    quantityKg: 80,
    pricePerKg: 70,
    status: 'Rejected',
  },
  {
    id: 'P-04',
    name: 'Beans',
    grade: 'Grade 2',
    quantityKg: 40,
    pricePerKg: 85,
    status: 'Rejected',
  },
];

export function FarmerProduceDetailScreen({
  farmerName = 'Ramesh Kumar',
  farmerId = 'FR-00241',
  zone = 'Coonoor',
  farmingMethod = 'Organic',
  initialItems,
  completedProduceNames,
  onBack,
  onNavigateToCounterOffer,
  onApproveAll,
}: FarmerProduceDetailScreenProps) {
  const isCompleted = Boolean(completedProduceNames && completedProduceNames.length > 0);
  const [isApprovedState, setIsApprovedState] = useState<boolean>(isCompleted);

  // Sync state if counter offer has been completed externally
  React.useEffect(() => {
    if (completedProduceNames && completedProduceNames.length > 0) {
      setIsApprovedState(true);
    }
  }, [completedProduceNames]);

  const items = isApprovedState || isCompleted
    ? APPROVED_PRODUCE_ITEMS
    : initialItems || DEFAULT_PRODUCE_ITEMS;

  const handleItemPress = (item: FarmProduceItem) => {
    if (onNavigateToCounterOffer) {
      onNavigateToCounterOffer(
        item,
        item.status === 'Approved' || item.status === 'Completed' || isApprovedState
      );
    }
  };

  const handleApprovalAction = () => {
    if (!isApprovedState && !isCompleted) {
      // Before counter offer completed: button remains static
      return;
    }
    // After counter offer completed: tapping active Approvel button finalizes and returns to listing
    if (onApproveAll) {
      onApproveAll();
    }
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`${farmerName} Farm`}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Farmer Information Section ─── */}
        <Text style={styles.sectionHeader}>Farmer Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoGridRow}>
            <View style={styles.infoGridCol}>
              <Text style={styles.infoLabel}>Farmer</Text>
              <Text style={styles.infoValue}>{farmerName}</Text>
            </View>
            <View style={styles.infoGridCol}>
              <Text style={styles.infoLabel}>Farmer ID</Text>
              <Text style={styles.infoValue}>{farmerId}</Text>
            </View>
          </View>

          <View style={[styles.infoGridRow, { marginTop: 14 }]}>
            <View style={styles.infoGridCol}>
              <Text style={styles.infoLabel}>Zone</Text>
              <Text style={styles.infoValue}>{zone}</Text>
            </View>
            <View style={styles.infoGridCol}>
              <Text style={styles.infoLabel}>Farming Method</Text>
              <Text style={styles.infoValue}>{farmingMethod}</Text>
            </View>
          </View>
        </View>

        {/* ─── Produce List Section ─── */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Produce list</Text>
        <View style={styles.produceList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.produceCard}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.75}
            >
              <View style={styles.produceRow}>
                <View style={styles.produceMetaCol}>
                  <Text style={styles.produceName}>{item.name}</Text>
                  <Text style={styles.produceSubtext}>
                    {`${item.grade} · ${item.quantityKg} KG · ₹${item.pricePerKg}/KG`}
                  </Text>
                </View>

                {/* Status Badge Matching Mockup States */}
                {item.status === 'Approved' ? (
                  <View style={styles.badgeApproved}>
                    <Text style={styles.badgeTextApproved}>Approved</Text>
                  </View>
                ) : item.status === 'Completed' ? (
                  <View style={styles.badgeApproved}>
                    <Text style={styles.badgeTextApproved}>Completed</Text>
                  </View>
                ) : item.status === 'Rejected' ? (
                  <View style={styles.badgeRejected}>
                    <Text style={styles.badgeTextRejected}>Rejected</Text>
                  </View>
                ) : item.status === 'Pending Review' ? (
                  <View style={styles.badgePending}>
                    <Text style={styles.badgeTextPending}>Pending Review</Text>
                  </View>
                ) : (
                  <View style={styles.badgePendingView}>
                    <Text style={styles.badgeTextPendingView}>Pending View</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ─── Docked Bottom Approval Button ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={[
            styles.approvalBtn,
            (isApprovedState || isCompleted) ? styles.approvalBtnActive : styles.approvalBtnInitial,
          ]}
          onPress={handleApprovalAction}
          disabled={!isApprovedState && !isCompleted}
          activeOpacity={(isApprovedState || isCompleted) ? 0.85 : 1}
        >
          <Text
            style={[
              styles.approvalBtnText,
              (isApprovedState || isCompleted) ? styles.approvalBtnTextActive : styles.approvalBtnTextInitial,
            ]}
          >
            Approvel
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived From Admin Theme ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 100,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoGridCol: {
    flex: 1,
  },
  infoLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  produceList: {
    gap: 12,
  },
  produceCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  produceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  produceMetaCol: {
    flex: 1,
    paddingRight: 12,
  },
  produceName: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 3,
  },
  produceSubtext: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    fontWeight: '600',
  },

  // ─── Status Badges ───
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextApproved: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextPending: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  badgeRejected: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextRejected: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  badgePendingView: {
    backgroundColor: adminColors.canvas,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextPendingView: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
  },

  // ─── Docked Bottom Approval Button ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  approvalBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalBtnInitial: {
    backgroundColor: adminColors.brand,
    opacity: 0.45,
  },
  approvalBtnActive: {
    backgroundColor: adminColors.brand,
    opacity: 1,
    ...adminShadow.sm,
  },
  approvalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  approvalBtnTextInitial: {
    color: adminColors.onBrand,
  },
  approvalBtnTextActive: {
    color: adminColors.onBrand,
  },
});
