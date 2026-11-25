/**
 * Screen 42 (Price History). Thin shell: the screen lives in
 * ../pricing/history/ (phase 2A: per-crop ceiling history from
 * GET /fair-prices/history, gated by pricing.fair_price.view). This path and
 * the component name stay so farmer/App.tsx, SuperAdminDashboardScreen and
 * the dashboard index keep compiling.
 */
export { PriceHistoryScreen } from '../pricing/history/PriceHistoryScreen';
export type { PriceHistoryScreenProps } from '../pricing/history/PriceHistoryScreen';
