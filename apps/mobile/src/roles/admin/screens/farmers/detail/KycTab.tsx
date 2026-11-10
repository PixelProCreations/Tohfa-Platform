/**
 * KYC tab (team design: status rows), wired to the farmer's documents
 * (GET /admin/farmers/{id}/documents, farmer.document.view).
 *
 * "Verify" appears on an unverified document only with
 * `farmer.document.verify` and calls the real endpoint
 * (useVerifyFarmerDocument; a replay is a no-op, BR-108e). The bank row is
 * drawn only with `farmer.bank_account.view`, from the payout destinations,
 * account number as its last four digits only (BR-53a).
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { adminErrorKey } from '../../../api/errors';
import type { LiveFarmerDocuments, LivePayoutDestinations, LiveAction } from '../../../api/farmerHooks';
import type { AdminFarmerDocumentDto } from '../../../api/farmers';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { bankRows, documentRows, type FarmerDetailAccess } from './model';
import { EmptyCard, SectionTitle, TabQueryGate } from './parts';
import { detailStyles as s } from './styles';

export function KycTab({
  access,
  documents,
  bank,
  verify,
}: {
  access: FarmerDetailAccess;
  documents: LiveFarmerDocuments;
  bank: LivePayoutDestinations;
  verify: LiveAction<string, AdminFarmerDocumentDto>;
}) {
  const rows = documentRows(documents.documents ?? [], access);
  return (
    <>
      <TabQueryGate
        permitted={access.canViewDocuments}
        hasData={documents.documents !== undefined}
        isLoading={documents.isLoading}
        error={documents.error}
        onRetry={documents.refresh}
      >
        {rows.length === 0 ? (
          <EmptyCard text={t('farmerDetail.kyc.empty')} />
        ) : (
          <View style={s.detailsCard}>
            {rows.map((row, i) => (
              <View key={row.id} style={[s.tableRow, i === rows.length - 1 && s.tableRowLast]}>
                <Text style={s.tableLabel}>{row.label}</Text>
                <View style={s.kycRowRight}>
                  <Text style={[s.tableValue, { color: adminColors[row.tone].text }]}>{row.status}</Text>
                  {row.canVerify ? (
                    <TouchableOpacity
                      onPress={() => verify.run(row.id)}
                      disabled={verify.isPending}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <Text style={s.verifyLink}>{verify.isPending ? t('farmerDetail.kyc.verifying') : t('farmerDetail.kyc.verify')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
        {verify.error !== null && verify.error !== undefined ? <Text style={s.errorText}>{t(adminErrorKey(verify.error))}</Text> : null}
      </TabQueryGate>

      {access.canViewBankAccounts ? (
        <>
          <SectionTitle spaced>{t('farmerDetail.kyc.bankDetails')}</SectionTitle>
          <TabQueryGate
            permitted
            hasData={bank.destinations !== undefined}
            isLoading={bank.isLoading}
            error={bank.error}
            onRetry={bank.refresh}
          >
            <BankRows bank={bank} />
          </TabQueryGate>
        </>
      ) : null}
    </>
  );
}

function BankRows({ bank }: { bank: LivePayoutDestinations }) {
  const rows = bankRows(bank.destinations ?? []);
  if (rows.length === 0) return <EmptyCard text={t('farmerDetail.kyc.bankEmpty')} />;
  return (
    <View style={s.detailsCard}>
      {rows.map((row, i) => (
        <View key={row.id} style={[s.tableRow, i === rows.length - 1 && s.tableRowLast]}>
          <Text style={s.tableLabel}>{row.value}</Text>
          <Text style={[s.tableValue, { color: adminColors[row.tone].text }]}>{row.status}</Text>
        </View>
      ))}
    </View>
  );
}
