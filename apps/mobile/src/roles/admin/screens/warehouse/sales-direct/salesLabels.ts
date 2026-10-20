/**
 * API enum code -> admin i18n key, for every code the sales screens show.
 * Exhaustive Records, so a new enum value is a type error here rather than a
 * raw code on screen. No react-native import (vitest covers it).
 */
import type {
  ChannelOrderStatus,
  Grade,
  SalePaymentMethod,
  SalePaymentRowStatus,
  SalePaymentStatus,
  SaleStatus,
} from '../../../api/sales';
import type { TranslationKey } from '../../../i18n';
import type { ChannelStatusGroup, SalePaymentBlock } from './mappers';

export const GRADE_KEY: Record<Grade, TranslationKey> = {
  GRADE_1: 'sales.grade.GRADE_1',
  GRADE_2: 'sales.grade.GRADE_2',
  GRADE_3: 'sales.grade.GRADE_3',
  REJECT: 'sales.grade.REJECT',
};

export const SALE_STATUS_KEY: Record<SaleStatus, TranslationKey> = {
  PENDING_PAYMENT: 'sales.status.PENDING_PAYMENT',
  PICKED_UP: 'sales.status.PICKED_UP',
  CANCELLED: 'sales.status.CANCELLED',
};

export const PAYMENT_STATUS_KEY: Record<SalePaymentStatus, TranslationKey> = {
  PENDING: 'sales.paymentStatus.PENDING',
  PAID: 'sales.paymentStatus.PAID',
  PARTIALLY_PAID: 'sales.paymentStatus.PARTIALLY_PAID',
  REFUNDED: 'sales.paymentStatus.REFUNDED',
  FAILED: 'sales.paymentStatus.FAILED',
};

export const PAYMENT_ROW_STATUS_KEY: Record<SalePaymentRowStatus, TranslationKey> = {
  PENDING: 'sales.paymentRowStatus.PENDING',
  CONFIRMED: 'sales.paymentRowStatus.CONFIRMED',
  FAILED: 'sales.paymentRowStatus.FAILED',
};

export const PAYMENT_METHOD_KEY: Record<SalePaymentMethod, TranslationKey> = {
  CASH: 'sales.method.CASH',
  UPI: 'sales.method.UPI',
  CARD: 'sales.method.CARD',
  WALLET: 'sales.method.WALLET',
};

export const SALE_CHANNEL_KEY: Record<'DIRECT' | 'MARKET' | 'HORECA' | 'B2B', TranslationKey> = {
  DIRECT: 'sales.channel.DIRECT',
  MARKET: 'sales.channel.MARKET',
  HORECA: 'sales.channel.HORECA',
  B2B: 'sales.channel.B2B',
};

export const CHANNEL_ORDER_STATUS_KEY: Record<ChannelOrderStatus, TranslationKey> = {
  PENDING_PAYMENT: 'sales.orderStatus.PENDING_PAYMENT',
  CONFIRMED: 'sales.orderStatus.CONFIRMED',
  PACKED: 'sales.orderStatus.PACKED',
  DISPATCHED: 'sales.orderStatus.DISPATCHED',
  READY_FOR_PICKUP: 'sales.orderStatus.READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'sales.orderStatus.OUT_FOR_DELIVERY',
  DELIVERED: 'sales.orderStatus.DELIVERED',
  PICKED_UP: 'sales.orderStatus.PICKED_UP',
  CANCELLED: 'sales.orderStatus.CANCELLED',
  RETURNED: 'sales.orderStatus.RETURNED',
};

export const CHANNEL_GROUP_KEY: Record<ChannelStatusGroup, TranslationKey> = {
  PENDING: 'sales.channelGroup.PENDING',
  IN_PROGRESS: 'sales.channelGroup.IN_PROGRESS',
  COMPLETED: 'sales.channelGroup.COMPLETED',
  CLOSED: 'sales.channelGroup.CLOSED',
};

export const PAYMENT_BLOCK_KEY: Record<SalePaymentBlock, TranslationKey> = {
  EMPTY_CART: 'sales.payment.block.EMPTY_CART',
  NO_QUOTE: 'sales.payment.block.NO_QUOTE',
  WALK_IN_NAME_REQUIRED: 'sales.payment.block.WALK_IN_NAME_REQUIRED',
  WALK_IN_MOBILE_INVALID: 'sales.payment.block.WALK_IN_MOBILE_INVALID',
  WALKIN_WALLET_NOT_ALLOWED: 'sales.payment.block.WALKIN_WALLET_NOT_ALLOWED',
  WALLET_INSUFFICIENT: 'sales.payment.block.WALLET_INSUFFICIENT',
  CASH_AMOUNT_INVALID: 'sales.payment.block.CASH_AMOUNT_INVALID',
  CASH_AMOUNT_INSUFFICIENT: 'sales.payment.block.CASH_AMOUNT_INSUFFICIENT',
  CARD_REF_REQUIRED: 'sales.payment.block.CARD_REF_REQUIRED',
};
