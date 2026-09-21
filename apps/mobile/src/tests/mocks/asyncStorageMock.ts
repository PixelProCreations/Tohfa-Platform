/**
 * Minimal stateful vitest mock for @react-native-async-storage/async-storage, backed by an
 * in-memory Map.
 *
 * The real package throws ("window is not defined") when getItem/setItem/removeItem are
 * called outside a React Native or browser runtime — which is exactly this app's test
 * environment (plain Node, no jsdom; see apps/mobile/CLAUDE.md's "Testing" section). Any
 * test that exercises a storage module backed by AsyncStorage (e.g. tokenStorage.ts) needs
 * this mocked, or the underlying promise rejects and the test either throws or leaks an
 * unhandled rejection into unrelated tests.
 *
 * Usage, at the top of a test file, before importing anything that reads/writes storage:
 *
 *   vi.mock('@react-native-async-storage/async-storage', () => createAsyncStorageMock());
 *
 * (the arrow-function wrapper matters: vi.mock's factory argument is hoisted above imports,
 * so passing createAsyncStorageMock by reference evaluates the still-uninitialized import
 * binding immediately and throws; a wrapper defers that lookup until the factory runs.)
 */
import { vi } from 'vitest';

export function createAsyncStorageMock() {
  const store = new Map<string, string>();

  return {
    default: {
      getItem: vi.fn((key: string) => Promise.resolve(store.has(key) ? store.get(key)! : null)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
    },
  };
}
