/**
 * RMA Detail — everything about one return request, with the Inspect Product
 * entry into the review flow.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Inspect Product" only with `rma.request.process` (FINAL_LIST row 105).
 * The warehouse field comes from the viewer's scope (Sub) or the record
 * (Main), never from a 'Coonoor Warehouse' literal.
 *
 * Customer evidence photos are shown as non-expandable thumbnails: the image
 * viewer (SubWarehouseImageViewerScreen, FINAL_LIST row 106) was dropped by the
 * owner, so a thumbnail no longer opens anything.
 *
 * Absorbs MainWarehouseRmaDetailScreen (pair M10-S02): its "Refund
 * Information" card (amount + method) is rendered for the Main view; its
 * "View Customer" button had no handler and is not ported.
 */
// Design id: M10-S02
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { RMA_DETAIL_TIMELINE } from './fixtures';
import {
  InfoCard,
  isAllWarehouses,
  IssueTag,
  PermissionNote,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  ReturnsTimeline,
  SectionTitle,
} from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface RmaDetailScreenProps extends RmaScreenBaseProps {
  onInspectProduct: (rma: RmaRecord) => void;
}

function VerifiedCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5 5.5-5.5"
        stroke={adminColors.success.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ImageIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={adminColors.brand} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={adminColors.brand} />
      <Path d="M21 15l-5-5L5 21" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InspectClipboardIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Mock refund method shown on the Main "Refund Information" card (ported from the Main twin). */
const REFUND_METHOD = 'TOHFA Wallet';

export function RmaDetailScreen({ scope, can, rma, onBack, onInspectProduct }: RmaDetailScreenProps) {
  const canProcess = can('rma.request.process');
  const warehouseLabel = scope.warehouseName ?? rma.warehouseName ?? '—';

  return (
    <ReturnsScreen
      title="RMA Detail"
      subtitle={`${rma.rmaId} · ${rma.status}`}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          {canProcess ? (
            <ReturnsButton label="Inspect Product" icon={<InspectClipboardIcon />} onPress={() => onInspectProduct(rma)} />
          ) : (
            <PermissionNote>Inspecting returns needs the RMA processing permission.</PermissionNote>
          )}
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.eligibleBanner}>
          <VerifiedCheckIcon />
          <Text style={styles.eligibleBannerText}>Reported within return window — Eligible</Text>
        </View>

        <SectionTitle>Customer</SectionTitle>
        <InfoCard
          rows={[
            [{ label: 'Customer Name', value: rma.customerName }],
            [{ label: 'Customer ID · Phone', value: `${rma.customerId} · ${rma.customerPhone}` }],
          ]}
        />

        <SectionTitle>Order</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Order ID', value: rma.orderId },
              { label: 'Order Date', value: rma.orderDate },
            ],
            [
              { label: 'Warehouse', value: warehouseLabel },
              { label: 'Sales Channel', value: rma.salesChannel },
            ],
            [{ label: 'Payment Status', value: rma.paymentStatus }],
          ]}
        />

        <SectionTitle>Product</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Product', value: rma.productName },
              { label: 'Grade', value: rma.grade },
            ],
            [
              { label: 'Quantity Purchased', value: rma.quantityPurchased },
              { label: 'Unit Price', value: rma.unitPrice },
            ],
            [{ label: 'Line Total', value: rma.lineTotal }],
          ]}
        />

        <SectionTitle>Return / Issue Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Issue Category', value: <IssueTag label={rma.issueCategory} /> },
              { label: 'Reported Date', value: rma.reportedDate },
            ],
            [{ label: 'Description', value: <Text style={styles.descriptionText}>{rma.description}</Text> }],
          ]}
        />

        <SectionTitle>Customer Evidence</SectionTitle>
        <View style={styles.evidenceRow}>
          {/* Non-expandable thumbnails: the image viewer was dropped (FINAL_LIST row 106). */}
          <View style={styles.evidenceBox} accessibilityLabel="Customer Photo 1">
            <ImageIcon />
          </View>
          <View style={styles.evidenceBox} accessibilityLabel="Customer Photo 2">
            <ImageIcon />
          </View>
        </View>

        <SectionTitle>Ticket Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Issue Ticket', value: rma.ticketId },
              { label: 'RMA ID', value: rma.rmaId },
            ],
          ]}
        />

        <SectionTitle>Return Quantity</SectionTitle>
        <InfoCard rows={[[{ label: 'Requested Return Quantity', value: rma.requestedQuantity }]]} />

        <SectionTitle>Requested Resolution</SectionTitle>
        <InfoCard rows={[[{ label: 'Resolution', value: rma.requestedResolution }]]} />

        {isAllWarehouses(scope) ? (
          <>
            <SectionTitle>Refund Information</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Refund Amount', value: rma.lineTotal },
                  { label: 'Refund Method', value: REFUND_METHOD },
                ],
              ]}
            />
          </>
        ) : null}

        <SectionTitle>Timeline</SectionTitle>
        <ReturnsTimeline items={RMA_DETAIL_TIMELINE} />
      </ScrollView>
    </ReturnsScreen>
  );
}

// Evidence thumbnail edge: an image size, not spacing.
const EVIDENCE_SIZE = 72;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  eligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  eligibleBannerText: { ...adminType.sectionHead, color: adminColors.success.text, flex: 1 },
  descriptionText: { ...adminType.body, color: adminColors.ink },
  evidenceRow: { flexDirection: 'row', gap: adminSpacing.md },
  evidenceBox: {
    width: EVIDENCE_SIZE,
    height: EVIDENCE_SIZE,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
