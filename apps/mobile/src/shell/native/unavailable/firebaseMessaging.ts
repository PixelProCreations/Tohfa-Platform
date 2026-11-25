/**
 * Stand-in for @react-native-firebase/messaging; see ./index.ts.
 *
 * pushProvider.ts only calls these after `isConfigured()` returned true, which
 * the firebaseApp stub never does. They still behave safely if reached:
 * permission is "denied", there is no token, and listeners never fire.
 */
import { UNAVAILABLE_NATIVE_MODULE_MESSAGE } from './index';

export const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 } as const;

type Unsubscribe = () => void;
const noop: Unsubscribe = () => undefined;

export function getMessaging(): Record<string, never> {
  return {};
}
export async function hasPermission(_messaging: unknown): Promise<number> {
  return AuthorizationStatus.DENIED;
}
export async function requestPermission(_messaging: unknown): Promise<number> {
  return AuthorizationStatus.DENIED;
}
export async function getToken(_messaging: unknown): Promise<string> {
  throw new Error(`@react-native-firebase/messaging: ${UNAVAILABLE_NATIVE_MODULE_MESSAGE}`);
}
export async function deleteToken(_messaging: unknown): Promise<void> {
  return undefined;
}
export function onTokenRefresh(_messaging: unknown, _listener: (token: string) => void): Unsubscribe {
  return noop;
}
export function onMessage(_messaging: unknown, _listener: (message: unknown) => void): Unsubscribe {
  return noop;
}
export function onNotificationOpenedApp(_messaging: unknown, _listener: (message: unknown) => void): Unsubscribe {
  return noop;
}
export async function getInitialNotification(_messaging: unknown): Promise<null> {
  return null;
}
