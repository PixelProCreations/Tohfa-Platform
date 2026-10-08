import React, { useState } from 'react';
import {
  Modal,
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

  brownLogo:     '#8B5E3C',
  categoryTitle: '#8B5E3C',
  greenText:     '#059669',
  greenBg:       '#ECFDF5',

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

function ChevronRightIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 18, color = PALETTE.greenText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export interface SubWarehouseAboutScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

type AboutViewType = 'main' | 'privacy' | 'terms' | 'licenses';

export function SubWarehouseAboutScreen({
  onBack,
  onTabChange,
}: SubWarehouseAboutScreenProps) {
  const [currentView, setCurrentView] = useState<AboutViewType>('main');

  // ─── Sub-view: Privacy Policy Full Screen ──────────────────────────────────
  if (currentView === 'privacy') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.75}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Privacy Policy</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.legalDocCard}>
            <Text style={styles.legalDocHeader}>TOHFA Digital Privacy Policy</Text>
            <Text style={styles.legalDocSub}>
              Last updated: September 2026 · Compliant with Digital Personal Data Protection Act (DPDP)
            </Text>

            <View style={styles.divider} />

            <Text style={styles.legalSectionTitle}>1. Data Protection Commitment</Text>
            <Text style={styles.legalParagraph}>
              The Nilgiris Horticulture Organic Farmers Association (TOHFA) is committed to safeguarding all operational data collected across warehouse receiving, farmer transactions, and customer dispatches in full compliance with the Indian Digital Personal Data Protection Act (DPDP).
            </Text>

            <Text style={styles.legalSectionTitle}>2. Information Collected</Text>
            <Text style={styles.legalParagraph}>
              We process batch barcode scans, produce weight and grading measurements, employee shift check-in records, customer contact details, and invoice receipts required exclusively for agricultural inventory administration and fulfillment.
            </Text>

            <Text style={styles.legalSectionTitle}>3. Storage & Encryption</Text>
            <Text style={styles.legalParagraph}>
              All authentication tokens, farmer payout records, and transaction ledgers are encrypted locally with AES-256 and transmitted over TLS 1.3 to authorized TOHFA cloud servers located within Indian data centers.
            </Text>

            <Text style={styles.legalSectionTitle}>4. Data Access & Sharing</Text>
            <Text style={styles.legalParagraph}>
              Access is strictly role-gated. Sub-warehouse operators cannot export or distribute farmer or customer records without explicit authorization from the Main Warehouse Admin or Association Board.
            </Text>

            <Text style={styles.legalSectionTitle}>5. Contact & Grievance Officer</Text>
            <Text style={styles.legalParagraph}>
              For any data inquiries or privacy concerns, contact our designated Data Protection Officer at privacy@tohfa.example or via the Help & Support center.
            </Text>

            <TouchableOpacity
              style={[styles.fullScreenActionBtn, { marginTop: 16 }]}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.85}
            >
              <Text style={styles.fullScreenActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Sub-view: Terms & Conditions Full Screen ──────────────────────────────
  if (currentView === 'terms') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.75}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Terms & Conditions</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.legalDocCard}>
            <Text style={styles.legalDocHeader}>Sub Warehouse Operating Terms</Text>
            <Text style={styles.legalDocSub}>
              Version 1.0 · Governing all warehouse administrative operations
            </Text>

            <View style={styles.divider} />

            <Text style={styles.legalSectionTitle}>1. Authorized Usage</Text>
            <Text style={styles.legalParagraph}>
              This mobile application is licensed strictly to certified sub-warehouse operators and staff under the Nilgiris Horticulture Organic Farmers Association.
            </Text>

            <Text style={styles.legalSectionTitle}>2. Operator Responsibilities</Text>
            <Text style={styles.legalParagraph}>
              Operators must accurately log grade, moisture content, and weight upon produce intake and ensure customer order dispatches match system invoice numbers without discrepancy.
            </Text>

            <Text style={styles.legalSectionTitle}>3. Financial & Cash Handling</Text>
            <Text style={styles.legalParagraph}>
              All cash collected for wallet top-ups, customer retail orders, and operational expense outlays must be reconciled daily against the system cash summary ledger.
            </Text>

            <Text style={styles.legalSectionTitle}>4. Security Compliance</Text>
            <Text style={styles.legalParagraph}>
              Users may not share administrative credentials or operate on rooted/compromised terminal devices. Any suspected security breach must be reported immediately.
            </Text>

            <TouchableOpacity
              style={[styles.fullScreenActionBtn, { marginTop: 16 }]}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.85}
            >
              <Text style={styles.fullScreenActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Sub-view: Open Source Licenses Full Screen ────────────────────────────
  if (currentView === 'licenses') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.75}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Open Source Licenses</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.legalDocCard}>
            <Text style={styles.legalDocHeader}>Third-Party Software Notices</Text>
            <Text style={styles.legalDocSub}>
              We gratefully acknowledge the following open-source software libraries
            </Text>

            <View style={styles.divider} />

            <View style={styles.licenseItem}>
              <Text style={styles.licenseName}>React Native</Text>
              <Text style={styles.licenseType}>MIT License · Meta Platforms, Inc.</Text>
              <Text style={styles.licenseDesc}>
                A framework for building native applications using React.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.licenseItem}>
              <Text style={styles.licenseName}>React Native SVG</Text>
              <Text style={styles.licenseType}>MIT License · Horcrux / react-native-svg</Text>
              <Text style={styles.licenseDesc}>
                SVG library for React Native providing vector graphics rendering support.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.licenseItem}>
              <Text style={styles.licenseName}>Lucide Icons</Text>
              <Text style={styles.licenseType}>ISC License · Lucide Contributors</Text>
              <Text style={styles.licenseDesc}>
                An open-source icon library designed for consistency and clarity.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.licenseItem}>
              <Text style={styles.licenseName}>Google Fonts (Inter & Outfit)</Text>
              <Text style={styles.licenseType}>SIL Open Font License 1.1</Text>
              <Text style={styles.licenseDesc}>
                Modern typeface fonts optimized for mobile readability and interface design.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.fullScreenActionBtn, { marginTop: 16 }]}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.85}
            >
              <Text style={styles.fullScreenActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitleText}>About TOHFA</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>T</Text>
            <View style={styles.logoLeafAccent}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.3 7.2 9.5-.2-1.8.1-3.7 1-5.3 1.2-2.1 3.2-3.6 5.5-4.2.3-.1.7 0 .8.3.1.3 0 .7-.3.8-2.1.6-3.9 2-5 3.9-.8 1.4-1.1 3.1-1 4.7 6.1-.7 10.8-5.8 10.8-12 0-4.3-3.6-7.7-8-7.7z"
                  fill="#86EFAC"
                />
              </Svg>
            </View>
          </View>
          <Text style={styles.appTitle}>TOHFA</Text>
          <Text style={styles.appSubtitle}>
            Nilgiris Horticulture Organic Farmers Association
          </Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Version 1.0.0 (Build 100)</Text>
          </View>
        </View>

        {/* Section 1: Application Information */}
        <Text style={styles.sectionHeading}>Application Information</Text>
        <View style={styles.infoCard}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Application</Text>
              <Text style={styles.fieldValue}>TOHFA Admin App</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Version</Text>
              <Text style={styles.fieldValue}>1.0.0</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={[styles.gridRow, { marginTop: 16 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Build</Text>
              <Text style={styles.fieldValue}>100</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Environment</Text>
              <Text style={styles.fieldValue}>Production</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.gridRow, { marginTop: 16 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Role</Text>
              <Text style={styles.fieldValue}>Sub Warehouse Admin</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>Coonoor Warehouse</Text>
            </View>
          </View>
        </View>

        {/* Section 2: System Status */}
        <Text style={styles.sectionHeading}>System Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <ShieldCheckIcon size={18} color={PALETTE.greenText} />
              <Text style={styles.statusTitle}>Backend & API Server</Text>
            </View>
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusBadgeGreenText}>Connected</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <ShieldCheckIcon size={18} color={PALETTE.greenText} />
              <Text style={styles.statusTitle}>Local Offline Sync</Text>
            </View>
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusBadgeGreenText}>Synchronized</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Legal Information */}
        <Text style={styles.sectionHeading}>Legal Information</Text>
        <View style={styles.legalCard}>
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => setCurrentView('privacy')}
            activeOpacity={0.75}
          >
            <Text style={styles.legalLabel}>Privacy Policy</Text>
            <ChevronRightIcon size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => setCurrentView('terms')}
            activeOpacity={0.75}
          >
            <Text style={styles.legalLabel}>Terms & Conditions</Text>
            <ChevronRightIcon size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Open Source Licenses */}
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => setCurrentView('licenses')}
            activeOpacity={0.75}
          >
            <Text style={styles.legalLabel}>Open Source Licenses</Text>
            <ChevronRightIcon size={18} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
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
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
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

  heroCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 4,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
  },
  logoLetter: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoLeafAccent: {
    position: 'absolute',
    top: 7,
    right: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  badgePill: {
    backgroundColor: PALETTE.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 18,
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  statusCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  statusBadgeGreen: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },

  legalCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  legalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
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

  // Legal Documents (Full Screen)
  legalDocCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  legalDocHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  legalDocSub: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  legalSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 6,
  },
  legalParagraph: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },
  licenseItem: {
    paddingVertical: 10,
  },
  licenseName: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  licenseType: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.primary,
    marginBottom: 4,
  },
  licenseDesc: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  fullScreenActionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  fullScreenActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
