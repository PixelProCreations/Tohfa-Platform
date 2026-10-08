import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  greenText:     '#15803D',
  greenBg:       '#DCFCE7',

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

function UserAvatarIcon({ size = 28, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function EditPencilIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckRadioIcon({ selected }: { selected: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={selected ? PALETTE.primary : '#D1D5DB'} strokeWidth="2" fill={selected ? PALETTE.primary : 'transparent'} />
      {selected && (
        <Path d="M8 12l2.5 2.5L16 9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
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

export interface SubWarehouseUserProfileScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseUserProfileScreen({
  onBack,
  onTabChange,
}: SubWarehouseUserProfileScreenProps) {
  const [fullName, setFullName] = useState('Suresh');
  const [role] = useState('Sub Warehouse Admin');
  const [warehouse] = useState('Coonoor Warehouse');
  const [adminId] = useState('SWA-COO-001');
  const [mobileNumber, setMobileNumber] = useState('+91 98765 43210');
  const [email, setEmail] = useState('suresh@tohfa.ag');
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Tamil'>('English');

  // Edit Profile Modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState(fullName);
  const [editMobile, setEditMobile] = useState(mobileNumber);
  const [editEmail, setEditEmail] = useState(email);

  const handleOpenEdit = () => {
    setEditFullName(fullName);
    setEditMobile(mobileNumber);
    setEditEmail(email);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editFullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }
    setFullName(editFullName.trim());
    setMobileNumber(editMobile.trim());
    setEmail(editEmail.trim());
    setIsEditModalVisible(false);
    Alert.alert('Success', 'Profile updated successfully.');
  };

  const handleSaveLanguage = () => {
    Alert.alert('Language Updated', `Preferred language set to ${selectedLanguage}.`);
  };

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
          <Text style={styles.headerTitleText}>Profile</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Header Card */}
        <View style={styles.identityHeader}>
          <View style={styles.avatarIconWrap}>
            <UserAvatarIcon size={28} color="#8B5E3C" />
          </View>
          <Text style={styles.userNameText}>{fullName}</Text>
          <Text style={styles.userSubtitleText}>
            {role} · {warehouse}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusPillText}>Active Staff</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Profile Information */}
        <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValueBold}>{fullName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Role</Text>
              <Text style={styles.fieldValueBold}>{role}</Text>
            </View>
          </View>

          <View style={styles.gridDivider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValueBold}>{warehouse}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Admin ID</Text>
              <Text style={styles.fieldValueBold}>{adminId}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Contact Information */}
        <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <Text style={styles.fieldValueBold}>{mobileNumber}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValueBold}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Language */}
        <Text style={styles.sectionTitle}>PREFERRED LANGUAGE</Text>
        <View style={styles.languageCard}>
          <TouchableOpacity
            style={styles.languageOptionRow}
            onPress={() => setSelectedLanguage('English')}
            activeOpacity={0.75}
          >
            <Text style={[styles.languageText, selectedLanguage === 'English' && styles.languageTextSelected]}>
              English
            </Text>
            <CheckRadioIcon selected={selectedLanguage === 'English'} />
          </TouchableOpacity>

          <View style={styles.languageDivider} />

          <TouchableOpacity
            style={styles.languageOptionRow}
            onPress={() => setSelectedLanguage('Tamil')}
            activeOpacity={0.75}
          >
            <Text style={[styles.languageText, selectedLanguage === 'Tamil' && styles.languageTextSelected]}>
              Tamil (தமிழ்)
            </Text>
            <CheckRadioIcon selected={selectedLanguage === 'Tamil'} />
          </TouchableOpacity>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={handleOpenEdit}
          activeOpacity={0.85}
        >
          <EditPencilIcon size={18} color="#FFFFFF" />
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>

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

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.inputField}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Enter your full name"
              placeholderTextColor={PALETTE.textMuted}
            />

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.inputField}
              value={editMobile}
              onChangeText={setEditMobile}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              placeholderTextColor={PALETTE.textMuted}
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.inputField}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={PALETTE.textMuted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  identityHeader: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 6,
  },
  avatarIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  userSubtitleText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.greenText,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.greenText,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.categoryTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoCard: {
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
    marginBottom: 3,
    fontWeight: '500',
  },
  fieldValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  gridDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },

  languageCard: {
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
  languageOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  languageTextSelected: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  languageDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 16,
  },

  editProfileBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  editProfileBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 10,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: PALETTE.textInk,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
