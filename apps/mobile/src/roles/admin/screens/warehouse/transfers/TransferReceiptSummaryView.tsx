/**
 * Transfer Receiving Summary (design M2-16, last card): what the receive POST
 * answered, or what a RECEIVED transfer's read carries. Built by
 * receiptViews.ts transferReceiptSummary, so every figure is the server's:
 * sent, received, the shortfall (from each line's variance), the receipt note
 * and, per line received above zero, the batch the server created at the
 * destination (its code when a batch read carried it).
 *
 * Not drawn (no API, owner decision): an accepted figure apart from received
 * (there is no acceptance decision), a storage location and a transfer
 * receipt number.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { formatAdminDay, formatAdminTime } from '../../../utils/datetime';
import { CheckIcon, InfoCard, InfoNote, SectionTitle, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import type { TransferReceiptLine, TransferReceiptSummary } from './receiptViews';
import { transferRouteLabel } from './TransferParts';

function newBatchLabel(line: TransferReceiptLine): string {
  if (line.newBatch === null) return t('transfers.summary.noBatch');
  return line.newBatch.code === undefined ? t('transfers.summary.newBatchUnread') : t('transfers.summary.newBatch', { code: line.newBatch.code });
}

export function TransferReceiptSummaryView({
  summary,
  header,
  onBack,
  onDone,
}: {
  summary: TransferReceiptSummary;
  header: React.ReactNode;
  onBack: () => void;
  onDone: () => void;
}) {
  const figures = [
    { label: t('transfers.summary.sent'), value: formatKg(summary.sentGrams) },
    { label: t('transfers.summary.received'), value: formatKg(summary.receivedGrams) },
  ];
  const rows = [
    [
      { label: t('transfers.summary.transfer'), value: summary.code },
      { label: t('transfers.summary.route'), value: transferRouteLabel(summary) },
    ],
    figures,
  ];
  const timing =
    summary.receivedAt === null
      ? []
      : [
          {
            label: t('transfers.summary.receivedAt'),
            value: t('datetime.dayAndTime', { day: formatAdminDay(summary.receivedAt), time: formatAdminTime(summary.receivedAt) }),
          },
        ];
  const discrepancy = summary.discrepancyGrams > 0 ? [{ label: t('transfers.summary.discrepancy'), value: formatKg(summary.discrepancyGrams) }] : [];
  const last = [...discrepancy, ...timing];
  if (last.length > 0) rows.push(last);

  return (
    <WalletScreen
      title={t('transfers.summary.title')}
      onBack={onBack}
      headerExtra={header}
      footer={
        <WalletFooter>
          <WalletButton label={t('transfers.summary.done')} icon={<CheckIcon />} onPress={onDone} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoCard rows={rows} />
        {summary.receiptNote !== null ? (
          <InfoNote tone={summary.discrepancyGrams > 0 ? 'warning' : 'brandSoft'}>
            {t('transfers.summary.receiptNoteValue', { note: summary.receiptNote })}
          </InfoNote>
        ) : null}

        <SectionTitle>{t('transfers.summary.batches')}</SectionTitle>
        {summary.lines.map((line) => (
          <View key={line.id} style={styles.lineCard}>
            <Text style={styles.lineTitle}>{line.product ?? line.sourceBatchCode}</Text>
            <Text style={styles.lineMeta}>{t('transfers.summary.fromBatch', { code: line.sourceBatchCode, grade: line.gradeLabel })}</Text>
            <Text style={styles.lineMeta}>
              {t('transfers.summary.lineQty', { qty: formatKg(line.receivedGrams), sent: formatKg(line.sentGrams) })}
            </Text>
            <Text style={line.newBatch === null ? styles.lineMeta : styles.newBatch}>{newBatchLabel(line)}</Text>
          </View>
        ))}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  lineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  lineTitle: { ...adminType.sectionHead, color: adminColors.ink },
  lineMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  newBatch: { ...adminType.rowTitle, color: adminColors.brandDeep, marginTop: adminSpacing.xs },
});
