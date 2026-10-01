import React, { useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textBody:      '#4B5563',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  amberBadge:    '#FFF0EB',
  amberText:     '#F0562A',
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',
  avatarBg:      '#FFF0EB',
  avatarText:    '#F0562A',
  clearBorder:   '#D1D5DB',
  clearText:     '#4B5563',
};

// ─── Pure SVG Icons (No Rect or Circle to avoid Hermes runtime errors) ───────

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

function PhoneIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
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

function ChatIcon({ size = 18, color = '#1E8E5A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CartPlusIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9v6M9 12h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 14h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StatementDocIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface CustomerData {
  id?: string;
  name?: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'Active' | 'On Hold' | 'Suspended' | undefined;
  customerType?: 'Retail' | 'B2B' | 'Market Day' | undefined;
  creditLimit?: string;
  notes?: string;
}

export interface SubWarehouseCustomerActionsScreenProps {
  customer?: CustomerData | undefined;
  onBack: () => void;
  onSaveCustomer?: ((updatedCustomer: CustomerData) => void) | undefined;
  onNavigateToNewSale?: (() => void) | undefined;
  onNavigateToCashTopUp?: (() => void) | undefined;
  onNavigateToOrders?: (() => void) | undefined;
  onNavigateToPurchases?: (() => void) | undefined;
}

export function SubWarehouseCustomerActionsScreen({
  customer,
  onBack,
  onSaveCustomer,
  onNavigateToNewSale,
  onNavigateToCashTopUp,
  onNavigateToOrders,
  onNavigateToPurchases,
}: SubWarehouseCustomerActionsScreenProps): React.JSX.Element {
  const [name, setName] = useState(customer?.name || 'Rajesh Kumar');
  const [phone, setPhone] = useState(customer?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(customer?.email || 'customer@example.com');
  const [address, setAddress] = useState(
    customer?.address || 'Shop #14, Main Bazaar, Coonoor, Nilgiris - 643102'
  );
  const [customerType, setCustomerType] = useState<CustomerData['customerType']>(
    customer?.customerType || 'Retail'
  );
  const [status, setStatus] = useState<CustomerData['status']>(
    customer?.status || 'Active'
  );
  const [creditLimit, setCreditLimit] = useState(customer?.creditLimit || '5000');
  const [notes, setNotes] = useState(
    customer?.notes || 'Frequent morning buyer. Prefers Grade 1 produce.'
  );

  const initials = (name || 'Rajesh Kumar')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSave = () => {
    const updated: CustomerData = {
      ...customer,
      name,
      phone,
      email,
      address,
      customerType,
      status,
      creditLimit,
      notes,
    };
    if (onSaveCustomer) {
      onSaveCustomer(updated);
    }
    Alert.alert('Customer Updated', `Changes for ${name} have been saved successfully.`);
    onBack();
  };

  const handleCall = () => {
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Phone Call', `Dialing ${phone}...`);
    });
  };

  const handleWhatsApp = () => {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanNumber}&text=Hello%20${encodeURIComponent(name)},%20greeting%20from%20Tohfa%20Sub-Warehouse!`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp', `Opening WhatsApp conversation with ${name} (${phone})...`);
    });
  };

  const handleStatement = () => {
    Alert.alert(
      'Account Statement Dispatched',
      `Monthly ledger and recent invoice summary for ${name} dispatched via SMS and Email (${email}).`
    );
  };

  const typeOptions: Array<CustomerData['customerType']> = ['Retail', 'B2B', 'Market Day'];
  const statusOptions: Array<CustomerData['status']> = ['Active', 'On Hold', 'Suspended'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Customer Details"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Customer Actions</Text>

          <TouchableOpacity
            style={styles.headerSaveButton}
            onPress={handleSave}
            activeOpacity={0.8}
            accessibilityLabel="Save Customer"
          >
            <Text style={styles.headerSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Customer Mini Card ─── */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials || 'RK'}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{name}</Text>
            <Text style={styles.heroSub}>{customer?.code || customer?.id || 'CUS-00291'} · {phone}</Text>
            <View
              style={[
                styles.statusBadge,
                status === 'Active'
                  ? styles.badgeActive
                  : status === 'On Hold'
                  ? styles.badgeHold
                  : styles.badgeSuspended,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  status === 'Active'
                    ? styles.badgeTextActive
                    : status === 'On Hold'
                    ? styles.badgeTextHold
                    : styles.badgeTextSuspended,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Communication Actions ─── */}
        <Text style={styles.sectionHeading}>Quick Communications</Text>
        <View style={styles.commGrid}>
          <TouchableOpacity style={styles.commTile} onPress={handleCall} activeOpacity={0.8}>
            <View style={[styles.commIconWrap, { backgroundColor: '#FEEFEA' }]}>
              <PhoneIcon size={18} color="#F0562A" />
            </View>
            <Text style={styles.commTileTitle}>Call</Text>
            <Text style={styles.commTileSub}>Direct Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.commTile} onPress={handleWhatsApp} activeOpacity={0.8}>
            <View style={[styles.commIconWrap, { backgroundColor: '#E6F5ED' }]}>
              <ChatIcon size={18} color="#1E8E5A" />
            </View>
            <Text style={styles.commTileTitle}>WhatsApp</Text>
            <Text style={styles.commTileSub}>Send Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.commTile} onPress={handleStatement} activeOpacity={0.8}>
            <View style={[styles.commIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <StatementDocIcon size={18} color="#2563EB" />
            </View>
            <Text style={styles.commTileTitle}>Statement</Text>
            <Text style={styles.commTileSub}>Dispatch Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Fast Operational Shortcuts ─── */}
        <Text style={styles.sectionHeading}>Operations & Transactions</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              if (onNavigateToNewSale) onNavigateToNewSale();
              else Alert.alert('New Sale', `Opening new direct sale for ${name}...`);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FEEFEA' }]}>
              <CartPlusIcon size={18} color="#F0562A" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Create New Direct Sale</Text>
              <Text style={styles.actionSub}>Generate invoice & pack order for pickup</Text>
            </View>
            <ChevronRightIcon size={16} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              if (onNavigateToCashTopUp) onNavigateToCashTopUp();
              else Alert.alert('Wallet Top-Up', `Opening wallet operations for ${name}...`);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FFF0EB' }]}>
              <WalletIcon size={18} color="#F0562A" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Wallet Cash Top-Up</Text>
              <Text style={styles.actionSub}>Collect cash & add credit to customer balance</Text>
            </View>
            <ChevronRightIcon size={16} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              if (onNavigateToOrders) onNavigateToOrders();
              else onBack();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <StatementDocIcon size={18} color="#2563EB" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Customer Orders List</Text>
              <Text style={styles.actionSub}>View active, completed & pickup order history</Text>
            </View>
            <ChevronRightIcon size={16} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              if (onNavigateToPurchases) onNavigateToPurchases();
              else onBack();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#E6F5ED' }]}>
              <CartPlusIcon size={18} color="#1E8E5A" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Purchase & Item History</Text>
              <Text style={styles.actionSub}>Crops, grades, weights & paid invoices</Text>
            </View>
            <ChevronRightIcon size={16} />
          </TouchableOpacity>
        </View>

        {/* ─── Edit Customer Profile Form ─── */}
        <Text style={styles.sectionHeading}>Edit Customer Profile</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Customer name"
            placeholderTextColor="#8A928D"
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 XXXXX XXXXX"
            placeholderTextColor="#8A928D"
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email Address</Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="customer@example.com"
            placeholderTextColor="#8A928D"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Delivery Address</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="Shop / delivery address"
            placeholderTextColor="#8A928D"
            multiline
            numberOfLines={2}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Customer Type</Text>
          <View style={styles.chipRow}>
            {typeOptions.map((t) => {
              const isSelected = customerType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setCustomerType(t)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Account Status</Text>
          <View style={styles.chipRow}>
            {statusOptions.map((s) => {
              const isSelected = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setStatus(s)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Credit Limit (₹)</Text>
          <TextInput
            style={styles.textInput}
            value={creditLimit}
            onChangeText={setCreditLimit}
            placeholder="5000"
            placeholderTextColor="#8A928D"
            keyboardType="numeric"
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Operational Notes</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Customer notes, timing preferences, etc."
            placeholderTextColor="#8A928D"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* ─── Danger Zone: Reset or Suspend ─── */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Account Access Control</Text>
          <Text style={styles.dangerDesc}>
            Temporarily disable pickup authorization or place the customer on credit hold.
          </Text>
          <TouchableOpacity
            style={styles.suspendButton}
            onPress={() => {
              Alert.alert(
                'Suspend Customer Account',
                `Are you sure you want to suspend ${name}? They will not be able to place new orders until reactivated.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Suspend Account',
                    style: 'destructive',
                    onPress: () => {
                      setStatus('Suspended');
                      Alert.alert('Account Suspended', `${name}'s account is now suspended.`);
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.suspendButtonText}>Suspend Customer Access</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Bottom Actions ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
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
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerSaveText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  heroCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PALETTE.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.avatarText,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  heroSub: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: PALETTE.greenBadge,
  },
  badgeHold: {
    backgroundColor: PALETTE.amberBadge,
  },
  badgeSuspended: {
    backgroundColor: PALETTE.redBadge,
  },
  statusBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: PALETTE.greenText,
  },
  badgeTextHold: {
    color: PALETTE.amberText,
  },
  badgeTextSuspended: {
    color: PALETTE.redText,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  commGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  commTile: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  commIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  commTileTitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  commTileSub: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  actionSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 4,
  },
  inputLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 42,
    paddingHorizontal: 12,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    color: PALETTE.textInk,
  },
  multilineInput: {
    height: 64,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  dangerCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7D7',
    padding: 14,
    marginBottom: 14,
  },
  dangerTitle: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.redText,
    marginBottom: 4,
  },
  dangerDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
    marginBottom: 10,
  },
  suspendButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendButtonText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.redText,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.clearBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.clearText,
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
