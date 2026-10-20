/**
 * Design sample data for the customer-order screens that have no API yet
 * (availability.ts): the stock check, delivery preparation and dispatch, order
 * issues and cancellation. Those screens stay in the code, unreachable, until
 * an API exists. The live screens (dashboard, list, detail, ready for pickup,
 * history, packing, pickup OTP, order invoice) read the API through
 * useOrdersData.ts and import nothing from here.
 *
 * No colours here: status tones stay with the screens, on the admin theme.
 */

/** The order every sample screen opened when no order was passed. */
export const SAMPLE_ORDER_ID = 'ORD-1024';
const SAMPLE_CUSTOMER = 'Arun Kumar';
/** The sample delivery order (delivery preparation and dispatch). */
export const SAMPLE_DELIVERY_ORDER_ID = 'ORD-1021';

export const SAMPLE_PARTNER_PLACEHOLDER = 'Select delivery person';

/** Sample delivery partners (M5S14). */
export const SAMPLE_DELIVERY_PARTNERS = [
  SAMPLE_PARTNER_PLACEHOLDER,
  'Ramesh Kumar (Van #04)',
  'Suresh M. (Bike #12)',
  'Anand P. (Runner #02)',
  'Karthik S. (Van #08)',
];

/** The dispatch sample order (M5S14). Slot codes come from configuration/API; this is the sample's slot. */
export const SAMPLE_DISPATCH = {
  customer: 'Divya R.',
  itemCount: 4,
  deliveryAddress: 'Ooty Road',
  deliverySlot: 'AFTERNOON_12_4',
};

/** The delivery preparation sample (M5S13). */
export const SAMPLE_DELIVERY_PREP = {
  configuredAddress: 'Configured address — Divya R., Ooty Road, Coonoor',
  deliveryDate: '25 Sep 2026',
  deliverySlot: 'AFTERNOON_12_4',
};

/** The id the old M5S16 handed to M5S16B on submit. */
export const SAMPLE_NEW_ISSUE_ID = 'ISS-0028';

/** The cancellation sample's figures (M5S17). */
export const SAMPLE_CANCELLATION = {
  customer: SAMPLE_CUSTOMER,
  total: '₹850',
};
