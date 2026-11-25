/**
 * Codegen spec for the app-local Android TurboModule that wraps Google's
 * SMS User Consent API (android/app/src/main/java/com/tohfa/mobile/smsconsent/).
 * The file name must start with `Native` — that is how codegen finds it
 * (see `codegenConfig` in this app's package.json). It lives alone in this
 * directory because codegen parses every file in `jsSrcsDir`.
 *
 * `get`, not `getEnforcing`: the module does not exist on iOS, under vitest,
 * or in an APK built before it was added, and every one of those must fall
 * back to plain manual entry rather than throw.
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Arms the User Consent API for the next SMS (up to five minutes). Resolves
   * with the full SMS body once the user taps "Allow" on the system sheet,
   * or with an empty string on timeout, denial, cancellation or any failure.
   * Never rejects. A second call supersedes the first (which resolves "").
   */
  listenForOneSms(): Promise<string>;
  /** Unregisters the listener and resolves any pending call with "". */
  stopListening(): void;
}

export default TurboModuleRegistry.get<Spec>('TohfaSmsUserConsent');
