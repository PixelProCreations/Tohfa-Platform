/**
 * Compliance Tier Thresholds Screen / Alert Threshold Config Screen
 * (SA-M2). One add/edit form: basic information, trigger condition, who is
 * notified, and active status.
 *
 * Ported from origin/Superadmin-main. There is no read or write endpoint for
 * alert thresholds in docs/openapi.yaml, so a new form opens empty (every
 * picker shows the no-value dash until chosen) and Save hands the form to the
 * host through `onSave`; with no `onSave`, or without a permission, Save is
 * drawn but disabled.
 */
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { adminColors } from '../../theme';
import { BackArrowIcon, CheckCircleIcon, ChevronDownIcon } from '../../components/AdminIcons';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  DESCRIPTION_MAX,
  NOTIFY_ROLE_OPTIONS,
  THRESHOLD_CODES,
  UNIT_OPTIONS,
  VALUE_OPTIONS,
  type LabelledOption,
} from './thresholdOptions';
import { complianceStyles as styles } from './complianceTierThresholdsStyles';

export interface AlertThresholdData {
  id?: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  thresholdValue: string;
  thresholdUnit: string;
  appliesTo: 'all' | 'specific';
  notifyRoles: string[];
  isActive: boolean;
}

export interface ComplianceTierThresholdsScreenProps {
  initialData?: AlertThresholdData | undefined;
  can: Can;
  onBack: () => void;
  onSave?: ((data: AlertThresholdData) => void) | undefined;
}

type MenuKey = 'category' | 'condition' | 'value' | 'unit';

/** The option's translated label, the raw stored text when it is not one of ours, else the dash. */
function labelFor(options: readonly LabelledOption[], value: string): string {
  if (value === '') return ADMIN_NO_VALUE;
  const hit = options.find((o) => o.value === value);
  return hit ? t(hit.labelKey) : value;
}

interface OptionMenuProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle> | undefined;
}

function OptionMenu({ visible, onClose, children, cardStyle }: OptionMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.menuCard, cardStyle]}>{children}</View>
      </TouchableOpacity>
    </Modal>
  );
}

interface SelectionMenuProps {
  visible: boolean;
  onClose: () => void;
  items: readonly { key: string; label: string }[];
  onPick: (key: string) => void;
}

