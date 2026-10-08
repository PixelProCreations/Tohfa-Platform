import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F3EFEA',

  categoryTitle: '#8B5E3C',
  greenText:     '#059669',
  greenBg:       '#ECFDF5',

  iconBoxBg:     '#FBF1EA',
  iconColor:     '#8B5E3C',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function KeyPasswordIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="4" stroke={color} strokeWidth="2" />
      <Circle cx="7" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="17" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SlashCircleIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = PALETTE.greenText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface SubWarehouseSecurityScreenProps {
  onBack?: (() => void) | undefined;
  onChangePassword?: (() => void) | undefined;
  onViewSessionSecurity?: (() => void) | undefined;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseSecurityScreen({
  onBack,
  onChangePassword,
  onViewSessionSecurity,
  onTabChange,
}: SubWarehouseSecurityScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onBack) onBack();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Security</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Security Status */}
        <Text style={styles.sectionHeading}>SECURITY STATUS</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusGridRow}>
            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>Password</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.statusDot, { backgroundColor: PALETTE.greenText }]} />
                <Text style={[styles.statusVal, { color: PALETTE.greenText }]}>Active</Text>
              </View>
            </View>

            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>2FA</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.statusDot, { backgroundColor: PALETTE.textMuted }]} />
                <Text style={[styles.statusVal, { color: PALETTE.textSecondary }]}>Not Enabled</Text>
              </View>
            </View>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusGridRow}>
            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>Session</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.statusDot, { backgroundColor: PALETTE.greenText }]} />
                <Text style={[styles.statusVal, { color: PALETTE.greenText }]}>Secure</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Password */}
        <Text style={styles.sectionHeading}>PASSWORD</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={onChangePassword}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <KeyPasswordIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Password</Text>
              <Text style={styles.menuSub}>Last changed 12 Aug 2026 · ••••••••••</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 3: Two-Factor Authentication */}
        <Text style={styles.sectionHeading}>TWO-FACTOR AUTHENTICATION</Text>
        <View style={styles.twoFaCard}>
          <View style={styles.twoFaHeaderRow}>
            <SlashCircleIcon size={18} color="#1E1612" />
            <Text style={styles.twoFaTitle}>Two-Factor Authentication — Role Protected</Text>
          </View>
          <Text style={styles.twoFaDesc}>
            2FA management is provisioned at the organizational policy level by system administrators for Sub Warehouse accounts.
          </Text>
        </View>

        {/* Section 4: Login Security */}
        <Text style={styles.sectionHeading}>LOGIN SECURITY</Text>
        <View style={styles.menuCard}>
          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Login with Password</Text>
            <View style={styles.statusPill}>
              <CheckIcon size={14} color={PALETTE.greenText} />
              <Text style={styles.statusPillText}>Enabled</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Login with OTP</Text>
            <View style={styles.statusPill}>
              <CheckIcon size={14} color={PALETTE.greenText} />
              <Text style={styles.statusPillText}>Available</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Trusted Device</Text>
            <View style={styles.statusPill}>
              <CheckIcon size={14} color={PALETTE.greenText} />
              <Text style={styles.statusPillText}>Enabled</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Security Alerts */}
        <Text style={styles.sectionHeading}>SECURITY ALERTS</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={onViewSessionSecurity ? onViewSessionSecurity : () => Alert.alert('Login Activity', 'Showing recent login activity from Coonoor Warehouse terminal.')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionLabel}>Recent Login Activity</Text>
            <Text style={styles.actionLinkText}>View</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={onViewSessionSecurity ? onViewSessionSecurity : () => Alert.alert('Session History', '1 active session: Pixel 8 · Android 14 (Active Now).')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionLabel}>Session History</Text>
            <Text style={styles.actionLinkText}>View</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange && onTabChange('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange && onTabChange('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange && onTabChange('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange && onTabChange('More')}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.categoryTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },

  statusCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCol: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },

  menuCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PALETTE.iconBoxBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLeft: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },

  twoFaCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoFaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  twoFaTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    flex: 1,
  },
  twoFaDesc: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  securityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 16,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
