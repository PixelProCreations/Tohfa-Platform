/**
 * Add Customer screen (POST /admin/customers).
 *
 * SA/TA only (customer.record.create). Design: origin/Superadmin-main
 * CustomerManagementFlow.tsx lines 1089–1405.
 *
 * The design's mock save (`CUS-${random}`) is replaced by a real API call.
 * The warehouse dropdown is populated from GET /warehouses when
 * warehouse.all.view is in scope; without it the field is hidden.
 *
 * customerType mapping: design shows Individual/B2B but the API accepts
 * RETAIL / B2B / HORECA. "Individual" → RETAIL.
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import { adminErrorKey } from '../../api/errors';
import { ApiError } from '../../../../shell/api/client';
import { useAdminMutation } from '../../api/hooks';
import {
  createCustomer,
  type CreateAdminCustomerBody,
  type CreateAdminCustomerResponseDto,
} from '../../api/customers';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Svg
        // @ts-expect-error – SVG Path child inside nested Svg (RN-SVG pattern)
        d="M15 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Svg
        // @ts-expect-error – SVG Path child inside nested Svg (RN-SVG pattern)
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomerTypeOption = 'Individual' | 'B2B' | 'HORECA';

function toApiCustomerType(opt: CustomerTypeOption): 'RETAIL' | 'B2B' | 'HORECA' {
  return opt === 'Individual' ? 'RETAIL' : opt;
}

export interface AddCustomerScreenProps {
  can?: Can | undefined;
  onBack?: (() => void) | undefined;
  /** Fires only after a real 201; carries the new customer's id. */
  onSuccess?: ((customerId: string) => void) | undefined;
}

const DENY_ALL: Can = () => false;
const MOBILE_PREFIX = '+91';

// ─── Component ────────────────────────────────────────────────────────────────

