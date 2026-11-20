/**
 * BR-160 (address book) / BR-171 (serviceability + area requests):
 * address modal, map screen and the unserved -> request-area flow against a
 * stubbed API client.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', async () => {
  const R = await import('react');
  return {
    ActivityIndicator: 'ActivityIndicator',
    Animated: {
      Value: class {
        interpolate() {
          return 0;
        }
      },
      View: 'AnimatedView',
      loop: () => ({ start: () => undefined, stop: () => undefined }),
      timing: () => ({}),
    },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Easing: { linear: (x: number) => x },
    Image: 'Image',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Linking: { openSettings: vi.fn(async () => undefined) },
    Modal: (props: { visible?: boolean; children?: React.ReactNode }) =>
      props.visible ? R.createElement('Modal', null, props.children) : null,
    PermissionsAndroid: {
      PERMISSIONS: {
        ACCESS_FINE_LOCATION: 'fine',
        ACCESS_COARSE_LOCATION: 'coarse',
        POST_NOTIFICATIONS: 'notif',
      },
      RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
      request: vi.fn(async () => 'granted'),
    },
    Platform: { OS: 'android', Version: 34, select: (o: Record<string, unknown>) => o.android ?? o.default },
    ScrollView: 'ScrollView',
    StatusBar: 'StatusBar',
    StyleSheet: { create: (s: Record<string, unknown>) => s },
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
  };
});
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path', Circle: 'Circle' }));
vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
  FarmBoundaryMap: 'FarmBoundaryMap',
}));
vi.mock('../assets/images/satellite_map_coimbatore.jpg', () => ({ default: 1 }));
vi.mock('../assets/images/flying_delivery_bag.png', () => ({ default: 2 }));

const geo = vi.hoisted(() => ({
  getCurrentPosition: vi.fn(),
  requestAuthorization: vi.fn(),
}));
vi.mock('@react-native-community/geolocation', () => ({ default: geo, ...geo }));

import { PermissionsAndroid } from 'react-native';
import { api, ApiError, NetworkError } from '../../../shell/api/client';
import { CustomerDeliveryAddressModal } from '../components/CustomerDeliveryAddressModal';
import { ServiceAreaRequestCard, ServiceAreaRequestModal } from '../components/ServiceAreaRequestFlow';
import { CustomerAddAddressScreen } from '../screens/CustomerAddAddressScreen';
import type { CustomerAddress } from '../api/addresses';

const created: CustomerAddress = {
  id: 'a1',
  label: 'OFFICE',
  line1: '12, Green Towers, MG Road',
  line2: 'RS Puram, West',
  city: 'Coimbatore',
  district: null,
  state: 'Tamil Nadu',
  pincode: '641002',
  lat: null,
  lng: null,
  landmark: null,
  contactPhone: '9876543210',
  nearestPickupPointId: 'pp-1',
  isDefault: true,
  createdAt: '2026-11-17T00:00:00Z',
  updatedAt: null,
};

const problem = (status: number, code: string, errors?: Record<string, string[]>) =>
  new ApiError({ type: 'about:blank', title: code, status, code, ...(errors ? { errors } : {}) } as never);

let qc: QueryClient;
let getMock: ReturnType<typeof vi.fn>;
let postMock: ReturnType<typeof vi.fn>;

function stubApi(opts: {
  serviceable?: boolean;
  serviceabilityFails?: boolean;
  pickupPoints?: unknown[];
  myRequests?: unknown[];
  post?: (path: string, body: unknown) => Promise<unknown>;
}) {
  getMock = vi.fn(async (path: string) => {
    if (path.startsWith('/serviceability')) {
      if (opts.serviceabilityFails) throw new NetworkError(new Error('offline'));
      return { serviceable: opts.serviceable ?? true, deliveryAvailable: opts.serviceable ?? true, nearestPickupPointId: 'pp-1' };
    }
    if (path.startsWith('/pickup-points')) return { items: opts.pickupPoints ?? [] };
    if (path === '/service-area-requests/me') return { items: opts.myRequests ?? [] };
    if (path === '/customers/me/addresses') return { items: [] };
    return {};
  });
  postMock = vi.fn(async (path: string, body: unknown) => {
    if (opts.post) return opts.post(path, body);
    if (path === '/customers/me/addresses') return created;
    return {};
  });
  vi.spyOn(api, 'get').mockImplementation(getMock as never);
  vi.spyOn(api, 'post').mockImplementation(postMock as never);
}

const flush = async () => {
  for (let i = 0; i < 6; i++) await act(async () => new Promise((r) => setTimeout(r, 0)));
};

function render(ui: React.ReactElement) {
  let root!: renderer.ReactTestRenderer;
  act(() => {
    root = renderer.create(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  });
  return root;
}

const byId = (root: renderer.ReactTestRenderer, id: string) => root.root.findByProps({ testID: id });
const hasId = (root: renderer.ReactTestRenderer, id: string) => root.root.findAllByProps({ testID: id }).length > 0;
const type = (root: renderer.ReactTestRenderer, id: string, text: string) =>
  act(() => {
    byId(root, id).props.onChangeText(text);
  });
const press = async (root: renderer.ReactTestRenderer, id: string) => {
  await act(async () => {
    byId(root, id).props.onPress();
  });
  await flush();
};
const text = (root: renderer.ReactTestRenderer) => JSON.stringify(root.toJSON());

function fillValidForm(root: renderer.ReactTestRenderer) {
  type(root, 'address-pincode', '641002');
  type(root, 'address-city', 'Coimbatore');
  type(root, 'address-area', 'RS Puram');
  type(root, 'address-locality', 'West');
  type(root, 'address-street', 'MG Road');
  type(root, 'address-flat', '12');
  type(root, 'address-building', 'Green Towers');
  type(root, 'address-contactPhone', '98765 43210');
}

beforeEach(() => {
  vi.restoreAllMocks();
  geo.getCurrentPosition.mockReset();
  geo.requestAuthorization.mockReset();
  (PermissionsAndroid.request as ReturnType<typeof vi.fn>).mockReset();
  (PermissionsAndroid.request as ReturnType<typeof vi.fn>).mockResolvedValue('granted');
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
});

describe('BR-160 address form (CustomerDeliveryAddressModal)', () => {
  it('BR-160: saves via POST /customers/me/addresses with the documented mapping and returns the created address', async () => {
    stubApi({ serviceable: true, pickupPoints: [{ id: 'pp-9', name: 'Gandhipuram Market', distanceKm: 1.2 }] });
    const onSave = vi.fn();
    const onClose = vi.fn();
    const root = render(
      <CustomerDeliveryAddressModal
        visible
        initialStep="addAddress"
        onClose={onClose}
        onSaveAddress={onSave}
        coords={{ lat: 11.01, lng: 76.95 }}
      />,
    );
    await flush();
    fillValidForm(root);
    await act(async () => {
      byId(root, 'market-pp-9').props.onPress();
    });
    await press(root, 'address-save');

    expect(getMock).toHaveBeenCalledWith('/serviceability?pincode=641002&lat=11.01&lng=76.95', expect.anything());
    const [path, body] = postMock.mock.calls.find((c) => c[0] === '/customers/me/addresses')!;
    expect(path).toBe('/customers/me/addresses');
    expect(body).toEqual({
      label: 'HOME',
      line1: '12, Green Towers, MG Road',
      line2: 'RS Puram, West',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641002',
      contactPhone: '9876543210',
      lat: 11.01,
      lng: 76.95,
      nearestPickupPointId: 'pp-9',
      isDefault: false,
    });
    expect(onSave).toHaveBeenCalledWith(created, expect.objectContaining({ serviceable: true }));
    expect(onClose).toHaveBeenCalled();
  });

  it('BR-160: blocks save on invalid pincode / missing door no / bad phone without calling the API', async () => {
    stubApi({});
    const onSave = vi.fn();
    const root = render(
      <CustomerDeliveryAddressModal visible initialStep="addAddress" onClose={vi.fn()} onSaveAddress={onSave} />,
    );
    await flush();
    type(root, 'address-pincode', '0123');
    type(root, 'address-contactPhone', '12');
    await press(root, 'address-save');
    const out = text(root);
    expect(out).toContain('Enter a valid 6-digit pincode');
    expect(out).toContain('Enter your city');
    expect(out).toContain('Enter flat / door no');
    expect(out).toContain('Enter a valid phone number');
    expect(postMock).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('BR-160: maps 422 VALIDATION_FAILED field errors onto the form (line1 -> door no, pincode)', async () => {
    stubApi({
      post: async () => {
        throw problem(422, 'VALIDATION_FAILED', { 'body.line1': ['Too long'], 'body.pincode': ['Not deliverable'] });
      },
    });
    const onSave = vi.fn();
    const root = render(
      <CustomerDeliveryAddressModal visible initialStep="addAddress" onClose={vi.fn()} onSaveAddress={onSave} />,
    );
    await flush();
    fillValidForm(root);
    await press(root, 'address-save');
    const out = text(root);
    expect(out).toContain('Too long');
    expect(out).toContain('Not deliverable');
    expect(out).toContain('Please check the highlighted details');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('BR-160: shows the network message and keeps the form when offline', async () => {
    stubApi({
      serviceabilityFails: true,
      post: async () => {
        throw new NetworkError(new Error('offline'));
      },
    });
    const onSave = vi.fn();
    const root = render(
      <CustomerDeliveryAddressModal visible initialStep="addAddress" onClose={vi.fn()} onSaveAddress={onSave} />,
    );
    await flush();
    fillValidForm(root);
    await press(root, 'address-save');
    expect(hasId(root, 'address-form-error')).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
    expect(byId(root, 'address-pincode').props.value).toBe('641002');
  });

  it('BR-171: reports serviceable=false so the caller can start the area-request flow', async () => {
    stubApi({ serviceable: false });
    const onSave = vi.fn();
    const root = render(
      <CustomerDeliveryAddressModal visible initialStep="addAddress" onClose={vi.fn()} onSaveAddress={onSave} />,
    );
    await flush();
    fillValidForm(root);
    await press(root, 'address-save');
    expect(onSave).toHaveBeenCalledWith(created, expect.objectContaining({ serviceable: false }));
    // nearest market falls back to the serviceability answer
    const body = postMock.mock.calls.find((c) => c[0] === '/customers/me/addresses')![1];
    expect(body.nearestPickupPointId).toBe('pp-1');
  });
});

describe('BR-171 unserved area -> request area -> received', () => {
  it('BR-171: submits POST /service-area-requests and shows "We\'ve got your request"', async () => {
    stubApi({
      post: async (_p, body) => ({ id: 'r1', ...(body as object), pincode: '641002', status: 'NEW', createdAt: 'x' }),
    });
    const onContinue = vi.fn();
    const root = render(
      <ServiceAreaRequestModal
        visible
        initialStep="unserved"
        prefill={{ area: 'RS Puram', locality: 'West', city: 'Coimbatore', pincode: '641002' }}
        onClose={vi.fn()}
        onContinue={onContinue}
      />,
    );
    expect(hasId(root, 'area-unserved')).toBe(true);
    await press(root, 'area-request-start');
    type(root, 'area-request-contact', '9876543210');
    await press(root, 'area-request-submit');
    expect(postMock).toHaveBeenCalledWith('/service-area-requests', {
      area: 'RS Puram',
      locality: 'West',
      city: 'Coimbatore',
      pincode: '641002',
      contact: '9876543210',
    });
    expect(hasId(root, 'area-request-received')).toBe(true);
    // derived state lands in the "my requests" cache
    expect(qc.getQueryData(['customer', 'service-area-requests'])).toEqual([
      expect.objectContaining({ id: 'r1', pincode: '641002' }),
    ]);
  });

  it('BR-171: validates min lengths client-side', async () => {
    stubApi({});
    const root = render(<ServiceAreaRequestModal visible initialStep="form" onClose={vi.fn()} />);
    type(root, 'area-request-area', 'a');
    await press(root, 'area-request-submit');
    const out = text(root);
    expect(out).toContain('Enter your apartment or area');
    expect(out).toContain('Enter your locality');
    expect(out).toContain('Enter your city');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('BR-171: 429 RATE_LIMITED shows the wait message and stays on the form', async () => {
    stubApi({
      post: async () => {
        throw problem(429, 'RATE_LIMITED');
      },
    });
    const root = render(
      <ServiceAreaRequestModal
        visible
        initialStep="form"
        prefill={{ area: 'RS Puram', locality: 'West', city: 'Coimbatore' }}
        onClose={vi.fn()}
      />,
    );
    await press(root, 'area-request-submit');
    expect(byId(root, 'area-request-error').props.children).toBe('Too many attempts. Please try again shortly.');
    expect(hasId(root, 'area-request-received')).toBe(false);
  });

  it('BR-171: Home card hidden when serviceable, shows "Request now" when unserved, "received" when a request exists', async () => {
    stubApi({ serviceable: true });
    let root = render(<ServiceAreaRequestCard pincode="641002" />);
    await flush();
    expect(hasId(root, 'area-request-card')).toBe(false);

    qc.clear();
    stubApi({ serviceable: false, myRequests: [] });
    root = render(<ServiceAreaRequestCard pincode="641002" />);
    await flush();
    expect(hasId(root, 'area-request-now')).toBe(true);

    qc.clear();
    stubApi({
      serviceable: false,
      myRequests: [{ id: 'r1', area: 'x', locality: 'y', city: 'z', pincode: '641002', status: 'NEW', createdAt: 'x' }],
    });
    root = render(<ServiceAreaRequestCard pincode="641002" />);
    await flush();
    expect(hasId(root, 'area-request-done')).toBe(true);
  });
});

describe('BR-160/BR-171 map screen (CustomerAddAddressScreen)', () => {
  it('BR-171: uses the device location, checks serviceability by lat/lng, then shows "Location added"', async () => {
    stubApi({ serviceable: true });
    geo.getCurrentPosition.mockImplementation((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 11.02, longitude: 76.96 } }),
    );
    const onNavigate = vi.fn();
    const root = render(<CustomerAddAddressScreen initialSource="current" onNavigate={onNavigate} />);
    await flush();
    expect(PermissionsAndroid.request).toHaveBeenCalledWith('fine');
    expect(getMock).toHaveBeenCalledWith('/serviceability?lat=11.02&lng=76.96', expect.anything());
    expect(byId(root, 'add-address-status').props.children).toContain('We deliver');

    await press(root, 'add-address-details');
    fillValidForm(root);
    await press(root, 'address-save');
    const body = postMock.mock.calls.find((c) => c[0] === '/customers/me/addresses')![1];
    expect(body).toMatchObject({ lat: 11.02, lng: 76.96 });
    expect(hasId(root, 'location-added')).toBe(true);
    expect(onNavigate).not.toHaveBeenCalled();
    await press(root, 'location-added-continue');
    expect(onNavigate).toHaveBeenCalledWith('CustomerLoadingMarket');
  });

  it('BR-160: denied location falls back to manual entry (no GPS call)', async () => {
    stubApi({});
    (PermissionsAndroid.request as ReturnType<typeof vi.fn>).mockResolvedValue('denied');
    const root = render(<CustomerAddAddressScreen initialSource="current" onNavigate={vi.fn()} />);
    await flush();
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
    expect(byId(root, 'add-address-status').props.children).toContain('Enter your address manually');
    expect(hasId(root, 'open-settings')).toBe(false);
  });

  it('BR-160: blocked location offers Open Settings', async () => {
    stubApi({});
    (PermissionsAndroid.request as ReturnType<typeof vi.fn>).mockResolvedValue('never_ask_again');
    const root = render(<CustomerAddAddressScreen initialSource="current" onNavigate={vi.fn()} />);
    await flush();
    expect(hasId(root, 'open-settings')).toBe(true);
  });

  it('BR-171: unserved address after save opens the request-area flow, Continue proceeds', async () => {
    stubApi({ serviceable: false });
    const onNavigate = vi.fn();
    const root = render(<CustomerAddAddressScreen initialSource="manual" onNavigate={onNavigate} />);
    await flush();
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    await press(root, 'add-address-details');
    fillValidForm(root);
    await press(root, 'address-save');
    expect(hasId(root, 'location-added')).toBe(false);
    expect(hasId(root, 'area-unserved')).toBe(true);
    await press(root, 'area-continue-browsing');
    expect(onNavigate).toHaveBeenCalledWith('CustomerLoadingMarket');
  });
});
