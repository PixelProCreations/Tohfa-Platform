/**
 * Module 7 home (Market & Pricing). Thin shell: the screen lives in
 * ../pricing/home/ (phase 2A: one view-only layout, sections gated by
 * pricing.fair_price.view / pricing.retail_price.view). This path and the
 * component name stay so farmer/App.tsx, SuperAdminDashboardScreen and the
 * dashboard index keep compiling.
 */
export { MarketPricingHomeScreen } from '../pricing/home/MarketPricingHomeScreen';
export type { MarketPricingHomeScreenProps } from '../pricing/home/MarketPricingHomeScreen';
