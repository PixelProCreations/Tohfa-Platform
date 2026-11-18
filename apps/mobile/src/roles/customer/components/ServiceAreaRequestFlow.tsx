/**
 * Unserved area -> request area -> request received (BR-171, Figma 46:34706,
 * 46:34925, 46:35103).
 *
 *  - `ServiceAreaRequestModal`: the three-step sheet (unserved notice, "Tell us
 *    your doorstep" form, "We've got your request"). Posts
 *    `POST /service-area-requests` (201 new / 200 repeat are both success).
 *  - `ServiceAreaRequestCard`: Home card. Shown only when the default address
 *    pincode is NOT serviceable (`GET /serviceability`); the "requested" state
 *    is derived from `GET /service-area-requests/me`, never a local flag.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { customerFonts, customerShadow } from '../theme';
import {
  serviceabilityQueryKeys,
  useCreateServiceAreaRequest,
  useMyServiceAreaRequests,
  useServiceability,
  type CreateServiceAreaRequestInput,
  type ServiceAreaRequest,
} from '../api/serviceability';
import { isValidPincode, normalizeContactPhone, type CustomerAddress } from '../api/addresses';
import { mapProblem } from '../api/problem';
import flyingDeliveryBag from '../assets/images/flying_delivery_bag.png';
import { t } from '../../../i18n/customer';

export interface ServiceAreaPrefill {
  area?: string | undefined;
  locality?: string | undefined;
  city?: string | undefined;
  pincode?: string | undefined;
  contact?: string | undefined;
}

type FormField = 'area' | 'locality' | 'city' | 'pincode' | 'contact';
export type ServiceAreaFormErrors = Partial<Record<FormField, string>>;
export type ServiceAreaFields = Record<FormField, string>;

/** Client-side mirror of `CreateServiceAreaRequest` (area/locality 2..120, city 2..80, contact 5..120). */
export function validateServiceAreaRequest(f: ServiceAreaFields): ServiceAreaFormErrors {
  const e: ServiceAreaFormErrors = {};
  const len = (s: string) => s.trim().length;
  if (len(f.area) < 2 || len(f.area) > 120) e.area = t('customer.serviceArea.error.area');
  if (len(f.locality) < 2 || len(f.locality) > 120) e.locality = t('customer.serviceArea.error.locality');
  if (len(f.city) < 2 || len(f.city) > 80) e.city = t('customer.serviceArea.error.city');
  if (f.pincode.trim() && !isValidPincode(f.pincode)) e.pincode = t('customer.serviceArea.error.pincode');
  if (f.contact.trim() && (len(f.contact) < 5 || len(f.contact) > 120)) e.contact = t('customer.serviceArea.error.contact');
  return e;
}

export function toServiceAreaRequestInput(f: ServiceAreaFields): CreateServiceAreaRequestInput {
  const contact = f.contact.trim();
  return {
    area: f.area.trim(),
    locality: f.locality.trim(),
    city: f.city.trim(),
    ...(f.pincode.trim() ? { pincode: f.pincode.trim() } : {}),
    ...(contact ? { contact: normalizeContactPhone(contact) ?? contact } : {}),
  };
}

/** Request-form prefill from a saved address (line2 = "area, locality", see api/addresses.ts). */
export function prefillFromAddress(
  a: Pick<CustomerAddress, 'line1' | 'line2' | 'city' | 'pincode' | 'contactPhone'> | undefined,
): ServiceAreaPrefill {
  if (!a) return {};
  const [area, ...rest] = (a.line2 ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    area: area ?? a.line1,
    locality: rest.join(', ') || area || '',
    city: a.city,
    pincode: a.pincode,
    contact: a.contactPhone ?? '',
  };
}

/** The customer's request for this pincode (or the latest one when no pincode is known). */
export function findAreaRequest(
  items: readonly ServiceAreaRequest[] | undefined,
  pincode: string | undefined,
): ServiceAreaRequest | undefined {
  if (!items || items.length === 0) return undefined;
  return pincode ? items.find((r) => r.pincode === pincode) : items[0];
}

const CheckCircle = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} fill="#FFFFFF" />
    <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#00C853" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#2563EB" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type ServiceAreaStep = 'unserved' | 'form' | 'received';

