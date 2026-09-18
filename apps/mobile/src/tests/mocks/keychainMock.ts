/**
 * Minimal stateful vitest mock for react-native-keychain, backed by an in-memory Map keyed by
 * `service`.
 *
 * The real native module has no JS-only implementation (it's a native module bridge/TurboModule
 * call), so it cannot run at all outside a React Native runtime -- which is exactly this app's
 * test environment (plain Node, no jsdom; see apps/mobile/CLAUDE.md's "Testing" section). Any
 * test that exercises a storage module backed by react-native-keychain (e.g. farmer's
 * tokenStorage.ts) needs this mocked, or the import throws before the test body ever runs.
 *
 * Modeled on ./asyncStorageMock.ts's shape and quality; the difference is that
 * `tokenStorage.ts` does `import * as Keychain from 'react-native-keychain'`, a namespace
 * import, so the mock factory returns the named exports directly (setGenericPassword,
 * getGenericPassword, resetGenericPassword, ACCESSIBLE, STORAGE_TYPE) rather than nesting them
 * under a `default` key.
 *
 * Usage, at the top of a test file, before importing anything that reads/writes storage:
 *
 *   vi.mock('react-native-keychain', () => createKeychainMock());
 *
 * (the arrow-function wrapper matters: vi.mock's factory argument is hoisted above imports,
 * so passing createKeychainMock by reference evaluates the still-uninitialized import binding
 * immediately and throws; a wrapper defers that lookup until the factory runs.)
 */
import { vi } from 'vitest';

interface StoredEntry {
  username: string;
  password: string;
}

interface ServiceOptions {
  service?: string;
}

// Matches the real library's default `service` -- callers here always pass one explicitly, but
// mirroring the library's fallback keeps this mock honest about what "no service given" means.
const DEFAULT_SERVICE = 'default-service';

export function createKeychainMock() {
  const store = new Map<string, StoredEntry>();

  return {
    ACCESSIBLE: {
      WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
      AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
      ALWAYS: 'AccessibleAlways',
      WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
    },
    STORAGE_TYPE: {
      AES_CBC: 'KeystoreAESCBC',
      AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
      AES_GCM: 'KeystoreAESGCM',
      RSA: 'KeystoreRSAECB',
    },

    setGenericPassword: vi.fn(
      (username: string, password: string, options?: ServiceOptions & Record<string, unknown>) => {
        const service = options?.service ?? DEFAULT_SERVICE;
        store.set(service, { username, password });
        return Promise.resolve({ service, storage: 'KeystoreAESGCM_NoAuth' });
      },
    ),

    getGenericPassword: vi.fn((options?: ServiceOptions & Record<string, unknown>) => {
      const service = options?.service ?? DEFAULT_SERVICE;
      const entry = store.get(service);
      // The real library resolves to `false` -- not a rejected promise -- when nothing is
      // stored yet for this service. Callers must check for `false`, not rely on a throw.
      if (!entry) {
        return Promise.resolve(false as const);
      }
      return Promise.resolve({
        service,
        username: entry.username,
        password: entry.password,
        storage: 'KeystoreAESGCM_NoAuth',
      });
    }),

    resetGenericPassword: vi.fn((options?: ServiceOptions) => {
      const service = options?.service ?? DEFAULT_SERVICE;
      store.delete(service);
      return Promise.resolve(true);
    }),
  };
}
