/**
 * The push-messaging seam: what ./push.ts needs from FCM, as an interface, so
 * the registration logic is unit-testable without a device, and so the app
 * keeps running when Firebase is not configured yet.
 *
 * `firebasePushProvider` is the real implementation over
 * @react-native-firebase/{app,messaging} (modular API). "Configured" means the
 * native default Firebase app exists, i.e. the build carried
 * google-services.json (Android, + the google-services Gradle plugin) /
 * GoogleService-Info.plist (iOS, + FirebaseApp.configure()). Until the owner
 * supplies those, `isConfigured()` is false and push registration is a logged
 * no-op -- see docs/mobile-native-setup.md.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { getApps } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';

export interface PushMessage {
  messageId?: string | undefined;
  title?: string | undefined;
  body?: string | undefined;
  data: Record<string, string>;
}

export interface PushMessagingProvider {
  /** False when the native Firebase app is missing (no config files in this build). */
  isConfigured(): boolean;
  /** Current OS permission, without prompting. */
  hasPermission(): Promise<boolean>;
  /** Prompt (Android 13+ POST_NOTIFICATIONS / iOS alert) and report the result. */
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string | null>;
  deleteToken(): Promise<void>;
  onTokenRefresh(listener: (token: string) => void): () => void;
  onForegroundMessage(listener: (message: PushMessage) => void): () => void;
  /**
   * The user tapped a push: fires once for the notification that cold-started
   * the app (getInitialNotification) and for every tap while backgrounded
   * (onNotificationOpenedApp). Optional so test fakes need not implement it.
   */
  onNotificationOpened?(listener: (message: PushMessage) => void): () => void;
}

interface RawRemoteMessage {
  messageId?: string | undefined;
  notification?: { title?: string | undefined; body?: string | undefined } | undefined;
  data?: Record<string, unknown> | undefined;
}

function toPushMessage(message: RawRemoteMessage): PushMessage {
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(message.data ?? {})) {
    data[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return {
    messageId: message.messageId,
    title: message.notification?.title,
    body: message.notification?.body,
    data,
  };
}

function isAuthorized(status: number): boolean {
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

function needsAndroidRuntimePermission(): boolean {
  return Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33;
}

export const firebasePushProvider: PushMessagingProvider = {
  isConfigured() {
    try {
      return getApps().length > 0;
    } catch {
      return false;
    }
  },

  async hasPermission() {
    if (needsAndroidRuntimePermission()) {
      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    if (Platform.OS === 'android') return true; // below Android 13: granted at install
    return isAuthorized(await hasPermission(getMessaging()));
  },

  async requestPermission() {
    if (needsAndroidRuntimePermission()) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (Platform.OS === 'android') return true;
    return isAuthorized(await requestPermission(getMessaging()));
  },

  async getToken() {
    const token = await getToken(getMessaging());
    return token.length > 0 ? token : null;
  },

  async deleteToken() {
    await deleteToken(getMessaging());
  },

  onTokenRefresh(listener) {
    return onTokenRefresh(getMessaging(), listener);
  },

  onForegroundMessage(listener) {
    return onMessage(getMessaging(), (message) => listener(toPushMessage(message)));
  },

  onNotificationOpened(listener) {
    const messaging = getMessaging();
    let active = true;
    void getInitialNotification(messaging)
      .then((message) => {
        if (active && message) listener(toPushMessage(message));
      })
      .catch(() => undefined);
    const off = onNotificationOpenedApp(messaging, (message) => listener(toPushMessage(message)));
    return () => {
      active = false;
      off();
    };
  },
};