export interface ServiceAreaRequestModalProps {
  visible: boolean;
  initialStep?: ServiceAreaStep;
  prefill?: ServiceAreaPrefill | undefined;
  onClose: () => void;
  /** "Continue" on the unserved / received step (onboarding proceeds to the market). */
  onContinue?: () => void;
  /** Fired with the API's request (new or repeat) once it has been accepted. */
  onRequested?: (request: ServiceAreaRequest) => void;
}

export const ServiceAreaRequestModal: React.FC<ServiceAreaRequestModalProps> = ({
  visible,
  initialStep = 'form',
  prefill,
  onClose,
  onContinue,
  onRequested,
}) => {
  const qc = useQueryClient();
  const createRequest = useCreateServiceAreaRequest();
  const [step, setStep] = useState<ServiceAreaStep>(initialStep);
  const [area, setArea] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<ServiceAreaFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep(initialStep);
    setArea(prefill?.area ?? '');
    setLocality(prefill?.locality ?? '');
    setCity(prefill?.city ?? '');
    setPincode(prefill?.pincode ?? '');
    setContact(prefill?.contact ?? '');
    setErrors({});
    setFormError(null);
    // Re-seed only when the sheet opens.
  }, [visible]);

  if (!visible) return null;

  const submitting = createRequest.isPending;

  const handleSubmit = async () => {
    if (submitting) return;
    const fields = { area, locality, city, pincode, contact };
    const v = validateServiceAreaRequest(fields);
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length > 0) return;
    try {
      // 201 (new) and 200 (repeat for the same area) both resolve here.
      const created = await createRequest.mutateAsync(toServiceAreaRequestInput(fields));
      qc.setQueryData<ServiceAreaRequest[]>(serviceabilityQueryKeys.myRequests, (prev) => [
        created,
        ...(prev ?? []).filter((r) => r.id !== created.id),
      ]);
      setStep('received');
      onRequested?.(created);
    } catch (err) {
      const p = mapProblem(err);
      if (p.silent) return;
      setErrors(p.fieldErrors as ServiceAreaFormErrors);
      setFormError(p.message);
    }
  };

  const continueOrClose = () => (onContinue ? onContinue() : onClose());

  const input = (
    field: FormField,
    placeholder: string,
    value: string,
    onChange: (s: string) => void,
    extra?: Partial<React.ComponentProps<typeof TextInput>>,
  ) => (
    <View>
      <TextInput
        testID={`area-request-${field}`}
        style={styles.underlineInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={(s) => {
          onChange(s);
          if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
        }}
        editable={!submitting}
        {...extra}
      />
      {errors[field] ? <Text style={styles.fieldError}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn} accessibilityLabel={t('customer.serviceArea.close')}>
            <CloseIcon />
          </TouchableOpacity>

          {step === 'unserved' ? (
            <View testID="area-unserved">
              <Image source={flyingDeliveryBag} style={styles.heroImage} resizeMode="contain" />
              <Text style={styles.title}>{t('customer.serviceArea.unserved.title')}</Text>
              <Text style={styles.subtitle}>{t('customer.serviceArea.unserved.body')}</Text>
              <TouchableOpacity testID="area-request-start" activeOpacity={0.85} onPress={() => setStep('form')} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{t('customer.serviceArea.unserved.request')}</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="area-continue-browsing" activeOpacity={0.85} onPress={continueOrClose} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>{t('customer.serviceArea.unserved.browse')}</Text>
              </TouchableOpacity>
            </View>
          ) : step === 'form' ? (
            <View testID="area-request-form">
              <Text style={styles.title}>{t('customer.serviceArea.form.title')}</Text>
              <Text style={styles.subtitle}>{t('customer.serviceArea.form.body')}</Text>
              {input('area', t('customer.serviceArea.form.area'), area, setArea)}
              {input('locality', t('customer.serviceArea.form.locality'), locality, setLocality)}
              {input('city', t('customer.serviceArea.form.city'), city, setCity)}
              {input('pincode', t('customer.serviceArea.form.pincode'), pincode, (s) => setPincode(s.replace(/\D/g, '').slice(0, 6)), {
                keyboardType: 'number-pad',
                maxLength: 6,
              })}
              {input('contact', t('customer.serviceArea.form.contact'), contact, setContact)}
              {formError ? (
                <Text testID="area-request-error" style={styles.formError}>
                  {formError}
                </Text>
              ) : null}
              <TouchableOpacity
                testID="area-request-submit"
                activeOpacity={0.85}
                onPress={() => void handleSubmit()}
                disabled={submitting}
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
              >
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{t('customer.serviceArea.form.submit')}</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View testID="area-request-received">
              <View style={styles.doneBadge}>
                <CheckCircle />
                <Text style={styles.doneText}>{t('customer.serviceArea.received.badge')}</Text>
              </View>
              <Text style={styles.subtitle}>{t('customer.serviceArea.received.body')}</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={continueOrClose} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{t('customer.common.continue')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export interface ServiceAreaRequestCardProps {
  /** Default address pincode; the card is hidden until serviceability says `serviceable: false`. */
  pincode?: string | undefined;
  prefill?: ServiceAreaPrefill | undefined;
}

/** Home "We're not in your area yet" card, driven by serviceability + the customer's own requests. */
export const ServiceAreaRequestCard: React.FC<ServiceAreaRequestCardProps> = ({ pincode, prefill }) => {
  const serviceability = useServiceability({ pincode });
  const unserved = serviceability.data?.serviceable === false;
  const myRequests = useMyServiceAreaRequests(unserved);
  const [showModal, setShowModal] = useState(false);

  if (!unserved) return null;
  const request = findAreaRequest(myRequests.data, pincode);

  return (
    <>
      <View testID="area-request-card" style={[styles.areaCard, customerShadow.subtle]}>
        <View style={styles.areaLeft}>
          <Text style={styles.areaTitle}>{t('customer.serviceArea.unserved.title')}</Text>
          <Text style={styles.areaSubtitle}>{t('customer.serviceArea.card.body')}</Text>
          {request ? (
            <View testID="area-request-done" style={styles.requestDoneButton}>
              <CheckCircle />
              <Text style={styles.requestDoneText}>{t('customer.serviceArea.received.badge')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              testID="area-request-now"
              activeOpacity={0.85}
              onPress={() => setShowModal(true)}
              style={styles.requestNowButton}
            >
              <Text style={styles.requestNowText}>{t('customer.serviceArea.card.requestNow')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.areaRight}>
          <Image source={flyingDeliveryBag} style={styles.areaBagImage} resizeMode="contain" />
        </View>
      </View>
      <ServiceAreaRequestModal
        visible={showModal}
        initialStep="form"
        prefill={{ pincode, ...prefill }}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // Home card (moved from HomeScreen, Figma 46:34706 card variant)
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  areaLeft: { flex: 1, paddingRight: 10 },
  areaTitle: { fontFamily: customerFonts.editorial, fontSize: 19, color: '#1F2937', marginBottom: 4 },
  areaSubtitle: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: '#6B7280', marginBottom: 12 },
  requestNowButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3D29',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  requestNowText: { fontFamily: customerFonts.bold, fontSize: 12, color: '#FFFFFF' },
  requestDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#00C853',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  requestDoneText: { fontFamily: customerFonts.bold, fontSize: 12, color: '#FFFFFF' },
  areaRight: { width: 94, height: 88, alignItems: 'center', justifyContent: 'center' },
  areaBagImage: { width: 90, height: 84 },

  // Sheet (moved from HomeScreen "Tell us your doorstep" modal)
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    zIndex: 10,
  },
  heroImage: { width: 110, height: 96, alignSelf: 'center', marginBottom: 8 },
  title: { fontFamily: customerFonts.editorial, fontSize: 20, color: '#1F2937', textAlign: 'center', marginBottom: 6 },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
    fontSize: 13,
    color: '#1F2937',
    fontFamily: customerFonts.regular,
    marginBottom: 10,
  },
  fieldError: { fontFamily: customerFonts.regular, fontSize: 11, color: '#DC2626', marginTop: -6, marginBottom: 8 },
  formError: { fontFamily: customerFonts.regular, fontSize: 12, color: '#DC2626', textAlign: 'center', marginBottom: 10 },
  primaryBtn: {
    height: 44,
    backgroundColor: '#2D6A4F',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.7 },
  primaryText: { fontFamily: customerFonts.bold, fontSize: 14, color: '#FFFFFF', letterSpacing: 0.2 },
  secondaryBtn: { height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  secondaryText: { fontFamily: customerFonts.semibold, fontSize: 13, color: '#2D6A4F' },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#00C853',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 12,
  },
  doneText: { fontFamily: customerFonts.bold, fontSize: 13, color: '#FFFFFF' },
});
