/**
 * Markup & pricing breakdown (Market & Pricing phase 2B). Thin shell: the
 * screen lives in ../pricing/markup/, ported from the team design
 * (origin/tofhafarmfin-rbac). Only retail price, ceiling and markupPct are
 * real. Access is by permission code only (`can`), fail closed.
 */
export {
  MarkupPricingBreakdownScreen,
  type MarkupPricingBreakdownScreenProps,
} from '../pricing/markup/MarkupBreakdownScreen';
