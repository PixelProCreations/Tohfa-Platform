/** BR-160 / BR-171: pure UI <-> API mappers for addresses and area requests. */
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o.android ?? o.default },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path', Circle: 'Circle' }));
vi.mock('../assets/images/flying_delivery_bag.png', () => ({ default: 1 }));

import { toApiAddress, isValidPincode, formatAddressShort } from '../api/addresses';
import { mapAddressFieldErrors, validateAddressForm } from '../components/CustomerDeliveryAddressModal';
import {
  findAreaRequest,
  prefillFromAddress,
  toServiceAreaRequestInput,
  validateServiceAreaRequest,
} from '../components/ServiceAreaRequestFlow';

describe('BR-160 address mapper', () => {
  it('BR-160: maps flat/building/street -> line1, area/locality -> line2, Office -> OFFICE, strips ", India"', () => {
    expect(
      toApiAddress({
        flat: '4B',
        building: 'Lotus',
        street: 'Avinashi Rd',
        area: 'Peelamedu',
        locality: 'East',
        city: 'Coimbatore',
        state: 'Tamil Nadu, India',
        pincode: ' 641004 ',
        landmark: '',
        contactPhone: '+91 98765-43210',
        type: 'Office',
        isDefault: true,
        lat: 1,
        lng: 2,
      }),
    ).toEqual({
      label: 'OFFICE',
      line1: '4B, Lotus, Avinashi Rd',
      line2: 'Peelamedu, East',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      contactPhone: '+919876543210',
      lat: 1,
      lng: 2,
      isDefault: true,
    });
  });

  it('BR-160: omits line2/phone/coords when blank and defaults state', () => {
    const out = toApiAddress({ flat: '1', city: 'Erode', pincode: '638001', lat: 1, lng: null });
    expect(out).toEqual({ label: 'HOME', line1: '1', city: 'Erode', state: 'Tamil Nadu', pincode: '638001', isDefault: false });
  });

  it('BR-160: form validation and problem field mapping', () => {
    expect(isValidPincode('012345')).toBe(false);
    expect(validateAddressForm({ flat: '', city: '', pincode: '12' })).toEqual({
      pincode: expect.any(String),
      city: expect.any(String),
      flat: expect.any(String),
    });
    expect(validateAddressForm({ flat: '1', city: 'X', pincode: '641001', contactPhone: '9876543210' })).toEqual({});
    expect(mapAddressFieldErrors({ line1: 'a', 'body.line2': 'b', contactPhone: 'c', unknown: 'd' })).toEqual({
      flat: 'a',
      area: 'b',
      contactPhone: 'c',
    });
    expect(formatAddressShort({ line1: '12, MG Road', city: 'Coimbatore' })).toBe('12, MG Road, Coimbatore');
  });
});

describe('BR-171 area-request mapper', () => {
  const base = { area: 'RS Puram', locality: 'West', city: 'Coimbatore', pincode: '', contact: '' };

  it('BR-171: validates lengths and optional pincode/contact', () => {
    expect(validateServiceAreaRequest(base)).toEqual({});
    expect(validateServiceAreaRequest({ ...base, area: 'a', city: 'c'.repeat(81), pincode: '99', contact: '123' })).toEqual({
      area: expect.any(String),
      city: expect.any(String),
      pincode: expect.any(String),
      contact: expect.any(String),
    });
  });

  it('BR-171: builds the request body, normalising a phone contact and dropping blanks', () => {
    expect(toServiceAreaRequestInput(base)).toEqual({ area: 'RS Puram', locality: 'West', city: 'Coimbatore' });
    expect(toServiceAreaRequestInput({ ...base, pincode: '641002', contact: '98765 43210' })).toMatchObject({
      pincode: '641002',
      contact: '9876543210',
    });
    expect(toServiceAreaRequestInput({ ...base, contact: 'me@x.in' }).contact).toBe('me@x.in');
  });

  it('BR-171: prefill from a saved address and request lookup by pincode', () => {
    expect(
      prefillFromAddress({ line1: '12', line2: 'RS Puram, West', city: 'Coimbatore', pincode: '641002', contactPhone: null }),
    ).toEqual({ area: 'RS Puram', locality: 'West', city: 'Coimbatore', pincode: '641002', contact: '' });
    expect(prefillFromAddress({ line1: '12', line2: null, city: 'C', pincode: '641002', contactPhone: '9' }).area).toBe('12');
    const items = [
      { id: '1', pincode: '600001' },
      { id: '2', pincode: '641002' },
    ] as never;
    expect(findAreaRequest(items, '641002')?.id).toBe('2');
    expect(findAreaRequest(items, '999999')).toBeUndefined();
    expect(findAreaRequest([], '641002')).toBeUndefined();
  });
});
