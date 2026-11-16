/**
 * The design's Confirm Purchase Terms (dashboard/ConfirmPurchaseTermsScreen),
 * reading the order from GET /admin/purchase-orders/{id}.
 *
 * The API has no endpoint that confirms or locks purchase terms, so the
 * design's "Confirm & Lock Terms" button is kept but always disabled, with a
 * not-available note; the acknowledgement checkbox still toggles as in the
 * design. Requested quantity / price are not in the API (dash).
 *
 * Not routed by PurchaseOrdersFlow: in the design it opens from the list's
 * "Collect" action, which the design's list never renders. Exported so a host
 * that gains that entry point can mount it.
 */
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usePurchaseOrderDetail } from '../../api/purchaseOrdersHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { CheckmarkIcon } from './PurchaseOrderIcons';
import { PurchaseOrdersFrame } from './PurchaseOrdersFrame';
import { DASH, purchaseOrdersAccess, toDetailView } from './purchaseOrdersLogic';
import { styles } from './purchaseOrdersStyles';

export interface ConfirmPurchaseTermsScreenProps {
  can: Can | undefined;
  orderId: string;
  warehouseId?: string | undefined;
  onBack: () => void;
}

export function ConfirmPurchaseTermsScreen(props: ConfirmPurchaseTermsScreenProps) {
  if (!purchaseOrdersAccess(props.can).canView) {
    return (
      <PurchaseOrdersFrame title={t('purchaseOrders.confirm.title')} onBack={props.onBack}>
        <AdminEmptyState title={t('purchaseOrders.notAvailable.title')} subtitle={t('purchaseOrders.notAvailable.subtitle')} />
      </PurchaseOrdersFrame>
    );
  }
  return <LiveConfirm {...props} />;
}

function TwoCol({ left, right }: { left: [string, string]; right: [string, string] }) {
  return (
    <View style={styles.twoColRow}>
      <View style={styles.col}>
        <Text style={styles.confirmFieldLabel}>{left[0]}</Text>
        <Text style={styles.confirmFieldValue}>{left[1]}</Text>
      </View>
      <View style={styles.col}>
        <Text style={styles.confirmFieldLabel}>{right[0]}</Text>
        <Text style={styles.confirmFieldValue}>{right[1]}</Text>
      </View>
    </View>
  );
}

function LiveConfirm({ orderId, warehouseId, onBack }: ConfirmPurchaseTermsScreenProps) {
  const query = usePurchaseOrderDetail(warehouseId, orderId, { enabled: true });
  const [acknowledged, setAcknowledged] = useState(false);
  const title = t('purchaseOrders.confirm.title');

  if (query.data === undefined) {
    return (
      <PurchaseOrdersFrame title={title} onBack={onBack}>
        {query.isLoading || !query.error ? <AdminLoadingState /> : <AdminErrorState error={query.error} onRetry={query.refresh} />}
      </PurchaseOrdersFrame>
    );
  }

  const view = toDetailView(query.data);
  const hasCalc = view.agreedQty !== DASH && view.agreedPrice !== DASH;

  return (
    <PurchaseOrdersFrame title={title} onBack={onBack}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.confirmScrollPad} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmCard}>
          <TwoCol left={[t('purchaseOrders.confirm.farmer'), view.farmer]} right={[t('purchaseOrders.confirm.produce'), view.produce]} />
        </View>

        <Text style={styles.sectionTitle}>{t('purchaseOrders.confirm.requestedQty')}</Text>
        <View style={styles.confirmCard}>
          <TwoCol left={[t('purchaseOrders.confirm.requestedQty'), DASH]} right={[t('purchaseOrders.confirm.agreedQty'), view.agreedQty]} />
        </View>

        <Text style={styles.sectionTitle}>{t('purchaseOrders.confirm.requestedPrice')}</Text>
        <View style={styles.confirmCard}>
          <TwoCol left={[t('purchaseOrders.confirm.requestedPrice'), DASH]} right={[t('purchaseOrders.confirm.agreedPrice'), view.agreedPrice]} />
        </View>

        <Text style={styles.sectionTitle}>{t('purchaseOrders.confirm.totalAmount')}</Text>
        <View style={[styles.confirmCard, styles.calcCard]}>
          {hasCalc ? <Text style={styles.calcSubline}>{t('purchaseOrders.confirm.calcLine', { qty: view.agreedQty, price: view.agreedPrice })}</Text> : null}
          <Text style={styles.calcTotal}>{view.total === DASH ? DASH : t('purchaseOrders.confirm.totalLine', { total: view.total })}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcknowledged((v) => !v)}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          testID="purchaseOrders.confirm.acknowledge"
        >
          <View style={[styles.checkboxBox, acknowledged && styles.checkboxBoxChecked]}>
            {acknowledged ? <CheckmarkIcon size={12} color={adminColors.onBrand} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>{t('purchaseOrders.confirm.acknowledgement')}</Text>
        </TouchableOpacity>

        <View style={styles.confirmBottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          disabled
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="purchaseOrders.confirm.submit"
        >
          <Text style={styles.confirmBtnText}>{t('purchaseOrders.confirm.confirmBtn')}</Text>
        </TouchableOpacity>
        <Text style={styles.confirmNote}>{t('purchaseOrders.confirm.notAvailable')}</Text>
      </View>
    </PurchaseOrdersFrame>
  );
}
