/**
 * Super Admin More Screen
 * Exact UI implementation matching Image 1 & Image 2 (Grouped operational navigation).
 * Strictly adheres to Admin Design Tokens from ../../theme.
 * Grouped into:
 *   1. FARM & PRODUCE (Produce & Crops, Audit, Inputs & Pest, Market & Pricing, Purchases)
 *   2. SALES & MONEY (Allocation, Sales & Orders, Customers, Finance)
 *   3. PEOPLE (Staff & Admin Accounts, Community, Learning & Support)
 *   4. SYSTEM (Notifications & Reports, System Settings & Audit Log, My Account)
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
} from '../../theme';

export interface SuperAdminMoreScreenProps {
  onBack?: () => void;
  onNavigateProduce?: () => void;
  onNavigateAudit?: () => void;
  onNavigateInputsPest?: () => void;
  onNavigateMarketPricing?: () => void;
  onNavigatePurchases?: () => void;
  onNavigateAllocation?: () => void;
  onNavigateSalesOrders?: () => void;
  onNavigateCustomers?: () => void;
  onNavigateFinance?: () => void;
  onNavigateStaff?: () => void;
  onNavigateCommunity?: () => void;
  onNavigateNotifications?: () => void;
  onNavigateReports?: () => void;
  onNavigateSettings?: () => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 1. Produce & Crops
function SproutPlantIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21v-7M7 11a5 5 0 015-5 5 5 0 015 5c0 2.5-2 4.5-5 4.5S7 13.5 7 11z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 6a3 3 0 00-3-3M12 6a3 3 0 013-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 2. Audit
function AuditChecklistIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 10l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="8" y1="15" x2="16" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 3. Inputs & Pest
function InputsPestIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v4M12 8a4 4 0 014 4v2a4 4 0 01-8 0v-2a4 4 0 014-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11H3M21 11h-4M7 15l-3 2M20 17l-3-2M9 5L7 3M15 5l2-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 4. Market & Pricing
function MarketPricingStoreIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l2-5h14l2 5M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 9c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 16h4v5h-4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

// 5. Purchases
function PurchasesCartIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3h2l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9.5" cy="20.5" r="1.5" fill={color} />
      <Circle cx="17.5" cy="20.5" r="1.5" fill={color} />
    </Svg>
  );
}

// 6. Allocation
function AllocationPieIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 7. Sales & Orders
function SalesRegisterIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 6h10M8 3h8v3H8V3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M5 9h14l-1.5 8H6.5L5 9z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Rect x="4" y="17" width="16" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Line x1="9" y1="13" x2="11" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="13" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 8. Customers
function CustomersIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 9. Finance
function FinanceBanknoteIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M6 9.5v.01M18 14.5v.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 10. Staff & Admin Accounts
function StaffBadgeIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="7" width="14" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 18c0-1.8 1.8-2.5 4-2.5s4 .7 4 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// 11. Community, Learning & Support
function CommunityTeamIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="10" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="10" r="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M8 19c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 20c0-1.7 1.3-3 3-3M21 20c0-1.7-1.3-3-3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// 12. Notifications & Reports
function NotificationsBellIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 12b. Reports
function ReportsDocumentIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 13. System Settings & Audit Log
function SystemSettingsGearIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 14. My Account
function _MyAccountProfileIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6.5 18.5c1.2-2 3.2-3 5.5-3s4.3 1 5.5 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Menu Groups Data ─────────────────────────────────────────────────────────

interface MoreMenuGroup {
  groupTitle: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    actionKey?: string;
  }>;
}

export function SuperAdminMoreScreen({
  onBack,
  onNavigateProduce,
  onNavigateAudit,
  onNavigateInputsPest,
  onNavigateMarketPricing,
  onNavigatePurchases,
  onNavigateAllocation,
  onNavigateSalesOrders,
  onNavigateCustomers,
  onNavigateFinance,
  onNavigateStaff,
  onNavigateCommunity,
  onNavigateNotifications,
  onNavigateReports,
  onNavigateSettings,
}: SuperAdminMoreScreenProps): React.JSX.Element {
  const menuGroups: MoreMenuGroup[] = [
    {
      groupTitle: 'FARM & PRODUCE',
      items: [
        {
          id: 'produce_crops',
          label: 'Produce & Crops',
          icon: <SproutPlantIcon />,
          actionKey: 'produce',
        },
        {
          id: 'audit',
          label: 'Audit',
          icon: <AuditChecklistIcon />,
          actionKey: 'audit',
        },
        {
          id: 'inputs_pest',
          label: 'Inputs & Pest',
          icon: <InputsPestIcon />,
          actionKey: 'inputs',
        },
        {
          id: 'market_pricing',
          label: 'Market & Pricing',
          icon: <MarketPricingStoreIcon />,
          actionKey: 'market_pricing',
        },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: <PurchasesCartIcon />,
          actionKey: 'purchases',
        },
      ],
    },
    {
      groupTitle: 'SALES & MONEY',
      items: [
        {
          id: 'allocation',
          label: 'Allocation',
          icon: <AllocationPieIcon />,
          actionKey: 'allocation',
        },
        {
          id: 'sales_orders',
          label: 'Sales & Orders',
          icon: <SalesRegisterIcon />,
          actionKey: 'sales_orders',
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: <CustomersIcon />,
          actionKey: 'customers',
        },
        {
          id: 'finance',
          label: 'Finance',
          icon: <FinanceBanknoteIcon />,
          actionKey: 'finance',
        },
      ],
    },
    {
      groupTitle: 'PEOPLE',
      items: [
        {
          id: 'staff_admin',
          label: 'Staff & Admin Accounts',
          icon: <StaffBadgeIcon />,
          actionKey: 'staff',
        },
        {
          id: 'community_learning',
          label: 'Community, Learning & Support',
          icon: <CommunityTeamIcon />,
          actionKey: 'community',
        },
      ],
    },
    {
      groupTitle: 'SYSTEM',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <NotificationsBellIcon />,
          actionKey: 'notifications',
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: <ReportsDocumentIcon />,
          actionKey: 'reports',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <SystemSettingsGearIcon />,
          actionKey: 'settings',
        },
      ],
    },
  ];

  const handleItemPress = (actionKey?: string) => {
    if (actionKey === 'produce' && onNavigateProduce) {
      onNavigateProduce();
    } else if (actionKey === 'audit' && onNavigateAudit) {
      onNavigateAudit();
    } else if (actionKey === 'inputs' && onNavigateInputsPest) {
      onNavigateInputsPest();
    } else if (actionKey === 'market_pricing' && onNavigateMarketPricing) {
      onNavigateMarketPricing();
    } else if (actionKey === 'purchases' && onNavigatePurchases) {
      onNavigatePurchases();
    } else if (actionKey === 'allocation' && onNavigateAllocation) {
      onNavigateAllocation();
    } else if (actionKey === 'sales_orders' && onNavigateSalesOrders) {
      onNavigateSalesOrders();
    } else if (actionKey === 'customers' && onNavigateCustomers) {
      onNavigateCustomers();
    } else if (actionKey === 'finance' && onNavigateFinance) {
      onNavigateFinance();
    } else if (actionKey === 'staff' && onNavigateStaff) {
      onNavigateStaff();
    } else if (actionKey === 'community' && onNavigateCommunity) {
      onNavigateCommunity();
    } else if (actionKey === 'notifications' && onNavigateNotifications) {
      onNavigateNotifications();
    } else if (actionKey === 'reports' && onNavigateReports) {
      onNavigateReports();
    } else if (actionKey === 'settings' && onNavigateSettings) {
      onNavigateSettings();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>More</Text>
      </View>

      {/* ─── Menu Groups List ─── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {menuGroups.map((group) => (
          <View key={group.groupTitle} style={styles.groupContainer}>
            <Text style={styles.groupHeader}>{group.groupTitle}</Text>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                onPress={() => handleItemPress(item.actionKey)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconContainer}>{item.icon}</View>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </View>
                <ChevronRightIcon />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '700',
    includeFontPadding: false,
  },
  content: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  groupContainer: {
    marginBottom: 10,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
    paddingHorizontal: 2,
    includeFontPadding: false,
  },
  menuItemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