function SelectionMenu({ visible, onClose, items, onPick }: SelectionMenuProps) {
  return (
    <OptionMenu visible={visible} onClose={onClose} cardStyle={styles.selectionMenuCard}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.selectionMenuItem}
          onPress={() => onPick(item.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectionMenuText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </OptionMenu>
  );
}

export function ComplianceTierThresholdsScreen({ initialData, can, onBack, onSave }: ComplianceTierThresholdsScreenProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [condition, setCondition] = useState(initialData?.condition ?? '');
  const [thresholdValue, setThresholdValue] = useState(initialData?.thresholdValue ?? '');
  const [thresholdUnit, setThresholdUnit] = useState(initialData?.thresholdUnit ?? '');
  const [appliesTo, setAppliesTo] = useState<'all' | 'specific'>(initialData?.appliesTo ?? 'all');
  const [notifyRoles, setNotifyRoles] = useState<string[]>(initialData?.notifyRoles ?? []);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);

  const toggleNotifyRole = (role: string) => {
    setNotifyRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const mayConfigure = can(THRESHOLD_CODES.alert) || can(THRESHOLD_CODES.tier);
  const complete =
    name.trim() !== '' &&
    description.trim() !== '' &&
    category !== '' &&
    condition !== '' &&
    thresholdValue !== '' &&
    thresholdUnit !== '' &&
    notifyRoles.length > 0;
  const saveEnabled = mayConfigure && complete && onSave !== undefined;

  const handleSave = () => {
    if (!saveEnabled || !onSave) return;
    onSave({
      ...(initialData?.id !== undefined ? { id: initialData.id } : {}),
      name,
      description,
      category,
      condition,
      thresholdValue,
      thresholdUnit,
      appliesTo,
      notifyRoles,
      isActive,
    });
    onBack();
  };

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.value === category) ?? CATEGORY_OPTIONS[0];
  const CategoryIconComponent = selectedCategory?.icon;
  const closeMenu = () => setOpenMenu(null);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saThresholds.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saThresholds.compliance.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('saThresholds.section.basic')}</Text>
        <View style={styles.sectionBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('saThresholds.field.name')}</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder={t('saThresholds.placeholder.name')}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('saThresholds.field.description')}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={DESCRIPTION_MAX}
              placeholder={t('saThresholds.placeholder.description')}
              placeholderTextColor={adminColors.placeholder}
            />
            <Text style={styles.charCounter}>
              {t('saThresholds.counter', { count: description.length, max: DESCRIPTION_MAX })}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('saThresholds.field.category')}</Text>
            <TouchableOpacity style={styles.dropdownBox} onPress={() => setOpenMenu('category')} activeOpacity={0.7}>
              <View style={styles.dropdownLeft}>
                {CategoryIconComponent ? <CategoryIconComponent size={18} color={adminColors.brand} /> : null}
                <Text style={styles.dropdownValue}>{labelFor(CATEGORY_OPTIONS, category)}</Text>
              </View>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('saThresholds.section.trigger')}</Text>
        <View style={styles.sectionBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('saThresholds.field.condition')}</Text>
            <TouchableOpacity style={styles.dropdownBox} onPress={() => setOpenMenu('condition')} activeOpacity={0.7}>
              <Text style={styles.dropdownValue}>{labelFor(CONDITION_OPTIONS, condition)}</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('saThresholds.field.value')}</Text>
            <View style={styles.sideBySideRow}>
              <TouchableOpacity
                style={[styles.dropdownBox, styles.flexHalf]}
                onPress={() => setOpenMenu('value')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{thresholdValue === '' ? ADMIN_NO_VALUE : thresholdValue}</Text>
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownBox, styles.flexHalf]}
                onPress={() => setOpenMenu('unit')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{labelFor(UNIT_OPTIONS, thresholdUnit)}</Text>
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('saThresholds.field.appliesTo')}</Text>
            <View style={styles.sideBySideRow}>
              {(
                [
                  { key: 'all', labelKey: 'saThresholds.applies.all' },
                  { key: 'specific', labelKey: 'saThresholds.applies.specific' },
                ] as const satisfies readonly { key: 'all' | 'specific'; labelKey: TranslationKey }[]
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.radioRow}
                  onPress={() => setAppliesTo(opt.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, appliesTo === opt.key && styles.radioOuterSelected]}>
                    {appliesTo === opt.key && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{t(opt.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('saThresholds.section.notify')}</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.fieldLabel}>{t('saThresholds.field.notifyTo')}</Text>
          <View style={styles.checkboxList}>
            {NOTIFY_ROLE_OPTIONS.map((role) => {
              const isChecked = notifyRoles.includes(role.value);
              return (
                <TouchableOpacity
                  key={role.value}
                  style={styles.checkboxCard}
                  onPress={() => toggleNotifyRole(role.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxOuter, isChecked && styles.checkboxOuterSelected]}>
                    {isChecked && <CheckCircleIcon size={14} color={adminColors.onBrand} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t(role.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('saThresholds.section.status')}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{t('saThresholds.field.status')}</Text>
          <View style={styles.switchWrapper}>
            <Text style={styles.switchStateText}>
              {isActive ? t('saThresholds.status.active') : t('saThresholds.status.inactive')}
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: adminColors.border, true: adminColors.brand }}
              thumbColor={adminColors.onBrand}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>{t('saThresholds.action.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, !saveEnabled && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!saveEnabled}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{t('saThresholds.action.save')}</Text>
        </TouchableOpacity>
      </View>

      <OptionMenu visible={openMenu === 'category'} onClose={closeMenu}>
        {CATEGORY_OPTIONS.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.categoryMenuItem, idx < CATEGORY_OPTIONS.length - 1 && styles.categoryMenuItemBorder]}
              onPress={() => {
                setCategory(item.value);
                closeMenu();
              }}
              activeOpacity={0.7}
            >
              <IconComp size={18} color={adminColors.brand} />
              <Text style={styles.categoryMenuText}>{t(item.labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </OptionMenu>

      <SelectionMenu
        visible={openMenu === 'condition'}
        onClose={closeMenu}
        items={CONDITION_OPTIONS.map((o) => ({ key: o.value, label: t(o.labelKey) }))}
        onPick={(key) => {
          setCondition(key);
          closeMenu();
        }}
      />
      <SelectionMenu
        visible={openMenu === 'value'}
        onClose={closeMenu}
        items={VALUE_OPTIONS.map((v) => ({ key: v, label: v }))}
        onPick={(key) => {
          setThresholdValue(key);
          closeMenu();
        }}
      />
      <SelectionMenu
        visible={openMenu === 'unit'}
        onClose={closeMenu}
        items={UNIT_OPTIONS.map((o) => ({ key: o.value, label: t(o.labelKey) }))}
        onPick={(key) => {
          setThresholdUnit(key);
          closeMenu();
        }}
      />
    </SafeAreaView>
  );
}
