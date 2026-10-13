/**
 * Invoice detail — `GET /invoices/{id}`, read-only.
 *
 * An id outside the admin's scope is 404 `NOT_FOUND` from the server (never
 * 403, BR-30/BR-36), shown through AsyncStates as "could not be found".
 *
 * HIDDEN — PDF download. `GET /invoices/{id}/download` exists but answers
 * `application/pdf` bytes or a 302 to a signed link. The app has no
 * file-saving dependency, the shared JSON client cannot read a PDF, and RN's
 * fetch follows the 302 itself, so the signed link cannot be obtained to hand
 * to the OS viewer. Gated on `invoiceDownload` in ../availability.ts, which
 * cites the gap; the button renders once that entry names a usable endpoint.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button } from '@tohfa/mobile-ui';
import { getInvoice } from '../../../api/invoices';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { t, type TranslationKey } from '../../../i18n';
import { formatPaise, type Paise } from '../../../money/paise';
import { formatGramsAsKg } from '../../../money/quantity';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { isWarehouseFeatureVisible } from '../availability';
import { AsyncStates } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { INVOICES_RESOURCE } from './InvoiceListScreen';
import { toInvoiceDetail, type InvoiceDetail, type InvoiceLine } from './mappers';

export interface InvoiceDetailScreenProps {
  invoiceId: string;
  onBack: () => void;
  /** Wired only when the download feature becomes available (see header). */
  onDownload?: ((invoiceId: string) => void) | undefined;
}

const { colors, spacing, typography, weights, radius } = adminTheme;

export function InvoiceDetailScreen(props: InvoiceDetailScreenProps): React.JSX.Element {
  const { scope, can } = useAdminSession();
  const query = useAdminQuery(
    adminKeys.detail(scope.warehouseId, INVOICES_RESOURCE, props.invoiceId),
    async (signal) => toInvoiceDetail(await getInvoice(props.invoiceId, signal)),
  );
  const state = queryViewState(query, () => false);
  const canDownload = isWarehouseFeatureVisible('invoiceDownload', can) && props.onDownload;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={query.data?.invoiceNumber ?? t('admin.invoices.detail.title')}
        subtitle={scope.warehouseName}
        onBack={props.onBack}
      />
      <AsyncStates state={state} error={query.error} onRetry={() => void query.refetch()}>
        {query.data === undefined ? null : (
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <Summary invoice={query.data} />
            <Lines lines={query.data.lines} />
            {canDownload ? (
              <Button
                title={t('admin.invoices.detail.download')}
                onPress={() => props.onDownload?.(props.invoiceId)}
              />
            ) : null}
          </ScrollView>
        )}
      </AsyncStates>
    </View>
  );
}

function Section(props: { children: React.ReactNode }): React.JSX.Element {
  return (
    <View
      style={[
        styles.section,
        {
          padding: spacing.lg,
          gap: spacing.sm,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.white,
        },
      ]}
    >
      {props.children}
    </View>
  );
}

function Field(props: {
  labelKey: TranslationKey;
  value: string;
  emphasis?: boolean | undefined;
}): React.JSX.Element {
  return (
    <View style={[styles.rowBetween, { gap: spacing.md }]}>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.body }}>
        {t(props.labelKey)}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: colors.onSurface,
            fontSize: props.emphasis ? typography.bodyLarge : typography.body,
            fontWeight: props.emphasis ? weights.bold : weights.medium,
          },
        ]}
      >
        {props.value}
      </Text>
    </View>
  );
}

const NA = (): string => t('admin.invoices.detail.notAvailable');
const money = (paise: Paise | null): string => (paise === null ? NA() : formatPaise(paise));

function Summary({ invoice }: { invoice: InvoiceDetail }): React.JSX.Element {
  return (
    <Section>
      <View style={[styles.rowBetween, { gap: spacing.sm }]}>
        <Text
          style={[
            styles.value,
            { color: colors.onSurface, fontSize: typography.title, fontWeight: weights.bold },
          ]}
        >
          {formatPaise(invoice.totalPaise)}
        </Text>
        <Badge label={t(invoice.status.labelKey)} variant={invoice.status.tone} />
      </View>
      <Field labelKey="admin.invoices.detail.issueDate" value={invoice.issueDateLabel} />
      <Field labelKey="admin.invoices.detail.type" value={t(invoice.typeLabelKey)} />
      <Field
        labelKey="admin.invoices.detail.placeOfSupply"
        value={invoice.placeOfSupply ?? NA()}
      />
      <Field labelKey="admin.invoices.detail.taxable" value={money(invoice.taxablePaise)} />
      <Field labelKey="admin.invoices.detail.cgst" value={money(invoice.cgstPaise)} />
      <Field labelKey="admin.invoices.detail.sgst" value={money(invoice.sgstPaise)} />
      <Field labelKey="admin.invoices.detail.igst" value={money(invoice.igstPaise)} />
      <Field labelKey="admin.invoices.detail.total" value={formatPaise(invoice.totalPaise)} emphasis />
      {invoice.gstInclusive ? (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.invoices.detail.gstInclusive')}
        </Text>
      ) : null}
    </Section>
  );
}

function Lines({ lines }: { lines: InvoiceLine[] }): React.JSX.Element {
  return (
    <Section>
      <Text
        accessibilityRole="header"
        style={{ color: colors.onSurface, fontSize: typography.bodyLarge, fontWeight: weights.semibold }}
      >
        {t('admin.invoices.detail.lines')}
      </Text>
      {lines.length === 0 ? (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.body }}>
          {t('admin.invoices.detail.noLines')}
        </Text>
      ) : (
        lines.map((line) => <LineRow key={line.key} line={line} />)
      )}
    </Section>
  );
}

function LineRow({ line }: { line: InvoiceLine }): React.JSX.Element {
  const sub = { color: colors.onSurfaceVariant, fontSize: typography.bodySmall };
  return (
    <View
      style={[
        styles.line,
        { paddingTop: spacing.sm, gap: spacing.xs, borderTopColor: colors.border },
      ]}
    >
      <View style={[styles.rowBetween, { gap: spacing.sm }]}>
        <Text style={[styles.flex, { color: colors.onSurface, fontSize: typography.body }]}>
          {line.description}
        </Text>
        <Text style={{ color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }}>
          {money(line.totalPaise)}
        </Text>
      </View>
      {line.qtyGrams === null ? null : (
        <Text style={sub}>
          {t('admin.invoices.detail.lineQty', {
            qty: formatGramsAsKg(line.qtyGrams),
            price: money(line.unitPricePaise),
          })}
        </Text>
      )}
      {line.hsnCode === null ? null : (
        <Text style={sub}>{t('admin.invoices.detail.lineHsn', { code: line.hsnCode })}</Text>
      )}
      {line.gstRate === null ? null : (
        <Text style={sub}>
          {t('admin.invoices.detail.lineTax', { rate: line.gstRate, tax: money(line.taxPaise) })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  section: { borderWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { flexShrink: 1, textAlign: 'right' },
  line: { borderTopWidth: StyleSheet.hairlineWidth },
});
