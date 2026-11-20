/**
 * Vitest mocks for the native libraries added for the customer integration:
 * react-native-razorpay, @react-native-firebase/{app,messaging},
 * react-native-image-picker and @react-native-community/geolocation.
 *
 * None of them can run in plain Node (they are TurboModules), so
 * ../setup.ts installs these globally. Defaults model the most common real
 * state of a dev build: Firebase NOT configured (no google-services.json /
 * GoogleService-Info.plist yet -> `getApps()` is empty). A test that needs
 * other behaviour overrides the individual `vi.fn`s, or re-mocks the module
 * in its own file (a per-file `vi.mock` wins over the global one).
 */
import { vi } from 'vitest';

export function createRazorpayMock() {
  const RazorpayCheckout = {
    open: vi.fn(async (_options: Record<string, unknown>) => ({ razorpay_payment_id: 'pay_mock' })),
    onExternalWalletSelection: vi.fn(),
  };
  return { default: RazorpayCheckout, __esModule: true };
}

export function createFirebaseAppMock() {
  return {
    getApps: vi.fn(() => [] as unknown[]),
    getApp: vi.fn(() => {
      throw new Error("No Firebase App '[DEFAULT]' has been created (mock)");
    }),
  };
}

export function createFirebaseMessagingMock() {
  const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 };
  return {
    AuthorizationStatus,
    getMessaging: vi.fn(() => ({})),
    getToken: vi.fn(async () => 'fcm-mock-token'),
    deleteToken: vi.fn(async () => undefined),
    requestPermission: vi.fn(async () => AuthorizationStatus.AUTHORIZED),
    hasPermission: vi.fn(async () => AuthorizationStatus.AUTHORIZED),
    onTokenRefresh: vi.fn(() => () => undefined),
    onMessage: vi.fn(() => () => undefined),
    onNotificationOpenedApp: vi.fn(() => () => undefined),
    getInitialNotification: vi.fn(async () => null),
    setBackgroundMessageHandler: vi.fn(),
    registerDeviceForRemoteMessages: vi.fn(async () => undefined),
  };
}

export function createImagePickerMock() {
  return {
    launchCamera: vi.fn(async () => ({ didCancel: true })),
    launchImageLibrary: vi.fn(async () => ({ didCancel: true })),
  };
}

export function createGeolocationMock() {
  const Geolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(() => 0),
    clearWatch: vi.fn(),
    stopObserving: vi.fn(),
    requestAuthorization: vi.fn(),
    setRNConfiguration: vi.fn(),
  };
  return { default: Geolocation, ...Geolocation, __esModule: true };
}
