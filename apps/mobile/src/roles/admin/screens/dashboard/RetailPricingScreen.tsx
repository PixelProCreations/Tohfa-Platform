/**
 * Retail pricing (Market & Pricing phase 2B). Thin shell: the screen lives in
 * ../pricing/retail/ (shell + frame + card + drawer + filter + logic + styles),
 * ported from the team design (origin/tofhafarmfin-rbac) and wired to
 * GET /retail-prices. Access is by permission code only (`can`), fail closed.
 */
export { RetailPricingScreen, type RetailPricingScreenProps } from '../pricing/retail/RetailPricingScreen';
