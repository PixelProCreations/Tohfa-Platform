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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';
import { SubWarehouseImageViewerScreen } from './SubWarehouseImageViewerScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenBg:       '#ECFDF5',
  greenBorder:   '#A7F3D0',
  greenText:     '#065F46',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function VerifiedCheckIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ImageIcon({ size = 24, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockBlueIcon({ size = 16, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InspectClipboardIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface SubWarehouseRmaDetailScreenProps {
  rma: RmaRecord;
  onBack: () => void;
  onInspectProduct: (rma: RmaRecord) => void;
  onViewImage?: ((photoIndex: number) => void) | undefined;
}

export function SubWarehouseRmaDetailScreen({
  rma,
  onBack,
  onInspectProduct,
  onViewImage,
}: SubWarehouseRmaDetailScreenProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const handleOpenPhoto = (index: number) => {
    if (onViewImage) {
      onViewImage(index);
    } else {
      setSelectedPhoto(index);
    }
  };

  if (selectedPhoto !== null) {
    return (
      <SubWarehouseImageViewerScreen
        rma={rma}
        photoIndex={selectedPhoto}
        onBack={() => setSelectedPhoto(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>RMA Detail</Text>
            <Text style={styles.headerSubtitle}>
              {rma.rmaId} · Under Review
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Green Banner: Eligible ─── */}
        <View style={styles.eligibleBanner}>
          <VerifiedCheckIcon size={18} color="#059669" />
          <Text style={styles.eligibleBannerText}>
            Reported within return window — Eligible
          </Text>
        </View>

        {/* ─── Customer Section ─── */}
        <Text style={styles.sectionHeader}>Customer</Text>
        <View style={styles.card}>
          <Text style={styles.customerSubLabel}>Customer Name</Text>
          <Text style={styles.customerName}>{rma.customerName}</Text>
          <Text style={styles.customerInfoText}>
            {rma.customerId} · {rma.customerPhone}
          </Text>
        </View>

        {/* ─── Order Section ─── */}
        <Text style={styles.sectionHeader}>Order</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order ID</Text>
              <Text style={styles.fieldValue}>{rma.orderId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order Date</Text>
              <Text style={styles.fieldValue}>{rma.orderDate}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>Coonoor Warehouse</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Sales Channel</Text>
              <Text style={styles.fieldValue}>{rma.salesChannel}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Payment Status</Text>
            <Text style={styles.fieldValue}>{rma.paymentStatus}</Text>
          </View>
        </View>

        {/* ─── Product Section ─── */}
        <Text style={styles.sectionHeader}>Product</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Product</Text>
              <Text style={styles.fieldValue}>{rma.productName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Grade</Text>
              <Text style={styles.fieldValue}>{rma.grade}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Quantity Purchased</Text>
              <Text style={styles.fieldValue}>{rma.quantityPurchased}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Unit Price</Text>
              <Text style={styles.fieldValue}>{rma.unitPrice}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Line Total</Text>
            <Text style={styles.fieldValue}>{rma.lineTotal}</Text>
          </View>
        </View>

        {/* ─── Return / Issue Information Section ─── */}
        <Text style={styles.sectionHeader}>Return / Issue Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Issue Category</Text>
              <View style={styles.damagedTag}>
                <Text style={styles.damagedTagText}>{rma.issueCategory}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Reported Date</Text>
              <Text style={styles.fieldValue}>{rma.reportedDate}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.descriptionText}>{rma.description}</Text>
          </View>
        </View>

        {/* ─── Customer Evidence Section ─── */}
        <Text style={styles.sectionHeader}>Customer Evidence</Text>
        <View style={styles.evidenceRow}>
          <TouchableOpacity
            style={styles.evidenceBox}
            onPress={() => handleOpenPhoto(1)}
            activeOpacity={0.75}
            accessibilityLabel="Customer Photo 1"
          >
            <ImageIcon size={24} color="#C2410C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.evidenceBox}
            onPress={() => handleOpenPhoto(2)}
            activeOpacity={0.75}
            accessibilityLabel="Customer Photo 2"
          >
            <ImageIcon size={24} color="#C2410C" />
          </TouchableOpacity>
        </View>

        {/* ─── Ticket Information Section ─── */}
        <Text style={styles.sectionHeader}>Ticket Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Issue Ticket</Text>
              <Text style={styles.ticketBoldValue}>{rma.ticketId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>RMA ID</Text>
              <Text style={styles.ticketBoldValue}>{rma.rmaId}</Text>
            </View>
          </View>
        </View>

        {/* ─── Return Quantity Section ─── */}
        <Text style={styles.sectionHeader}>Return Quantity</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Requested Return Quantity</Text>
          <Text style={styles.returnQtyText}>{rma.requestedQuantity}</Text>
        </View>

        {/* ─── Requested Resolution Section ─── */}
        <Text style={styles.sectionHeader}>Requested Resolution</Text>
        <View style={styles.card}>
          <Text style={styles.fieldValue}>{rma.requestedResolution}</Text>
        </View>

        {/* ─── Timeline Section (Screenshot 1) ─── */}
        <Text style={styles.sectionHeader}>Timeline</Text>
        <View style={styles.timelineContainer}>
          {[
            { title: 'Issue Reported', time: '25 Sep, 10:30 AM', isLast: false },
            { title: 'RMA Created', time: '25 Sep, 10:30 AM', isLast: false },
            { title: 'Assigned for Review', time: '25 Sep, 10:35 AM', isLast: false },
            { title: 'Inspection Pending', time: '25 Sep, 10:40 AM', isLast: true },
          ].map((item, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                {!item.isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.inspectButton}
          onPress={() => onInspectProduct(rma)}
          activeOpacity={0.88}
        >
          <InspectClipboardIcon size={20} color="#FFFFFF" />
          <Text style={styles.inspectButtonText}>Inspect Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Green Eligible Banner */
  eligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.greenBg,
    borderWidth: 1,
    borderColor: PALETTE.greenBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  eligibleBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.greenText,
    flex: 1,
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 8,
  },

  /* Card */
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Customer card specifics */
  customerSubLabel: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  customerInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  /* Damaged Tag */
  damagedTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  damagedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
    lineHeight: 18,
  },

  /* Evidence Photo Boxes */
  evidenceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  evidenceBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Ticket info bold values */
  ticketBoldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Return Qty */
  returnQtyText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },

  /* Blue Lock Alert Box */
  blueAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  blueAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.blueText,
    flex: 1,
    lineHeight: 16,
  },

  /* Timeline */
  timelineContainer: {
    paddingLeft: 4,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: '#EBE5DC',
    marginVertical: 2,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  /* Sticky Bottom Bar */
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inspectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  inspectButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
