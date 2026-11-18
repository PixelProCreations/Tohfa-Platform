import type React from 'react';
import { t } from '../../../i18n/customer';
import { ProductImages } from '../assets/images/products';
import {
  BoxSvg,
  CartSvg,
  GridSvg,
  TruckSvg,
  CreditCardSvg,
  RepeatSvg,
  MapPinSvg,
  QualitySvg,
  DamagedSvg,
  WrongItemSvg,
  MissingItemSvg,
  ScaleSvg,
  UserSvg,
  BellSvg,
  GearSvg,
  ShieldCheckSvg,
  InfoCircleSvg,
} from './ContactSupportIcons';

/**
 * Display labels resolve lazily (getter, at render time) so they follow the
 * active locale. Ids/codes are untouched.
 */
function withLabel<T extends { label: string }>(item: Omit<T, 'label'>, key: Parameters<typeof t>[0]): T {
  return Object.defineProperties({}, {
    ...Object.getOwnPropertyDescriptors(item),
    label: { enumerable: true, get: () => t(key) },
  }) as T;
}

export type RelatedCategory = 'order' | 'product' | 'review' | 'other';

export type IssueTypeCode =
  | 'product_support'
  | 'order_status'
  | 'payment_refund'
  | 'return_replacement'
  | 'pickup_delivery'
  | 'quality_issue'
  | 'damaged_item'
  | 'wrong_item'
  | 'missing_item'
  | 'weight_quantity'
  | 'account_profile'
  | 'notifications'
  | 'payments_wallet'
  | 'addresses'
  | 'app_issue_technical'
  | 'policies'
  | 'report_concern'
  | 'other';

export interface IssueTypeItem {
  code: IssueTypeCode;
  label: string;
  sublabel?: string;
  icon: React.FC<{ color?: string; size?: number }>;
}

export const RELATED_TABS: { id: RelatedCategory; label: string; icon: React.FC<{ color?: string; size?: number }> }[] = [
  withLabel({ id: 'order', icon: BoxSvg }, 'customer.contact.related.order'),
  withLabel({ id: 'product', icon: CartSvg }, 'customer.contact.related.product'),
  withLabel({ id: 'other', icon: GridSvg }, 'customer.contact.related.other'),
];

export const ORDER_ISSUE_TYPES: IssueTypeItem[] = [
  withLabel({ code: 'product_support', icon: BoxSvg }, 'customer.contact.issue.product_support'),
  withLabel({ code: 'order_status', icon: TruckSvg }, 'customer.contact.issue.order_status'),
  withLabel({ code: 'payment_refund', icon: CreditCardSvg }, 'customer.contact.issue.payment_refund'),
  withLabel({ code: 'return_replacement', icon: RepeatSvg }, 'customer.contact.issue.return_replacement'),
  withLabel({ code: 'pickup_delivery', icon: MapPinSvg }, 'customer.contact.issue.pickup_delivery'),
  withLabel({ code: 'other', icon: GridSvg }, 'customer.contact.issue.other'),
];

export const PRODUCT_ISSUE_TYPES: IssueTypeItem[] = [
  withLabel({ code: 'quality_issue', icon: QualitySvg }, 'customer.contact.issue.quality_issue'),
  withLabel({ code: 'damaged_item', icon: DamagedSvg }, 'customer.contact.issue.damaged_item'),
  withLabel({ code: 'wrong_item', icon: WrongItemSvg }, 'customer.contact.issue.wrong_item'),
  withLabel({ code: 'missing_item', icon: MissingItemSvg }, 'customer.contact.issue.missing_item'),
  withLabel({ code: 'weight_quantity', icon: ScaleSvg }, 'customer.contact.issue.weight_quantity'),
  withLabel({ code: 'other', icon: GridSvg }, 'customer.contact.issue.other'),
];

export const OTHER_ISSUE_TYPES: IssueTypeItem[] = [
  withLabel({ code: 'account_profile', icon: UserSvg }, 'customer.contact.issue.account_profile'),
  withLabel({ code: 'notifications', icon: BellSvg }, 'customer.contact.issue.notifications'),
  withLabel({ code: 'payments_wallet', icon: CreditCardSvg }, 'customer.contact.issue.payments_wallet'),
  withLabel({ code: 'addresses', icon: MapPinSvg }, 'customer.contact.issue.addresses'),
  withLabel({ code: 'app_issue_technical', icon: GearSvg }, 'customer.contact.issue.app_issue_technical'),
  withLabel({ code: 'policies', get sublabel() { return t('customer.contact.issue.policies.sublabel'); }, icon: ShieldCheckSvg }, 'customer.contact.issue.policies'),
  withLabel({ code: 'report_concern', icon: InfoCircleSvg }, 'customer.contact.issue.report_concern'),
  withLabel({ code: 'other', icon: GridSvg }, 'customer.contact.issue.other'),
];

