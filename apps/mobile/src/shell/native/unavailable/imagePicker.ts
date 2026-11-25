/** Stand-in for react-native-image-picker; see ./index.ts. Every pick returns an error result (no photos). */
import { UNAVAILABLE_NATIVE_MODULE_MESSAGE } from './index';

interface UnavailablePickerResult {
  didCancel?: boolean;
  errorCode: 'others';
  errorMessage: string;
  assets?: undefined;
}

function unavailable(): Promise<UnavailablePickerResult> {
  return Promise.resolve({ errorCode: 'others', errorMessage: `react-native-image-picker: ${UNAVAILABLE_NATIVE_MODULE_MESSAGE}` });
}

export function launchImageLibrary(_options: unknown): Promise<UnavailablePickerResult> {
  return unavailable();
}

export function launchCamera(_options: unknown): Promise<UnavailablePickerResult> {
  return unavailable();
}
