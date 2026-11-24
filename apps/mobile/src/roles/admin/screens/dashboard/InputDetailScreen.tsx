import React, { useState } from 'react';
import {
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
import Svg, { Circle, Path } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { Can } from '../../permissions/can';
import { PencilEditIcon } from '../../components/AdminIcons';
import { AdminConfirmDialog } from '../../components/AdminConfirmDialog';
import { type ApprovedInputItem } from './ApprovedInputsScreen';

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function DocumentOutlineIcon({ size = 15, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BanAlertIcon({ size = 28, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TrashWarningIcon({ size = 28, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface InputDetailScreenProps {
  inputItem?: ApprovedInputItem | undefined;
  onBack: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
  onTerminate?: () => void;
  onDelete?: () => void;
  can?: Can | undefined;
  role?: string | undefined;
}

/**
 * InputDetailScreen
 *
 * Implements M6-S35 · Input Details & Approval (official 35) matching exact UI
 * from user screenshot media_1795508858610_41a0c618.png.
 *
 * All 4 sections (Basic Information, Composition & Usage, Supporting Documents,
 * Approval & History) are rendered continuously. For Super Admin, elevated access
 * actions (Deactivate account, Terminate, Delete Information) are added at the bottom
 * matching media_1795508943957_9167c880.png.
 */
export function InputDetailScreen({
  inputItem,
  onBack,
  onEdit,
  onDeactivate,
  onTerminate,
  onDelete,
  can: _can,
  role = 'SUPER_ADMIN',
}: InputDetailScreenProps): React.JSX.Element {
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'none' | 'deactivate' | 'terminate' | 'delete'>('none');
  const [reasonInput, setReasonInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    hideCancel?: boolean;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Values matching M6-S35 (Image 1)
  const name = inputItem?.name || 'Neem Oil Concentrate';
  const status = isDeactivated ? 'Inactive' : (inputItem?.status || 'Approved');
  const isApproved = status === 'Approved';

  const category = inputItem?.category || 'Pest control';
  const manufacturer = inputItem?.manufacturer || 'GreenGro Organics';
  const registrationId =
    inputItem?.code === 'IN-0041' || !inputItem?.code
      ? 'NEEM-0041-TN'
      : `${inputItem.code}-TN`;

  const composition =
    inputItem?.name === 'Neem Oil Concentrate' || !inputItem
      ? 'Azadirachtin 1500 ppm'
      : (inputItem.method || 'Azadirachtin 1500 ppm');

  const applicableCrops = inputItem?.applicableCrops
    ? inputItem.applicableCrops.replace(/^Applicable:\s*/, '')
    : 'Tomato, Cabbage';

  const dosage =
    inputItem?.name === 'Neem Oil Concentrate' || !inputItem
      ? '5 mL per litre of water'
      : (inputItem.usage || '5 mL per litre of water');

  const applicationMethod =
    inputItem?.name === 'Neem Oil Concentrate' || !inputItem
      ? 'Foliar spray, every 10 days'
      : (inputItem.frequency || 'Foliar spray, every 10 days');

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setConfirmDialog({
        visible: true,
        title: 'Edit Input',
        message: `Editing form for ${name} opened.`,
        confirmLabel: 'OK',
        hideCancel: true,
        onConfirm: () => setConfirmDialog(null),
      });
    }
  };

  const handleDeactivate = () => {
    if (onDeactivate) {
      onDeactivate();
    } else {
      setConfirmDialog({
        visible: true,
        title: isDeactivated ? 'Activate Input?' : 'Deactivate Input?',
        message: isDeactivated
          ? `Are you sure you want to activate ${name}?`
          : `Are you sure you want to deactivate ${name}? It will be marked as Inactive.`,
        confirmLabel: isDeactivated ? 'Activate' : 'Deactivate',
        destructive: !isDeactivated,
        onConfirm: () => {
          setIsDeactivated(!isDeactivated);
          setConfirmDialog(null);
        },
      });
    }
  };

  const handleConfirmDeactivate = () => {
    setConfirmModal('none');
    setIsDeactivated(true);
    if (onDeactivate) {
      onDeactivate();
    } else {
      setConfirmDialog({
        visible: true,
        title: 'Account Deactivated',
        message: `${name} account has been deactivated.`,
        confirmLabel: 'OK',
        hideCancel: true,
        onConfirm: () => setConfirmDialog(null),
      });
    }
  };

  const handleConfirmTerminate = () => {
    setConfirmModal('none');
    if (onTerminate) {
      onTerminate();
    } else {
      setConfirmDialog({
        visible: true,
        title: 'Terminated',
        message: `${name} has been permanently terminated.`,
        confirmLabel: 'OK',
        hideCancel: true,
        onConfirm: () => {
          setConfirmDialog(null);
          onBack();
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    setConfirmModal('none');
    if (onDelete) {
      onDelete();
    } else {
      setConfirmDialog({
        visible: true,
        title: 'Deleted',
        message: `${name} information has been completely removed.`,
        confirmLabel: 'OK',
        hideCancel: true,
        onConfirm: () => {
          setConfirmDialog(null);
          onBack();
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Header Banner (Image 1: M6-S35) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to catalog"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {name}
          </Text>

          {/* Pencil edit icon matching M6-S35 in circular pill */}
          <TouchableOpacity
            style={styles.headerPencilBtn}
            onPress={handleEdit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit Input"
          >
            <PencilEditIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Scrollable Area (Continuous All 4 Sections) ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section 1: Basic Information ─── */}
        <Text style={styles.sectionHeading}>Basic Information</Text>
        <View style={styles.tableCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Input name</Text>
            <Text style={styles.tableValue}>{name}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Category</Text>
            <Text style={styles.tableValue}>{category}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Manufacturer / supplier</Text>
            <Text style={styles.tableValue}>{manufacturer}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Registration ID</Text>
            <Text style={styles.tableValue}>{registrationId}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Record status</Text>
            <Text
              style={[
                styles.tableValue,
                isApproved ? styles.statusApprovedText : styles.statusInactiveText,
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* ─── Section 2: Composition & Usage ─── */}
        <Text style={styles.sectionHeading}>Composition & Usage</Text>
        <View style={styles.tableCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Composition</Text>
            <Text style={styles.tableValue}>{composition}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Applicable crops</Text>
            <Text style={styles.tableValue}>{applicableCrops}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Dosage</Text>
            <Text style={styles.tableValue}>{dosage}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Application method</Text>
            <Text style={styles.tableValue}>{applicationMethod}</Text>
          </View>
        </View>

        {/* ─── Section 3: Supporting Documents ─── */}
        <Text style={styles.sectionHeading}>Supporting Documents</Text>
        <View style={styles.tableCard}>
          {/* Doc 1 */}
          <View style={styles.docRow}>
            <View style={styles.docInfoCol}>
              <Text style={styles.docTitle}>Safety Date Sheet (MSDS)</Text>
              <Text style={styles.docSubtitle}>Verified 11 Oct 2026 - PDF 1.2 MB</Text>
            </View>
            <TouchableOpacity
              style={styles.docViewPill}
              onPress={() =>
                setConfirmDialog({
                  visible: true,
                  title: 'Safety Data Sheet',
                  message: 'Opening Safety Data Sheet (MSDS) PDF...',
                  confirmLabel: 'OK',
                  hideCancel: true,
                  onConfirm: () => setConfirmDialog(null),
                })
              }
              activeOpacity={0.75}
            >
              <DocumentOutlineIcon size={14} color="#EA580C" />
              <Text style={styles.docViewPillText}>View</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {/* Doc 2 */}
          <View style={styles.docRow}>
            <View style={styles.docInfoCol}>
              <Text style={styles.docTitle}>NPOP Organic Certificate</Text>
              <Text style={styles.docSubtitle}>Verified 11 Oct 2026 - PDF 1.2 MB</Text>
            </View>
            <TouchableOpacity
              style={styles.docViewPill}
              onPress={() =>
                setConfirmDialog({
                  visible: true,
                  title: 'Certificate',
                  message: 'Opening NPOP Organic Certificate PDF...',
                  confirmLabel: 'OK',
                  hideCancel: true,
                  onConfirm: () => setConfirmDialog(null),
                })
              }
              activeOpacity={0.75}
            >
              <DocumentOutlineIcon size={14} color="#EA580C" />
              <Text style={styles.docViewPillText}>View</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {/* Doc 3 */}
          <View style={styles.docRow}>
            <View style={styles.docInfoCol}>
              <Text style={styles.docTitle}>Usage & Label Specification</Text>
              <Text style={styles.docSubtitle}>Verified 11 Oct 2026 - PDF 1.2 MB</Text>
            </View>
            <TouchableOpacity
              style={styles.docViewPill}
              onPress={() =>
                setConfirmDialog({
                  visible: true,
                  title: 'Specification',
                  message: 'Opening Usage & Label Specification PDF...',
                  confirmLabel: 'OK',
                  hideCancel: true,
                  onConfirm: () => setConfirmDialog(null),
                })
              }
              activeOpacity={0.75}
            >
              <DocumentOutlineIcon size={14} color="#EA580C" />
              <Text style={styles.docViewPillText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Section 4: Approval & History ─── */}
        <Text style={styles.sectionHeading}>Approval & History</Text>
        <View style={styles.tableCard}>
          {/* History Event 1 (Green) */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineLeftCol}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.timelineRightCol}>
              <Text style={styles.timelineTimestamp}>11 Oct 2026 - 12:30 AM</Text>
              <Text style={styles.timelineTitle}>Approved by Priya Nair</Text>
              <Text style={styles.timelineSub}>Agronomy lead - Full organic compliance verified</Text>
            </View>
          </View>

          {/* History Event 2 (Blue) */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineLeftCol}>
              <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.timelineRightCol}>
              <Text style={styles.timelineTimestamp}>11 Oct 2026 - 12:30 AM</Text>
              <Text style={styles.timelineTitle}>Verified By Super Admin</Text>
              <Text style={styles.timelineSub}>NPOP certification check passed</Text>
            </View>
          </View>

          {/* History Event 3 (Grey) */}
          <View style={[styles.timelineRow, { marginBottom: 6 }]}>
            <View style={styles.timelineLeftCol}>
              <View style={[styles.timelineDot, { backgroundColor: '#D1D5DB' }]} />
            </View>
            <View style={styles.timelineRightCol}>
              <Text style={styles.timelineTimestamp}>11 Oct 2026 - 12:30 AM</Text>
              <Text style={styles.timelineTitle}>Submitted by GreenGro Organics</Text>
              <Text style={styles.timelineSub}>Initial application filed for pest control input</Text>
            </View>
          </View>
        </View>

        {/* ─── Standard Actions (Edit & Deactivate for non-Super Admin, e.g. TOHFA Admin) ─── */}
        {!isSuperAdmin && (
          <View style={styles.standardActionsRow}>
            <TouchableOpacity
              style={styles.editOutlineBtn}
              onPress={handleEdit}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Edit"
            >
              <Text style={styles.editOutlineBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deactivateSolidBtn}
              onPress={handleDeactivate}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Deactivate"
            >
              <Text style={styles.deactivateSolidBtnText}>
                {isDeactivated ? 'Activate' : 'Deactivate'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Super Admin Extra Access Controls (Image 2) ─── */}
        {isSuperAdmin && (
          <View style={styles.superAdminExtraSection}>
            {/* Button 1: Outline Red Terminate */}
            <TouchableOpacity
              style={styles.terminateOutlineBtn}
              onPress={() => setConfirmModal('terminate')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Terminate"
            >
              <Text style={styles.terminateOutlineBtnText}>Terminate</Text>
            </TouchableOpacity>

            {/* Button 2: Outline Red Delete Information */}
            <TouchableOpacity
              style={styles.deleteInfoOutlineBtn}
              onPress={() => setConfirmModal('delete')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Delete Information"
            >
              <Text style={styles.deleteInfoOutlineBtnText}>Delete Information</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ─── Modal 1: Deactivate Account Confirmation ─── */}
      <Modal
        visible={confirmModal === 'deactivate'}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal('none')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogIconWrap}>
              <BanAlertIcon size={32} color="#DC2626" />
            </View>
            <Text style={styles.dialogTitle}>Deactivate Account</Text>
            <Text style={styles.dialogMessage}>
              Are you sure you want to deactivate the input account for <Text style={{ fontWeight: '700' }}>{name}</Text>?
              Farmers will no longer be able to select this input for new spray cycles.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for deactivation (optional)"
              placeholderTextColor={adminColors.placeholder}
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setConfirmModal('none')}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDestructiveBtn}
                onPress={handleConfirmDeactivate}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogDestructiveBtnText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal 2: Terminate Confirmation ─── */}
      <Modal
        visible={confirmModal === 'terminate'}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal('none')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogIconWrap}>
              <BanAlertIcon size={32} color="#DC2626" />
            </View>
            <Text style={styles.dialogTitle}>Terminate Input</Text>
            <Text style={styles.dialogMessage}>
              Terminating <Text style={{ fontWeight: '700' }}>{name}</Text> will permanently revoke approval across all zones and invalidate active farmer inventory linkages.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Termination justification (required)"
              placeholderTextColor={adminColors.placeholder}
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setConfirmModal('none')}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogDestructiveBtn,
                  !reasonInput.trim() && { opacity: 0.5 },
                ]}
                onPress={handleConfirmTerminate}
                disabled={!reasonInput.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogDestructiveBtnText}>Confirm Terminate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal 3: Delete Information Confirmation ─── */}
      <Modal
        visible={confirmModal === 'delete'}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal('none')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogIconWrap}>
              <TrashWarningIcon size={32} color="#DC2626" />
            </View>
            <Text style={styles.dialogTitle}>Delete Information</Text>
            <Text style={styles.dialogMessage}>
              Permanent action: this will delete all specification records, uploaded safety documents, and compliance logs for <Text style={{ fontWeight: '700' }}>{name}</Text>.
            </Text>

            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setConfirmModal('none')}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDestructiveBtn}
                onPress={handleConfirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogDestructiveBtnText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Informational & Alert Confirm Dialog (Image 2 Style) ─── */}
      {confirmDialog && (
        <AdminConfirmDialog
          visible={confirmDialog.visible}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          hideCancel={confirmDialog.hideCancel}
          destructive={confirmDialog.destructive}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived from Admin Theme & Image 1 & 2 ────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerPencilBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: 48,
  },

  // Section Heading
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5C3826',
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  // Table Card Structure (Image 1)
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: '#ECE5DE',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tableLabel: {
    fontSize: 13.5,
    color: '#6B7280',
    flex: 1,
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    flex: 1.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3ECE4',
  },
  statusApprovedText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  statusInactiveText: {
    color: '#6B7280',
  },

  // Documents Row (Image 1)
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  docInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  docSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  docViewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  docViewPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#EA580C',
  },

  // Timeline (Image 1)
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 2,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  timelineLine: {
    width: 1.5,
    height: 44,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineRightCol: {
    flex: 1,
    paddingBottom: 6,
  },
  timelineTimestamp: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  timelineSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },

  // Standard Bottom Actions (Image 1)
  standardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  editOutlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#78350F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOutlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
  },
  deactivateSolidBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#9E9892',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateSolidBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Super Admin Extra Access Section (Image 2)
  superAdminExtraSection: {
    marginTop: 10,
    gap: 12,
    marginBottom: 10,
  },
  deactivateAccountBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  deactivateAccountBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  terminateOutlineBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateOutlineBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteInfoOutlineBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteInfoOutlineBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Confirmation Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dialogCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...adminShadow.md,
  },
  dialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  dialogMessage: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  reasonInput: {
    width: '100%',
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: adminColors.ink,
    marginBottom: 16,
    backgroundColor: adminColors.canvas,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '700',
  },
  dialogDestructiveBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogDestructiveBtnText: {
    ...adminType.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
