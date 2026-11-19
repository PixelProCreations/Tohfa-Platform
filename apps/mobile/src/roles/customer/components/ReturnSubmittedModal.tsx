import React from 'react';
import {
  type ImageSourcePropType,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ReturnTicketSvg } from './ContactSupportIcons';
import { t } from '../../../i18n/customer';
import { customerColors } from '../theme';

export interface ReturnSubmittedModalProps {
  visible: boolean;
  onClose: () => void;
  returnId?: string;
  orderNumber?: string;
  productName?: string;
  /** Remote thumbnail (`{ uri }`); omitted -> an empty thumbnail box. */
  productImage?: ImageSourcePropType | undefined;
  onTrackReturn?: () => void;
  onContinueShopping?: () => void;
}

const CloseSvg = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={11} fill={customerColors.neutral.neutral100} />
    <Path
      d="M8 8l8 8M16 8l-8 8"
      stroke={customerColors.neutral.neutral700}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SuccessCheckSvg = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
    <Circle cx={32} cy={32} r={30} fill={customerColors.palette.green.frost} />
    <Circle cx={32} cy={32} r={20} fill={customerColors.primary} />
    <Path
      d="M26 32l4 4 8-8"
      stroke={customerColors.white}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export function ReturnSubmittedModal({
  visible,
  onClose,
  returnId = 'RET-20260715-0147',
  orderNumber = 'ORD-20260715-0039',
  productName = 'Fresh apples (1 kg)',
  productImage,
  onTrackReturn,
  onContinueShopping,
}: ReturnSubmittedModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialogCard}>
          {/* Close button in top-right */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel={t('customer.orders.return.modal.close')}
          >
            <CloseSvg />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Success Badge */}
            <View style={styles.iconWrapper}>
              <SuccessCheckSvg />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>{t('customer.orders.return.modal.title')}</Text>
            <Text style={styles.subtitle}>
              {t('customer.orders.return.modal.subtitle')}
            </Text>

            {/* Return Request ID Pill Card */}
            <View style={styles.returnIdCard}>
              <View style={styles.ticketIconBox}>
                <ReturnTicketSvg color={customerColors.primary} size={20} />
              </View>
              <View style={styles.returnIdColumn}>
                <Text style={styles.returnIdLabel}>{t('customer.orders.return.modal.returnId')}</Text>
                <Text style={styles.returnIdValue}>{returnId}</Text>
              </View>
            </View>

            {/* Product Summary Row */}
            <View style={styles.productCard}>
              {productImage ? (
                <Image source={productImage} style={styles.productThumbnail} resizeMode="cover" />
              ) : (
                <View style={styles.productThumbnail} />
              )}
              <View style={styles.productInfoColumn}>
                <Text style={styles.productLabel}>{t('customer.orders.return.modal.product')}</Text>
                <Text style={styles.productName}>{productName}</Text>
              </View>
            </View>

            {/* Dashed Separator */}
            <View style={styles.dashedDivider} />

            {/* Two Column Order Details */}
            <View style={styles.metaRow}>
              <View style={styles.metaColumn}>
                <Text style={styles.metaLabel}>{t('customer.orders.return.modal.orderId')}</Text>
                <Text style={styles.metaValue}>{orderNumber}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaColumn}>
                <Text style={styles.metaLabel}>{t('customer.orders.return.modal.orderId')}</Text>
                <Text style={styles.metaValue}>{orderNumber}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onTrackReturn?.();
              }}
              style={styles.trackButton}
              accessibilityLabel={t('customer.orders.return.modal.track')}
            >
              <Text style={styles.trackButtonText}>{t('customer.orders.return.modal.track')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onContinueShopping?.();
              }}
              style={styles.continueButton}
              accessibilityLabel={t('customer.orders.return.modal.continue')}
            >
              <Text style={styles.continueButtonText}>{t('customer.orders.return.modal.continue')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: customerColors.overlay.scrim55,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: customerColors.white,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: customerColors.heading,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: customerColors.neutral.neutral600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  returnIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customerColors.palette.green.frost,
    borderWidth: 1,
    borderColor: customerColors.palette.green.mintBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 14,
  },
  ticketIconBox: {
    marginRight: 10,
  },
  returnIdColumn: {
    flex: 1,
  },
  returnIdLabel: {
    fontSize: 11,
    color: customerColors.neutral.neutral700,
    marginBottom: 2,
  },
  returnIdValue: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.heading,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customerColors.palette.grey.snow,
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },
  productThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: customerColors.neutral.neutral100,
  },
  productInfoColumn: {
    flex: 1,
  },
  productLabel: {
    fontSize: 11,
    color: customerColors.neutral.neutral500,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.heading,
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  metaColumn: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: customerColors.neutral.neutral600,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: customerColors.heading,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: customerColors.neutral.neutral300,
    marginHorizontal: 14,
  },
  trackButton: {
    width: '100%',
    backgroundColor: customerColors.legacy.greenDark,
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  trackButtonText: {
    color: customerColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  continueButton: {
    width: '100%',
    backgroundColor: customerColors.white,
    borderWidth: 1.2,
    borderColor: customerColors.legacy.greenDark,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: customerColors.legacy.greenDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

