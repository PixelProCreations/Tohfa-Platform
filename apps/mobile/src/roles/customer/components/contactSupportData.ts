import type React from 'react';
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
  StarTabSvg,
} from './ContactSupportIcons';

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
  { id: 'order', label: 'My Order', icon: BoxSvg },
  { id: 'product', label: 'Product', icon: CartSvg },
  { id: 'review', label: 'Review', icon: StarTabSvg },
  { id: 'other', label: 'Other', icon: GridSvg },
];

export const ORDER_ISSUE_TYPES: IssueTypeItem[] = [
  { code: 'product_support', label: 'Product support', icon: BoxSvg },
  { code: 'order_status', label: 'Order status', icon: TruckSvg },
  { code: 'payment_refund', label: 'Payment & refund', icon: CreditCardSvg },
  { code: 'return_replacement', label: 'Return & replacement', icon: RepeatSvg },
  { code: 'pickup_delivery', label: 'Pickup / delivery', icon: MapPinSvg },
  { code: 'other', label: 'Other', icon: GridSvg },
];

export const PRODUCT_ISSUE_TYPES: IssueTypeItem[] = [
  { code: 'quality_issue', label: 'Quality issue', icon: QualitySvg },
  { code: 'damaged_item', label: 'Damaged item', icon: DamagedSvg },
  { code: 'wrong_item', label: 'Wrong item', icon: WrongItemSvg },
  { code: 'missing_item', label: 'Missing item', icon: MissingItemSvg },
  { code: 'weight_quantity', label: 'Weight / quantity issue', icon: ScaleSvg },
  { code: 'other', label: 'Other', icon: GridSvg },
];

export const OTHER_ISSUE_TYPES: IssueTypeItem[] = [
  { code: 'account_profile', label: 'Account & Profile', icon: UserSvg },
  { code: 'notifications', label: 'Notifications', icon: BellSvg },
  { code: 'payments_wallet', label: 'Payments & wallet', icon: CreditCardSvg },
  { code: 'addresses', label: 'Addresses', icon: MapPinSvg },
  { code: 'app_issue_technical', label: 'App issue / technical', icon: GearSvg },
  { code: 'policies', label: 'Policies', sublabel: '(Return, Refund, etc.)', icon: ShieldCheckSvg },
  { code: 'report_concern', label: 'Report a concern', icon: InfoCircleSvg },
  { code: 'other', label: 'Other', icon: GridSvg },
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
  { id: 'quality', label: 'Product quality' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'delivery', label: 'Delivery / Pickup' },
  { id: 'communication', label: 'Communication' },
  { id: 'other', label: 'Other' },
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
  { id: 'quality', label: 'Quality issue (damaged / spoiled)' },
  { id: 'wrong_item', label: 'Wrong item delivered' },
  { id: 'expired', label: 'Item expired / near expiry' },
  { id: 'damaged_pkg', label: 'Item missing or damaged packaging' },
  { id: 'mismatch', label: 'Weight / quantity mismatch' },
  { id: 'not_described', label: 'Not as described' },
  { id: 'other', label: 'Other reason' },
];
