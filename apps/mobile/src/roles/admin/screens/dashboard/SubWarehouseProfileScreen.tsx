import React, { useState } from 'react';
import {
  Alert,
  Modal,
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

// ─── Design Tokens (#F0562A Unified Subwarehouse Brand Palette) ──────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  heroCardBg: '#F0562A',
  heroCardBorder: '#E04A1F',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Status Colors
  greenBadge: '#DCFCE7',
  greenText: '#15803D',
  greenDot: '#10B981',

  // Info Banner (Blue)
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  infoText: '#1D4ED8',

  // Warning Banner (Red)
  warningBg: '#FEF2F2',
  warningBorder: '#FECACA',
  warningText: '#DC2626',

  // Section Icon Box
  iconBoxBg: '#FEF1EC',
  iconBoxBorder: '#FCD9CE',
  iconColor: '#F0562A',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
};

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

function WarehouseBuildingIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon({ size = 19, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
        stroke={color}
        strokeWidth="2.2"
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

function MapPinIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
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

function StorageRackIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 9h18M3 15h18M9 9v6M15 9v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhoneIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
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

function DocumentIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight({ size = 16, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SlashCircleIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

import { SubWarehouseStorageInfoScreen } from './SubWarehouseStorageInfoScreen';
import { SubWarehouseOperatingInfoScreen } from './SubWarehouseOperatingInfoScreen';
import { SubWarehouseContactScreen } from './SubWarehouseContactScreen';
import { SubWarehouseDocumentsScreen } from './SubWarehouseDocumentsScreen';

export interface SubWarehouseProfileScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
  onNavigateToInventory?: (() => void) | undefined;
  onNavigateToStorageInfo?: (() => void) | undefined;
  onNavigateToOperatingInfo?: (() => void) | undefined;
  onNavigateToContact?: (() => void) | undefined;
  onNavigateToDocuments?: (() => void) | undefined;
}

type DetailModalType = 'operating' | 'contact' | 'documents' | 'map' | null;

export function SubWarehouseProfileScreen({
  onBack,
  onTabChange,
  onNavigateToInventory,
  onNavigateToStorageInfo,
  onNavigateToOperatingInfo,
  onNavigateToContact,
  onNavigateToDocuments,
}: SubWarehouseProfileScreenProps) {
  const [activeSubScreen, setActiveSubScreen] = useState<'storage' | 'operating' | 'contact' | 'documents' | null>(null);
  const [activeModal, setActiveModal] = useState<DetailModalType>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Alert.alert('Profile Refreshed', 'Coonoor Warehouse profile data is up to date.');
    }, 600);
  };

  if (activeSubScreen === 'storage') {
    return (
      <SubWarehouseStorageInfoScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'operating') {
    return (
      <SubWarehouseOperatingInfoScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'contact') {
    return (
      <SubWarehouseContactScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'documents') {
    return (
      <SubWarehouseDocumentsScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

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
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ArrowBackIcon size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleRow}>
              <WarehouseBuildingIcon size={24} color="#FFFFFF" />
              <Text style={styles.headerTitleText}>Warehouse Profile</Text>
            </View>

            <TouchableOpacity
              style={styles.headerRefreshBtn}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <RefreshIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Locked Warehouse Pill */}
          <View style={styles.lockedPill}>
            <LockBadgeIcon size={12} color="#FFFFFF" />
            <Text style={styles.lockedPillText}>Coonoor Warehouse</Text>
          </View>
        </View>

        {/* ─── Main Content Body ─── */}
        <View style={styles.mainContainer}>
          {/* 1. Hero Warehouse Card (#F0562A Brand Theme) */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBadge}>
              <WarehouseBuildingIcon size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.heroWarehouseTitle}>Coonoor Warehouse</Text>
            <Text style={styles.heroWarehouseId}>Warehouse ID: WH-COO-001</Text>

            <View style={styles.heroActivePill}>
              <View style={styles.heroActiveDot} />
              <Text style={styles.heroActiveText}>Active</Text>
            </View>
          </View>

          {/* 2. Information Section */}
          <Text style={styles.sectionHeading}>Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Warehouse Name</Text>
                <Text style={styles.infoValue}>Coonoor Warehouse</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Warehouse ID</Text>
                <Text style={styles.infoValue}>WH-COO-001</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>Active</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Warehouse Type</Text>
                <Text style={styles.infoValue}>Sub Warehouse</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Region</Text>
                <Text style={styles.infoValue}>Nilgiris</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Assigned SWA</Text>
                <Text style={styles.infoValue}>Suresh</Text>
              </View>
            </View>
          </View>

          {/* 3. Location Section */}
          <Text style={styles.sectionHeading}>Location</Text>
          <View style={[styles.card, { marginBottom: 10 }]}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.locationMainText}>Coonoor, Nilgiris, Tamil Nadu, India</Text>
          </View>

          <TouchableOpacity
            style={styles.mapPreviewCard}
            onPress={() => setActiveModal('map')}
            activeOpacity={0.75}
          >
            <View style={styles.mapPreviewLeft}>
              <MapFoldedIcon size={20} color={PALETTE.primary} />
              <Text style={styles.mapPreviewLabel}>Map Preview</Text>
            </View>
            <Text style={styles.openMapLink}>Open Map</Text>
          </TouchableOpacity>

          {/* 4. Warehouse Overview Section */}
          <Text style={styles.sectionHeading}>Warehouse Overview</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Storage Locations</Text>
                <Text style={styles.infoValue}>8</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Active</Text>
                <Text style={styles.infoValue}>Yes</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Assigned Admin</Text>
                <Text style={styles.infoValue}>SWA – Coonoor</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Current Stock</Text>
                <Text style={styles.infoValue}>12,480 kg</Text>
              </View>
            </View>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Current Stock links to <Text style={{ fontWeight: '700' }}>Inventory → Warehouse Inventory (Module 3)</Text> — it is not editable from here, and SWA cannot activate or deactivate the warehouse.
            </Text>
          </View>

          {/* 5. Warehouse Profile Sections */}
          <Text style={styles.sectionHeading}>Warehouse Profile Sections</Text>
          <View style={styles.sectionList}>
            {/* Storage Information */}
            <TouchableOpacity
              style={styles.sectionRowCard}
              onPress={() => {
                if (onNavigateToStorageInfo) onNavigateToStorageInfo();
                else setActiveSubScreen('storage');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.sectionRowLeft}>
                <View style={styles.sectionIconBox}>
                  <StorageRackIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.sectionRowTitle}>Storage Information</Text>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>

            {/* Operating Information */}
            <TouchableOpacity
              style={styles.sectionRowCard}
              onPress={() => {
                if (onNavigateToOperatingInfo) onNavigateToOperatingInfo();
                else setActiveSubScreen('operating');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.sectionRowLeft}>
                <View style={styles.sectionIconBox}>
                  <ClockIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.sectionRowTitle}>Operating Information</Text>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>

            {/* Warehouse Contact */}
            <TouchableOpacity
              style={styles.sectionRowCard}
              onPress={() => {
                if (onNavigateToContact) onNavigateToContact();
                else setActiveSubScreen('contact');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.sectionRowLeft}>
                <View style={styles.sectionIconBox}>
                  <PhoneIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.sectionRowTitle}>Warehouse Contact</Text>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>

            {/* Warehouse Documents */}
            <TouchableOpacity
              style={styles.sectionRowCard}
              onPress={() => {
                if (onNavigateToDocuments) onNavigateToDocuments();
                else setActiveSubScreen('documents');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.sectionRowLeft}>
                <View style={styles.sectionIconBox}>
                  <DocumentIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.sectionRowTitle}>Warehouse Documents</Text>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 6. Red Warning Alert Box */}
          <View style={styles.redWarningBox}>
            <SlashCircleIcon size={18} color={PALETTE.warningText} />
            <Text style={styles.redWarningText}>
              No Add Warehouse, Delete Warehouse, Change Assignment, or warehouse-switching dropdown anywhere in this module — SWA is locked to Coonoor, enforced server-side.
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
            else if (onBack) onBack();
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
            if (onNavigateToInventory) onNavigateToInventory();
            else if (onTabChange) onTabChange('Inventory');
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

      {/* ─── Detail Modal Dialogs ─── */}

      {/* 1. Operating Information Modal */}

      {/* 2. Operating Information Modal */}
      <Modal visible={activeModal === 'operating'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.sectionIconBox}>
                  <ClockIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.modalTitle}>Operating Information</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Working Hours</Text>
                <Text style={styles.detailValue}>06:00 AM – 08:00 PM</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Goods Receiving Window</Text>
                <Text style={styles.detailValue}>06:30 AM – 11:30 AM</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Pickup Window</Text>
                <Text style={styles.detailValue}>10:00 AM – 06:00 PM</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Operating Days</Text>
                <Text style={styles.detailValue}>Monday – Saturday (7 Days Active)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dispatch Cutoff</Text>
                <Text style={styles.detailValue}>05:00 PM Daily</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Night Guard Shift</Text>
                <Text style={styles.detailValue}>08:00 PM – 06:00 AM</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. Warehouse Contact Modal */}
      <Modal visible={activeModal === 'contact'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.sectionIconBox}>
                  <PhoneIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.modalTitle}>Warehouse Contact</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Facility Manager</Text>
                <Text style={styles.detailValue}>Suresh (SWA Admin)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone / Mobile</Text>
                <Text style={styles.detailValue}>+91 94421 87654</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>coonoor.hub@tohfa.in</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Emergency Hotline</Text>
                <Text style={styles.detailValue}>1800-425-TOHFA (Ext 401)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Security Desk</Text>
                <Text style={styles.detailValue}>+91 94421 87659</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Central Dispatch Line</Text>
                <Text style={styles.detailValue}>+91 80012 34567</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 4. Warehouse Documents Modal */}
      <Modal visible={activeModal === 'documents'} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View
            style={styles.modalSheet}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.sectionIconBox}>
                  <DocumentIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.modalTitle}>Warehouse Documents</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>APMC Trade License</Text>
                <Text style={[styles.detailValue, { color: PALETTE.greenText }]}>✓ Active (EXP: Dec 2028)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>FSSAI Food Storage Lic.</Text>
                <Text style={[styles.detailValue, { color: PALETTE.greenText }]}>✓ 12423011000452</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fire Safety Clearance</Text>
                <Text style={[styles.detailValue, { color: PALETTE.greenText }]}>✓ Certified (Nilgiris DFS)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Organic Storage Handling</Text>
                <Text style={[styles.detailValue, { color: PALETTE.greenText }]}>✓ PGS-India Approved</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Lease Agreement</Text>
                <Text style={styles.detailValue}>Valid till 2030 (TOHFA-COO-L01)</Text>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 5. Map Preview Modal */}
      <Modal visible={activeModal === 'map'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.sectionIconBox}>
                  <MapPinIcon size={20} color={PALETTE.primary} />
                </View>
                <Text style={styles.modalTitle}>Warehouse Location</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.mapGraphicPlaceholder}>
                <MapPinIcon size={36} color={PALETTE.primary} />
                <Text style={styles.mapCoordsText}>11.3530° N, 76.7959° E</Text>
                <Text style={styles.mapAddressSub}>Coonoor Agricultural Hub, BedFord, Coonoor, Nilgiris - 643101</Text>
              </View>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => {
                  setActiveModal(null);
                  Alert.alert('Directions', 'Opening GPS navigation to Coonoor Warehouse...');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionButtonText}>Start GPS Navigation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerRefreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  lockedPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Content Container ─────────────────────────────────────────────────────
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ─── Hero Card ─────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: PALETTE.heroCardBg,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#F0562A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  heroIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroWarehouseTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroWarehouseId: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  heroActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  heroActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  heroActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 6,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // ─── Standard White Cards ──────────────────────────────────────────────────
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  infoLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  dividerLine: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  locationMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },

  // ─── Map Preview Card ──────────────────────────────────────────────────────
  mapPreviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  mapPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapPreviewLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  openMapLink: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  // ─── Blue Info Box ─────────────────────────────────────────────────────────
  blueNoticeBox: {
    backgroundColor: PALETTE.infoBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    padding: 13,
    marginTop: -2,
    marginBottom: 16,
  },
  blueNoticeText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: PALETTE.infoText,
    fontWeight: '500',
  },

  // ─── Warehouse Profile Section Cards ───────────────────────────────────────
  sectionList: {
    gap: 10,
    marginBottom: 16,
  },
  sectionRowCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PALETTE.iconBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.iconBoxBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  // ─── Red Warning Box ───────────────────────────────────────────────────────
  redWarningBox: {
    backgroundColor: PALETTE.warningBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.warningBorder,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  redWarningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: PALETTE.warningText,
    fontWeight: '500',
  },

  // ─── Bottom Tab Bar ────────────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },

  // ─── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: PALETTE.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  detailLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    color: PALETTE.textInk,
    fontWeight: '700',
    textAlign: 'right',
  },
  mapGraphicPlaceholder: {
    backgroundColor: PALETTE.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  mapCoordsText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 8,
  },
  mapAddressSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  modalActionButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modalActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
