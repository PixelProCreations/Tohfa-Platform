/**
 * Stand-in for @react-native-community/geolocation; see ./index.ts. Reports
 * POSITION_UNAVAILABLE (code 2), which deviceLocation.ts maps to 'unavailable'.
 */
import { UNAVAILABLE_NATIVE_MODULE_MESSAGE } from './index';

const POSITION_UNAVAILABLE = 2;
const error = { code: POSITION_UNAVAILABLE, message: `@react-native-community/geolocation: ${UNAVAILABLE_NATIVE_MODULE_MESSAGE}` };

type ErrorCallback = (err: { code?: number; message?: string }) => void;

const Geolocation = {
  requestAuthorization(_success?: () => void, onError?: ErrorCallback): void {
    onError?.(error);
  },
  getCurrentPosition(_success: unknown, onError?: ErrorCallback, _options?: unknown): void {
    onError?.(error);
  },
  watchPosition(_success: unknown, onError?: ErrorCallback, _options?: unknown): number {
    onError?.(error);
    return -1;
  },
  clearWatch(_watchId: number): void {},
  stopObserving(): void {},
  setRNConfiguration(_config: unknown): void {},
};

export default Geolocation;
