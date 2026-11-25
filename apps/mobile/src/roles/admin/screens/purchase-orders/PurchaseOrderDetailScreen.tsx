/**
 * The design's Purchase Order detail (dashboard/PurchaseOrderDetailScreen) on
 * GET /admin/purchase-orders/{id}. Every section of the design is kept:
 *
 *  - Purchase Summary: PO number, listing id, farmer, produce, quantity,
 *    agreed price, total, all from the API.
 *  - Farmer Information: Farmer ID is `tohfaFarmerId`; Farm/Location is not in
 *    the API, so it is the dash.
 *  - Produce Information: listed quantity / price are not in the API (dash);
 *    the agreed ones are the order's own.
 *  - View Original Listing: kept, disabled with a note (this flow has no
 *    listing screen to open, and the host gives it none).
 *  - Negotiation Summary: the design's Counter Offer / Direct Approval toggle
 *    is kept. The farmer's original request and TOHFA's counter are not in the
 *    API (dash); the final agreed terms are the order's quantity, price, total.
 *  - Purchase Timeline: the design's five steps; see timelineSteps().
 *
 * The header subtitle is the PO number and its real status (the design's
 * fixed "Awaiting Handover" was a sample).
 */
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usePurchaseOrderDetail } from '../../api/purchaseOrdersHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { CheckCircleIcon, HourglassIcon, ReceiptIcon, TargetPlusIcon } from './PurchaseOrderIcons';
import { PurchaseOrdersFrame } from './PurchaseOrdersFrame';
import { DASH, purchaseOrdersAccess, timelineSteps, toDetailView, type TimelineKey } from './purchaseOrdersLogic';
import { styles } from './purchaseOrdersStyles';

export interface PurchaseOrderDetailScreenProps {
  can: Can | undefined;
  orderId: string;
  warehouseId?: string | undefined;
  onBack: () => void;
}

export function PurchaseOrderDetailScreen(props: PurchaseOrderDetailScreenProps) {
  if (!purchaseOrdersAccess(props.can).canView) {
    return (
      <PurchaseOrdersFrame title={t('purchaseOrders.detail.title')} onBack={props.onBack}>
        <AdminEmptyState title={t('purchaseOrders.notAvailable.title')} subtitle={t('purchaseOrders.notAvailable.subtitle')} />
      </PurchaseOrdersFrame>
    );
  }
  return <LiveDetail {...props} />;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.gridCol}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function TimelineIcon({ step }: { step: TimelineKey }) {
  const color = adminColors.brandDeep;
  if (step === 'listingCreated') return <TargetPlusIcon size={16} color={color} />;
  if (step === 'poCreated') return <ReceiptIcon size={16} color={color} />;
  if (step === 'current') return <HourglassIcon size={16} color={color} />;
  return <CheckCircleIcon size={16} color={color} />;
}

type Negotiation = 'counter' | 'direct';

