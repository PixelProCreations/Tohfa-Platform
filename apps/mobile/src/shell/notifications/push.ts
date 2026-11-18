/**
 * Push registration for the signed-in session (FCM token <-> server).
 *
 *   // after sign-in (customer: CustomerMainApp mount; never prompts):
 *   void registerPushForSession({ app: 'customer-mobile', locale: 'en' });
 *   // from a "Turn on notifications" button (prompts on Android 13+/iOS):
 *   await registerPushForSession({ app: 'customer-mobile', locale, requestPermission: true });
 *   // on sign-out, BEFORE tokens are cleared (roles/farmer/api/auth.ts logout() does this):
 *   await unregisterPushForSession();
 *   // foreground messages (e.g. invalidate the notifications query):
 *   const off = onForegroundPush(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
 *
 * Never throws: every failure resolves to `{ status: 'skipped', reason }` and
 * is logged with the reason, because push is an enhancement -- a missing
 * Firebase config, a denied permission or a 5xx must never block sign-in or
 * sign-out.
 */
import { registerDeviceToken, revokeDeviceToken, type PushApp, type PushLocale } from './api';
import { firebasePushProvider, type PushMessage, type PushMessagingProvider } from './pushProvider';

export type { PushMessage, PushMessagingProvider } from './pushProvider';

export type PushSkipReason = 'firebase-not-configured' | 'permission-denied' | 'no-token' | 'register-failed';

export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'skipped'; reason: PushSkipReason; detail?: string };

export interface RegisterPushOptions {
  app: PushApp;
  locale?: PushLocale | undefined;
  /** Prompt for permission if not yet granted. Default false: only register when already allowed. */
  requestPermission?: boolean | undefined;
}

export interface PushRegistrationDeps {
  provider: PushMessagingProvider;
  register: typeof registerDeviceToken;
  revoke: typeof revokeDeviceToken;
  log?: ((message: string) => void) | undefined;
}

export interface PushRegistration {
  register(options: RegisterPushOptions): Promise<PushRegistrationResult>;
  unregister(): Promise<void>;
  onForegroundMessage(listener: (message: PushMessage) => void): () => void;
  /** User tapped a push (cold start or from background); a no-op when Firebase is not configured. */
  onOpenedMessage(listener: (message: PushMessage) => void): () => void;
  /** The token currently registered with the server for this session, if any. */
  registeredToken(): string | null;
}

function describeFailure(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function createPushRegistration(deps: PushRegistrationDeps): PushRegistration {
  const log = deps.log ?? ((message: string) => console.warn(`[push] ${message}`));
  let current: { token: string; app: PushApp; locale: PushLocale } | null = null;
  let stopRefresh: (() => void) | null = null;

  const skipped = (reason: PushSkipReason, detail?: string): PushRegistrationResult => {
    log(`registration skipped: ${reason}${detail === undefined ? '' : ` (${detail})`}`);
    return detail === undefined ? { status: 'skipped', reason } : { status: 'skipped', reason, detail };
  };

  async function sendToServer(token: string, app: PushApp, locale: PushLocale): Promise<void> {
    await deps.register({ token, app, locale });
    current = { token, app, locale };
  }

  return {
    async register(options) {
      const locale = options.locale ?? 'en';
      if (!deps.provider.isConfigured()) {
        return skipped(
          'firebase-not-configured',
          'no native Firebase app; add google-services.json / GoogleService-Info.plist (docs/mobile-native-setup.md)',
        );
      }
      try {
        let allowed = await deps.provider.hasPermission();
        if (!allowed && options.requestPermission === true) {
          allowed = await deps.provider.requestPermission();
        }
        if (!allowed) return skipped('permission-denied');

        const token = await deps.provider.getToken();
        if (token === null) return skipped('no-token');

        // Register once per (token, app, locale): re-mounts must not spam the API.
        if (current === null || current.token !== token || current.app !== options.app || current.locale !== locale) {
          await sendToServer(token, options.app, locale);
        }

        if (stopRefresh === null) {
          stopRefresh = deps.provider.onTokenRefresh((fresh) => {
            const previous = current;
            if (previous === null || previous.token === fresh) return;
            void sendToServer(fresh, previous.app, previous.locale)
              .then(() => deps.revoke(previous.token))
              .catch((err: unknown) => log(`token refresh re-registration failed: ${describeFailure(err)}`));
          });
        }
        return { status: 'registered', token };
      } catch (err) {
        return skipped('register-failed', describeFailure(err));
      }
    },

    async unregister() {
      stopRefresh?.();
      stopRefresh = null;
      const registered = current;
      current = null;
      if (registered === null) return;
      try {
        await deps.revoke(registered.token);
      } catch (err) {
        // Sign-out must always complete locally; the server prunes dead tokens.
        log(`revoke failed: ${describeFailure(err)}`);
      }
    },

    onForegroundMessage(listener) {
      if (!deps.provider.isConfigured()) return () => undefined;
      try {
        return deps.provider.onForegroundMessage(listener);
      } catch (err) {
        log(`foreground listener unavailable: ${describeFailure(err)}`);
        return () => undefined;
      }
    },

    onOpenedMessage(listener) {
      const subscribe = deps.provider.onNotificationOpened;
      if (subscribe === undefined || !deps.provider.isConfigured()) return () => undefined;
      try {
        return subscribe.call(deps.provider, listener);
      } catch (err) {
        log(`opened-notification listener unavailable: ${describeFailure(err)}`);
        return () => undefined;
      }
    },

    registeredToken() {
      return current?.token ?? null;
    },
  };
}

/** The app-wide instance, over Firebase Cloud Messaging. */
export const pushRegistration: PushRegistration = createPushRegistration({
  provider: firebasePushProvider,
  register: registerDeviceToken,
  revoke: revokeDeviceToken,
});

export const registerPushForSession = (options: RegisterPushOptions): Promise<PushRegistrationResult> =>
  pushRegistration.register(options);

export const unregisterPushForSession = (): Promise<void> => pushRegistration.unregister();

export const onForegroundPush = (listener: (message: PushMessage) => void): (() => void) =>
  pushRegistration.onForegroundMessage(listener);

/** Push tapped (cold start or background). Map `message.data` with roles/customer/api/notifications notificationTarget(). */
export const onPushOpened = (listener: (message: PushMessage) => void): (() => void) =>
  pushRegistration.onOpenedMessage(listener);
