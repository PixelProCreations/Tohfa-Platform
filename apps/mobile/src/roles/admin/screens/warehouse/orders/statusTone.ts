/**
 * The admin-theme colours of an order status tone (./mappers.ts orderStatusTone),
 * shared by the order screens so a status reads the same everywhere.
 */
import { adminColors } from '../../../theme';
import type { OrderStatusTone } from './types';

const TONE_COLORS: Readonly<Record<OrderStatusTone, { bg: string; text: string }>> = {
  warning: adminColors.warning,
  success: adminColors.success,
  danger: adminColors.danger,
  info: adminColors.info,
  neutral: adminColors.brandSoft,
};

export function orderToneColors(tone: OrderStatusTone): { bg: string; text: string } {
  return TONE_COLORS[tone];
}