export function AddCustomerScreen({ can = DENY_ALL, onBack, onSuccess }: AddCustomerScreenProps) {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<CustomerTypeOption>('Individual');

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstin, setGstin] = useState('');
  const [bizAddressLine1, setBizAddressLine1] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [bizState, setBizState] = useState('');
  const [bizPinCode, setBizPinCode] = useState('');

  const [preferredWarehouseId, setPreferredWarehouseId] = useState<string | null>(null);
  const [_typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [warehouseMenuOpen, setWarehouseMenuOpen] = useState(false);

  const canViewWarehouses = can('warehouse.all.view');
  const warehouses = useWarehouseOptions({ enabled: canViewWarehouses, activeOnly: true });

  const preferredWarehouseName = warehouses.options.find((o) => o.warehouseId === preferredWarehouseId)?.warehouseName ?? t('addCustomer.field.warehouseNone');

  const mutation = useAdminMutation<CreateAdminCustomerBody, CreateAdminCustomerResponseDto>({
    mutationFn: createCustomer,
  });

  if (!can('customer.record.create')) {
    return (
      <View style={styles.root}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('addCustomer.title')}</Text>
          </View>
        </View>
        <View style={styles.permissionDenied}>
          <Text style={styles.permissionDeniedText}>{t('addCustomer.noPermission')}</Text>
        </View>
      </View>
    );
  }

  const cycleCustomerType = () => {
    const types: CustomerTypeOption[] = ['Individual', 'B2B', 'HORECA'];
    setCustomerType((prev) => {
      const idx = types.indexOf(prev);
      return types[(idx + 1) % types.length] ?? 'Individual';
    });
    setTypeMenuOpen(false);
  };

  const handleSave = () => {
    if (mutation.isPending) return;

    if (!customerName.trim()) {
      void import('react-native').then(({ Alert }) => Alert.alert('', t('addCustomer.validation.name')));
      return;
    }

    const digits = mobileNumber.replace(/\D/g, '');
    const mobileE164 = digits.startsWith('91') && digits.length === 12 ? `+${digits}` : `${MOBILE_PREFIX}${digits}`;
    if (digits.length < 10) {
      void import('react-native').then(({ Alert }) => Alert.alert('', t('addCustomer.validation.mobile')));
      return;
    }

    const isB2B = customerType !== 'Individual';
    if (isB2B && !businessName.trim()) {
      void import('react-native').then(({ Alert }) => Alert.alert('', t('addCustomer.validation.businessName')));
      return;
    }

    const body: CreateAdminCustomerBody = {
      name: customerName.trim(),
      mobile: mobileE164,
      email: email.trim() !== '' ? email.trim() : null,
      customerType: toApiCustomerType(customerType),
      businessName: businessName.trim() !== '' ? businessName.trim() : null,
      businessType: businessType.trim() !== '' ? businessType.trim() : null,
      gstin: gstin.trim() !== '' ? gstin.trim() : null,
      preferredWarehouseId: preferredWarehouseId,
      address:
        addressLine1.trim() !== ''
          ? {
              line1: addressLine1.trim(),
              line2: addressLine2.trim() !== '' ? addressLine2.trim() : null,
              city: city.trim() !== '' ? city.trim() : 'Ooty',
              state: stateName.trim() !== '' ? stateName.trim() : 'Tamil Nadu',
              pincode: pinCode.trim(),
            }
          : null,
      businessAddress:
        bizAddressLine1.trim() !== ''
          ? {
              line1: bizAddressLine1.trim(),
              city: bizCity.trim() !== '' ? bizCity.trim() : 'Ooty',
              state: bizState.trim() !== '' ? bizState.trim() : 'Tamil Nadu',
              pincode: bizPinCode.trim(),
            }
          : null,
    };

    mutation.mutate(body, {
      onSuccess: (res) => onSuccess?.(res.id),
    });
  };

  const customerTypeLabel =
    customerType === 'Individual' ? t('addCustomer.customerType.individual') : customerType === 'B2B' ? t('addCustomer.customerType.b2b') : t('addCustomer.customerType.horeca');

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="addCustGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#addCustGrad)" />
        </Svg>

        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('addCustomer.title')}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <Text style={styles.formSectionTitle}>{t('addCustomer.section.personal')}</Text>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>
            {t('addCustomer.field.name')} <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <TextInput style={styles.formInputBoxEditable} value={customerName} onChangeText={setCustomerName} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>
            {t('addCustomer.field.mobile')} <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <TextInput
            style={styles.formInputBoxEditable}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            placeholder="+91 …"
          />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.email')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.customerType')}</Text>
          <TouchableOpacity style={styles.formDropdownButton} onPress={cycleCustomerType} activeOpacity={0.7}>
            <Text style={styles.formDropdownText}>{customerTypeLabel}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <Text style={styles.formSectionTitle}>{t('addCustomer.section.address')}</Text>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.addressLine1')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={addressLine1} onChangeText={setAddressLine1} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.addressLine2')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={addressLine2} onChangeText={setAddressLine2} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.city')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={city} onChangeText={setCity} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.state')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={stateName} onChangeText={setStateName} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.pinCode')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={pinCode} onChangeText={setPinCode} keyboardType="number-pad" placeholder="" />
        </View>

        {/* Business information */}
        <Text style={styles.formSectionTitle}>{t('addCustomer.section.business')}</Text>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.businessName')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={businessName} onChangeText={setBusinessName} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.businessType')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={businessType} onChangeText={setBusinessType} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.gstin')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={gstin} onChangeText={setGstin} autoCapitalize="characters" placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.bizAddressLine1')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={bizAddressLine1} onChangeText={setBizAddressLine1} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.bizCity')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={bizCity} onChangeText={setBizCity} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.bizState')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={bizState} onChangeText={setBizState} placeholder="" />
        </View>

        <View style={styles.formFieldGroup}>
          <Text style={styles.formLabel}>{t('addCustomer.field.bizPinCode')}</Text>
          <TextInput style={styles.formInputBoxEditable} value={bizPinCode} onChangeText={setBizPinCode} keyboardType="number-pad" placeholder="" />
        </View>

        {/* Preferences */}
        <Text style={styles.formSectionTitle}>{t('addCustomer.section.preferences')}</Text>

        {canViewWarehouses && (
          <View style={styles.formFieldGroup}>
            <Text style={styles.formLabel}>{t('addCustomer.field.preferredWarehouse')}</Text>
            <TouchableOpacity
              style={styles.formDropdownButton}
              onPress={() => setWarehouseMenuOpen((o) => !o)}
              activeOpacity={0.7}
            >
              <Text style={styles.formDropdownText}>{preferredWarehouseName}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>
            {warehouseMenuOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setPreferredWarehouseId(null); setWarehouseMenuOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>{t('addCustomer.field.warehouseNone')}</Text>
                </TouchableOpacity>
                {warehouses.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.warehouseId}
                    style={[styles.dropdownItem, opt.warehouseId === preferredWarehouseId && styles.dropdownItemSelected]}
                    onPress={() => { setPreferredWarehouseId(opt.warehouseId); setWarehouseMenuOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, opt.warehouseId === preferredWarehouseId && styles.dropdownItemTextSelected]}>
                      {opt.warehouseName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.formHelperNote}>{t('addCustomer.helper.communicationPrefs')}</Text>
          </View>
        )}

        {mutation.error !== null && mutation.error !== undefined ? (
          <Text style={styles.errorText}>
            {mutation.error instanceof ApiError && mutation.error.problem.code === 'CONFLICT'
              ? t('addCustomer.error.conflict')
              : t(adminErrorKey(mutation.error))}
          </Text>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.addCustomerBottomBar}>
        <TouchableOpacity
          style={[styles.addCustomerSaveBtn, mutation.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={mutation.isPending}
        >
          <Text style={styles.addCustomerSaveText}>{mutation.isPending ? t('addCustomer.saving') : t('addCustomer.save')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addCustomerCancelBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.addCustomerCancelText}>{t('addCustomer.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles — mirrors customerStyles from origin/Superadmin-main ──────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: 16,
    backgroundColor: adminColors.brand,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 16,
    marginBottom: 8,
  },
  formFieldGroup: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  formInputBoxEditable: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  formDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
  },
  formDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  formHelperNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 4,
    ...adminShadow.sm,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemSelected: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  dropdownItemTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  addCustomerBottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  addCustomerSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.55,
  },
  addCustomerSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  addCustomerCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerCancelText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  errorText: {
    fontSize: 12.5,
    color: adminColors.danger.text,
    marginTop: 8,
    lineHeight: 17,
    fontWeight: '600',
  },
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: adminSpacing.lg,
  },
  permissionDeniedText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
});
