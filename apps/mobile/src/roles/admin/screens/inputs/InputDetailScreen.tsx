import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { Can } from '../../permissions/can';
import { BackArrowIcon, PencilEditIcon } from './inputsIcons';
import type { ApprovedInputItem } from './ApprovedInputsScreen';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { t } from '../../i18n';

export interface InputDetailScreenProps {
  inputItem?: ApprovedInputItem | undefined;
  onBack: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
  onTerminate?: () => void;
  onDelete?: () => void;
  can?: Can | undefined;
}

/**
 * One approved input. There is no inputs endpoint (inputs.catalog.manage has
 * no route), so every value comes from the item passed in or is the dash; the
 * status is never defaulted; the registration id, documents and approval
 * history have no source and are dashed; Deactivate / Terminate / Delete and
 * the document links are drawn and disabled (R3).
 */
export function InputDetailScreen({
  inputItem,
  onBack,
  onEdit,
  can,
}: InputDetailScreenProps): React.JSX.Element {
  const isElevatedAdmin = can ? (can('admin.decision.override') || can('system.config.manage')) : false;
  const [activeTab, setActiveTab] = useState<'basic' | 'composition' | 'documents' | 'history'>('basic');

  const name = inputItem?.name || ADMIN_NO_VALUE;
  const code = inputItem?.code || ADMIN_NO_VALUE;
  const status = inputItem?.status || ADMIN_NO_VALUE;
  const isApproved = status === 'Approved';

  const category = inputItem?.category || ADMIN_NO_VALUE;
  const manufacturer = inputItem?.manufacturer || ADMIN_NO_VALUE;
  // No registration id is stored anywhere; it is not derived from the code.
  const registrationId = ADMIN_NO_VALUE;

  const composition = inputItem?.method || ADMIN_NO_VALUE;
  const applicableCrops = inputItem?.applicableCrops
    ? inputItem.applicableCrops.replace(/^Applicable:\s*/, '')
    : ADMIN_NO_VALUE;

  const dosage = inputItem?.usage || ADMIN_NO_VALUE;
  const applicationMethod = inputItem?.frequency || ADMIN_NO_VALUE;

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
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

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>{name}</Text>
            {!isElevatedAdmin && (
              <Text style={styles.headerSubtitle}>
                {code} · {status}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.headerPencilBtn, !onEdit && styles.actionUnavailable]}
            onPress={onEdit}
            disabled={!onEdit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit Input"
          >
            <PencilEditIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontal Segmented Pills */}
        {!isElevatedAdmin && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScrollView}
            contentContainerStyle={styles.pillsScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.pillBtn,
                activeTab === 'basic' && styles.pillBtnActive,
              ]}
              onPress={() => setActiveTab('basic')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  activeTab === 'basic' && styles.pillTextActive,
                ]}
              >
                Basic Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillBtn,
                activeTab === 'composition' && styles.pillBtnActive,
              ]}
              onPress={() => setActiveTab('composition')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  activeTab === 'composition' && styles.pillTextActive,
                ]}
              >
                Composition & Usage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillBtn,
                activeTab === 'documents' && styles.pillBtnActive,
              ]}
              onPress={() => setActiveTab('documents')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  activeTab === 'documents' && styles.pillTextActive,
                ]}
              >
                Documents
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillBtn,
                activeTab === 'history' && styles.pillBtnActive,
              ]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  activeTab === 'history' && styles.pillTextActive,
                ]}
              >
                Approval & History
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {(isElevatedAdmin || activeTab === 'basic' || activeTab === 'composition') && (
          <>
            {/* Section 1: Basic Information */}
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

            {/* Section 2: Composition & Usage */}
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
          </>
        )}

        {activeTab === 'documents' && (
          <>
            <Text style={styles.sectionHeading}>Supporting Documents</Text>
            <View style={styles.tableCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Safety Data Sheet (MSDS)</Text>
                <TouchableOpacity disabled style={styles.actionUnavailable} accessibilityRole="button" accessibilityState={{ disabled: true }}>
                  <Text style={styles.linkText}>View PDF</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>NPOP Organic Certificate</Text>
                <TouchableOpacity disabled style={styles.actionUnavailable} accessibilityRole="button" accessibilityState={{ disabled: true }}>
                  <Text style={styles.linkText}>View PDF</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Usage Label Spec</Text>
                <TouchableOpacity disabled style={styles.actionUnavailable} accessibilityRole="button" accessibilityState={{ disabled: true }}>
                  <Text style={styles.linkText}>View PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text style={styles.sectionHeading}>Approval & History</Text>
            <View style={styles.tableCard}>
              {/* No approval history endpoint exists. */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>{ADMIN_NO_VALUE}</Text>
                <Text style={styles.tableValue}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>
          </>
        )}

        {/* Elevated Actions for Super Admin */}
        {isElevatedAdmin && (
          <View style={styles.superAdminActionsWrap}>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.inputs.actionsUnavailable')}</Text>
            <TouchableOpacity
              style={[styles.deactivateAccountBtn, styles.actionUnavailable]}
              disabled
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.deactivateAccountBtnText}>Deactivate account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.outlineActionBtn, styles.actionUnavailable]}
              disabled
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.outlineActionBtnText}>Terminate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.outlineActionBtn, styles.actionUnavailable]}
              disabled
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.outlineActionBtnText}>Delete Information</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isElevatedAdmin && <View style={{ height: 90 }} />}
      </ScrollView>

      {/* Pinned Bottom Edit / Deactivate Bar */}
      {!isElevatedAdmin && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.editBtn, !onEdit && styles.actionUnavailable]}
            onPress={onEdit}
            disabled={!onEdit}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deactivateBtn, styles.actionUnavailable]}
            disabled
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
          >
            <Text style={styles.deactivateBtnText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  headerPencilBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  pillsScrollView: {
    marginBottom: adminSpacing.md,
  },
  pillsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: adminSpacing.md,
  },
  pillBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  pillText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  pillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs + 2,
    paddingHorizontal: 2,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tableLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    flex: 1,
  },
  tableValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1.3,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  statusApprovedText: {
    color: adminColors.success.text,
  },
  statusInactiveText: {
    color: adminColors.muted,
  },
  linkText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: adminSpacing.lg + 4,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  deactivateBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  superAdminActionsWrap: {
    marginTop: adminSpacing.lg,
    gap: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
  deactivateAccountBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateAccountBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  outlineActionBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
});
