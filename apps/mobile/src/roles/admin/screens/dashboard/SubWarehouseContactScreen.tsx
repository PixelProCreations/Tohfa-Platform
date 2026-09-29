import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Action Buttons
  actionBtnBg: '#FEF8F5',
  actionBtnBorder: '#F9D8CB',
  actionBtnText: '#D4451B',

  // Info Banner (Blue)
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  infoText: '#1D4ED8',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
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

function LockBadgeIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function PhoneIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MailIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M22 7l-8.97 5.7a2 2 0 0 1-2.06 0L2 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DirectionsIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 12l10 10 10-10L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 8h4v4M14 8l-5 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapFoldedIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 6v15l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v15M16 6v15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AsteriskIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
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

export interface SubWarehouseContactScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseContactScreen({
  onBack,
  onTabChange,
}: SubWarehouseContactScreenProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (label: string, text: string) => {
    setCopiedField(label);
    Alert.alert('Copied to Clipboard', `${label}: ${text}`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Calling', `Dialing ${phoneNumber}`);
    });
  };

  const handleEmail = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}`).catch(() => {
      Alert.alert('Email', `Composing email to ${emailAddress}`);
    });
  };

  const handleDirections = () => {
    const query = encodeURIComponent('Coonoor, Nilgiris, Tamil Nadu, India');
    Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() => {
      Alert.alert('Maps', 'Opening Google Maps directions for Coonoor Warehouse');
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header (#F0562A) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.75}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Warehouse Contact</Text>
          </View>

          {/* Locked Warehouse Pill */}
          <View style={styles.lockedPill}>
            <LockBadgeIcon size={12} color="#FFFFFF" />
            <Text style={styles.lockedPillText}>Coonoor Warehouse</Text>
          </View>
        </View>

        {/* ─── Main Content Body ─── */}
        <View style={styles.mainContainer}>
          {/* 1. Primary Contact Section */}
          <Text style={styles.sectionHeading}>Primary Contact</Text>
          <View style={styles.card}>
            {/* Phone Row */}
            <View style={styles.contactItemRow}>
              <View style={styles.contactItemLeft}>
                <Text style={styles.itemLabel}>Phone</Text>
                <Text style={styles.itemValue}>+91 XXXXX XXXXX</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy('Phone', '+91 94421 88210')}
                activeOpacity={0.7}
              >
                <Text style={styles.copyButtonText}>
                  {copiedField === 'Phone' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerLine} />

            {/* Email Row */}
            <View style={styles.contactItemRow}>
              <View style={styles.contactItemLeft}>
                <Text style={styles.itemLabel}>Email</Text>
                <Text style={styles.itemValue}>warehouse@example.com</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy('Email', 'warehouse@example.com')}
                activeOpacity={0.7}
              >
                <Text style={styles.copyButtonText}>
                  {copiedField === 'Email' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Contact Person Section */}
          <Text style={styles.sectionHeading}>Contact Person</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.itemLabel}>Name</Text>
                <Text style={styles.itemValueBold}>Ganesh Kumar</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.itemLabel}>Role</Text>
                <Text style={styles.itemValueBold}>Warehouse Contact</Text>
              </View>
            </View>

            <View style={[styles.contactItemLeft, { marginTop: 14 }]}>
              <Text style={styles.itemLabel}>Phone</Text>
              <Text style={styles.itemValueBold}>+91 XXXXX XXXXX</Text>
            </View>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Contact person details are shown only if actually configured — never invented when no such person exists in the data.
            </Text>
          </View>

          {/* 3. Address Section */}
          <Text style={styles.sectionHeading}>Address</Text>
          <View style={styles.card}>
            <View style={styles.contactItemRow}>
              <View style={styles.contactItemLeft}>
                <Text style={styles.itemLabel}>Warehouse Address</Text>
                <Text style={styles.addressValue}>Coonoor, Nilgiris, Tamil Nadu, India</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy('Warehouse Address', 'Coonoor, Nilgiris, Tamil Nadu, India')}
                activeOpacity={0.7}
              >
                <Text style={styles.copyButtonText}>
                  {copiedField === 'Warehouse Address' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Map Preview Card */}
          <TouchableOpacity
            style={styles.mapPreviewCard}
            onPress={handleDirections}
            activeOpacity={0.8}
          >
            <View style={styles.mapPreviewLeft}>
              <MapFoldedIcon size={20} color={PALETTE.primary} />
              <Text style={styles.mapPreviewTitle}>Map Preview</Text>
            </View>
            <Text style={styles.openInMapsText}>Open in Maps</Text>
          </TouchableOpacity>

          {/* 4. Contact Actions */}
          <Text style={styles.sectionHeading}>Contact Actions</Text>
          <View style={styles.actionsRow}>
            {/* Call */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall('+91 94421 88210')}
              activeOpacity={0.75}
            >
              <PhoneIcon size={16} color={PALETTE.actionBtnText} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEmail('warehouse@example.com')}
              activeOpacity={0.75}
            >
              <MailIcon size={16} color={PALETTE.actionBtnText} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>

            {/* Directions */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDirections}
              activeOpacity={0.75}
            >
              <DirectionsIcon size={16} color={PALETTE.actionBtnText} />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Emergency Contact Section */}
          <Text style={styles.sectionHeading}>Emergency Contact</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.itemLabel}>Name</Text>
                <Text style={styles.itemValueBold}>Regional Ops Desk</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.itemLabel}>Phone</Text>
                <Text style={styles.itemValueBold}>+91 XXXXX XXXXX</Text>
              </View>
            </View>
          </View>

          {/* Call Emergency Contact Button */}
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={() => handleCall('+91 91122 33445')}
            activeOpacity={0.75}
          >
            <AsteriskIcon size={16} color={PALETTE.primary} />
            <Text style={styles.emergencyCallBtnText}>Call Emergency Contact</Text>
          </TouchableOpacity>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Emergency contact is not treated as mandatory — shown only if the warehouse configuration actually contains one.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  lockedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginLeft: 32,
  },
  lockedPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Main Content Container ────────────────────────────────────────────────
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: -0.2,
  },

  // ─── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },

  // ─── Contact Rows ──────────────────────────────────────────────────────────
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    lineHeight: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },

  // ─── Copy Button ───────────────────────────────────────────────────────────
  copyButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },

  // ─── Grid 2-Col Layout ─────────────────────────────────────────────────────
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gridCol: {
    flex: 1,
  },

  // ─── Map Preview Card ──────────────────────────────────────────────────────
  mapPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  mapPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  openInMapsText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  // ─── Contact Action 3-Buttons Row ──────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.actionBtnBg,
    borderWidth: 1.2,
    borderColor: PALETTE.actionBtnBorder,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.actionBtnText,
  },

  // ─── Emergency Call Button ─────────────────────────────────────────────────
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.actionBtnBg,
    borderWidth: 1.2,
    borderColor: PALETTE.actionBtnBorder,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 10,
    gap: 8,
  },
  emergencyCallBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  // ─── Blue Helper / Info Notice Box ─────────────────────────────────────────
  blueNoticeBox: {
    backgroundColor: PALETTE.infoBg,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  blueNoticeText: {
    fontSize: 12,
    color: PALETTE.infoText,
    lineHeight: 17,
    fontWeight: '500',
  },

  // ─── Bottom Navigation Bar ─────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
