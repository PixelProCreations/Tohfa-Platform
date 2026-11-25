/**
 * Markup & pricing breakdown (Market & Pricing phase 2B): the team design's
 * MarkupPricingBreakdownScreen (origin/tofhafarmfin-rbac) as ONE shared
 * layout. The design's Tohfa sections ("Price inputs", "Calculation details",
 * "History") and Farmer Admin sections ("Pricing Flow", "Expense Breakdown")
 * are both drawn, so no role sees less than its design did; there is no role
 * prop.
 *
 * Data: the live retail row the retail list was tapped with (no extra
 * request). Only retail price, ceiling and markupPct are real; everything the
 * owner has not defined (decision D5) is the placeholder, and the design's
 * demo history is an empty state (no retail price history endpoint).
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { RetailPriceRowView } from '../../../api/pricingTypes';
import { t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { PricingScreenFrame } from '../retail/PricingScreenFrame';
import { frameStyles } from '../retail/pricingFrameStyles';
import { markupAccess, markupView, type MarkupScreenView } from './markupBreakdownLogic';
import { markupStyles as styles } from './markupBreakdownStyles';

export interface MarkupPricingBreakdownScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The live retail row (from RetailPricingScreen's onSelectBreakdown). */
  row?: RetailPriceRowView | undefined;
}

function InputRow({ label, value, last = false }: { label: TranslationKey; value: string; last?: boolean }) {
  return (
    <>
      <View style={styles.inputRow}>
        <Text style={styles.rowLabel}>{t(label)}</Text>
        <Text style={styles.rowValueBold}>{value}</Text>
      </View>
      {last ? null : <View style={styles.divider} />}
    </>
  );
}

function FlowCard({ label, value }: { label: TranslationKey; value: string }) {
  return (
    <View style={styles.flowCard}>
      <Text style={styles.flowLabel}>{t(label)}</Text>
      <Text style={styles.flowValue}>{value}</Text>
    </View>
  );
}

function Operator({ symbol }: { symbol: TranslationKey }) {
  return <Text style={styles.operatorText}>{t(symbol)}</Text>;
}

function BreakdownBody({ view }: { view: MarkupScreenView }) {
  return (
    <>
      <View style={styles.sectionContainer}>
        <Text style={frameStyles.sectionHeading}>{t('pricingRetail.markup.inputs.heading')}</Text>
        <View style={styles.card}>
          <InputRow label="pricingRetail.markup.inputs.purchase" value={view.purchasePrice} />
          <InputRow label="pricingRetail.markup.inputs.costComponents" value={view.costComponents} />
          <InputRow label="pricingRetail.markup.inputs.markup" value={view.markup} />
          <InputRow label="pricingRetail.markup.inputs.retail" value={view.retail} />
          <InputRow label="pricingRetail.markup.inputs.ceiling" value={view.ceiling} last />
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={frameStyles.sectionHeading}>{t('pricingRetail.markup.calc.heading')}</Text>
        <View style={styles.card}>
          <Text style={styles.calcNoticeText}>{t('pricingRetail.markup.calc.notice')}</Text>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <Text style={styles.validationLabel}>{t('pricingRetail.markup.calc.validation')}</Text>
            <Text style={[styles.validationValue, view.validationAbove && styles.validationValueAlert]}>{view.validation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={frameStyles.sectionHeading}>{t('pricingRetail.markup.flow.heading')}</Text>
        <FlowCard label="pricingRetail.markup.flow.purchase" value={view.purchasePrice} />
        <Operator symbol="pricingRetail.markup.flow.plus" />
        <FlowCard label="pricingRetail.markup.flow.markup" value={view.markup} />
        <Operator symbol="pricingRetail.markup.flow.plus" />
        <FlowCard label="pricingRetail.markup.flow.expenses" value={view.expenses} />
        <Operator symbol="pricingRetail.markup.flow.equals" />
        <FlowCard label="pricingRetail.markup.flow.retail" value={view.retail} />
        <Operator symbol="pricingRetail.markup.flow.minus" />
        <FlowCard label="pricingRetail.markup.flow.discount" value={view.customerDiscount} />
        <Operator symbol="pricingRetail.markup.flow.equals" />
        <View style={styles.finalPriceCard}>
          <Text style={styles.finalPriceLabel}>{t('pricingRetail.markup.flow.final')}</Text>
          <Text style={styles.finalPriceValue}>{view.finalPrice}</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={frameStyles.sectionHeading}>{t('pricingRetail.markup.expenses.heading')}</Text>
        <View style={styles.expenseCard}>
          <View style={styles.expenseRow}>
            <Text style={styles.flowLabel}>{t('pricingRetail.markup.expenses.freight')}</Text>
            <Text style={styles.flowValue}>{view.freight}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.expenseRow}>
            <Text style={styles.flowLabel}>{t('pricingRetail.markup.expenses.loading')}</Text>
            <Text style={styles.flowValue}>{view.loading}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.expenseRow}>
            <Text style={styles.flowLabel}>{t('pricingRetail.markup.expenses.unloading')}</Text>
            <Text style={styles.flowValue}>{view.unloading}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={frameStyles.sectionHeading}>{t('pricingRetail.markup.history.heading')}</Text>
        <AdminEmptyState title={t('pricingRetail.markup.history.empty')} />
      </View>
    </>
  );
}

export function MarkupPricingBreakdownScreen({ onBack, can, row }: MarkupPricingBreakdownScreenProps) {
  const access = markupAccess(can);
  const view = access.canView && row !== undefined ? markupView(row, access) : null;
  return (
    <PricingScreenFrame title={t('pricingRetail.markup.title')} subtitle={view?.title} onBack={onBack} testIdPrefix="pricingMarkup">
      {!access.canView ? (
        <AdminEmptyState title={t('pricingRetail.notAvailable.title')} subtitle={t('pricingRetail.notAvailable.subtitle')} />
      ) : view === null ? (
        <AdminEmptyState title={t('pricingRetail.markup.noRow.title')} subtitle={t('pricingRetail.markup.noRow.subtitle')} />
      ) : (
        <BreakdownBody view={view} />
      )}
    </PricingScreenFrame>
  );
}
