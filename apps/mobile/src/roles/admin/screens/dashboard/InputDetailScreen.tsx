import React, { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ApprovedInputItem } from './ApprovedInputsScreen';

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

export interface InputDetailScreenProps {
  inputItem?: ApprovedInputItem | undefined;
  onBack: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
}

export function InputDetailScreen({
  inputItem,
  onBack,
  onEdit,
  onDeactivate,
}: InputDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'composition' | 'documents' | 'history'>('basic');
  const [isDeactivated, setIsDeactivated] = useState(false);

  // Derive display values matching Image 5 reference or passed item
  const name = inputItem?.name || 'Neem Oil Concentrate';
  const code = inputItem?.code || 'IN-0041';
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
      : (inputItem.method || 'Organic botanical extract');

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
      Alert.alert('Edit Input', `Editing form for ${name} opened.`);
    }
  };

  const handleDeactivate = () => {
    if (onDeactivate) {
      onDeactivate();
    } else {
      Alert.alert(
        isDeactivated ? 'Activate Input' : 'Deactivate Input',
        isDeactivated
          ? `Are you sure you want to activate ${name}?`
          : `Are you sure you want to deactivate ${name}? It will be marked as Inactive.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isDeactivated ? 'Activate' : 'Deactivate',
            style: isDeactivated ? 'default' : 'destructive',
            onPress: () => setIsDeactivated(!isDeactivated),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Image 5) ─── */}
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
            <Text style={styles.headerSubtitle}>
              {code} · {status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Horizontal Segmented Pills (Image 1 reference) ─── */}
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

        {(activeTab === 'basic' || activeTab === 'composition') && (
          <>
            {/* ─── Section 1: Basic Information ─── */}
            <Text style={styles.sectionHeading}>Basic Information</Text>
            <View style={styles.tableCard}>
              {/* Row 1: Input name */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Input name</Text>
                <Text style={styles.tableValue}>{name}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 2: Category */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Category</Text>
                <Text style={styles.tableValue}>{category}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 3: Manufacturer / supplier */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Manufacturer / supplier</Text>
                <Text style={styles.tableValue}>{manufacturer}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 4: Registration ID */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Registration ID</Text>
                <Text style={styles.tableValue}>{registrationId}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 5: Record status */}
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
              {/* Row 1: Composition */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Composition</Text>
                <Text style={styles.tableValue}>{composition}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 2: Applicable crops */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Applicable crops</Text>
                <Text style={styles.tableValue}>{applicableCrops}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 3: Dosage */}
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Dosage</Text>
                <Text style={styles.tableValue}>{dosage}</Text>
              </View>
              <View style={styles.divider} />

              {/* Row 4: Application method */}
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
                <TouchableOpacity onPress={() => Alert.alert('Document', 'Opening MSDS PDF')}>
                  <Text style={styles.linkText}>View PDF</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>NPOP Organic Certificate</Text>
                <TouchableOpacity onPress={() => Alert.alert('Document', 'Opening Certificate PDF')}>
                  <Text style={styles.linkText}>View PDF</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Usage Label Spec</Text>
                <TouchableOpacity onPress={() => Alert.alert('Document', 'Opening Label PDF')}>
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
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>11 Oct 2026</Text>
                <Text style={styles.tableValue}>Approved by Priya Nair</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>08 Oct 2026</Text>
                <Text style={styles.tableValue}>Submitted by GreenGro Organics</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>01 Oct 2026</Text>
                <Text style={styles.tableValue}>Draft created by Agronomy team</Text>
              </View>
            </View>
          </>
        )}

        {/* Space for bottom fixed bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Actions Bar (Image 5) ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={handleDeactivate}
          activeOpacity={0.8}
        >
          <Text style={styles.deactivateBtnText}>
            {isDeactivated ? 'Activate' : 'Deactivate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles Strictly Derived from Admin Theme ─────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner (Image 5)
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
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
    fontWeight: '500',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Horizontal Segmented Pills (Image 1 reference)
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
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#D8D1C9',
  },
  pillBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  pillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },

  // Section Heading
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs + 2,
    paddingHorizontal: 2,
  },

  // Table Card Structure (Image 5)
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
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
    fontSize: 13,
    color: adminColors.muted,
    flex: 1,
  },
  tableValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  statusApprovedText: {
    color: '#059669',
  },
  statusInactiveText: {
    color: '#6B7280',
  },
  linkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Fixed Bottom Bar (Image 5)
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
    backgroundColor: 'rgba(247, 244, 240, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#EDE7E1',
  },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: '#7A2E14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7A2E14',
  },
  deactivateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#9E978E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});

