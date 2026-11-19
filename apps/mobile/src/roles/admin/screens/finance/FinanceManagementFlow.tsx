/**
 * Finance Management Flow: the navigation hub for the Tohfa Admin Finance tab.
 *
 * Shows the FinanceHubScreen (data-wired KPI overview from finance-hub/) as the
 * entry point, and routes to sub-screens when the user taps a Go-to tile or a
 * KPI card. Screens that have a real backend are wired to live flows
 * (FinanceFlow, SalesFlow, WalletFlow, FarmerPayoutDuesScreen). Screens whose
 * backend is not yet built show an inline FinanceComingSoon stub.
 *
 * Design source: origin/Superadmin-main FinanceManagementFlow.tsx.
 * This port replaces the design's hardcoded state with real data hooks and
 * replaces role string checks with can() permission gates (CLAUDE.md §2.1).
 *
 * Stubbed screens (backend pending):
 *   profitLoss, salesIncome, invoicesGst, reviewReturns,
 *   transactionHistory, reportExport, paymentMethods
 *
 * Real routes:
 *   expenses        → FinanceFlow (initialScreen='Expenses')
 *   purchaseSales   → SalesFlow
 *   customerWallet  → WalletFlow (initialScreen='CustomerWallet')
 *   duesPayouts     → FarmerPayoutDuesScreen
 */
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { FinanceFlow } from '../warehouse/finance-expenses';
import { SalesFlow } from '../warehouse/sales-direct';
import { WalletFlow } from '../warehouse/wallet-cashtopup';
import { FinanceHubScreen } from '../finance-hub';
import { FarmerPayoutDuesScreen } from './FarmerPayoutDuesScreen';
import { PayoutProcessingScreen } from './PayoutProcessingScreen';

// ─── Sub-screen state ─────────────────────────────────────────────────────────

type FinanceSubScreen =
  | 'overview'
  // Real routes
  | 'expenses'
  | 'purchaseSales'
  | 'customerWallet'
  | 'duesPayouts'
  | 'payoutProcessing'
  // Stub routes (backend pending)
  | 'profitLoss'
  | 'salesIncome'
  | 'invoicesGst'
  | 'reviewReturns'
  | 'transactionHistory'
  | 'reportExport'
  | 'paymentMethods';

// ─── Inline coming-soon stub ──────────────────────────────────────────────────

function FinanceComingSoon({ screenName, onBack }: { screenName: string; onBack: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: adminColors.canvas }}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View
        style={{
          backgroundColor: adminColors.brand,
          paddingHorizontal: adminSpacing.md,
          paddingVertical: adminSpacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomLeftRadius: adminRadius.xl,
          borderBottomRightRadius: adminRadius.xl,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('financeHub.back')}
          style={{ padding: adminSpacing.xs, marginRight: adminSpacing.sm }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={adminColors.onBrand}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text
          style={{
            ...adminType.title,
            color: adminColors.onBrand,
            fontSize: 17,
            fontWeight: '700',
          }}
        >
          {screenName}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: adminSpacing.xl,
        }}
      >
        <Text
          style={{
            ...adminType.body,
            color: adminColors.muted,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          {t('financeHub.comingSoon.message')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface FinanceManagementFlowProps {
  /** Permission check from /auth/me; absent = deny everything (fail closed). */
  can?: Can | undefined;
  /** Leave the Finance tab (back arrow and Android hardware back). */
  onBack: () => void;
}

// ─── Flow ─────────────────────────────────────────────────────────────────────

/**
 * Routes the Finance tab: the overview hub plus all sub-screen flows.
 * Screens with a real backend are wired; stub screens show a coming-soon
 * placeholder. Navigation is internal — no shell sub-flows are opened.
 */
export function FinanceManagementFlow({ can, onBack }: FinanceManagementFlowProps) {
  const [sub, setSub] = useState<FinanceSubScreen>('overview');

  const goBack = () => setSub('overview');
  /** Fail-closed fallback: deny all codes when can is absent. */
  const resolvedCan = can ?? (() => false);
  /** All-warehouses scope for sub-flows; server enforces the real scope. */
  const allWh = { warehouseId: undefined as string | undefined };

  // ─── Real sub-screen flows ─────────────────────────────────────────────────

  if (sub === 'expenses') {
    return (
      <FinanceFlow
        scope={allWh}
        can={resolvedCan}
        initialScreen="Expenses"
        onBack={goBack}
      />
    );
  }

  if (sub === 'purchaseSales') {
    return (
      <SalesFlow
        scope={allWh}
        can={resolvedCan}
        onBack={goBack}
      />
    );
  }

  if (sub === 'customerWallet') {
    return (
      <WalletFlow
        scope={allWh}
        can={resolvedCan}
        initialScreen="CustomerWallet"
        onBack={goBack}
      />
    );
  }

  if (sub === 'duesPayouts') {
    // FarmerPayoutDuesScreen is the closest existing screen for dues & payouts.
    // PurchaseDuesPayoutsScreen (design) does not exist yet (backend pending).
    return (
      <FarmerPayoutDuesScreen
        onBack={goBack}
        onNavigateToProcessing={() => setSub('payoutProcessing')}
      />
    );
  }

  if (sub === 'payoutProcessing') {
    return <PayoutProcessingScreen can={can} onBack={() => setSub('duesPayouts')} />;
  }

  // ─── Stub sub-screens (backend pending) ───────────────────────────────────

  if (sub === 'profitLoss') {
    return <FinanceComingSoon screenName={t('financeHub.tile.profitLoss')} onBack={goBack} />;
  }
  if (sub === 'salesIncome') {
    return <FinanceComingSoon screenName={t('financeHub.tile.salesIncome')} onBack={goBack} />;
  }
  if (sub === 'invoicesGst') {
    return <FinanceComingSoon screenName={t('financeHub.tile.invoices')} onBack={goBack} />;
  }
  if (sub === 'reviewReturns') {
    return <FinanceComingSoon screenName={t('financeHub.tile.reviewReturns')} onBack={goBack} />;
  }
  if (sub === 'transactionHistory') {
    return <FinanceComingSoon screenName={t('financeHub.tile.transactionHistory')} onBack={goBack} />;
  }
  if (sub === 'reportExport') {
    return <FinanceComingSoon screenName={t('financeHub.tile.reportExport')} onBack={goBack} />;
  }
  if (sub === 'paymentMethods') {
    return <FinanceComingSoon screenName={t('financeHub.tile.paymentMethods')} onBack={goBack} />;
  }

  // ─── Overview: FinanceHubScreen with all Go-to tile callbacks wired ────────

  return (
    <FinanceHubScreen
      can={can}
      onBack={onBack}
      onOpenSales={() => setSub('purchaseSales')}
      onOpenSalesIncome={() => setSub('salesIncome')}
      onOpenExpenses={() => setSub('expenses')}
      onOpenWallet={() => setSub('customerWallet')}
      onOpenReturns={() => setSub('reviewReturns')}
      onOpenInvoices={() => setSub('invoicesGst')}
      onOpenDuesPayouts={() => setSub('duesPayouts')}
      onOpenTransactionHistory={() => setSub('transactionHistory')}
      onOpenReports={() => setSub('reportExport')}
      onOpenProfitLoss={() => setSub('profitLoss')}
      onOpenPaymentMethods={() => setSub('paymentMethods')}
    />
  );
}
