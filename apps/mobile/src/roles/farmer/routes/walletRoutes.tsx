import React from 'react';
import { BankPaymentScreen } from '../screens/payment/BankPaymentScreen';
import { BankAccountScreen } from '../screens/payment/BankAccountScreen';
import { UpiIdScreen } from '../screens/payment/UpiIdScreen';
import { PayoutHistoryScreen } from '../screens/payment/PayoutHistoryScreen';
import { PayoutDetailScreen } from '../screens/payment/PayoutDetailScreen';
import { WithdrawFundsScreen } from '../screens/payment/WithdrawFundsScreen';
import { WalletTransactionDetailScreen } from '../screens/payment/WalletTransactionDetailScreen';
import { AddMoneyScreen } from '../screens/payment/AddMoneyScreen';
import { CashTopUpScreen } from '../screens/payment/CashTopUpScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { readRouteParams } from './routeParams';
import type { FarmerRouteRenderer } from './types';

/** The farmer wallet, payouts, bank / UPI details, add money and withdrawals. */
export const renderWalletRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack }) => {
  switch (screen) {
    case 'BankPayment':
      return (
        <BankPaymentScreen
          onBack={goBack}
          onNavigateToBankAccount={() => navigate('BankAccount')}
          onNavigateToUpiId={() => navigate('UpiId')}
          onNavigateToPayoutHistory={() => navigate('PayoutHistory')}
          onNavigateToWallet={() => navigate('Wallet')}
        />
      );
    case 'BankAccount':
      return <BankAccountScreen onBack={goBack} />;
    case 'UpiId':
      return <UpiIdScreen onBack={goBack} onSaveSuccess={goBack} />;
    case 'PayoutHistory':
      return (
        <PayoutHistoryScreen
          onBack={goBack}
          onNavigateToDetail={(payout) => navigate('PayoutDetail', payout)}
        />
      );
    case 'PayoutDetail':
      return <PayoutDetailScreen payout={readRouteParams('PayoutDetail', params)} onBack={goBack} />;
    case 'WithdrawFunds':
      return <WithdrawFundsScreen onClose={goBack} onRequestSuccess={goBack} />;
    case 'WalletTransactionDetail':
      return (
        <WalletTransactionDetailScreen
          transaction={readRouteParams('WalletTransactionDetail', params)}
          onBack={goBack}
        />
      );
    case 'AddMoney':
      return (
        <AddMoneyScreen
          onClose={goBack}
          onSuccess={goBack}
          onNavigateToCashTopUp={(data) => navigate('CashTopUp', data)}
        />
      );
    case 'CashTopUp':
      return (
        <CashTopUpScreen
          amount={typeof params['amount'] === 'string' ? params['amount'] : '2,000'}
          referenceCode={typeof params['referenceCode'] === 'string' ? params['referenceCode'] : 'CASH-TU-7734'}
          onBack={goBack}
          onDone={goBack}
        />
      );
    case 'Wallet':
      return (
        <WalletScreen
          onBack={goBack}
          onNavigateToAddMoney={() => navigate('AddMoney')}
          onNavigateToWithdraw={() => navigate('WithdrawFunds')}
          onNavigateToPayoutHistory={() => navigate('PayoutHistory')}
          onNavigateToTransactionDetail={(txn) => navigate('WalletTransactionDetail', txn)}
        />
      );
    default:
      return undefined;
  }
};
