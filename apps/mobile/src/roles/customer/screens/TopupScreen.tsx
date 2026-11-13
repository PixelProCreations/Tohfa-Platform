import React from 'react';
import { CustomerWalletScreen, CustomerWalletScreenProps } from './CustomerWalletScreen';

export interface TopupScreenProps extends CustomerWalletScreenProps {
  shortfall?: string | undefined;
}

/**
 * TopupScreen wraps CustomerWalletScreen, supporting both direct wallet access
 * and shortfall checkout top-ups with exact Figma UI (Screens 70, 71, 72, 72a).
 */
export const TopupScreen: React.FC<TopupScreenProps> = (props) => {
  return <CustomerWalletScreen {...props} />;
};