function LiveDetail({ orderId, warehouseId, onBack }: PurchaseOrderDetailScreenProps) {
  const query = usePurchaseOrderDetail(warehouseId, orderId, { enabled: true });
  const [negotiation, setNegotiation] = useState<Negotiation>('counter');
  const dto = query.data;

  if (dto === undefined) {
    return (
      <PurchaseOrdersFrame title={t('purchaseOrders.detail.title')} onBack={onBack}>
        {query.isLoading || !query.error ? <AdminLoadingState /> : <AdminErrorState error={query.error} onRetry={query.refresh} />}
      </PurchaseOrdersFrame>
    );
  }

  const view = toDetailView(dto);
  const steps = timelineSteps(dto);
  const terms = t('purchaseOrders.detail.termsTotalLine', { qty: view.agreedQty, price: view.agreedPrice, total: view.total });

  return (
    <PurchaseOrdersFrame
      title={t('purchaseOrders.detail.title')}
      subtitle={t('purchaseOrders.detail.subtitle', { poNumber: view.poNumber, status: view.statusText })}
      onBack={onBack}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.detailScrollPad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={query.refresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />}
      >
        <Text style={styles.sectionTitle}>{t('purchaseOrders.detail.section.summary')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <Field label={t('purchaseOrders.detail.orderId')} value={view.poNumber} />
            <Field label={t('purchaseOrders.detail.listingId')} value={view.listingId} />
          </View>
          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <Field label={t('purchaseOrders.detail.farmer')} value={view.farmer} />
            <Field label={t('purchaseOrders.detail.produce')} value={view.produce} />
          </View>
          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <Field label={t('purchaseOrders.detail.quantity')} value={view.agreedQty} />
            <Field label={t('purchaseOrders.detail.agreedPrice')} value={view.agreedPrice} />
          </View>
          <View style={styles.fieldRowSpacing}>
            <Text style={styles.fieldLabel}>{t('purchaseOrders.detail.totalAmount')}</Text>
            <Text style={styles.fieldValue}>{view.total}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('purchaseOrders.detail.section.farmerInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <Field label={t('purchaseOrders.detail.farmerId')} value={view.farmerId} />
            <Field label={t('purchaseOrders.detail.farmLocation')} value={view.farmLocation} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('purchaseOrders.detail.section.produceInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <Field label={t('purchaseOrders.detail.listedQty')} value={view.listedQty} />
            <Field label={t('purchaseOrders.detail.agreedQty')} value={view.agreedQty} />
          </View>
          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <Field label={t('purchaseOrders.detail.listedPrice')} value={view.listedPrice} />
            <Field label={t('purchaseOrders.detail.agreedPrice')} value={view.agreedPrice} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.outlineActionBtn, styles.outlineActionBtnDisabled]}
          disabled
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="purchaseOrders.detail.viewListing"
        >
          <Text style={styles.outlineActionBtnText}>{t('purchaseOrders.detail.viewListing')}</Text>
        </TouchableOpacity>
        <Text style={styles.outlineActionNote}>{t('purchaseOrders.detail.viewListingNotAvailable')}</Text>

        <Text style={styles.sectionTitle}>{t('purchaseOrders.detail.section.terms')}</Text>
        <View style={styles.chipToggleRow}>
          {(['counter', 'direct'] as const).map((kind) => {
            const active = negotiation === kind;
            return (
              <TouchableOpacity
                key={kind}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                onPress={() => setNegotiation(kind)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`purchaseOrders.detail.negotiation.${kind}`}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {kind === 'counter' ? t('purchaseOrders.detail.counterOffer') : t('purchaseOrders.detail.direct')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {negotiation === 'counter' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.termHeading}>{t('purchaseOrders.detail.originalRequest')}</Text>
              <Text style={styles.termBody}>{t('purchaseOrders.detail.termsLine', { qty: DASH, price: DASH })}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.termHeading}>{t('purchaseOrders.detail.tohfaCounter')}</Text>
              <Text style={styles.termBody}>{t('purchaseOrders.detail.termsLine', { qty: DASH, price: DASH })}</Text>
            </View>
            <View style={[styles.card, styles.finalTermsCard]}>
              <Text style={styles.termHeading}>{t('purchaseOrders.detail.finalTerms')}</Text>
              <Text style={styles.termBody}>{terms}</Text>
            </View>
          </>
        ) : (
          <View style={[styles.card, styles.finalTermsCard]}>
            <Text style={styles.termHeading}>{t('purchaseOrders.detail.directApproval')}</Text>
            <Text style={styles.termBody}>{terms}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('purchaseOrders.detail.section.timeline')}</Text>
        <View style={styles.timelineContainer}>
          {steps.map((step, index) => (
            <View key={step.key} style={styles.timelineRow} testID={`purchaseOrders.timeline.${step.key}`}>
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.timelineIconBadge}>
                  <TimelineIcon step={step.key} />
                </View>
                {index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineTime}>{step.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </PurchaseOrdersFrame>
  );
}