export const ALL_ISSUE_LABELS: Record<IssueTypeCode, string> = {
  product_support: 'Product support',
  order_status: 'Order status',
  payment_refund: 'Payment & refund',
  return_replacement: 'Return & replacement',
  pickup_delivery: 'Pickup / delivery',
  quality_issue: 'Quality issue',
  damaged_item: 'Damaged item',
  wrong_item: 'Wrong item',
  missing_item: 'Missing item',
  weight_quantity: 'Weight / quantity issue',
  account_profile: 'Account & Profile',
  notifications: 'Notifications',
  payments_wallet: 'Payments & wallet',
  addresses: 'Addresses',
  app_issue_technical: 'App issue / technical',
  policies: 'Policies',
  report_concern: 'Report a concern',
  other: 'Other',
};

export interface ProductItem {
  id: string;
  name: string;
  weight: string;
  image: number;
}

export const SAMPLE_PRODUCTS: ProductItem[] = [
  { id: 'prod_1', name: 'Fresh apples', weight: '(1 kg)', image: ProductImages.fruitApple },
  { id: 'prod_2', name: 'Fuji', weight: '(1 kg)', image: ProductImages.fruitApple },
  { id: 'prod_3', name: 'Green Curly Lettuce', weight: '(1 kg)', image: ProductImages.foryouLettuce },
];

export interface OrderOption {
  id: string;
  orderNumber: string;
  dateStr: string;
  itemCount: number;
}

export const SAMPLE_ORDERS: OrderOption[] = [
  { id: 'ord_1', orderNumber: 'ORD-20261115-0039', dateStr: '15 Jul 2026', itemCount: 3 },
  { id: 'ord_2', orderNumber: 'ORD-20261110-0012', dateStr: '10 Jul 2026', itemCount: 2 },
];

export interface ReviewAspectOption {
  id: string;
  label: string;
}

export const REVIEW_ASPECTS: ReviewAspectOption[] = [
  withLabel({ id: 'quality' }, 'customer.contact.aspect.quality'),
  withLabel({ id: 'packaging' }, 'customer.contact.aspect.packaging'),
  withLabel({ id: 'delivery' }, 'customer.contact.aspect.delivery'),
  withLabel({ id: 'communication' }, 'customer.contact.aspect.communication'),
  withLabel({ id: 'other' }, 'customer.contact.aspect.other'),
];

export interface ReviewItem {
  id: string;
  name: string;
  weight: string;
  image: number;
  rating: number;
  statusLabel?: string;
}

export const SAMPLE_REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'prod_1',
    name: 'Fresh apples',
    weight: '(1 kg)',
    image: ProductImages.fruitApple,
    rating: 5,
    statusLabel: 'Excellent',
  },
  {
    id: 'prod_2',
    name: 'Fuji',
    weight: '(1 kg)',
    image: ProductImages.fruitApple,
    rating: 0,
    statusLabel: 'Tap to rate',
  },
  {
    id: 'prod_3',
    name: 'Green Curly Lettuce',
    weight: '(1 kg)',
    image: ProductImages.foryouLettuce,
    rating: 0,
    statusLabel: 'Tap to rate',
  },
];

export interface ReturnReasonOption {
  id: string;
  label: string;
}

export const RETURN_REASONS: ReturnReasonOption[] = [
  withLabel({ id: 'quality' }, 'customer.contact.returnReason.quality'),
  withLabel({ id: 'wrong_item' }, 'customer.contact.returnReason.wrong_item'),
  withLabel({ id: 'expired' }, 'customer.contact.returnReason.expired'),
  withLabel({ id: 'damaged_pkg' }, 'customer.contact.returnReason.damaged_pkg'),
  withLabel({ id: 'mismatch' }, 'customer.contact.returnReason.mismatch'),
  withLabel({ id: 'not_described' }, 'customer.contact.returnReason.not_described'),
  withLabel({ id: 'other' }, 'customer.contact.returnReason.other'),
];
