/**
 * Screen 39 (Fair Price Ceilings). Thin shell: the screen lives in
 * ../pricing/ceiling/ (Market & Pricing phase 2A, wired to GET /fair-prices,
 * view-only, gated by pricing.fair_price.view). This path and the component
 * name stay so farmer/App.tsx, SuperAdminDashboardScreen and the dashboard
 * index keep compiling.
 */
export { FairPriceCeilingScreen } from '../pricing/ceiling/FairPriceCeilingScreen';
export type { FairPriceCeilingScreenProps } from '../pricing/ceiling/FairPriceCeilingScreen';
