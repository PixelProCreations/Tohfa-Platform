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
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminMoreMenuScreenProps {
  onBack: () => void;
  onSelectOption: (optionId: string) => void;
}

// ─── Menu Icons Matching Exact Design Mockup in Brand Orange ───────────────

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
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FarmersManagementIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceControlIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="16" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="17" r="2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M6 13V9a1 1 0 0 1 1-1h4v4.5M11 11h6v3h2v3h-3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 8V5h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 8v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AuditManagementIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      <Rect x="7" y="12" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="11" y="12" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="15" y="12" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="7" y="15.5" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="11" y="15.5" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="15" y="15.5" width="2" height="2" rx="0.5" fill={color} />
    </Svg>
  );
}

function InputsPestIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18c0-5 3.5-12 13-12 0 9.5-7 13-12 13-0.5 0-1-0.2-1-1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 17l7-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MarketPricingIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-5h16l1 5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 14v7h16v-7" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function CustomersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AccountsFinanceIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WorkforceStaffIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="12" x2="12" y2="12.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function NotificationsReportsIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommunityIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Circle cx="17" cy="11" r="3" stroke={color} strokeWidth="1.9" />
      <Path d="M21 21v-1.5a3 3 0 0 0-2.5-2.95" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function SettingsProfileIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Menu Items Configuration ────────────────────────────────────────────────

interface MenuItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: MenuItemConfig[] = [
  { id: 'farmers', label: 'Farmers Management', icon: <FarmersManagementIcon /> },
  { id: 'produce', label: 'Produce Calendar', icon: <ProduceControlIcon /> },
  { id: 'audit', label: 'Audit Management', icon: <AuditManagementIcon /> },
  { id: 'inputs', label: 'Inputs & Pest Management', icon: <InputsPestIcon /> },
  { id: 'pricing', label: 'Market & Pricing', icon: <MarketPricingIcon /> },
  { id: 'customers', label: 'Customers', icon: <CustomersIcon /> },
  { id: 'workforce', label: 'Workforce & Staff', icon: <WorkforceStaffIcon /> },
  { id: 'notifications', label: 'Notifications & Reports', icon: <NotificationsReportsIcon /> },
  { id: 'community', label: 'Community & Knowledge Management', icon: <CommunityIcon /> },
  { id: 'settings', label: 'Settings & Profile', icon: <SettingsProfileIcon /> },
];

export function AdminMoreMenuScreen({ onBack, onSelectOption }: AdminMoreMenuScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner in Brand Orange */}
      <View style={styles.headerBanner}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
          <BackArrowWhiteIcon />
          <Text style={styles.headerTitle}>More</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItemCard}
              onPress={() => onSelectOption(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>{item.icon}</View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  menuContainer: {
    gap: adminSpacing.sm,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  menuIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
});
