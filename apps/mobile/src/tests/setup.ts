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
vi.mock('@env', () => ({ MAPBOX_ACCESS_TOKEN: 'mock_token' }));

/**
 * `react-native` itself, mocked globally, for a completely different reason
 * than the keychain mock above: not because it needs native bridge state,
 * but because its real entry point cannot be parsed by this test runner at
 * all. `node_modules/react-native/index.js` is Flow source (`@flow` pragma)
 * that re-exports its whole public API via Flow-only `import typeof X from
 * '...'` statements -- valid to Metro/Babel's Flow-aware parser (what every
 * real app build and this repo's own eslint config use), but not to
 * Vite/Rollup's plain-JS/TS parser, which has no Flow support and no plugin
 * here adds any. The failure is silent until something in the module graph
 * actually forces Vite to resolve the real package (observed via `Platform`:
 * merely importing the `Platform` binding is fine, but evaluating
 * `Platform.OS` anywhere makes Vite's SSR import analysis reach into the
 * real file and choke on `import typeof`, surfacing as a confusing
 * `Expected 'from', got 'typeOf'` parse error with no file/line attached).
 *
 * This is a test-tooling gap, not a real app bug -- Metro parses Flow
 * natively, so production code importing `Platform` (or anything else) from
 * `'react-native'` is completely unaffected; do not "fix" this by changing
 * any application source import path.
 *
 * The stub below covers every named export currently imported from
 * `'react-native'` anywhere in this app (checked via a repo-wide grep before
 * writing this). None of it is ever actually rendered here -- there is no
 * jsdom in this test environment (see this file's own docblock above), so
 * component stubs only need to exist and be importable, not behave like
 * real UI. `StyleSheet.create` is the one real behavior worth preserving
 * (an identity passthrough, matching the real module closely enough for any
 * test that inspects the style objects it's given).
 */
vi.mock('react-native', () => {
  const componentStub = (name: string) => {
    const stub = (props: unknown) => props;
    stub.displayName = name;
    return stub;
  };
  return {
    ActivityIndicator: componentStub('ActivityIndicator'),
    BackHandler: { addEventListener: vi.fn(() => ({ remove: vi.fn() })), removeEventListener: vi.fn() },
    FlatList: componentStub('FlatList'),
    Image: componentStub('Image'),
    ImageBackground: componentStub('ImageBackground'),
    Platform: { OS: 'ios', Version: 0, select: (obj: Record<string, unknown>) => obj.ios ?? obj.default },
    Pressable: componentStub('Pressable'),
    SafeAreaView: componentStub('SafeAreaView'),
    ScrollView: componentStub('ScrollView'),
    StatusBar: componentStub('StatusBar'),
    StyleSheet: { create: (styles: Record<string, unknown>) => styles, flatten: (style: unknown) => style },
    Switch: componentStub('Switch'),
    Text: componentStub('Text'),
    TextInput: componentStub('TextInput'),
    TouchableOpacity: componentStub('TouchableOpacity'),
    UIManager: { setLayoutAnimationEnabledExperimental: vi.fn() },
    View: componentStub('View'),
  };
});
