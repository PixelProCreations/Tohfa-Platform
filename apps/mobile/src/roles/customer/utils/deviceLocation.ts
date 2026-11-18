/**
 * Device permissions used by the customer onboarding / address flow (BR-160/BR-171).
 *
 *  - Location: Android -> PermissionsAndroid (FINE = precise, COARSE = approximate);
 *    iOS -> Geolocation.requestAuthorization (the OS dialog offers precise/approximate).
 *  - Current position: Geolocation.getCurrentPosition wrapped in a promise with a timeout.
 *  - Notifications: the shared push service (registers the FCM token with the API);
 *    when Firebase is not configured we still ask the OS on Android 13+ so the
 *    choice is remembered for later.
 *
 * Nothing here throws for a "no": every helper resolves to a status the screen
 * renders (granted / denied / blocked / unavailable), so denial always falls back
 * to manual entry and never blocks onboarding.
 */
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { registerPushForSession } from '../../../shell/notifications/push';
import { getLocale } from '../../../i18n/customer';

export type PermissionOutcome = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface Coords {
  lat: number;
  lng: number;
}

export type LocationErrorKind = 'denied' | 'unavailable' | 'timeout';

export class LocationError extends Error {
  readonly kind: LocationErrorKind;
  constructor(kind: LocationErrorKind, message?: string) {
    super(message ?? `location ${kind}`);
    this.name = 'LocationError';
    this.kind = kind;
  }
}

function mapAndroidResult(result: string): PermissionOutcome {
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
}

/** Ask for location permission. `precise=false` asks for approximate (COARSE) only on Android. */
export async function requestLocationPermission(precise = true): Promise<PermissionOutcome> {
  try {
    if (Platform.OS === 'android') {
      const permission = precise
        ? PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        : PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
      return mapAndroidResult(await PermissionsAndroid.request(permission));
    }
    return await new Promise<PermissionOutcome>((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve('granted'),
        // iOS never re-prompts after a denial: the user has to go to Settings.
        (err: { code?: number }) => resolve(err?.code === 1 ? 'blocked' : 'unavailable'),
      );
    });
  } catch {
    return 'unavailable';
  }
}

/** Current device position. Rejects with a {@link LocationError}. */
export function getCurrentPosition(timeoutMs = 15000): Promise<Coords> {
  return new Promise<Coords>((resolve, reject) => {
    try {
      Geolocation.getCurrentPosition(
        (pos: { coords: { latitude: number; longitude: number } }) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err: { code?: number; message?: string }) => {
          const kind: LocationErrorKind = err?.code === 1 ? 'denied' : err?.code === 3 ? 'timeout' : 'unavailable';
          reject(new LocationError(kind, err?.message));
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
      );
    } catch (err) {
      reject(new LocationError('unavailable', err instanceof Error ? err.message : undefined));
    }
  });
}

/** Permission + position in one step; resolves `{ outcome }` without coords when not granted. */
export async function locateDevice(precise = true): Promise<{ outcome: PermissionOutcome; coords?: Coords; error?: LocationErrorKind }> {
  const outcome = await requestLocationPermission(precise);
  if (outcome !== 'granted') return { outcome };
  try {
    return { outcome, coords: await getCurrentPosition() };
  } catch (err) {
    const kind = err instanceof LocationError ? err.kind : 'unavailable';
    return { outcome: kind === 'denied' ? 'denied' : 'granted', error: kind };
  }
}

/**
 * Turn on notifications: registers the push token with the API (prompting on
 * Android 13+/iOS). When Firebase is not configured, still records the OS
 * choice on Android 13+.
 */
export async function requestNotificationPermission(): Promise<PermissionOutcome> {
  const locale = getLocale() === 'ta' ? 'ta' : 'en';
  const result = await registerPushForSession({ app: 'customer-mobile', locale, requestPermission: true });
  if (result.status === 'registered') return 'granted';
  if (result.reason === 'permission-denied') return 'denied';
  if (result.reason === 'firebase-not-configured' && Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    try {
      return mapAndroidResult(await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
    } catch {
      return 'unavailable';
    }
  }
  // no-token / register-failed / not configured: the OS may have allowed it; nothing to block on.
  return 'unavailable';
}

export function openAppSettings(): void {
  void Linking.openSettings().catch(() => undefined);
}
