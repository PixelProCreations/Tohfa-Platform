import React from 'react';
import { CustomerWalletScreen } from './CustomerWalletScreen';
import type { CustomerWalletScreenProps } from './CustomerWalletScreen';

export interface TopupScreenProps extends Omit<CustomerWalletScreenProps, 'initialMode' | 'initialAmount'> {
  /** Money string of the checkout shortfall; prefills the amount (rounded up to whole rupees). */
  shortfall?: string | undefined;
}

/**
 * Add-money entry used by checkout ("Wallet balance too low") and the 402
 * mapping on send money. Opens the Add Money form directly; after a successful
 * top-up it returns to the caller (`onBack`) so checkout can re-check the
 * (server-side) balance. The wallet is credited only by the server webhook.
 */
export const TopupScreen: React.FC<TopupScreenProps> = ({ shortfall, onBack, onTopupComplete, ...rest }) => {
  return (
    <CustomerWalletScreen
      {...rest}
      initialMode="add_money"
      initialAmount={shortfall}
      onBack={onBack}
      onTopupComplete={onTopupComplete ?? onBack}
    />
  );
};
