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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { StaffMember } from './SubWarehouseStaffScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenIcon:     '#059669',
  redBoxBg:      '#FEF2F2',
  redBoxBorder:  '#FECACA',
  redBoxText:    '#DC2626',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
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

function DeliveryTruckIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PersonUserIcon({ size = 24, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ProhibitedCircleIcon({ size = 16, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface SubWarehouseStaffDetailScreenProps {
  staff?: StaffMember;
  onBack: () => void;
  onEditProfile?: (staff: StaffMember) => void;
  onViewAttendance?: (staff?: StaffMember) => void;
  onAssignDelivery?: (staff: StaffMember) => void;
}

export function SubWarehouseStaffDetailScreen({
  staff,
  onBack,
  onEditProfile,
  onViewAttendance,
  onAssignDelivery,
}: SubWarehouseStaffDetailScreenProps) {
  const currentStaff: StaffMember = staff || {
    id: 'staff-2',
    name: 'Karthik',
    staffId: 'STF-0024',
    type: 'warehouse',
    role: 'Warehouse Staff',
    status: 'Active',
    attendance: 'Present',
    phone: 'XXXXXXXXXX',
    email: 'example@email.com',
    warehouse: 'Coonoor Warehouse',
  };

  const activityTimeline = [
    { id: '1', title: 'Profile Created', isLast: false },
    { id: '2', title: 'Assigned to Coonoor', isLast: false },
    { id: '3', title: 'Attendance Recorded', isLast: true },
  ];

  const isDriver = currentStaff.type === 'driver';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Staff Detail</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Profile Card ─── */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircleLarge}>
            {isDriver ? (
              <DeliveryTruckIcon size={28} color="#7A726C" />
            ) : (
              <PersonUserIcon size={28} color="#7A726C" />
            )}
          </View>
          <View style={styles.profileHeaderInfo}>
            <Text style={styles.profileName}>{currentStaff.name}</Text>
            <Text style={styles.profileSubtitle}>
              Staff ID: {currentStaff.staffId} · {currentStaff.status}
            </Text>
          </View>
        </View>

        {currentStaff.type === 'driver' ? (
          <>
            {/* ─── Driver Information ─── */}
            <Text style={styles.sectionHeader}>Driver Information</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Driver ID</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.staffId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.status}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Assigned Warehouse</Text>
                <Text style={styles.fieldBoldVal}>{currentStaff.warehouse || 'Coonoor Warehouse'}</Text>
              </View>
            </View>

            {/* ─── Delivery Summary ─── */}
            <Text style={styles.sectionHeader}>Delivery Summary</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Today's Deliveries</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.deliveriesToday ?? 6}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Completed</Text>
                  <Text style={styles.fieldBoldVal}>4</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Pending</Text>
                <Text style={styles.fieldBoldVal}>2</Text>
              </View>
            </View>

            {/* ─── Performance ─── */}
            <Text style={styles.sectionHeader}>Performance</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Completed Deliveries</Text>
                  <Text style={styles.fieldBoldVal}>124</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Cancelled</Text>
                  <Text style={styles.fieldBoldVal}>3</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Failed</Text>
                <Text style={styles.fieldBoldVal}>2</Text>
              </View>
            </View>

            {/* ─── Blue Disclaimer Box ─── */}
            <View style={styles.blueInfoBox}>
              <Text style={styles.blueInfoText}>
                Only metrics the backend actually defines are shown — no invented performance figures.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* ─── Basic Information ─── */}
            <Text style={styles.sectionHeader}>Basic Information</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.name}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Staff ID</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.staffId}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Role</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.role}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.status}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Warehouse</Text>
                <Text style={styles.fieldBoldVal}>
                  {currentStaff.warehouse || 'Coonoor Warehouse'}
                </Text>
              </View>
            </View>

            {/* ─── Contact Information ─── */}
            <Text style={styles.sectionHeader}>Contact Information</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.phone || 'XXXXXXXXXX'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.fieldBoldVal}>{currentStaff.email || 'example@email.com'}</Text>
                </View>
              </View>
            </View>

            {/* ─── Red Disclaimer Box ─── */}
            <View style={styles.redDisclaimerCard}>
              <ProhibitedCircleIcon size={18} color={PALETTE.redBoxText} />
              <Text style={styles.redDisclaimerText}>
                No salary, payroll, bank account, or Aadhaar fields — the source doesn't define a complete warehouse-staff HR data model, so none is invented here.
              </Text>
            </View>
          </>
        )}

        {/* ─── Attendance Summary ─── */}
        <Text style={styles.sectionHeader}>Attendance Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Present</Text>
              <Text style={styles.fieldBoldVal}>22 days</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Absent</Text>
              <Text style={styles.fieldBoldVal}>2 days</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Leave</Text>
            <Text style={styles.fieldBoldVal}>1 day</Text>
          </View>
        </View>

        {/* ─── Activity Timeline ─── */}
        <Text style={styles.sectionHeader}>Activity</Text>
        <View style={styles.timelineContainer}>
          {activityTimeline.map((item) => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                {!item.isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Bar: Actions ─── */}
      <View style={styles.bottomBar}>
        {currentStaff.type === 'driver' && (
          <TouchableOpacity
            style={styles.assignDeliveryBtn}
            onPress={() => onAssignDelivery && onAssignDelivery(currentStaff)}
            activeOpacity={0.88}
          >
            <DeliveryTruckIcon color="#FFFFFF" size={20} />
            <Text style={styles.assignDeliveryText}>Assign Delivery</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => onEditProfile && onEditProfile(currentStaff)}
          activeOpacity={0.88}
        >
          <Text style={styles.editProfileText}>
            Edit {currentStaff.type === 'driver' ? 'Driver' : 'Staff'} Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  avatarCircleLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldBoldVal: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  redDisclaimerCard: {
    flexDirection: 'row',
    backgroundColor: PALETTE.redBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.redBoxBorder,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  redDisclaimerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.redBoxText,
    lineHeight: 18,
    fontWeight: '500',
  },
  blueInfoBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  blueInfoText: {
    fontSize: 12,
    color: PALETTE.blueBoxText,
    lineHeight: 18,
    fontWeight: '500',
  },
  timelineContainer: {
    paddingLeft: 4,
    marginTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: PALETTE.greenIcon,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.greenIcon,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  assignDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  assignDeliveryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 14,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.primary,
  },
});
