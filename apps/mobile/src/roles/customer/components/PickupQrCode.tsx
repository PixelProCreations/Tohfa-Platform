/**
 * Pickup QR (BR-194): renders `Order.pickupQr.payload` verbatim. The payload is
 * signed server-side and carries only the order number and pickup code, never
 * the handover OTP. Falls back to nothing when the order has no QR (delivery).
 */
import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export interface PickupQrCodeProps {
  payload: string | null | undefined;
  size?: number;
}

export function PickupQrCode({ payload, size = 180 }: PickupQrCodeProps): React.ReactElement | null {
  if (!payload) return null;
  return (
    <View testID="pickup-qr-container" accessibilityLabel="Pickup QR code">
      <QRCode value={payload} size={size} />
    </View>
  );
}
