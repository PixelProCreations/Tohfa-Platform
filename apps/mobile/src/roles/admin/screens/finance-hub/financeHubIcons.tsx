/**
 * Icons of the Accounts & Finance hub, copied path for path from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen: BankBuildingWhiteIcon,
 * FilterSlidersIcon, DownloadWhiteIcon, the GoTo*Icon set, the header back
 * arrow, and the OverviewDashboardCard 'clipboard' glyph that the Dev card
 * does not carry). Default colours are the design's, as admin theme tokens.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';
import type { FinanceHubTileId } from './financeHubLogic';

interface IconProps {
  size?: number;
  color?: string;
}

export function BackArrowWhiteIcon({ size = 24, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BankBuildingWhiteIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 4l9 5.5v1H3v-1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M5 10.5v6.5M9 10.5v6.5M15 10.5v6.5M19 10.5v6.5M3 17.5h18M2 20.5h20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FilterSlidersIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function DownloadWhiteIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v13M7 11l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The design card's 'clipboard' glyph (Net Financial Summary), in the card's default icon colour. */
export function ClipboardCardIcon({ size = 18, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M8.5 13l2.5 2.5 5-5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToPurchaseSalesIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M8 12h8M8 16h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function GoToDuesPayoutsIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.9" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Path d="M6 9h.01M18 15h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GoToSalesIncomeIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 7h7v7" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToExpensesIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Circle cx="8" cy="12" r="1.5" fill={color} />
      <Circle cx="16" cy="12" r="1.5" fill={color} />
      <Rect x="10.5" y="9.5" width="3" height="5" rx="0.8" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function GoToCustomerWalletIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="13" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M2 10h20M17 14h3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="15.5" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function GoToInvoiceIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M8 13h4M8 17h8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToReviewReturnsIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M15 12h-6m0 0l2.5-2.5M9 12l2.5 2.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToTransactionHistoryIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 3v5h5M12 7v5l3 3" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToReportExportIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v11M8 10l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GoToProfitLossIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 9l-5 5-4-4-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToPaymentMethodsIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

/** Go-to tile icon per tile id (the design renders each at size 24). */
export const FINANCE_HUB_TILE_ICONS: Record<FinanceHubTileId, (props: IconProps) => React.JSX.Element> = {
  purchaseSales: GoToPurchaseSalesIcon,
  duesPayouts: GoToDuesPayoutsIcon,
  salesIncome: GoToSalesIncomeIcon,
  expenses: GoToExpensesIcon,
  customerWallet: GoToCustomerWalletIcon,
  invoices: GoToInvoiceIcon,
  reviewReturns: GoToReviewReturnsIcon,
  transactionHistory: GoToTransactionHistoryIcon,
  reportExport: GoToReportExportIcon,
};
