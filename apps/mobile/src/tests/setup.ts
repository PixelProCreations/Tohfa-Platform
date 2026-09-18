/**
 * Global vitest setup, applied to every test file in this package.
 *
 * `react-native-keychain` is a native module with no JS-only implementation —
 * it cannot run at all outside a real React Native runtime, which is exactly
 * this app's test environment (plain Node, no jsdom; see this app's own
 * CLAUDE.md's "Testing" section). Any file that imports farmer's
 * `storage/tokenStorage.ts` — directly, or transitively via `api/client.ts`,
 * `api/auth.ts`, or any other `api/*.ts` module that routes through the
 * shared client — pulls in `react-native-keychain` and throws before the
 * test body ever runs unless it's mocked first.
 *
 * Mocking it here, once, globally, means a NEW farmer test file that imports
 * any api module never has to remember to add this mock itself — the
 * per-file `vi.mock('react-native-keychain', ...)` calls already present in
 * a couple of test files (added before this global setup existed) are
 * harmless, redundant no-ops now, not conflicts.
 *
 * Customer and shell tests never touch `react-native-keychain` at all, so
 * this mock is simply unused (and harmless) for them.
 */
import { vi } from 'vitest';
import { createKeychainMock } from './mocks/keychainMock';

vi.mock('react-native-keychain', () => createKeychainMock());
