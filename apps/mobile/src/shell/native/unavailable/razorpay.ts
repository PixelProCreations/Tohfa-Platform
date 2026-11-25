/** Stand-in for react-native-razorpay; see ./index.ts. Checkout always fails closed. */
import { UNAVAILABLE_NATIVE_MODULE_MESSAGE } from './index';

const RazorpayCheckout = {
  open(_options: Record<string, unknown>): Promise<never> {
    return Promise.reject({ code: null, description: `react-native-razorpay: ${UNAVAILABLE_NATIVE_MODULE_MESSAGE}` });
  },
};

export default RazorpayCheckout;
